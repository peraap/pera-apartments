import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Calendar, Home, ArrowRight, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';

const BookingSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    if (sessionId) {
      verifyAndSaveBooking();
    } else {
      setStatus('error');
      toast.error('Sesiune de plată invalidă.');
    }
  }, [sessionId]);

  const verifyAndSaveBooking = async () => {
    try {
      // 1. Check if already saved
      const q = query(collection(db, 'bookings'), where('stripeSessionId', '==', sessionId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setBookingDetails(querySnapshot.docs[0].data());
        setStatus('success');
        return;
      }

      // 2. Verify with server
      const response = await fetch('/api/verify-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Verificarea a eșuat.');
      }

      const data = await response.json();
      const { metadata } = data;

      // 3. Save to Firestore
      const bookingData = {
        apartmentId: metadata.apartmentId,
        checkIn: metadata.checkIn,
        checkOut: metadata.checkOut,
        guestName: metadata.guestName,
        guestEmail: metadata.guestEmail,
        totalPrice: parseFloat(metadata.totalPrice),
        stripeSessionId: sessionId,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      
      setBookingDetails(bookingData);
      setStatus('success');
      toast.success('Rezervare confirmată și salvată!');
    } catch (error) {
      console.error('Error verifying booking:', error);
      setStatus('error');
      toast.error('Nu am putut verifica rezervarea. Te rugăm să ne contactezi.');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-neutral-400 mb-4" size={48} />
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400">Se verifică rezervarea...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-32 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] p-12 text-center shadow-2xl shadow-black/5 border border-white"
        >
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl shadow-green-500/20">
            <CheckCircle2 className="text-white" size={48} />
          </div>

          <h1 className="text-4xl font-display font-black mb-4 uppercase tracking-tight text-neutral-900">
            Rezervare Confirmată!
          </h1>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mb-12">
            Îți mulțumim că ai ales Pera Apartments. Detaliile au fost trimise pe email.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <div className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100 text-left">
              <Calendar className="text-neutral-400 mb-3" size={20} />
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Perioada</p>
              <p className="text-sm font-bold text-neutral-900">Verifică email-ul pentru detalii</p>
            </div>
            <div className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100 text-left">
              <Home className="text-neutral-400 mb-3" size={20} />
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Locație</p>
              <p className="text-sm font-bold text-neutral-900">Pera Apartments, Brașov</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/"
              className="flex-1 bg-black text-white py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3"
            >
              Înapoi la Home
            </Link>
            <Link 
              to="/apartamente"
              className="flex-1 bg-white text-black border border-neutral-200 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-neutral-50 transition-all flex items-center justify-center gap-3"
            >
              Vezi alte apartamente
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingSuccess;
