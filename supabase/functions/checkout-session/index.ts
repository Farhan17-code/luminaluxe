
import { serve } from "http/server.ts";
import { createClient } from "supabase";
import Stripe from "stripe";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
})

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckoutItem {
  id: string;
  quantity: number;
  color?: string;
  size?: string;
}

interface ProductData {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string;
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            throw new Error('User not authenticated')
        }

        const { items, coupon_code } = await req.json() as { items: CheckoutItem[], coupon_code?: string }

        // Create a Service Role client to perform admin actions
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch real prices from database
        const { data: products, error: productsError } = await supabaseAdmin
            .from('products')
            .select('id, name, price, stock, image_url')
            .in('id', items.map((item) => item.id))

        if (productsError) throw productsError

        // 2. Fetch Coupon if provided
        let couponId = null
        let couponData = null
        if (coupon_code) {
            const { data: coupon, error: couponError } = await supabaseAdmin
                .from('coupons')
                .select('*')
                .eq('code', coupon_code)
                .eq('is_active', true)
                .single()

            if (!couponError && coupon) {
                couponId = coupon.id
                couponData = coupon

                // 2b. Check if user already used this coupon
                const { data: existingOrder, error: usageError } = await supabaseAdmin
                    .from('orders')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('coupon_id', couponId)
                    .neq('status', 'cancelled')
                    .limit(1)
                    .maybeSingle()

                if (usageError) throw usageError
                if (existingOrder) {
                    throw new Error('You have already used this coupon code.')
                }
            }
        }

        let subtotal = 0
        const line_items = []
        const orderItemsData = []

        for (const item of items) {
            const product = (products as ProductData[]).find((p) => p.id === item.id)
            if (!product) throw new Error(`Product not found: ${item.id}`)
            if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`)

            const itemTotal = product.price * item.quantity
            subtotal += itemTotal

            line_items.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.name,
                        images: [product.image_url],
                        metadata: {
                            color: item.color,
                            size: item.size
                        }
                    },
                    unit_amount: Math.round(product.price * 100),
                },
                quantity: item.quantity,
            })

            orderItemsData.push({
                product_id: product.id,
                quantity: item.quantity,
                price_at_time: product.price,
                color: item.color,
                size: item.size
            })
        }

        // 3. Finalize Calculations
        let actualDiscount = 0
        if (couponData) {
            if (couponData.discount_type === 'percentage') {
                actualDiscount = (subtotal * couponData.value) / 100
            } else {
                actualDiscount = Math.min(couponData.value, subtotal)
            }
        }

        const taxRate = 0.08 // 8% tax
        const subtotalAfterDiscount = subtotal - actualDiscount
        const taxAmount = subtotalAfterDiscount * taxRate
        const shippingAmount = 15
        const total = subtotalAfterDiscount + taxAmount + shippingAmount

        // Update line items for Stripe to reflect discount and shipping
        if (actualDiscount > 0) {
            line_items.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Discount',
                    },
                    unit_amount: -Math.round(actualDiscount * 100),
                },
                quantity: 1,
            })
        }

        line_items.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Express Shipping & Tax',
                },
                unit_amount: Math.round((shippingAmount + taxAmount) * 100),
            },
            quantity: 1,
        })

        // 4. Create Order with detailed breakdown
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: user.id,
                subtotal: subtotal,
                tax_amount: taxAmount,
                discount_amount: actualDiscount,
                shipping_amount: shippingAmount,
                total: total,
                status: 'pending',
                coupon_id: couponId
            })
            .select()
            .single()

        if (orderError) throw orderError

        // Insert Order Items
        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItemsData.map(item => ({ ...item, order_id: order.id })))

        if (itemsError) {
            await supabaseAdmin.from('orders').delete().eq('id', order.id)
            throw itemsError
        }

        // 5. Initialize Stripe Session
        let sessionUrl = `${req.headers.get('origin')}/success`
        let sessionId = 'mock_session_id'

        if (Deno.env.get('STRIPE_SECRET_KEY')) {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items,
                mode: 'payment',
                success_url: `${req.headers.get('origin')}/checkout?step=success&order_id=${order.id}`,
                cancel_url: `${req.headers.get('origin')}/checkout?step=shipping`,
                metadata: {
                    order_id: order.id
                }
            })
            sessionUrl = session.url ?? sessionUrl
            sessionId = session.id
        }

        // Atomic stock update
        for (const item of items) {
            await supabaseAdmin.rpc('decrement_stock', { p_id: item.id, qty: item.quantity })
        }

        return new Response(
            JSON.stringify({ url: sessionUrl, sessionId, order_id: order.id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return new Response(
            JSON.stringify({ error: message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
