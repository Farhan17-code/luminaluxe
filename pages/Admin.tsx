import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit3, Save, X, ShieldAlert, Key, ArrowRight, LayoutDashboard, Upload, Image as ImageIcon, Loader2, Tag, Ticket, RefreshCw, History, Layers } from 'lucide-react';
import { Product, Category, Coupon, CustomerInsight, CategoryModel } from '../types';
import { supabase, uploadImage } from '../services/supabase';
import { useAuth } from '../contexts';

const SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

const Admin: React.FC = () => {
  const { user, login } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<CategoryModel[]>([]);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsight[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'coupons' | 'customers'>('products');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const variantThumbRef = useRef<HTMLInputElement>(null);
  const variantGalleryRef = useRef<HTMLInputElement>(null);
  const [activeVariantIndex, setActiveVariantIndex] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProducts();
      fetchCoupons();
      fetchCustomerInsights();
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const data = await (supabase as any).getCategories();
      setCategories(data);
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  };

  const fetchCustomerInsights = async () => {
    try {
      const data = await supabase.getCustomerInsights();
      setCustomerInsights(data);
    } catch (e) {
      console.error('Failed to fetch customer insights:', e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await supabase.getProducts();
      setProducts(data);
    } catch (e) {
      console.error('Failed to fetch products:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const data = await (supabase as any).getCoupons();
      setCoupons(data);
    } catch (e) {
      console.error('Failed to fetch coupons:', e);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail) return;

    await login(adminEmail);
    // Note: Login might be async/magic link, so immediate check might fail if not fully authed.
    // Ideally we wait for session state change.
    setError('Check your email for the login link (or console if dev mode).');
  };

  const handleCreate = async () => {
    const newProd: Omit<Product, 'id'> = {
      name: 'New Product',
      description: 'Enter description...',
      price: 0,
      category: 'Apparel',
      subcategory: 'Hoodies',
      image_url: 'https://i.pinimg.com/736x/3b/a2/e7/3ba2e7915e634d082578b5a4bcc105ba.jpg', // Placeholder
      stock: 1,
      rating: 5,
      sizes: ['S', 'M', 'L'],
      variants: [],
      material: 'Premium Fabric',
      care: 'Machine Wash Cold',
      origin: 'Imported',
      size_and_fit: 'True to Size'
    };
    try {
      const created = await supabase.createProduct(newProd);
      setProducts([created, ...products]);
      setEditingId(created.id);
      setFormData(created);
    } catch (e: any) {
      console.error(e);
      alert('Failed to create product. Ensure you have admin rights.');
    }
  };

  const handleCreateCategory = async () => {
    const newCategory: Omit<CategoryModel, 'id' | 'created_at'> = {
      name: 'New Category ' + Math.floor(Math.random() * 1000),
      description: 'Category description...',
      image_url: 'https://i.pinimg.com/736x/3b/a2/e7/3ba2e7915e634d082578b5a4bcc105ba.jpg',
      show_on_home: false
    };
    try {
      const created = await (supabase as any).createCategory(newCategory);
      setCategories([created, ...categories]);
      setEditingId(created.id);
      setFormData(created);
    } catch (e: any) {
      alert('Failed to create category.');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      if (activeTab === 'products') {
        const { id: _, review_count, reviews, created_at, ...payload } = formData as any;
        await supabase.updateProduct(id, payload);
        setProducts(products.map(p => p.id === id ? { ...p, ...formData } : (p as Product)));
      } else if (activeTab === 'coupons') {
        const { id: _, created_at, ...payload } = formData as any;
        await (supabase as any).updateCoupon(id, payload);
        setCoupons(coupons.map(c => c.id === id ? { ...c, ...formData } : c));
      } else if (activeTab === 'categories') {
        const { id: _, created_at, ...payload } = formData as any;
        await (supabase as any).updateCategory(id, payload);
        setCategories(categories.map(c => c.id === id ? { ...c, ...formData } : c));
      }
      setEditingId(null);
    } catch (e: any) {
      console.error('Update Error:', e);
      alert(`Failed to update: ${e.message}`);
    }
  };

  const handleCreateCoupon = async () => {
    const newCoupon: Omit<Coupon, 'id' | 'created_at'> = {
      code: 'NEWCOUPON' + Math.floor(Math.random() * 1000),
      discount_type: 'percentage',
      value: 10,
      is_active: true
    };
    try {
      const created = await (supabase as any).createCoupon(newCoupon);
      setCoupons([created, ...coupons]);
      setEditingId(created.id);
      setFormData(created);
    } catch (e: any) {
      alert('Failed to create coupon.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this item permanently?')) {
      try {
        if (activeTab === 'products') {
          await supabase.deleteProduct(id);
          setProducts(products.filter(p => p.id !== id));
        } else if (activeTab === 'coupons') {
          await (supabase as any).deleteCoupon(id);
          setCoupons(coupons.filter(c => c.id !== id));
        } else if (activeTab === 'categories') {
          await (supabase as any).deleteCategory(id);
          setCategories(categories.filter(c => c.id !== id));
        }
      } catch (e: any) {
        alert('Failed to delete item.');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({});
    setActiveVariantIndex(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    try {
      const file = e.target.files[0];
      const publicUrl = await uploadImage(file);
      setFormData({ ...formData, image_url: publicUrl });
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Ensure you have admin rights.');
    } finally {
      setUploading(false);
    }
  };

  const handleVariantThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const publicUrl = await uploadImage(file);
      const newVariants = [...(formData.variants || [])];
      newVariants[index].thumbnail_url = publicUrl;
      setFormData({ ...formData, variants: newVariants });
    } catch (error: any) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleVariantGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const files = Array.from(e.target.files);
      const urls = await Promise.all(files.map((f: File) => uploadImage(f)));
      const newVariants = [...(formData.variants || [])];
      newVariants[index].images = [...(newVariants[index].images || []), ...urls];
      setFormData({ ...formData, variants: newVariants });
    } catch (error: any) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const addVariant = () => {
    const newVariants = [...(formData.variants || []), { color_name: 'New Color', thumbnail_url: '', images: [] }];
    setFormData({ ...formData, variants: newVariants });
    setActiveVariantIndex(newVariants.length - 1);
  };

  const removeVariant = (index: number) => {
    const newVariants = formData.variants?.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: newVariants });
    if (activeVariantIndex === index) setActiveVariantIndex(null);
  };

  const toggleSize = (size: string) => {
    const currentSizes = formData.sizes || [];
    const newSizes = currentSizes.includes(size)
      ? currentSizes.filter(s => s !== size)
      : [...currentSizes, size];
    setFormData({ ...formData, sizes: newSizes });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-[#EDEDED] text-center space-y-10"
        >
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto group">
            <ShieldAlert className="w-12 h-12 group-hover:scale-110 transition-transform" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tighter">Restricted Access</h1>
            <p className="text-gray-400 text-sm font-medium leading-relaxed">Admin privileges required.</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="admin@example.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-[#F4F4F4] border-none rounded-2xl text-sm font-bold outline-none"
              />
            </div>
            {error && <p className="text-red-500 text-[10px] font-black uppercase">{error}</p>}
            <button type="submit" className="w-full py-5 bg-[#1A1A1A] text-white font-black text-xs uppercase rounded-2xl flex items-center justify-center gap-3">
              Unlock Portal <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-12 space-y-12 pb-40">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-[10px]">
            <LayoutDashboard className="w-4 h-4" /> Management Console
          </div>
          <h1 className="text-5xl font-black tracking-tight">
            {activeTab === 'products' ? 'Inventory Details' : activeTab === 'categories' ? 'Categories' : activeTab === 'coupons' ? 'Promo Codes' : 'Customer Database'}
          </h1>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => { setActiveTab('products'); setEditingId(null); }}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'products' ? 'bg-black text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Products
            </button>
            <button
              onClick={() => { setActiveTab('categories'); setEditingId(null); }}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'categories' ? 'bg-black text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
            >
              <Layers className="w-4 h-4" /> Categories
            </button>
            <button
              onClick={() => { setActiveTab('coupons'); setEditingId(null); }}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'coupons' ? 'bg-black text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
            >
              <Tag className="w-4 h-4" /> Coupons
            </button>
            <button
              onClick={() => { setActiveTab('customers'); setEditingId(null); }}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'customers' ? 'bg-black text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
            >
              <History className="w-4 h-4" /> Insights
            </button>
          </div>
        </div>

        {activeTab !== 'customers' && (
          <button
            onClick={activeTab === 'products' ? handleCreate : activeTab === 'categories' ? handleCreateCategory : handleCreateCoupon}
            className="px-8 py-5 bg-[#1A1A1A] text-white hover:bg-black rounded-3xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all shadow-xl active:scale-95"
          >
            <Plus className="w-5 h-5" /> Add {activeTab === 'products' ? 'New Inventory' : activeTab === 'categories' ? 'Category' : 'Promo Code'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'products' ? (
          products.map(product => (
            <motion.div
              layout
              key={product.id}
              className={`bg-white border rounded-[2.5rem] overflow-hidden transition-all duration-300 ${editingId === product.id ? 'border-blue-500 shadow-2xl ring-4 ring-blue-500/10' : 'border-[#EDEDED] hover:shadow-lg'}`}
            >
              <div className="p-8 flex flex-col lg:flex-row gap-10 items-start">
                {/* Image Section */}
                <div className="w-full lg:w-72 shrink-0 space-y-4">
                  <div
                    className={`aspect-square rounded-3xl overflow-hidden bg-gray-50 relative group ${editingId === product.id ? 'cursor-pointer' : ''}`}
                    onClick={() => editingId === product.id && fileInputRef.current?.click()}
                  >
                    <img
                      src={editingId === product.id && formData.image_url ? formData.image_url : product.image_url}
                      alt={product.name}
                      className={`w-full h-full object-cover transition-opacity ${uploading && editingId === product.id ? 'opacity-50' : 'opacity-100'}`}
                    />
                    {editingId === product.id && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Upload className="w-8 h-8 text-white mb-2" />}
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                </div>

                {/* Content Section */}
                <div className="flex-1 w-full space-y-8">
                  {editingId === product.id ? (
                    <div className="space-y-8">
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Product Name</label>
                            <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#F8F8F8] border-none rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500/20" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
                            <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-[#F8F8F8] border-none rounded-xl px-4 py-3 text-sm font-medium outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500/20 resize-none" />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price ($)</label>
                              <input type="number" value={formData.price || 0} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="w-full bg-[#F8F8F8] border-none rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory</label>
                              <input type="number" value={formData.stock || 0} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })} className="w-full bg-[#F8F8F8] border-none rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category Selection</label>
                              <select value={formData.category || (categories[0]?.name || 'Apparel')} onChange={e => setFormData({ ...formData, category: e.target.value as Category })} className="w-full bg-[#F8F8F8] border-none rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500/20 appearance-none">
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                {categories.length === 0 && <option value="Apparel">Apparel</option>}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subcategory</label>
                              <input type="text" placeholder="e.g. Hoodies, Cameras" value={formData.subcategory || ''} onChange={e => setFormData({ ...formData, subcategory: e.target.value })} className="w-full bg-[#F8F8F8] border-none rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Size Selection */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Available Sizes</label>
                        <div className="flex flex-wrap gap-3">
                          {SIZES.map(size => (
                            <button
                              key={size}
                              onClick={() => toggleSize(size)}
                              className={`px-5 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${formData.sizes?.includes(size) ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Specifications */}
                      <div className="space-y-4 pt-6 border-t border-gray-100">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Specifications</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Material</label>
                            <input type="text" value={formData.material || ''} onChange={e => setFormData({ ...formData, material: e.target.value })} className="w-full bg-[#F8F8F8] border-none rounded-xl px-4 py-2 text-xs font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. 100% Cotton" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Care Instructions</label>
                            <input type="text" value={formData.care || ''} onChange={e => setFormData({ ...formData, care: e.target.value })} className="w-full bg-[#F8F8F8] border-none rounded-xl px-4 py-2 text-xs font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. Machine Wash Cold" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Origin</label>
                            <input type="text" value={formData.origin || ''} onChange={e => setFormData({ ...formData, origin: e.target.value })} className="w-full bg-[#F8F8F8] border-none rounded-xl px-4 py-2 text-xs font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. Made in Italy" />
                          </div>
                          <div className="space-y-2 col-span-1 md:col-span-3">
                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Size & Fit</label>
                            <input type="text" value={formData.size_and_fit || ''} onChange={e => setFormData({ ...formData, size_and_fit: e.target.value })} className="w-full bg-[#F8F8F8] border-none rounded-xl px-4 py-2 text-xs font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500/20" placeholder="e.g. True to Size, Slightly Oversized" />
                          </div>
                        </div>
                      </div>

                      {/* Variant Manager */}
                      <div className="space-y-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Color Variants & Galleries</label>
                          <button onClick={addVariant} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors">
                            <Plus className="w-3 h-3" /> Add Color Group
                          </button>
                        </div>

                        <div className="space-y-4">
                          {formData.variants?.map((v, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-2xl p-6 space-y-6 relative border border-transparent hover:border-blue-100 transition-colors">
                              <button onClick={() => removeVariant(idx)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500"><X className="w-4 h-4" /></button>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Color Name</label>
                                  <input
                                    type="text"
                                    value={v.color_name}
                                    onChange={e => {
                                      const newVars = [...(formData.variants || [])];
                                      newVars[idx].color_name = e.target.value;
                                      setFormData({ ...formData, variants: newVars });
                                    }}
                                    placeholder="e.g. Navy Blue"
                                    className="w-full bg-white border-none rounded-xl px-4 py-2 text-xs font-bold outline-none ring-1 ring-gray-100"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Fabric Thumbnail</label>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-100 overflow-hidden">
                                      {v.thumbnail_url ? <img src={v.thumbnail_url} className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-2 text-gray-200" />}
                                    </div>
                                    <input type="file" id={`thumb-${idx}`} className="hidden" onChange={(e) => handleVariantThumbUpload(e, idx)} />
                                    <label htmlFor={`thumb-${idx}`} className="px-3 py-2 bg-white text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer hover:bg-gray-50 border border-gray-100">Upload</label>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Gallery Assets</label>
                                  <div className="flex items-center gap-3">
                                    <input type="file" id={`gallery-${idx}`} className="hidden" multiple onChange={(e) => handleVariantGalleryUpload(e, idx)} />
                                    <label htmlFor={`gallery-${idx}`} className="flex items-center gap-2 px-3 py-2 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer hover:bg-gray-800">
                                      <Upload className="w-3 h-3" /> {v.images?.length || 0} Images
                                    </label>
                                  </div>
                                </div>
                              </div>

                              {v.images && v.images.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                  {v.images.map((img, iidx) => (
                                    <div key={iidx} className="relative group">
                                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-100">
                                        <img src={img} className="w-full h-full object-cover" />
                                      </div>
                                      <button
                                        onClick={() => {
                                          const newVars = [...(formData.variants || [])];
                                          newVars[idx].images = newVars[idx].images.filter((_, k) => k !== iidx);
                                          setFormData({ ...formData, variants: newVars });
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="w-2 h-2" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">{product.category}</span>
                            {product.subcategory && (
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">{product.subcategory}</span>
                            )}
                          </div>
                          <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tight mb-3">{product.name}</h2>
                          <p className="text-gray-500 text-sm leading-relaxed">{product.description || 'No detailed log provided for this asset.'}</p>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Sizes</p>
                          <div className="flex flex-wrap gap-2">
                            {product.sizes?.map(s => <span key={s} className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold rounded-lg">{s}</span>)}
                            {(!product.sizes || product.sizes.length === 0) && <span className="text-gray-300 italic text-xs">No sizes defined</span>}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Variants</p>
                          <div className="flex flex-wrap gap-4">
                            {product.variants?.map((v, i) => (
                              <div key={i} className="flex items-center gap-3 bg-gray-50 pr-4 pl-1 py-1 rounded-full border border-gray-100">
                                <div className="w-6 h-6 rounded-full bg-white border border-gray-200 overflow-hidden">
                                  {v.thumbnail_url ? <img src={v.thumbnail_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                                </div>
                                <span className="text-[10px] font-bold text-gray-600 uppercase">{v.color_name}</span>
                                <span className="text-[10px] font-black text-blue-500">{v.images?.length || 0} pics</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#F8F8F8] p-5 rounded-4xl border border-gray-100">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Price Node</p>
                          <p className="text-2xl font-black text-[#1A1A1A]">৳{product.price.toFixed(2)}</p>
                        </div>
                        <div className="bg-[#F8F8F8] p-5 rounded-4xl border border-gray-100">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Inventory</p>
                          <p className={`text-2xl font-black ${product.stock > 0 ? 'text-[#1A1A1A]' : 'text-red-500'}`}>{product.stock > 0 ? product.stock : 'EMTPY'}</p>
                        </div>
                        <div className="bg-emerald-50 p-5 rounded-4xl border border-emerald-100 col-span-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Security Hub Rating</p>
                          <div className="flex items-center gap-1 text-emerald-600 font-black">★ {product.rating} <span className="text-emerald-300 font-medium px-2">Verified Archive</span></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                < div className="flex flex-col gap-3" >
                  {editingId === product.id ? (
                    <>
                      <button onClick={() => handleUpdate(product.id)} className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center hover:bg-gray-800 transition-all shadow-xl active:scale-90 group">
                        <Save className="w-6 h-6 group-hover:scale-110" />
                      </button>
                      <button onClick={handleCancelEdit} className="w-14 h-14 bg-white border border-gray-200 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-50 transition-all active:scale-90">
                        <X className="w-6 h-6" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(product.id); setFormData({ ...product }); }} className="w-14 h-14 bg-white border border-[#EDEDED] text-black rounded-2xl flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm active:scale-90 group">
                        <Edit3 className="w-6 h-6 group-hover:scale-110" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-all active:scale-90 group">
                        <Trash2 className="w-6 h-6 group-hover:scale-110" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Status Bar */}
              {
                editingId === product.id && (
                  <div className="bg-blue-50 p-3 text-center border-t border-blue-100">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] animate-pulse">Editing Mode Active</p>
                  </div>
                )
              }
            </motion.div >
          ))
        ) : activeTab === 'categories' ? (
          categories.map(category => (
            <motion.div
              layout
              key={category.id}
              className={`bg-white border rounded-[2.5rem] overflow-hidden transition-all duration-300 flex flex-col md:flex-row ${editingId === category.id ? 'border-blue-500 shadow-xl' : 'border-[#EDEDED] hover:shadow-md'}`}
            >
              <div className="w-full md:w-64 h-48 md:h-auto bg-gray-50 relative shrink-0 group">
                 <img
                    src={editingId === category.id && formData.image_url ? formData.image_url : category.image_url}
                    alt={category.name}
                    className={`w-full h-full object-cover transition-opacity ${uploading && editingId === category.id ? 'opacity-50' : 'opacity-100'}`}
                 />
                 {editingId === category.id && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                       {uploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Upload className="w-8 h-8 text-white mb-2" />}
                    </div>
                 )}
                 <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </div>
              
              <div className="p-8 flex-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                 {editingId === category.id ? (
                    <div className="flex-1 space-y-4 w-full">
                       <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#F8F8F8] border-none rounded-xl px-4 py-3 text-sm font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500/20" placeholder="Category Name" />
                       <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full bg-[#F8F8F8] border-none rounded-xl px-4 py-3 text-sm font-medium outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500/20 resize-none" placeholder="Description" />
                       <div className="flex items-center gap-2">
                          <input type="checkbox" id={`home-${category.id}`} checked={formData.show_on_home} onChange={e => setFormData({ ...formData, show_on_home: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <label htmlFor={`home-${category.id}`} className="text-sm font-bold text-gray-600 cursor-pointer">Show on Home Page</label>
                       </div>
                    </div>
                 ) : (
                    <div className="flex-1 space-y-2">
                       <h3 className="text-2xl font-black tracking-tight">{category.name}</h3>
                       <p className="text-gray-500 text-sm">{category.description || 'No description provided.'}</p>
                       {category.show_on_home && <span className="inline-block px-3 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">Featured on Home</span>}
                    </div>
                 )}

                <div className="flex gap-2">
                  {editingId === category.id ? (
                    <>
                      <button onClick={() => handleUpdate(category.id)} className="p-4 bg-black text-white rounded-2xl hover:bg-gray-800 transition-all shadow-xl active:scale-95">
                        <Save className="w-6 h-6" />
                      </button>
                      <button onClick={handleCancelEdit} className="p-4 bg-white border border-gray-200 text-gray-400 rounded-2xl hover:bg-gray-50 transition-all active:scale-95">
                        <X className="w-6 h-6" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(category.id); setFormData({ ...category }); }} className="p-4 bg-white border border-[#EDEDED] text-black rounded-2xl hover:bg-gray-50 transition-all shadow-sm active:scale-95">
                        <Edit3 className="w-6 h-6" />
                      </button>
                      <button onClick={() => handleDelete(category.id)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all active:scale-95">
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : activeTab === 'coupons' ? (
          coupons.map(coupon => (
            <motion.div
              layout
              key={coupon.id}
              className={`bg-white border rounded-3xl overflow-hidden transition-all duration-300 ${editingId === coupon.id ? 'border-blue-500 shadow-xl' : 'border-[#EDEDED] hover:shadow-md'}`}
            >
              {/* Coupon content ... */}
              <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                  <Ticket className="w-8 h-8" />
                </div>

                <div className="flex-1 space-y-2">
                  {editingId === coupon.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-gray-400">Code</label>
                        <input type="text" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full bg-gray-50 border-none rounded-lg px-3 py-2 text-sm font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-blue-500/20" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-gray-400">Value</label>
                        <div className="flex gap-2">
                          <input type="number" value={formData.value || 0} onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })} className="flex-1 bg-gray-50 border-none rounded-lg px-3 py-2 text-sm font-bold outline-none ring-1 ring-gray-100" />
                          <select value={formData.discount_type || 'percentage'} onChange={e => setFormData({ ...formData, discount_type: e.target.value })} className="bg-gray-50 border-none rounded-lg px-2 py-2 text-xs font-bold outline-none ring-1 ring-gray-100">
                            <option value="percentage">%</option>
                            <option value="fixed">$</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <input type="checkbox" id={`active-${coupon.id}`} checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor={`active-${coupon.id}`} className="text-xs font-bold text-gray-500 uppercase">Active</label>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black tracking-tight">{coupon.code}</h3>
                        <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${coupon.is_active ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-400'}`}>
                          {coupon.is_active ? 'Live' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {coupon.discount_type === 'percentage' ? `${coupon.value}% Off Entire Order` : `৳${coupon.value.toFixed(2)} Flat Discount`}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  {editingId === coupon.id ? (
                    <>
                      <button onClick={() => handleUpdate(coupon.id)} className="p-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all">
                        <Save className="w-5 h-5" />
                      </button>
                      <button onClick={handleCancelEdit} className="p-3 bg-white border border-gray-200 text-gray-400 rounded-xl hover:bg-gray-50 transition-all">
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(coupon.id); setFormData({ ...coupon }); }} className="p-3 bg-white border border-[#EDEDED] text-black rounded-xl hover:bg-gray-50 transition-all">
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(coupon.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="space-y-6">
            {/* Customer insights rendering */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-8 rounded-[2.5rem] border border-[#EDEDED] shadow-sm space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Total Active Nodes</p>
                <h4 className="text-4xl font-black">{customerInsights.length}</h4>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-[#EDEDED] shadow-sm space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Gross Archive Value</p>
                <h4 className="text-4xl font-black">৳{customerInsights.reduce((sum, c) => sum + (c.total_spend || 0), 0).toFixed(2)}</h4>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-[#EDEDED] shadow-sm space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Avg Acquisition Value</p>
                <h4 className="text-4xl font-black">৳{(customerInsights.reduce((sum, c) => sum + (c.total_spend || 0), 0) / (customerInsights.length || 1)).toFixed(2)}</h4>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-[#EDEDED] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[#EDEDED]">
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Identity</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Acquisitions</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Investment</th>
                      <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {customerInsights.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                          No customer data found in current index
                        </td>
                      </tr>
                    ) : (
                      customerInsights.sort((a, b) => b.total_spend - a.total_spend).map((customer) => (
                        <tr key={customer.user_id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center font-black text-xs">
                                {customer.email[0].toUpperCase()}
                              </div>
                              <span className="font-bold text-sm">{customer.email}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
                              {customer.order_count} Orders
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm font-black">
                            ৳{customer.total_spend.toFixed(2)}
                          </td>
                          <td className="px-8 py-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                            {customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {
          ((activeTab === 'products' && products.length === 0) || (activeTab === 'coupons' && coupons.length === 0) || (activeTab === 'categories' && categories.length === 0) || (activeTab === 'customers' && customerInsights.length === 0)) && !loading && (
            <div className="bg-white border text-center p-20 rounded-[3rem] space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                {activeTab === 'products' ? <LayoutDashboard className="w-8 h-8 text-gray-300" /> : activeTab === 'categories' ? <Layers className="w-8 h-8 text-gray-300" /> : activeTab === 'coupons' ? <Tag className="w-8 h-8 text-gray-300" /> : <History className="w-8 h-8 text-gray-300" />}
              </div>
              <h3 className="text-xl font-bold">No {activeTab} Found</h3>
              <p className="text-gray-400">
                {activeTab === 'customers'
                  ? 'No transaction data recorded in the archive yet.'
                  : `Initialize your database or add a new ${activeTab === 'products' ? 'product' : activeTab === 'categories' ? 'category' : 'coupon'} to get started.`}
              </p>
            </div>
          )
        }
      </div >

      <div className="flex justify-center pt-8">
        <button
          onClick={() => { fetchProducts(); fetchCoupons(); fetchCategories(); }}
          className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all group"
        >
          <RefreshCw className="w-4 h-4 group-active:rotate-180 transition-transform duration-500" /> Refresh Data Node
        </button>
      </div>

      {loading && (
        <div className="p-20 text-center flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Syncing Neural Data</p>
        </div>
      )}
    </div >
  );
};

export default Admin;
