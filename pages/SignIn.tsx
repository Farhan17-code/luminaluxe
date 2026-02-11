import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Mail, Lock, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import GoogleSignInButton from '../components/GoogleSignInButton';

const SignIn: React.FC = () => {
    const { signInWithPassword } = useAuth(); // Assuming useAuth exposes this now
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithPassword(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-[#EDEDED] text-center space-y-10"
            >
                <div className="space-y-4">
                    <h1 className="text-4xl font-black tracking-tighter">Welcome Back</h1>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed">Sign in to access your account.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-12 pr-5 py-4 bg-[#F4F4F4] border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-black/5 transaction-all"
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full pl-12 pr-5 py-4 bg-[#F4F4F4] border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-black/5 transaction-all"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl justify-center">
                            <AlertCircle className="w-4 h-4" />
                            <p className="text-[10px] font-black uppercase">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-[#1A1A1A] text-white font-black text-xs uppercase rounded-2xl flex items-center justify-center gap-3 hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing In...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500 font-medium">Or continue with</span>
                    </div>
                </div>

                <GoogleSignInButton />

                <div className="text-xs font-bold text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-black hover:underline">
                        Sign Up
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default SignIn;
