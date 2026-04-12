import React, { useState, useEffect } from 'react';
import { format, addDays, isBefore, isAfter, startOfDay, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Calendar as CalendarIcon, CreditCard, Loader2, Info, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';

// Booking Calendar Component
interface BookingCalendarProps {
  apartmentId: string;
  apartmentName: string;
  pricePerNight: number;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ apartmentId, apartmentName, pricePerNight }) => {
  const { user } = useAuth();
  const [range, setRange] = useState<DateRange | undefined>();
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(true);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchBookedDates();
  }, [apartmentId]);

  const fetchBookedDates = async () => {
    setCheckingAvailability(true);
    try {
      const q = query(
        collection(db, 'bookings'),
        where('apartmentId', '==', apartmentId),
        where('status', 'in', ['confirmed', 'pending'])
      );
      const querySnapshot = await getDocs(q);
      const dates: Date[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const start = new Date(data.checkIn);
        const end = new Date(data.checkOut);
        const interval = eachDayOfInterval({ start, end });
        dates.push(...interval);
      });
      setBookedDates(dates);
    } catch (error) {
      console.error('Error fetching booked dates:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date())) || bookedDates.some(bookedDate => 
      format(bookedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const calculateTotal = () => {
    if (range?.from && range?.to) {
      const diffTime = Math.abs(range.to.getTime() - range.from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays * pricePerNight;
    }
    return 0;
  };

  const handleBooking = async () => {
    if (!range?.from || !range?.to) {
      toast.error('Te rugăm să selectezi perioada rezervării.');
      return;
    }

    if (!user) {
      toast.error('Te rugăm să te autentifici pentru a rezerva.');
      return;
    }

    setLoading(true);
    console.log('Starting booking process for:', apartmentName);
    
    try {
      // 1. Final availability check
      console.log('Checking availability...');
      const q = query(
        collection(db, 'bookings'),
        where('apartmentId', '==', apartmentId),
        where('status', 'in', ['confirmed', 'pending'])
      );
      const querySnapshot = await getDocs(q);
      let isOverlap = false;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const existingStart = new Date(data.checkIn);
        const existingEnd = new Date(data.checkOut);
        
        if (
          isWithinInterval(range.from!, { start: existingStart, end: existingEnd }) ||
          isWithinInterval(range.to!, { start: existingStart, end: existingEnd }) ||
          (isBefore(range.from!, existingStart) && isAfter(range.to!, existingEnd))
        ) {
          isOverlap = true;
        }
      });

      if (isOverlap) {
        console.warn('Overlap detected');
        toast.error('Din păcate, perioada selectată s-a ocupat între timp.');
        fetchBookedDates();
        setLoading(false);
        return;
      }

      // 2. Create Stripe Checkout Session
      console.log('Creating checkout session...');
      const response = await fetch(`${window.location.origin}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartmentId,
          apartmentName,
          totalPrice: calculateTotal(),
          checkIn: format(range.from, 'yyyy-MM-dd'),
          checkOut: format(range.to, 'yyyy-MM-dd'),
          guestEmail: user.email,
          guestName: user.displayName || 'Oaspete Pera',
        }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        // Show the first 100 characters of the response to help debug
        throw new Error(`Eroare server (${response.status}): ${text.substring(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Eroare la server.');
      }

      const session = data;
      console.log('Session created:', session.id);

      if (session.url) {
        console.log('Redirecting to Stripe:', session.url);
        setRedirectUrl(session.url);
        
        // Check if we are in an iframe
        const isInIframe = window.self !== window.top;
        
        if (isInIframe) {
          console.log('In iframe, showing manual payment button to avoid block');
          setLoading(false);
          toast.info('Te rugăm să apeși butonul de plată care a apărut mai jos.');
        } else {
          // Not in iframe, try automatic redirect
          window.location.href = session.url;
        }
      } else {
        throw new Error('Nu s-a putut genera link-ul de plată.');
      }

    } catch (error: any) {
      console.error('Booking Error:', error);
      toast.error(error.message || 'A apărut o eroare la procesarea rezervării.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-neutral-100 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center">
          <CalendarIcon className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-900">Rezervă Direct</h3>
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter">Cel mai bun preț garantat</p>
        </div>
      </div>

      <div className="mb-8 flex justify-center">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
          disabled={isDateDisabled}
          numberOfMonths={1}
          className="border-none font-sans"
          classNames={{
            selected: "rounded-full",
            range_start: "rounded-l-full",
            range_end: "rounded-r-full",
            range_middle: "rounded-none",
            today: "text-black font-black underline",
            day: "h-10 w-10 text-xs font-bold hover:bg-neutral-100 rounded-full transition-all",
            head_cell: "text-[10px] font-black uppercase tracking-widest text-neutral-400 pb-4",
          }}
        />
      </div>

      {range?.from && range?.to && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mb-8 p-6 bg-neutral-50 rounded-2xl border border-neutral-100"
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Perioada</span>
            <span className="text-xs font-bold text-neutral-900">
              {format(range.from, 'dd MMM')} - {format(range.to, 'dd MMM yyyy')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Total</span>
            <span className="text-lg font-display font-black text-neutral-900">
              {calculateTotal()} RON
            </span>
          </div>
        </motion.div>
      )}

      <button
        onClick={handleBooking}
        disabled={loading || checkingAvailability || !range?.from || !range?.to}
        className="w-full bg-black text-white py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>
            <CreditCard size={18} />
            Confirmă și Plătește
          </>
        )}
      </button>

      {redirectUrl && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-6 bg-neutral-900 rounded-2xl text-center shadow-2xl shadow-black/20 border border-neutral-800"
        >
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">
            Pasul Final: Finalizează Plata
          </p>
          <a 
            href={redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neutral-100 transition-all group"
          >
            Deschide Pagina de Plată
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
          </a>
          <p className="mt-4 text-[9px] text-neutral-500 font-medium uppercase tracking-tight leading-relaxed">
            Se va deschide o fereastră securizată Stripe pentru a finaliza tranzacția.
          </p>
        </motion.div>
      )}

      <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
        <Info className="text-blue-500 shrink-0" size={16} />
        <p className="text-[9px] text-blue-700 font-medium leading-relaxed uppercase tracking-tight">
          Plata este procesată securizat prin Stripe. Vei primi confirmarea pe email imediat după finalizarea tranzacției.
        </p>
      </div>
    </div>
  );
};
