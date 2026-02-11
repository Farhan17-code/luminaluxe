
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Filter, Search, ArrowLeft } from 'lucide-react';
import { Product, Category } from '../types';
import { supabase } from '../services/supabase';
import { useGlobalState } from '../contexts';
import { ProductCard } from './Home';

const Collection: React.FC = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery, setActiveCategory } = useGlobalState();

  useEffect(() => {
    if (categoryName) {
      setActiveCategory(categoryName as Category);
    }
    const fetchProducts = async () => {
      setLoading(true);
      const data = await supabase.getProducts();
      setProducts(data);
      setLoading(false);
    };
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categoryName]);

  const filteredProducts = products.filter(p => {
    const matchesCategory = categoryName === 'All' || p.category === categoryName;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen">
      {/* Dynamic Collection Header */}
      <section className="bg-white border-b border-[#EDEDED] pt-12 pb-20 px-4 md:px-12">
        <div className="max-w-[1440px] mx-auto space-y-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none">
                {categoryName === 'All' ? 'The Archive' : categoryName}
              </h1>
              <div className="flex items-center gap-4">
                <div className="h-px w-12 bg-black" />
                <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">
                  {filteredProducts.length} Premium Pieces Available
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="px-6 py-4 bg-[#F4F4F4] rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-gray-200 transition-colors">
                <Filter className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Grid - Updated to 2 columns on mobile */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-12 py-10 md:py-20">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-10">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-3/4 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-40 text-center space-y-6 max-w-md mx-auto">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-2xl font-black">Collection Empty</h3>
            <p className="text-gray-400 font-medium">We couldn't find any products matching your current filters in this category.</p>
            <button onClick={() => navigate('/collection/All')} className="text-blue-600 font-bold hover:underline">Clear Filters</button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16"
          >
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default Collection;
