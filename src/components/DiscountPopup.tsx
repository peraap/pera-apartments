import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Gift, ArrowRight } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export const DiscountPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('pera_discount_popup_seen');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000); // Show after 3 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('pera_discount_popup_seen', 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'leads'), {
        name,
        email,
        source: 'discount_popup_april_2026',
        createdAt: new Date().toISOString(),
      });
      toast.success('Codul de reducere a fost trimis pe email!');
      handleClose();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error('A apărut o eroare. Te rugăm să încerci din nou.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 text-neutral-400 hover:text-black transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="p-8 md:p-10">
              <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-black/20">
                <Gift className="text-white" size={32} />
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-display font-black mb-3 uppercase tracking-tight text-neutral-900 leading-tight">
                  Reducere <span className="text-neutral-400">20%</span>
                </h2>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest leading-relaxed">
                  Beneficiază de reducere 20% până pe 15 aprilie 2026. Înscrie-te acum!
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Numele tău"
                    required
                    className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-bold outline-none focus:border-black transition-all text-neutral-900 placeholder:text-neutral-400"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Adresa de email"
                    required
                    className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-bold outline-none focus:border-black transition-all text-neutral-900 placeholder:text-neutral-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                >
                  {loading ? 'Se trimite...' : (
                    <>
                      Vreau reducerea
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-[10px] text-center text-neutral-400 font-medium uppercase tracking-tighter">
                *Oferta este valabilă pentru rezervările directe pe site.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
