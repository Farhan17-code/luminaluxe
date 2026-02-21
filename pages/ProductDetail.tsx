import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Star, StarHalf, ShoppingCart, ArrowLeft, ShieldCheck, Truck, RefreshCcw, Package, ChevronRight, Share2, Heart } from 'lucide-react';
import { Product, Review } from '../types';
import { supabase } from '../services/supabase';
import { useCart } from '../contexts';

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'shipping'>('description');
  const [isLiked, setIsLiked] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  // Load wishlist state from Supabase on mount
  useEffect(() => {
    const checkWishlist = async () => {
      const user = await supabase.getUser();
      if (user) {
        const wishlist = await supabase.getWishlist();
        setIsLiked(wishlist.includes(productId!));
      }
    };
    checkWishlist();
  }, [productId]);

  // Handle wishlist toggle with Supabase persistence
  const handleWishlistToggle = async () => {
    const user = await supabase.getUser();
    if (!user) {
      alert('Please sign in to save items to your wishlist');
      navigate('/signin');
      return;
    }

    try {
      const liked = await supabase.toggleWishlist(productId!);
      setIsLiked(liked);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  // Handle share functionality
  const handleShare = async () => {
    const shareData = {
      title: product?.name || 'Check out this product',
      text: `${product?.name} - ${product?.description?.substring(0, 100)}...`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        // Use Web Share API if available (mobile devices)
        await navigator.share(shareData);
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.log('Share failed:', err);
    }
  };

  const avgRating = reviews.length > 0
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
    : 0;

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.3 && rating % 1 <= 0.7;
    const roundedFullStars = rating % 1 > 0.7 ? fullStars + 1 : fullStars;

    for (let i = 1; i <= 5; i++) {
      if (i <= roundedFullStars && !(hasHalfStar && i === roundedFullStars + 1)) {
        stars.push(<Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />);
      } else if (hasHalfStar && i === fullStars + 1) {
        stars.push(<StarHalf key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />);
      } else {
        stars.push(<Star key={i} className="w-5 h-5 text-gray-200" />);
      }
    }
    return stars;
  };

  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      const allProducts = await supabase.getProducts();
      const found = allProducts.find(p => p.id === productId);
      if (found) {
        setProduct(found);
        // Initialize with first variant if available, else default image
        if (found.variants && found.variants.length > 0) {
          setSelectedVariant(found.variants[0]);
          setSelectedImage(found.variants[0].images?.[0] || found.image_url);
        } else {
          setSelectedImage(found.image_url);
        }
        setRelatedProducts(allProducts.filter(p => p.category === found.category && p.id !== found.id).slice(0, 4));
      }
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Fetch reviews
      const productReviews = await supabase.getReviewsByProductId(productId!);
      setReviews(productReviews);
    };
    fetchProductData();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Loading Product Neural-Map</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-6">
        <h2 className="text-3xl font-black">Piece not found in Archive</h2>
        <button onClick={() => navigate('/')} className="px-10 py-4 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-xs">Return to Collection</button>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const gallery = selectedVariant ? selectedVariant.images : [product.image_url];

  return (
    <div className="bg-white min-h-screen pb-24">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 pt-12 md:pt-20">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-4 mb-12 md:mb-16">
          <button onClick={() => navigate(-1)} className="p-3 hover:bg-gray-100 rounded-full transition-colors border border-[#EDEDED] group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <span className="hover:text-black cursor-pointer" onClick={() => navigate('/')}>Home</span>
            <ChevronRight className="w-3 h-3" />
            <span className="hover:text-black cursor-pointer" onClick={() => navigate(`/collection/${product.category}`)}>{product.category}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-black">{product.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative aspect-4/5 rounded-[3rem] md:rounded-[5rem] overflow-hidden bg-[#F9F9F9] shadow-2xl group"
            >
              <img src={selectedImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-2000ms group-hover:scale-105" />
              <div className="absolute top-8 right-8 flex flex-col gap-4">
                <button onClick={handleWishlistToggle} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${isLiked ? 'bg-red-500 text-white' : 'bg-white text-black'}`}>
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-white' : ''}`} />
                </button>
                <button onClick={handleShare} className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-90 border border-[#EDEDED]">
                  <Share2 className="w-6 h-6 text-[#1A1A1A]" />
                </button>
              </div>
            </motion.div>

            {/* Gallery Thumbnails */}
            <div className="grid grid-cols-4 gap-6">
              {gallery.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`relative aspect-square bg-gray-100 rounded-2rem overflow-hidden border-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${selectedImage === img ? 'border-black' : 'border-transparent opacity-60'}`}
                >
                  <img src={img} alt={`view ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Product Info */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-10">
            <div className="space-y-6">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] px-4 py-2 bg-blue-50 rounded-full"
              >
                {product.category}
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-black text-[#1A1A1A] tracking-tighter leading-[1] md:leading-[0.9]"
              >
                {product.name}
              </motion.h1>
              <div className="flex items-center gap-6">
                <div className="flex gap-0.5">
                  {renderStars(avgRating)}
                </div>
                <span className="text-xs font-bold text-gray-400 tracking-tight">( {avgRating || 'No'} Customer Rating{reviews.length !== 1 ? 's' : ''} )</span>
              </div>
            </div>

            {/* COLOR SELECTION WITH FABRIC THUMBNAILS */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Color: <span className="text-black">{selectedVariant?.color_name}</span></p>
                <div className="flex items-center gap-4 flex-wrap">
                  {product.variants.map((variant, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedVariant(variant);
                        setSelectedImage(variant.images?.[0] || product.image_url);
                      }}
                      className={`w-14 h-14 rounded-full border-2 transition-all transform hover:scale-110 overflow-hidden ${selectedVariant?.color_name === variant.color_name ? 'border-black ring-2 ring-black ring-offset-2' : 'border-gray-100'}`}
                      title={variant.color_name}
                    >
                      <img src={variant.thumbnail_url || product.image_url} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SIZE SELECTION GRID */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Size: <span className="text-black">{selectedSize}</span></p>
                  <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 underline decoration-gray-200 underline-offset-4 hover:text-black">Size Guide</button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-6 rounded-xl text-sm font-bold transition-all border ${selectedSize === size ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-100 hover:border-black'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="py-10 border-y border-[#EDEDED]"
            >
              <span className="text-6xl md:text-7xl font-black text-[#1A1A1A] tracking-tighter">৳{product.price.toFixed(2)}</span>
              <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Price Includes VAT & Duties where applicable</p>
              {/* Write Review Link */}
              <div className="pt-8 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/review/${product.id}`)}
                  className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors flex items-center gap-2"
                >
                  Share your feedback — Write a Review
                </button>
              </div>
            </motion.div>

            <div className="space-y-8">
              <div className="flex gap-10">
                {(['description', 'specs', 'shipping'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all ${activeTab === tab ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="min-h-[100px]">
                <AnimatePresence mode="wait">
                  {activeTab === 'description' && (
                    <motion.p key="desc" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-gray-500 leading-relaxed text-lg font-medium">
                      {product.description}
                    </motion.p>
                  )}
                  {activeTab === 'specs' && (
                    <motion.div key="specs" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-2xl"><p className="text-[10px] font-black text-gray-400 uppercase">Material</p><p className="font-bold">{product.material || 'Premium Fabric'}</p></div>
                      <div className="p-4 bg-gray-50 rounded-2xl"><p className="text-[10px] font-black text-gray-400 uppercase">Care</p><p className="font-bold">{product.care || 'Machine Wash Cold'}</p></div>
                      <div className="p-4 bg-gray-50 rounded-2xl"><p className="text-[10px] font-black text-gray-400 uppercase">Size & Fit</p><p className="font-bold">{product.size_and_fit || 'True to Size'}</p></div>
                      <div className="p-4 bg-gray-50 rounded-2xl"><p className="text-[10px] font-black text-gray-400 uppercase">Origin</p><p className="font-bold">{product.origin || 'Imported'}</p></div>
                    </motion.div>
                  )}
                  {activeTab === 'shipping' && (
                    <motion.div key="ship" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl text-emerald-700">
                        <Truck className="w-6 h-6" />
                        <div><p className="font-black text-xs uppercase">Express Shipping</p><p className="text-xs font-medium">Delivered in 2-4 business days.</p></div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl text-blue-700">
                        <RefreshCcw className="w-6 h-6" />
                        <div><p className="font-black text-xs uppercase">Easy Returns</p><p className="text-xs font-medium">30-day effortless return policy.</p></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="pt-6 space-y-6">
              <button
                disabled={isOutOfStock || (product.sizes && product.sizes.length > 0 && !selectedSize)}
                onClick={() => {
                  const variantImage = selectedVariant
                    ? (selectedVariant.images?.[0] || selectedVariant.thumbnail_url || product.image_url)
                    : product.image_url;

                  addToCart({
                    ...product,
                    selectedSize: selectedSize || undefined,
                    selectedColor: selectedVariant?.color_name || undefined
                  });
                }}
                className={`group w-full py-8 text-white rounded-3xl font-black uppercase tracking-[0.25em] text-sm shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-4 ${(isOutOfStock || (product.sizes && product.sizes.length > 0 && !selectedSize))
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-[#1A1A1A] hover:bg-black'
                  }`}
              >
                {isOutOfStock ? (
                  'Currently Out of Stock'
                ) : (product.sizes && product.sizes.length > 0 && !selectedSize) ? (
                  'Please Select a Size'
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Add to Shopping Bag
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-8 pt-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                  <ShieldCheck className="w-4 h-4" /> 2 Year Warranty
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                  <Package className="w-4 h-4" /> Eco-Secure Packaging
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-40 space-y-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Complete the Setup</h2>
                <div className="flex items-center gap-4">
                  <div className="h-px w-12 bg-black" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hand-picked companions from the {product.category} Archive</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {relatedProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="group cursor-pointer space-y-6"
                >
                  <div className="aspect-4/5 rounded-[2.5rem] overflow-hidden bg-[#F9F9F9] relative">
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                      ৳{p.price.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{p.category}</p>
                    <h3 className="text-lg font-bold group-hover:text-blue-600 transition-colors">{p.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Product Reviews Section */}
        <section className="mt-40 pt-20 border-t border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-20">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic">Social Proof</h2>
              <div className="flex items-center gap-4">
                <div className="h-px w-12 bg-black" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Based on {reviews.length} authentic customer reviews</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {showAllReviews && (
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-full border border-gray-100">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${ratingFilter === star ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
                    >
                      {star}★
                    </button>
                  ))}
                  {ratingFilter && (
                    <button
                      onClick={() => setRatingFilter(null)}
                      className="text-[9px] font-black uppercase px-3 text-gray-400 hover:text-black"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={async () => {
                  const user = await supabase.getUser();
                  if (!user) {
                    alert('Please sign in to write a review');
                    navigate('/signin');
                  } else {
                    navigate(`/review/${product.id}`);
                  }
                }}
                className="px-10 py-5 bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full hover:scale-105 transition-transform"
              >
                Write a Review
              </button>
            </div>
          </div>

          <div className="space-y-16">
            {reviews.length > 0 ? (
              (() => {
                const displayedReviews = showAllReviews
                  ? (ratingFilter ? reviews.filter(r => r.rating === ratingFilter) : reviews)
                  : reviews.filter(r => r.rating === 5).slice(0, 10);

                if (displayedReviews.length === 0) {
                  return (
                    <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em]">No reviews found for this rating</p>
                    </div>
                  );
                }

                return (
                  <>
                    {displayedReviews.map((review) => (
                      <div key={review.id} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 border-b border-gray-50 pb-16 last:border-0">
                        {/* Review Sidebar: Customer Info & Fit */}
                        <div className="lg:col-span-4 space-y-8">
                          <div className="space-y-4">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${review.rating >= star ? 'fill-black text-black' : 'text-gray-200'}`}
                                />
                              ))}
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-black">{review.nickname}</p>
                              {review.is_verified && (
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                  Verified Buyer
                                </div>
                              )}
                            </div>
                          </div>

                          {(review.height || review.weight) && (
                            <div className="flex gap-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                              {review.height && <span>Height: {review.height}</span>}
                              {review.weight && <span>Weight: {review.weight}</span>}
                            </div>
                          )}

                          <div className="space-y-1">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest italic">Size Ordered: <span className="text-black not-italic">{review.size_ordered}</span></p>
                          </div>

                          {/* Mini Fit Slider */}
                          <div className="space-y-4">
                            <div className="relative h-px bg-gray-200 w-full mt-6">
                              <div
                                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full"
                                style={{ left: `${review.fit}%` }}
                              />
                              <div className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-gray-200 left-0" />
                              <div className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-gray-200 left-1/2" />
                              <div className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-gray-200 left-full" />
                            </div>
                            <div className="flex justify-between text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                              <span>Runs Small</span>
                              <span>True to size</span>
                              <span>Runs Large</span>
                            </div>
                          </div>
                        </div>

                        {/* Review Content */}
                        <div className="lg:col-span-5 space-y-6">
                          <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold text-black">{review.title}</h3>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {new Date(review.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-gray-600 leading-relaxed font-medium">
                            {review.content}
                          </p>

                          <div className="flex flex-col gap-6 pt-4">
                            <div className="flex items-center gap-6">
                              <button className="px-6 py-2 border border-gray-200 text-[10px] font-black uppercase tracking-[0.2em] hover:border-black transition-colors">
                                Helpful
                              </button>
                              {review.helpful_count! > 0 && (
                                <span className="text-[10px] font-bold text-gray-400 uppercase">
                                  {review.helpful_count} customer{review.helpful_count !== 1 ? 's' : ''} found this found this helpful
                                </span>
                              )}
                            </div>
                            <button className="text-[9px] font-black text-gray-300 uppercase underline underline-offset-4 hover:text-black w-fit transition-colors">
                              Report
                            </button>
                          </div>
                        </div>

                        {/* Review Photo */}
                        <div className="lg:col-span-3">
                          {review.photo_url && (
                            <div className="aspect-3/4 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
                              <img src={review.photo_url} className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {!showAllReviews && reviews.length > 10 && (
                      <div className="flex justify-center pt-10">
                        <button
                          onClick={() => setShowAllReviews(true)}
                          className="px-12 py-6 bg-white border-2 border-black text-black text-[12px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-black hover:text-white transition-all shadow-xl active:scale-95"
                        >
                          See more reviews
                        </button>
                      </div>
                    )}
                  </>
                );
              })()
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em]">Be the first to archive a review for this piece</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;
