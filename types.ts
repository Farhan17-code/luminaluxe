export interface CategoryModel {
  id: string;
  name: string;
  description: string;
  image_url: string;
  show_on_home: boolean;
  created_at: string;
}

export type Category = string;

export interface ProductVariant {
  color_name: string;
  thumbnail_url: string;
  images: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  subcategory?: string;
  image_url: string;
  stock: number;
  rating: number;
  review_count?: number;
  sizes?: string[];
  variants?: ProductVariant[];
  material?: string;
  care?: string;
  origin?: string;
  size_and_fit?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface WishlistItem {
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  items: CartItem[];
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  rating: number;
  fit: number;
  size_ordered?: string;
  title?: string;
  content: string;
  nickname: string;
  email: string;
  height?: string;
  weight?: string;
  photo_url?: string;
  is_verified?: boolean;
  helpful_count: number;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  value: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface CustomerInsight {
  user_id: string;
  email: string;
  total_spend: number;
  order_count: number;
  last_purchase: string;
}