import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Mail, Lock, User, Globe, ArrowLeft } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';

export default function AuthPage({ lang }: { lang: 'ro' | 'en' }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loginWithEmail, signupWithEmail } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
        toast.success(lang === 'ro' ? 'Autentificare reușită!' : 'Login successful!');
      } else {
        await signupWithEmail(email, password, name);
        toast.success(lang === 'ro' ? 'Cont creat cu succes!' : 'Account created successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || (lang === 'ro' ? 'A apărut o eroare' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 pt-24 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden border border-neutral-100 flex flex-col md:flex-row min-h-[600px]"
      >
        {/* Left Side - Visual/Branding */}
        <div className="hidden md:block w-1/2 bg-neutral-900 relative overflow-hidden">
          <img 
            src="/d6b549ee-a86d-4e0d-a3ec-2adc1a6ac383.jpg" 
            alt="Pera Interior" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <Link to="/" className="inline-flex items-center text-xs font-bold uppercase tracking-widest mb-8 opacity-60 hover:opacity-100 transition-opacity">
              <ArrowLeft size={16} className="mr-2" />
              {lang === 'ro' ? 'Înapoi la site' : 'Back to site'}
            </Link>
            <h3 className="text-4xl font-serif italic mb-4">Pera</h3>
            <p className="text-xs uppercase tracking-[0.4em] font-bold opacity-60 mb-8">Apartments</p>
            <p className="text-sm font-light leading-relaxed opacity-80 max-w-xs">
              {lang === 'ro' 
                ? 'Accesează universul nostru premium și bucură-te de beneficii exclusive.' 
                : 'Access our premium universe and enjoy exclusive benefits.'}
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 p-8 md:p-16 bg-white flex flex-col justify-center">
          <div className="mb-12">
            <h2 className="text-4xl font-serif font-black mb-3 uppercase tracking-tight text-neutral-900">
              {isLogin ? (lang === 'ro' ? 'Autentificare' : 'Login') : (lang === 'ro' ? 'Cont Nou' : 'New Account')}
            </h2>
            <p className="text-xs text-neutral-400 font-black uppercase tracking-widest">
              {isLogin 
                ? (lang === 'ro' ? 'Bine ai revenit în universul Pera' : 'Welcome back to Pera universe') 
                : (lang === 'ro' ? 'Începe experiența ta premium' : 'Start your premium experience')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <input 
                  type="text" 
                  placeholder={lang === 'ro' ? 'Nume Complet' : 'Full Name'}
                  className="w-full pl-14 pr-6 py-5 bg-neutral-50 border border-neutral-100 rounded-3xl text-sm font-bold outline-none focus:border-black transition-all text-neutral-900 placeholder:text-neutral-400"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <input 
                type="email" 
                placeholder="Email"
                className="w-full pl-14 pr-6 py-5 bg-neutral-50 border border-neutral-100 rounded-3xl text-sm font-bold outline-none focus:border-black transition-all text-neutral-900 placeholder:text-neutral-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <input 
                type="password" 
                placeholder={lang === 'ro' ? 'Parolă' : 'Password'}
                className="w-full pl-14 pr-6 py-5 bg-neutral-50 border border-neutral-100 rounded-3xl text-sm font-bold outline-none focus:border-black transition-all text-neutral-900 placeholder:text-neutral-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-6 rounded-3xl text-sm font-black uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-2xl shadow-black/20 disabled:opacity-50 mt-6"
            >
              {loading ? (lang === 'ro' ? 'Se procesează...' : 'Processing...') : (isLogin ? (lang === 'ro' ? 'Autentificare' : 'Login') : (lang === 'ro' ? 'Creează Cont' : 'Create Account'))}
            </button>
          </form>

          <div className="mt-12 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-all"
            >
              {isLogin 
                ? (lang === 'ro' ? 'Nu ai cont? Înregistrează-te' : "Don't have an account? Sign up") 
                : (lang === 'ro' ? 'Ai deja cont? Autentifică-te' : 'Already have an account? Login')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
