import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Gift, ArrowRight } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Magnetic, Reveal3D, GlowWrapper, FloatingElement } from './AnimatedComponents';

export const DiscountPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 3000); // Show after 3 seconds
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Save to Firestore
      await addDoc(collection(db, 'leads'), {
        name,
        email,
        source: 'discount_popup_april_2026',
        createdAt: new Date().toISOString(),
      });

      // 2. Send Email via Backend
      await fetch('/api/send-discount-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
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
            initial={{ opacity: 0, scale: 0.5, y: 100, rotateX: 45 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 100, rotateX: -45 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-neutral-100 perspective-1000"
          >
            <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none select-none">
              <FloatingElement duration={10}>
                <div className="text-[15vw] font-display font-black leading-none tracking-tighter">OFFER</div>
              </FloatingElement>
            </div>

            <button
              onClick={handleClose}
              className="absolute top-6 right-6 text-neutral-400 hover:text-black transition-colors z-[300]"
            >
              <X size={20} />
            </button>

            <div className="p-8 md:p-10 relative z-10">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
                className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-black/20"
              >
                <Gift className="text-white" size={32} />
              </motion.div>

              <div className="mb-8">
                <motion.h2 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl font-display font-black mb-3 uppercase tracking-tight text-neutral-900 leading-tight"
                >
                  Reducere <span className="text-neutral-400">20%</span>
                </motion.h2>
                <motion.p 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xs text-neutral-500 font-bold uppercase tracking-widest leading-relaxed"
                >
                  Beneficiază de reducere 20% până pe 30 aprilie 2026. Înscrie-te acum!
                </motion.p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="relative"
                >
                  <input
                    type="text"
                    placeholder="Numele tău"
                    required
                    className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-bold outline-none focus:border-black transition-all text-neutral-900 placeholder:text-neutral-400"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </motion.div>
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="relative"
                >
                  <input
                    type="email"
                    placeholder="Adresa de email"
                    required
                    className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-bold outline-none focus:border-black transition-all text-neutral-900 placeholder:text-neutral-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </motion.div>
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <Magnetic>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-black text-white py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50 mt-4 active:scale-95"
                    >
                      {loading ? 'Se trimite...' : (
                        <>
                          Vreau reducerea
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </Magnetic>
                </motion.div>
              </form>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 text-[10px] text-center text-neutral-400 font-medium uppercase tracking-tighter"
              >
                *Oferta este valabilă pentru rezervările directe pe site.
              </motion.p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
