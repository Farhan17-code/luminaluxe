import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, Upload, Info, ChevronDown, X } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Product, User } from '../types';

const WriteReview: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [fit, setFit] = useState(50); // 0: Small, 50: True, 100: Large
    const [sizeOrdered, setSizeOrdered] = useState('');
    const [title, setTitle] = useState('');
    const [review, setReview] = useState('');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [user, setUser] = useState<User | null>(null);

    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const user = await supabase.getUser();
            if (!user) {
                alert('Please sign in to write a review');
                navigate('/signin');
                return;
            }
            setUser(user);
            setNickname(user.email?.split('@')[0] || '');
            setEmail(user.email || '');
        };
        checkAuth();
    }, [navigate]);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) return;
            setLoading(true);
            const data = await supabase.getProducts();
            const found = data.find(p => p.id === productId);
            setProduct(found || null);
            setLoading(false);
        };
        fetchProduct();
    }, [productId]);

    const sanitizeInput = (text: string) => {
        return text
            .replace(/<[^>]*>?/gm, '') // Strip HTML tags
            .replace(/[;\"']/g, '')     // Remove SQL-prone characters
            .trim();
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploadingPhoto(true);
        try {
            const file = e.target.files[0];
            // Limit file size to 5MB
            if (file.size > 5 * 1024 * 1024) {
                alert('File size too large. Max 5MB.');
                return;
            }
            const { uploadImage } = await import('../services/supabase');
            const url = await uploadImage(file);
            setSelectedPhoto(url);
        } catch (error: any) {
            console.error('Photo upload failed:', error);
            alert('Failed to upload photo. Please try again.');
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanReview = sanitizeInput(review);
        const cleanNickname = sanitizeInput(nickname);
        const cleanTitle = sanitizeInput(title);
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

        if (cleanReview.length < 25) {
            alert('Review must be at least 25 characters after sanitization.');
            return;
        }
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }
        if (rating === 0) {
            alert('Please select a rating.');
            return;
        }
        if (!sizeOrdered) {
            alert('Please select the size ordered.');
            return;
        }

        setIsSubmitting(true);
        try {
            const reviewData = {
                product_id: productId!,
                rating,
                fit,
                size_ordered: sizeOrdered,
                title: cleanTitle,
                content: cleanReview,
                nickname: nickname || user?.email?.split('@')[0],
                email: user?.email,
                height: height.trim() || undefined,
                weight: weight.trim() || undefined,
                photo_url: selectedPhoto || undefined
            };

            console.log('Submitting review data:', reviewData);

            await supabase.addReview(reviewData);
            alert('Review submitted successfully!');
            navigate(`/product/${productId}`);
        } catch (error: any) {
            console.error('Submission failed. Full error object:', error);
            const errorMessage = error.message || (typeof error === 'string' ? error : 'An unexpected error occurred');
            alert(`Failed to submit review: ${errorMessage}\n\nPlease check your inputs and try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getFitLabel = (val: number) => {
        if (val < 40) return 'Runs Small';
        if (val > 60) return 'Runs Large';
        return 'True to size';
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!product) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <p className="font-bold text-gray-400 uppercase tracking-widest">Product Not Found</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[1200px] mx-auto px-6 py-12 lg:py-24">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors mb-12"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to Product
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
                    {/* Left Column: Product Info */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="sticky top-32">
                            <div className="aspect-3/4 rounded-sm overflow-hidden bg-[#F4F4F4] mb-8 shadow-sm">
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-medium tracking-tight text-black">{product.name}</h1>
                                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">{product.category}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Review Form */}
                    <div className="lg:col-span-7 space-y-12">
                        <section className="space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-2xl font-medium text-black">Overall Rating</h2>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setRating(star)}
                                            className="transition-transform active:scale-90"
                                        >
                                            <Star
                                                className={`w-10 h-10 ${(hoverRating || rating) >= star
                                                    ? 'fill-black text-black'
                                                    : 'text-gray-200'
                                                    } transition-colors`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actual Fit Slider */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-medium text-black">Actual Fit</h2>
                                    <span className="text-[12px] font-bold text-blue-600 uppercase tracking-widest">{getFitLabel(fit)}</span>
                                </div>
                                <div className="relative px-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={fit}
                                        onChange={(e) => setFit(parseInt(e.target.value))}
                                        className="w-full h-0.5 bg-gray-200 appearance-none cursor-pointer accent-black"
                                    />
                                    <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <span>Run Small</span>
                                        <span>True to size</span>
                                        <span>Run Large</span>
                                    </div>
                                </div>
                            </div>

                            {/* Size Ordered Dropdown */}
                            <div className="space-y-3">
                                <label className="text-[12px] font-bold text-black uppercase tracking-widest italic">Size Ordered</label>
                                <div className="relative">
                                    <select
                                        value={sizeOrdered}
                                        onChange={(e) => setSizeOrdered(e.target.value)}
                                        className="w-full appearance-none border border-gray-200 rounded-none px-4 py-4 text-sm outline-none focus:border-black transition-colors"
                                    >
                                        <option value="">Select</option>
                                        {['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Review Inputs */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-medium text-black">Write your review</h2>
                                    <div className="space-y-6">
                                        <input
                                            type="text"
                                            placeholder="Review Title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                            className="w-full border border-gray-200 rounded-none px-4 py-4 text-sm outline-none focus:border-black transition-colors placeholder:text-gray-300"
                                        />
                                        <div className="space-y-2">
                                            <textarea
                                                placeholder="Review"
                                                value={review}
                                                onChange={(e) => setReview(e.target.value)}
                                                required
                                                rows={6}
                                                className="w-full border border-gray-200 rounded-none px-4 py-4 text-sm outline-none focus:border-black transition-colors placeholder:text-gray-300 resize-none"
                                            />
                                            <p className="text-[10px] font-medium text-gray-400 tracking-wide">
                                                {review.length < 25 ? `Minimum of 25 characters (needs ${25 - review.length} more)` : 'Minimum of 25 characters met'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Add Photo Button */}
                                <div className="flex items-center gap-6">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingPhoto}
                                        className="flex-1 lg:flex-none border border-black px-12 py-5 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUploadingPhoto ? 'Uploading...' : selectedPhoto ? 'Change Photo' : 'Add A Photo'}
                                    </button>

                                    <AnimatePresence>
                                        {selectedPhoto && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-100 shadow-sm"
                                            >
                                                <img src={selectedPhoto} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPhoto(null)}
                                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="group relative">
                                        <Info className="w-5 h-5 text-gray-300 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-black text-white text-[9px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                                            Upload .jpg or .png. Max file size 5MB.
                                        </div>
                                    </div>
                                </div>

                                {/* Personality Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                                    <div className="bg-gray-50 p-6 rounded-none border border-gray-100 space-y-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Reviewing as</p>
                                        <p className="text-sm font-bold text-black">{user?.email}</p>
                                    </div>

                                    <div className="relative">
                                        <select
                                            value={height}
                                            onChange={(e) => setHeight(e.target.value)}
                                            className="w-full appearance-none border border-gray-200 rounded-none px-4 py-4 text-sm outline-none focus:border-black transition-colors text-gray-400 focus:text-black"
                                        >
                                            <option value="">Height (opt)</option>
                                            {[...Array(20)].map((_, i) => (
                                                <option key={i} value={`${5 + Math.floor(i / 12)}'${i % 12}"`}>{`${5 + Math.floor(i / 12)}'${i % 12}"`}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>

                                    <div className="relative">
                                        <select
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            className="w-full appearance-none border border-gray-200 rounded-none px-4 py-4 text-sm outline-none focus:border-black transition-colors text-gray-400 focus:text-black"
                                        >
                                            <option value="">Approx. Weight (opt)</option>
                                            {[90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 220, 250].map(w => (
                                                <option key={w} value={`${w} lbs`}>{w} lbs</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-6 pt-12">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || review.length < 25}
                                        className="w-full py-6 bg-black text-white font-black text-[13px] uppercase tracking-[0.3em] hover:bg-black/90 disabled:bg-gray-100 disabled:text-gray-300 transition-all flex items-center justify-center gap-4 active:scale-[0.99]"
                                    >
                                        {isSubmitting ? 'Processing Submission...' : 'Submit'}
                                    </button>
                                    <p className="text-[9px] text-gray-400 leading-relaxed text-center font-medium max-w-sm mx-auto">
                                        All submitted reviews are subject to the terms set forth in our website Conditions of Use. If your review is in violation of our Ratings Guidelines, it will be rejected.
                                    </p>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WriteReview;
