import React, { useState } from 'react';
// Fix: Use motion/react for consistent animations and fix react-router imports
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Truck, CheckCircle, ArrowLeft, ArrowRight, ShieldCheck, Tag, Loader2, XCircle } from 'lucide-react';
import { useCart } from '../contexts';
import { useNavigate } from 'react-router';
import { supabase } from '../services/supabase';
import { Coupon } from '../types';

type Step = 'shipping' | 'payment' | 'success';

const Checkout: React.FC = () => {
  const { cart, total, clearCart } = useCart();
  const [step, setStep] = useState<Step>('shipping');
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check for success query param
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('step') === 'success') {
      setStep('success');
      clearCart();
    }
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setValidatingCoupon(true);
    setCouponError(null);
    
    try {
      const coupon = await supabase.getCouponByCode(couponCode.trim());
      if (coupon) {
        setActiveCoupon(coupon);
        setCouponError(null);
      } else {
        setActiveCoupon(null);
        setCouponError('Invalid or expired promo code');
      }
    } catch (error) {
      setCouponError('Error validating coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { url } = await supabase.placeOrder({
        user_id: '', // Server handles
        total: 0,    // Server handles
        status: 'pending',
        items: cart
      }, activeCoupon?.code || undefined);

      // Redirect to Stripe or Success Page
      if (url) {
        window.location.href = url;
      } else {
        setStep('success');
        clearCart();
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && step !== 'success') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-6">
        <h2 className="text-3xl font-black">Your cart is empty</h2>
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-blue-600 rounded-xl font-bold">Start Shopping</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Stepper */}
      {step !== 'success' && (
        <div className="flex items-center justify-center mb-16 gap-4">
          <div className={`flex items-center gap-2 ${step === 'shipping' ? 'text-blue-400' : 'text-emerald-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'shipping' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
              {step === 'shipping' ? '1' : <CheckCircle className="w-5 h-5" />}
            </div>
            <span className="text-sm font-bold hidden sm:inline">Shipping</span>
          </div>
          <div className="w-12 h-px bg-white/10" />
          <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-blue-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'payment' ? 'bg-blue-600 text-white' : 'bg-white/10'}`}>2</div>
            <span className="text-sm font-bold hidden sm:inline">Payment</span>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'shipping' && (
          <motion.div
            key="shipping"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            <div className="space-y-8">
              <h2 className="text-3xl font-black">Shipping Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="First Name" className="w-full p-4 glass rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="text" placeholder="Last Name" className="w-full p-4 glass rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <input type="email" placeholder="Email Address" className="w-full p-4 glass rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                <input type="text" placeholder="Address" className="w-full p-4 glass rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                <div className="grid grid-cols-3 gap-4">
                  <input type="text" placeholder="City" className="w-full p-4 glass rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="text" placeholder="State" className="w-full p-4 glass rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="text" placeholder="ZIP" className="w-full p-4 glass rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <button
                onClick={() => setStep('payment')}
                className="w-full py-4 bg-blue-600 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                Proceed to Payment <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <OrderSummary 
              couponCode={couponCode} 
              onCouponChange={setCouponCode} 
              onApplyCoupon={handleApplyCoupon}
              activeCoupon={activeCoupon}
              validatingCoupon={validatingCoupon}
              couponError={couponError}
            />
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black">Secure Payment</h2>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-3 py-1.5 rounded-full">
                  <ShieldCheck className="w-4 h-4" /> SSL ENCRYPTED
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-6 glass border-blue-500/50 border rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CreditCard className="w-6 h-6 text-blue-400" />
                    <span className="font-bold">Credit / Debit Card</span>
                  </div>
                  <div className="w-4 h-4 rounded-full border-4 border-blue-500" />
                </div>
                <div className="p-8 glass rounded-2xl flex flex-col items-center justify-center space-y-4 text-center border border-white/5">
                  <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold">Stripe Secure Checkout</h4>
                    <p className="text-sm text-gray-400">You will be redirected to a secure payment page.</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('shipping')}
                  className="flex-grow py-4 glass rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-[2] py-4 bg-blue-600 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-900/30"
                >
                  {loading ? 'Processing...' : `Secure Checkout`}
                </button>
              </div>
            </div>
            <OrderSummary activeCoupon={activeCoupon} />
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center space-y-8 py-20"
          >
            <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h1 className="text-5xl font-black">Transmission Received.</h1>
            <p className="text-gray-400">Your order has been logged into our neural network. We'll send tracking coordinates shortly.</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-4 glass hover:bg-white/10 rounded-2xl font-bold transition-all"
            >
              Back to Home
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface OrderSummaryProps {
  couponCode?: string;
  onCouponChange?: (code: string) => void;
  onApplyCoupon?: () => void;
  activeCoupon?: Coupon | null;
  validatingCoupon?: boolean;
  couponError?: string | null;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  couponCode, 
  onCouponChange, 
  onApplyCoupon, 
  activeCoupon, 
  validatingCoupon,
  couponError 
}) => {
  const { cart, total } = useCart();
  const shipping = 15.00;
  
  let discountAmount = 0;
  if (activeCoupon) {
    if (activeCoupon.discount_type === 'percentage') {
      discountAmount = total * (activeCoupon.value / 100);
    } else {
      discountAmount = activeCoupon.value;
    }
  }

  const finalTotal = Math.max(0, total + shipping - discountAmount);

  return (
    <div className="glass p-8 rounded-[32px] h-fit sticky top-24">
      <h3 className="text-xl font-bold mb-6">Summary</h3>
      <div className="space-y-4 mb-8">
        {cart.map(item => (
          <div key={item.id} className="flex justify-between items-center text-sm">
            <span className="text-gray-400">{item.name} x {item.quantity}</span>
            <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {onCouponChange && (
        <div className="mb-8 space-y-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-3 h-3 text-blue-400" /> Promo Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => onCouponChange(e.target.value)}
              placeholder="e.g. WELCOME10"
              className={`flex-grow p-3 bg-white/5 rounded-xl outline-none focus:ring-1 text-sm transition-all ${
                couponError ? 'focus:ring-red-500 border border-red-500/30' : 
                activeCoupon ? 'focus:ring-emerald-500 border border-emerald-500/30' : 'focus:ring-blue-500'
              }`}
            />
            <button
              onClick={onApplyCoupon}
              disabled={validatingCoupon || !couponCode}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
            </button>
          </div>
          {couponError && (
            <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-bold uppercase tracking-wide">
              <XCircle className="w-3 h-3" /> {couponError}
            </div>
          )}
          {activeCoupon && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wide">
              <CheckCircle className="w-3 h-3" /> Discount Applied: {activeCoupon.code}
            </div>
          )}
        </div>
      )}

      {!onCouponChange && activeCoupon && (
        <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{activeCoupon.code}</span>
          </div>
          <span className="text-xs font-black text-emerald-400">
            -{activeCoupon.discount_type === 'percentage' ? `${activeCoupon.value}%` : `$${activeCoupon.value.toFixed(2)}`}
          </span>
        </div>
      )}

      <div className="space-y-4 pt-6 border-t border-white/10">
        <div className="flex justify-between items-center text-sm text-gray-400">
          <span>Subtotal</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-400">
          <span>Shipping (Express)</span>
          <span>${shipping.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-sm text-emerald-400 font-bold">
            <span className="flex items-center gap-1.5">
              Discount {activeCoupon?.discount_type === 'percentage' && `(${activeCoupon.value}%)`}
            </span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm text-gray-400">
          <span>Taxes (Estimated)</span>
          <span>$0.00</span>
        </div>
        <div className="flex justify-between items-center text-xl font-black pt-4">
          <span>Total</span>
          <span className="text-blue-400">${finalTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
