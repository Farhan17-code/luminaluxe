import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, Trash2, ArrowLeft, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Product } from '../types';
import { useAuth, useCart } from '../contexts';

const Wishlist: React.FC = () => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const loadWishlist = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await supabase.getFullWishlist();
        setWishlist(data);
      } catch (error) {
        console.error('Error loading wishlist:', error);
      } finally {
        setLoading(false);
      }
    };
    loadWishlist();
  }, [user]);

  const handleRemove = async (productId: string) => {
    try {
      await supabase.toggleWishlist(productId);
      setWishlist(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const handleMoveToCart = async (product: Product) => {
    try {
      await addToCart(product);
      await handleRemove(product.id);
    } catch (error) {
      console.error('Error moving to cart:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#F4F4F4] border-t-[#1A1A1A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-32 text-center">
        <Heart className="w-16 h-16 mx-auto mb-6 text-gray-200" />
        <h1 className="text-4xl font-black tracking-tight mb-4">Your Wishlist</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Please sign in to view and manage your saved items.</p>
        <Link to="/signin" className="inline-block px-12 py-5 bg-[#1A1A1A] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Wishlist</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{wishlist.length} Saved Items</p>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {wishlist.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-32 text-center bg-[#F9F9F9] rounded-3xl"
          >
            <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-gray-200" />
            </div>
            <h3 className="text-xl font-black mb-2">No items saved yet</h3>
            <p className="text-sm text-gray-400 mb-8">Start exploring our collection to build your wishlist.</p>
            <Link to="/collection/All" className="text-xs font-black text-blue-600 hover:underline uppercase tracking-widest">Browse Collection</Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            {wishlist.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative"
              >
                <div className="aspect-4/5 bg-[#F4F4F4] rounded-2xl overflow-hidden relative mb-4">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button 
                      onClick={() => handleRemove(product.id)}
                      className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white hover:text-red-500 transition-all text-gray-400"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <button 
                      onClick={() => handleMoveToCart(product)}
                      className="w-full py-4 bg-[#1A1A1A] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-xl"
                    >
                      <ShoppingCart className="w-4 h-4" /> Move to Bag
                    </button>
                  </div>
                </div>

                <Link to={`/product/${product.id}`} className="block">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{product.category}</p>
                  <h3 className="font-bold text-sm group-hover:text-blue-600 transition-colors">{product.name}</h3>
                  <p className="font-black text-sm mt-1 text-[#1A1A1A]">৳{product.price.toLocaleString()}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wishlist;
