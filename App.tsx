import React, { useState, useEffect } from 'react';
// Fix: Splitting react-router-dom imports to handle missing re-exports in some environments
import { HashRouter, Link } from 'react-router-dom';
import { Routes, Route, useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingCart,
  User,
  LogOut,
  Package,
  Search,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Instagram,
  Twitter,
  Linkedin,
  Heart
} from 'lucide-react';
import { Product, CartItem, User as UserType, Category, CategoryModel } from './types';
import { supabase } from './services/supabase';
import {
  GlobalStateContext,
  CartContext,
  AuthContext,
  useAuth,
  useCart,
  useGlobalState
} from './contexts';

// Pages
import Home from './pages/Home';
import Admin from './pages/Admin';
import Checkout from './pages/Checkout';
import Collection from './pages/Collection';

import ProductDetail from './pages/ProductDetail';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import WriteReview from './pages/WriteReview';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<UserType | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('All');


  useEffect(() => {
    // Check Supabase session
    const checkUser = async () => {
      const user = await supabase.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  // Sync cart with Supabase when user changes
  useEffect(() => {
    const loadCart = async () => {
      if (user) {
        const remoteCart = await supabase.getCart();
        setCart(remoteCart);
      } else {
        setCart([]);
      }
    };
    loadCart();
  }, [user]);

  const addToCart = async (product: Product) => {
    if (!user) {
      alert('Please sign in to add items to your cart');
      window.location.hash = '/signin';
      return;
    }

    try {
      await supabase.addToCart(
        product.id,
        1,
        (product as any).selectedSize,
        (product as any).selectedColor
      );

      // Refresh local state from server to ensure consistency
      const remoteCart = await supabase.getCart();
      setCart(remoteCart);
      setIsCartOpen(true);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      alert(`Could not add to bag: ${error.message || 'Unknown error'}`);
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      await supabase.removeFromCart(cartItemId);
      setCart(prev => prev.filter(item => item.id !== cartItemId));
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateQuantity = async (cartItemId: string, delta: number) => {
    const item = cart.find(i => i.id === cartItemId);
    if (!item) return;

    const newQty = Math.max(1, item.quantity + delta);
    try {
      await supabase.updateCartQuantity(cartItemId, newQty);
      setCart(prev => prev.map(i => i.id === cartItemId ? { ...i, quantity: newQty } : i));
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const clearCart = async () => {
    try {
      await supabase.clearCart();
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const login = async (email: string) => {
    const userData = await supabase.login(email);
    setUser(userData);
  };

  const signUp = async (email: string, password: string) => {
    const userData = await supabase.signUp(email, password);
    setUser(userData);
  };

  const signInWithPassword = async (email: string, password: string) => {
    const userData = await supabase.signInWithPassword(email, password);
    setUser(userData);
  };

  const signInWithGoogle = async () => {
    await supabase.signInWithGoogle();
  };

  const logout = () => {
    supabase.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signUp, signInWithPassword, signInWithGoogle, logout }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
        <GlobalStateContext.Provider value={{ searchQuery, setSearchQuery, activeCategory, setActiveCategory }}>
          <HashRouter>
            <div className="min-h-screen flex flex-col relative bg-[#FCFCFC] text-[#1A1A1A]">
              <Navbar setIsCartOpen={setIsCartOpen} cartCount={cart.length} />
              <main className="grow pt-24">
                <PageTransitions>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/collection/:categoryName" element={<Collection />} />
                    <Route path="/product/:productId" element={<ProductDetail />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/review/:productId" element={<WriteReview />} />
                  </Routes>
                </PageTransitions>
              </main>
              <Footer />
              <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            </div>
          </HashRouter>
        </GlobalStateContext.Provider>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
};

// Components
const Navbar: React.FC<{ setIsCartOpen: (v: boolean) => void; cartCount: number }> = ({ setIsCartOpen, cartCount }) => {
  const { user, login, logout } = useAuth();
  const { searchQuery, setSearchQuery, activeCategory, setActiveCategory } = useGlobalState();
  const [navCategories, setNavCategories] = useState<Category[]>(['All']);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCats = async () => {
      try {
        const cats = await (supabase as any).getCategories();
        if (Array.isArray(cats) && cats.length > 0) {
          setNavCategories(['All', ...cats.map((c: any) => c.name as string)]);
        }
      } catch (err) {
        console.error('Failed to load nav categories:', err);
      }
    };
    loadCats();
  }, []);

  const handleCategorySelect = (cat: Category) => {
    setActiveCategory(cat);
    setIsCatOpen(false);
    navigate(`/collection/${cat}`);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav h-20 flex items-center">
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Left Side: Brand & Categories */}
        <div className="flex items-center gap-8 lg:gap-12">
          <Link
            to="/"
            onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
            className="text-xl font-bold tracking-tighter text-[#1A1A1A] whitespace-nowrap"
          >
            LUMINA LUXE
          </Link>

          <div className="relative hidden md:block" onMouseEnter={() => setIsCatOpen(true)} onMouseLeave={() => setIsCatOpen(false)}>
            <button className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-widest hover:text-blue-600 transition-colors py-4">
              {activeCategory === 'All' ? 'Collections' : activeCategory}
              <ChevronDown className={`w-3 h-3 transition-transform ${isCatOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isCatOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-0 w-48 bg-white border border-[#EDEDED] rounded-2xl shadow-xl p-2 z-50"
                >
                  {navCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="grow max-w-xl mx-8 relative hidden sm:block">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search our catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (!location.pathname.includes('/collection')) navigate('/collection/All'); }}
            className="w-full pl-12 pr-5 py-3 bg-[#F4F4F4] border-transparent border focus:border-[#1A1A1A] focus:bg-white rounded-full text-sm outline-none transition-all placeholder:text-gray-400 font-medium"
          />
        </div>

        {/* Right Side: Actions (Cart & Login) */}
        <div className="flex items-center gap-4 lg:gap-8">
          {user && (
            <Link to="/orders" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors flex items-center gap-1.5">
              <Package className="w-4 h-4" /> <span className="hidden xl:inline">Orders</span>
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link to="/admin" className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <ShieldCheck className="w-4 h-4" /> <span className="hidden xl:inline">Admin</span>
            </Link>
          )}

          <Link to="/wishlist" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors flex items-center gap-1.5">
            <Heart className="w-4 h-4" /> <span className="hidden xl:inline">Wishlist</span>
          </Link>

          <div className="flex items-center gap-6">
            <button onClick={() => setIsCartOpen(true)} className="relative group p-2 hover:bg-[#F4F4F4] rounded-full transition-all">
              <ShoppingCart className="w-6 h-6 text-[#1A1A1A]" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#1A1A1A] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="h-6 w-px bg-[#EDEDED] hidden md:block opacity-0" />

            {user ? (
              <button onClick={logout} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-all text-gray-500">
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <Link
                to="/signin"
                className="text-sm font-black uppercase tracking-[0.15em] text-[#1A1A1A] hover:text-blue-600 transition-colors"
              >
                LOGIN
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const CartDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-60"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-70 shadow-2xl flex flex-col"
          >
            <div className="p-8 border-b border-[#EDEDED] flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Bag</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{cart.length} Items Total</p>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grow overflow-y-auto p-8 space-y-8">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-300 space-y-4">
                  <div className="w-20 h-20 bg-[#F4F4F4] rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-10 h-10 opacity-40" />
                  </div>
                  <p className="font-bold uppercase tracking-widest text-[10px]">Your bag is currently empty</p>
                  <button onClick={onClose} className="text-xs font-bold text-blue-600 hover:underline">Start Shopping</button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-5 group">
                    <div className="w-24 h-28 shrink-0 bg-[#F9F9F9] rounded-2xl overflow-hidden cursor-pointer" onClick={() => { onClose(); navigate(`/product/${item.id.split('-')[0]}`); }}>
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="grow flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold text-sm leading-tight mb-1 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => { onClose(); navigate(`/product/${item.id.split('-')[0]}`); }}>{item.name}</h4>
                        <p className="text-xs font-black text-blue-600">৳{item.price.toFixed(2)}</p>
                        {item.selectedSize && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Size: <span className="text-black">{item.selectedSize}</span></p>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-[#F4F4F4] rounded-full p-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-full transition-all text-sm font-bold">-</button>
                          <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-full transition-all text-sm font-bold">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-[9px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors underline underline-offset-4">Remove</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-8 border-t border-[#EDEDED] space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold">Estimated Total</span>
                  <span className="text-2xl font-black">৳{total.toFixed(2)}</span>
                </div>
              </div>
              <button
                disabled={cart.length === 0}
                onClick={() => { onClose(); navigate('/checkout'); }}
                className="w-full py-5 bg-[#1A1A1A] text-white hover:bg-black disabled:bg-gray-200 disabled:cursor-not-allowed rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] active:scale-[0.98]"
              >
                Checkout Now
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Footer: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await (supabase as any).getCategories();
        if (Array.isArray(cats)) {
          setCategories(cats.map((c: any) => c.name));
        }
      } catch (err) {
        console.error('Failed to load footer categories:', err);
      }
    };
    loadCategories();
  }, []);

  return (
    <footer className="bg-white border-t border-[#EDEDED] pt-24 pb-12 px-6 md:px-12 mt-24">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
        <div className="space-y-6">
          <h3 className="text-xl font-bold tracking-tighter text-[#1A1A1A]">LUMINA LUXE</h3>
          <p className="text-sm text-gray-500 leading-relaxed font-medium">Elevating daily life through minimalist design and premium engineering. Our collection is curated for the modern aesthetic.</p>
        </div>
        <div className="space-y-8">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Shop Collection</h4>
          <ul className="text-sm text-gray-500 space-y-4 font-medium">
            {categories.length > 0 ? (
              categories.map(cat => (
                <li key={cat}>
                  <Link to={`/collection/${cat}`} className="hover:text-black cursor-pointer transition-colors block">
                    {cat}
                  </Link>
                </li>
              ))
            ) : (
              <>
                <li className="hover:text-black cursor-pointer transition-colors">Electronics & Tech</li>
                <li className="hover:text-black cursor-pointer transition-colors">Designer Apparel</li>
                <li className="hover:text-black cursor-pointer transition-colors">Home & Living</li>
                <li className="hover:text-black cursor-pointer transition-colors">Premium Accessories</li>
              </>
            )}
          </ul>
        </div>
        <div className="space-y-8">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Company</h4>
          <ul className="text-sm text-gray-500 space-y-4 font-medium">
            <li className="hover:text-black cursor-pointer transition-colors">About our Studio</li>
            <li className="hover:text-black cursor-pointer transition-colors">Sustainability Commit</li>
            <li className="hover:text-black cursor-pointer transition-colors">Careers</li>
            <li className="hover:text-black cursor-pointer transition-colors">Press Inquiries</li>
          </ul>
        </div>
        <div className="space-y-8">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Connect</h4>
          <div className="flex gap-4">
            <div className="w-12 h-12 border border-[#EDEDED] rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer group">
              <Instagram className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </div>
            <div className="w-12 h-12 border border-[#EDEDED] rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition-all cursor-pointer group">
              <Twitter className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </div>
          </div>
          <div className="pt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Newsletter</p>
            <div className="mt-4 flex">
              <input type="text" placeholder="Email Address" className="bg-[#F4F4F4] border-none rounded-l-xl px-4 py-3 text-xs grow outline-none" />
              <button className="bg-[#1A1A1A] text-white px-4 py-3 rounded-r-xl text-[10px] font-black uppercase tracking-widest">Join</button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto border-t border-[#EDEDED] mt-24 pt-8 text-[9px] text-gray-400 font-bold uppercase tracking-[0.4em] text-center">
        &copy; {new Date().getFullYear()} Lumina Luxe Studio. All rights reserved.
      </div>
    </footer>
  );
};

const PageTransitions: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Hooks are now imported from ./contexts
export { useCart, useAuth, useGlobalState } from './contexts';

export default App;
