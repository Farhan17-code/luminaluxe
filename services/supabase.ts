import { createClient } from '@supabase/supabase-js';
import { Product, Order, User, Review, Coupon, CartItem, CustomerInsight } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key');
}

// Export the raw client as 'supabaseClient' (renamed from original to avoid conflict, or kept internal)
// But we might want to export it for identifying session in App.tsx if needed.
export const supabaseClient = createClient(supabaseUrl, supabaseKey);

export const uploadImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabaseClient.storage
    .from('products')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabaseClient.storage.from('products').getPublicUrl(filePath);
  return data.publicUrl;
};

// Seed data preserved for migration
const SEED_PRODUCTS: Omit<Product, 'id'>[] = [
  {
    name: 'Lumix Z-Series Camera',
    description: 'Capture life in stunning 8K detail with ultra-low light capabilities.',
    price: 1299.99,
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop',
    stock: 12,
    rating: 4.8
  },
  {
    name: 'Cyber-Knit Sneaker',
    description: 'Ultra-breathable mesh with kinetic energy return soles.',
    price: 189.50,
    category: 'Apparel',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop',
    stock: 45,
    rating: 4.5
  },
  {
    name: 'Arcane Watch',
    description: 'A masterpiece of Swiss engineering with a sapphire crystal face.',
    price: 450.00,
    category: 'Accessories',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop',
    stock: 8,
    rating: 4.9
  },
  {
    name: 'Aether Pods Pro',
    description: 'Spatial audio that moves with you. Noise cancellation like never before.',
    price: 249.00,
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
    stock: 0,
    rating: 4.7
  }
];

export const seedProducts = async () => {
  const { error } = await supabaseClient.from('products').insert(SEED_PRODUCTS);
  if (error) throw error;
  console.log('Products seeded successfully');
};

class SupabaseService {
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*, reviews(count)');

    if (error) throw error;

