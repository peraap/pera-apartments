import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Mail, Lock, User, Facebook, Globe, ArrowLeft } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';

export default function AuthPage({ lang }: { lang: 'ro' | 'en' }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loginWithGoogle, loginWithFacebook, loginWithEmail, signupWithEmail } = useAuth();
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

  const handleSocialLogin = async (method: () => Promise<void>) => {
    try {
      await method();
      toast.success(lang === 'ro' ? 'Autentificare reușită!' : 'Login successful!');
    } catch (error: any) {
      toast.error(error.message || (lang === 'ro' ? 'A apărut o eroare. Verifică dacă furnizorul este activat în consola Firebase.' : 'An error occurred. Check if the provider is enabled in Firebase console.'));
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
            src="/d6b549ee-a86d-4e0d-a3ec-2adc1a6ac383.jfif" 
            alt="Pera Interior" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            referrerPolicy="no-referrer"
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

          <div className="space-y-4 mb-10">
            <button 
              onClick={() => handleSocialLogin(loginWithGoogle)}
              className="w-full flex items-center justify-center space-x-4 px-8 py-5 bg-white border border-neutral-100 rounded-3xl hover:bg-neutral-50 transition-all group shadow-sm"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-xs font-black uppercase tracking-widest text-neutral-700">
                {lang === 'ro' ? 'Continuă cu Google' : 'Continue with Google'}
              </span>
            </button>
            <button 
              onClick={() => handleSocialLogin(loginWithFacebook)}
              className="w-full flex items-center justify-center space-x-4 px-8 py-5 bg-[#1877F2] rounded-3xl hover:bg-[#166fe5] transition-all group shadow-xl shadow-[#1877F2]/20"
            >
              <Facebook size={24} className="text-white" fill="currentColor" />
              <span className="text-xs font-black uppercase tracking-widest text-white">
                {lang === 'ro' ? 'Continuă cu Facebook' : 'Continue with Facebook'}
              </span>
            </button>
          </div>

          <div className="relative mb-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="px-6 bg-white text-neutral-300 font-black">
                {lang === 'ro' ? 'Sau prin email' : 'Or via email'}
              </span>
            </div>
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
