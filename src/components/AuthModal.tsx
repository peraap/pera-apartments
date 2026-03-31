import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, LogIn, Globe } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginWithEmail, signupWithEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
        toast.success('Autentificare reușită!');
      } else {
        await signupWithEmail(email, password, name);
        toast.success('Cont creat cu succes!');
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'A apărut o eroare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col md:flex-row"
          >
            {/* Left Side - Visual/Branding */}
            <div className="hidden md:block w-1/3 bg-neutral-900 relative overflow-hidden">
              <img 
                src="/d6b549ee-a86d-4e0d-a3ec-2adc1a6ac383.jfif" 
                alt="Pera Interior" 
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <h3 className="text-2xl font-display italic mb-2">Pera</h3>
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60">Apartments</p>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 p-8 md:p-12 bg-white">
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 text-neutral-400 hover:text-black transition-colors"
              >
                <X size={24} />
              </button>

              <div className="mb-10">
                <h2 className="text-3xl font-display font-black mb-2 uppercase tracking-tight text-neutral-900">
                  {isLogin ? 'Autentificare' : 'Cont Nou'}
                </h2>
                <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">
                  {isLogin ? 'Bine ai revenit în universul Pera' : 'Începe experiența ta premium'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Nume Complet"
                      className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-bold outline-none focus:border-black transition-all text-neutral-900 placeholder:text-neutral-400"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input 
                    type="email" 
                    placeholder="Email"
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-bold outline-none focus:border-black transition-all text-neutral-900 placeholder:text-neutral-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input 
                    type="password" 
                    placeholder="Parolă"
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-bold outline-none focus:border-black transition-all text-neutral-900 placeholder:text-neutral-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-2xl shadow-black/20 disabled:opacity-50 mt-4"
                >
                  {loading ? 'Se procesează...' : (isLogin ? 'Autentificare' : 'Creează Cont')}
                </button>
              </form>

              <div className="mt-10 text-center">
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-all"
                >
                  {isLogin ? 'Nu ai cont? Înregistrează-te' : 'Ai deja cont? Autentifică-te'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