    // Extract count from the reviews array/object that Supabase returns
    return (data as any[]).map(product => ({
      ...product,
      review_count: product.reviews?.[0]?.count || 0
    })) as Product[];
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const { data, error } = await supabaseClient
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabaseClient
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  }

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*, reviews(count)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      ...(data as any),
      review_count: (data as any).reviews?.[0]?.count || 0
    } as Product;
  }

  private getFilePathFromUrl(url: string): string | null {
    if (!url) return null;
    // Standard Supabase public URL format:
    // https://[project-id].supabase.co/storage/v1/object/public/[bucket-name]/[file-path]
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/');
      // The path usually starts with /storage/v1/object/public/products/
      // So we want everything after 'products/'
      const bucketIndex = parts.indexOf('products');
      if (bucketIndex !== -1 && bucketIndex < parts.length - 1) {
        return parts.slice(bucketIndex + 1).join('/');
      }
    } catch (e) {
      console.error('Error parsing image URL:', e);
    }
    return null;
  }

  async deleteImages(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    const { error } = await supabaseClient.storage
      .from('products')
      .remove(paths);

    if (error) {
      console.error('Error deleting images from storage:', error);
      // We don't necessarily want to block the whole deletion if image deletion fails,
      // but we log it.
    }
  }

  async deleteProduct(id: string): Promise<void> {
    // 1. Fetch product to get image URLs
    const product = await this.getProductById(id);
    if (product) {
      const imagePaths: string[] = [];

      // Collect main image
      const mainPath = this.getFilePathFromUrl(product.image_url);
      if (mainPath) imagePaths.push(mainPath);

      // Collect variant images
      if (product.variants) {
        product.variants.forEach(variant => {
          const thumbPath = this.getFilePathFromUrl(variant.thumbnail_url);
          if (thumbPath) imagePaths.push(thumbPath);

          if (variant.images) {
            variant.images.forEach(imgUrl => {
              const imgPath = this.getFilePathFromUrl(imgUrl);
              if (imgPath) imagePaths.push(imgPath);
            });
          }
        });
      }

      // 2. Delete images from storage
      if (imagePaths.length > 0) {
        await this.deleteImages([...new Set(imagePaths)]); // Use Set to avoid duplicates
      }
    }

    // 3. Delete product from database
    const { error } = await supabaseClient
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async placeOrder(order: Omit<Order, 'id' | 'created_at'>, couponCode?: string): Promise<{ url: string, sessionId: string, order_id: string }> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabaseClient.functions.invoke('checkout-session', {
      body: {
        items: order.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          color: item.selectedColor || 'default',
          size: item.selectedSize || 'default'
        })),
        coupon_code: couponCode
      }
    });

    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string): Promise<User> {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    if (!data.user) throw new Error('User creation failed');

    // Create profile entry
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({ id: data.user.id, role: 'user' });

    // Ignore profile error if it already exists (e.g. from trigger)
    if (profileError && profileError.code !== '23505') {
      console.error('Error creating profile:', profileError);
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      role: 'user'
    };
  }

  async signInWithPassword(email: string, password: string): Promise<User> {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (!data.user) throw new Error('Login failed');

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    return {
      id: data.user.id,
      email: data.user.email!,
      role: profile?.role as 'user' | 'admin' || 'user'
    };
  }

  async login(email: string): Promise<User> {
    // Use OTP for login
    const { error } = await supabaseClient.auth.signInWithOtp({ email });
    if (error) throw error;

    return {
      id: 'pending-verification',
      email,
      role: 'user'
    };
  }

  async getUser(): Promise<User | null> {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!profile) {
      // Try to create the profile if it doesn't exist
      await supabaseClient
        .from('profiles')
        .insert({ id: session.user.id, role: 'user' })
        .select()
        .single();
    }

    return {
      id: session.user.id,
      email: session.user.email!,
      role: profile?.role as 'user' | 'admin' || 'user'
    };
  }

  async logout(): Promise<void> {
    await supabaseClient.auth.signOut();
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  }

  async getReviewsByProductId(productId: string): Promise<Review[]> {
    const { data, error } = await supabaseClient
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Review[];
  }

  async addReview(review: Omit<Review, 'id' | 'created_at' | 'helpful_count'>): Promise<Review> {
    const { data, error } = await supabaseClient
      .from('reviews')
      .insert(review)
      .select()
      .single();

    if (error) {
      console.error('Supabase addReview error:', error);
      throw error;
    }
    return data as Review;
  }

  // --- CATEGORY METHODS ---
  async getCategories(): Promise<any[]> {
    const { data, error } = await supabaseClient
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any[];
  }

  async createCategory(category: any): Promise<any> {
    const { data, error } = await supabaseClient
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCategory(id: string, updates: any): Promise<any> {
    const { data, error } = await supabaseClient
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCategory(id: string): Promise<void> {
    // Delete the image from storage if it exists (Optional, relies on DB triggers if set up properly)
    // The DB trigger handles image deletion now, so we just delete the row.
    const { error } = await supabaseClient
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // --- COUPON METHODS ---
  async getCoupons(): Promise<Coupon[]> {
    const { data, error } = await supabaseClient
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Coupon[];
  }

  async createCoupon(coupon: Omit<Coupon, 'id' | 'created_at'>): Promise<Coupon> {
    const { data, error } = await supabaseClient
      .from('coupons')
      .insert(coupon)
      .select()
      .single();

    if (error) throw error;
    return data as Coupon;
  }

  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon> {
    const { data, error } = await supabaseClient
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Coupon;
  }

  async getCouponByCode(code: string): Promise<Coupon | null> {
    const { data, error } = await supabaseClient
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching coupon:', error);
      return null;
    }
    return data as Coupon;
  }

  async deleteCoupon(id: string): Promise<void> {
    const { error } = await supabaseClient
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Cart Management
  async getCart(): Promise<CartItem[]> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabaseClient
      .from('cart_items')
      .select('*, products(*)')
      .eq('user_id', user.id);

    if (error) throw error;

    return data.map((item: any) => ({
      ...item.products,
      id: item.id, // Using the cart_item id as the identifier in the UI
      product_id: item.product_id,
      quantity: item.quantity,
      selectedSize: item.size,
      selectedColor: item.color,
    }));
  }

  async addToCart(productId: string, quantity: number = 1, size?: string, color?: string): Promise<void> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { error } = await supabaseClient
      .from('cart_items')
      .insert({
        user_id: user.id,
        product_id: productId,
        quantity,
        size,
        color
      });

    if (error) throw error;
  }

  async updateCartQuantity(cartItemId: string, quantity: number): Promise<void> {
    const { error } = await supabaseClient
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId);

    if (error) throw error;
  }

  async removeFromCart(cartItemId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) throw error;
  }

  async clearCart(): Promise<void> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { error } = await supabaseClient
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
  }

  // Wishlist Management
  async getWishlist(): Promise<string[]> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabaseClient
      .from('wishlist')
      .select('product_id')
      .eq('user_id', user.id);

    if (error) throw error;
    return data.map((item: any) => item.product_id);
  }

  async getFullWishlist(): Promise<Product[]> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabaseClient
      .from('wishlist')
      .select('products(*, reviews(count))')
      .eq('user_id', user.id);

    if (error) throw error;
    
    return data.map((item: any) => ({
      ...item.products,
      review_count: item.products.reviews?.[0]?.count || 0
    })) as Product[];
  }

  async toggleWishlist(productId: string): Promise<boolean> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return false;

    // Check if exists
    const { data: existing } = await supabaseClient
      .from('wishlist')
      .select('product_id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      await supabaseClient
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      return false;
    } else {
      await supabaseClient
        .from('wishlist')
        .insert({ user_id: user.id, product_id: productId });
      return true;
    }
  }

  // Order Management
  async getOrders(): Promise<(Order & { items: any[] })[]> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabaseClient
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any[];
  }

  async getAdminOrders(): Promise<any[]> {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*, profiles(email), order_items(*, products(*))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any[];
  }

  async getCustomerInsights(): Promise<CustomerInsight[]> {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select(`
        id,
        email,
        orders (
          total,
          created_at
        )
      `);

    if (error) throw error;

    return (data as any[]).map(profile => {
      const orders = profile.orders || [];
      const totalSpend = orders.reduce((sum: number, order: any) => sum + Number(order.total), 0);
      const lastPurchase = orders.length > 0
        ? orders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : '';

      return {
        user_id: profile.id,
        email: profile.email || 'No email',
        total_spend: totalSpend,
        order_count: orders.length,
        last_purchase: lastPurchase
      };
    }).filter(insight => insight.order_count > 0);
  }
}


// Export the service instance as 'supabase' to match previous default export usage
export const supabase = new SupabaseService();

// Expose seed function to window for easy setup in development
if (import.meta.env.DEV) {
  (window as any).seedProducts = seedProducts;
  (window as any).supabaseClient = supabaseClient;
  console.log('Supabase Development Tools Exposed:');
  console.log('- Run "await window.seedProducts()" to populate the database with initial data.');
  console.log('- Access "window.supabaseClient" for raw Supabase client.');
}
