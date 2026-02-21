import React, { useState, useEffect } from 'react';
import { motion, type Variants } from 'motion/react';
import { ArrowRight, Sparkles, Smartphone, Shirt, Home as HomeIcon, Watch, LayoutGrid, Heart, Plus, Star } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Product, Category, CategoryModel } from '../types';
import { supabase } from '../services/supabase';
import { useCart, useGlobalState, useAuth } from '../contexts';

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryModel[]>([]);
  const [loading, setLoading] = useState(true);
  const { setActiveCategory } = useGlobalState();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodData, catData] = await Promise.all([
          supabase.getProducts(),
          (supabase as any).getCategories()
        ]);
        setProducts(prodData);
        setCategories((catData as CategoryModel[]).filter(c => c.show_on_home));
      } catch (error) {
         console.error("Error fetching data:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleCategoryClick = (category: Category) => {
    setActiveCategory(category);
    navigate(`/collection/${category}`);
  };

  const featuredProducts = products.slice(0, 4);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="space-y-12 md:space-y-24 pb-24">
      {/* Promotional Banner Card */}
      <section className="px-4 md:px-12 pt-4 md:pt-6">
        <div className="max-w-[1440px] mx-auto relative min-h-[550px] md:h-[600px] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden bg-[#1A1A1A] text-white flex items-center justify-center md:justify-start px-6 md:px-20 group shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-6 md:space-y-8 text-center md:text-left flex flex-col items-center md:items-start">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] border border-white/10"
            >
              <Sparkles className="w-3 h-3 text-yellow-400" /> New Season Now Live
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-8xl font-black tracking-tight leading-none md:leading-[0.95] drop-shadow-lg"
            >
              The Art of <br />
              <span className="text-gray-400">Essentials.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-xl text-gray-400 max-w-sm md:max-w-md font-medium leading-relaxed"
            >
              Where high-performance engineering meets minimalist luxury. Redefining your daily collection.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto"
            >
              <button
                onClick={() => handleCategoryClick('All')}
                className="w-full sm:w-auto px-10 py-5 bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 group/btn shadow-xl active:scale-95"
              >
                Explore Shop <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform" />
              </button>
            </motion.div>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 overflow-hidden">
            <motion.img
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ duration: 30, repeat: Infinity, repeatType: "reverse" }}
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
              className="w-full h-full object-cover opacity-40 md:opacity-70 transition-transform duration-3000 group-hover:scale-110"
              alt="Promotion"
            />
            <div className="absolute inset-0 bg-linear-to-t md:bg-linear-to-r from-[#1A1A1A] via-[#1A1A1A]/80 md:via-[#1A1A1A]/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* Categories Grid - Primary Navigation */}
      <section className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="flex flex-col items-center text-center space-y-4 mb-16">
          <div className="h-1 w-12 bg-blue-600 rounded-full" />
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[#1A1A1A]">Discover Collections</h2>
          <p className="text-gray-400 font-medium text-sm md:text-base uppercase tracking-widest">Select your path to luxury</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => handleCategoryClick(cat.name)}
              className="group cursor-pointer flex flex-col"
            >
              <div className="relative aspect-3/4 overflow-hidden rounded-3xl md:rounded-[2.5rem] bg-gray-100 mb-4 shadow-sm group-hover:shadow-xl transition-shadow duration-500">
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors duration-500" />
              </div>

              <div className="px-2 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm md:text-xl font-black text-[#1A1A1A] tracking-tighter group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </h3>
                  <ArrowRight className="w-3 h-3 md:w-5 md:h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </div>
                <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                  {cat.description || 'Explore Collection'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Selection Section */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-12 py-12 md:py-24 bg-white rounded-[3rem] md:rounded-[5rem] shadow-sm border border-[#EDEDED]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[#1A1A1A]">Featured Selection</h2>
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-[#1A1A1A]" />
              <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">
                A taster of our curated archive
              </p>
            </div>
          </div>
          <button
            onClick={() => handleCategoryClick('All')}
            className="text-[10px] font-black uppercase tracking-widest bg-[#F4F4F4] px-8 py-4 rounded-full hover:bg-black hover:text-white transition-all active:scale-95"
          >
            View Full Archive
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-3/4 bg-[#F4F4F4] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-12 md:gap-y-20 mb-20"
            >
              {featuredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <button
                onClick={() => handleCategoryClick('All')}
                className="group relative px-12 py-6 bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] font-black text-xs uppercase tracking-[0.3em] rounded-full overflow-hidden transition-all hover:text-white active:scale-95"
              >
                <div className="absolute inset-0 bg-[#1A1A1A] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center gap-3">
                  <LayoutGrid className="w-4 h-4" />
                  Access All Collections
                </span>
              </button>
            </motion.div>
          </>
        )}
      </section>
    </div>
  );
};

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOutOfStock = product.stock <= 0;

  // Track wishlist state
  const [isLiked, setIsLiked] = useState(false);
  const [displayImage, setDisplayImage] = useState(product.image_url);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Load wishlist state from Supabase on mount
  useEffect(() => {
    const checkWishlist = async () => {
      if (user) {
        const wishlist = await supabase.getWishlist();
        setIsLiked(wishlist.includes(product.id));
      }
    };
    checkWishlist();
  }, [user, product.id]);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert('Please sign in to save items to your wishlist');
      navigate('/signin');
      return;
    }

    try {
      const liked = await supabase.toggleWishlist(product.id);
      setIsLiked(liked);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  // Initialize with the first variant gallery image if available
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      setDisplayImage(product.variants[0].images?.[0] || product.image_url);
      setSelectedVariantId(product.variants[0].color_name);
    }
  }, [product]);

  const variants = product.variants && product.variants.length > 0 ? product.variants : [];
  const displayVariants = variants.slice(0, 4);
  const remainingVariants = variants.length > 4 ? variants.length - 4 : 0;

  const handleVariantClick = (e: React.MouseEvent, v: any) => {
    e.stopPropagation();
    setSelectedVariantId(v.color_name);
    setDisplayImage(v.images?.[0] || product.image_url);
  };

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      className="group flex flex-col h-full bg-white cursor-pointer relative"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Image with white overlays */}
      <div className="relative aspect-[3.2/4] overflow-hidden rounded-sm bg-[#F4F4F4] mb-4">
        <motion.img
          key={displayImage}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Status Badge */}
        <div className="absolute bottom-3 left-3">
          <div className="bg-white px-3 py-1.5 shadow-sm text-[11px] font-bold text-black uppercase tracking-tighter">
            {isOutOfStock ? 'RESTOCKING' : 'PREMIUM ARCHIVE'}
          </div>
        </div>

        {/* Wishlist Toggle */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all active:scale-90 ${isLiked ? 'bg-red-500 text-white' : 'bg-white/90 backdrop-blur-sm text-black hover:bg-white'}`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
        </button>

        {/* Quick Add */}
        <button
          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
          disabled={isOutOfStock}
          className="absolute bottom-3 right-3 w-10 h-10 bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Plus className="w-6 h-6 text-black stroke-[2.5]" />
        </button>
      </div>

      {/* Info Block */}
      <div className="flex flex-col space-y-0.5">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-[14px] font-medium text-black line-clamp-1 grow">
            {product.name}
          </h3>
          {product.review_count != null && product.review_count > 0 && (
            <div className="flex items-center gap-1 shrink-0 pt-0.5">
              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
              <span className="text-[11px] font-bold text-black leading-none">
                {(product.rating || 0).toFixed(1)}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">({product.review_count})</span>
            </div>
          )}
        </div>

        <p className="text-[14px] font-black text-black">
          ৳{product.price.toFixed(2)}
        </p>

        {/* VARIANT SWATCHES - Using Thumbnails */}
        {variants.length > 0 && (
          <div className="flex items-center gap-2 py-2">
            {displayVariants.map((v, i) => (
              <button
                key={i}
                onClick={(e) => handleVariantClick(e, v)}
                className={`w-5 h-5 rounded-full border-2 transition-all transform hover:scale-125 overflow-hidden ${selectedVariantId === v.color_name ? 'border-black ring-1 ring-black ring-offset-1' : 'border-gray-100'}`}
                title={v.color_name}
              >
                {v.thumbnail_url ? (
                  <img src={v.thumbnail_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </button>
            ))}
            {remainingVariants > 0 && (
              <span className="text-[11px] font-bold text-gray-400 leading-none ml-1">
                + {remainingVariants}
              </span>
            )}
          </div>
        )}

        <div className="pt-0.5">
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            {product.category} {product.subcategory ? `• ${product.subcategory}` : ''}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default Home;
