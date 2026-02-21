import { createContext, useContext } from 'react';
import { Product, CartItem, User as UserType, Category } from './types';

// Global State Context
export interface GlobalStateContextType {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    activeCategory: Category;
    setActiveCategory: (c: Category) => void;
}

export const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

export const useGlobalState = () => {
    const context = useContext(GlobalStateContext);
    if (!context) throw new Error('useGlobalState must be used within a GlobalStateProvider');
    return context;
};

// Cart Context
export interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, delta: number) => void;
    clearCart: () => void;
    total: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};

// Auth Context
export interface AuthContextType {
    user: UserType | null;
    login: (email: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signInWithPassword: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
