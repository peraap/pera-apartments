import React, { useState, useEffect } from 'react';
import { format, addDays, isBefore, isAfter, startOfDay, eachDayOfInterval, isWithinInterval, differenceInDays, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Calendar as CalendarIcon, CreditCard, Loader2, Info, ArrowRight, Tag, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';
import { SpecialOffer } from '../types';

// Booking Calendar Component
interface BookingCalendarProps {
  apartmentId: string;
  apartmentName: string;
  pricePerNight: number;
  slug: string;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ apartmentId, apartmentName, pricePerNight, slug }) => {
  const { user } = useAuth();
  const [range, setRange] = useState<DateRange | undefined>();
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(true);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  
  const [availableOffers, setAvailableOffers] = useState<SpecialOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<SpecialOffer | null>(null);
  const [isOfferDropdownOpen, setIsOfferDropdownOpen] = useState(false);

  useEffect(() => {
    fetchBookedDates();
    fetchOffers();
  }, [apartmentId, slug]);

  const fetchOffers = () => {
    const q = query(
      collection(db, 'specialOffers'), 
      where('isActive', '==', true)
    );
    
    return onSnapshot(q, (snapshot) => {
      const allOffers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpecialOffer));
      // Filter by apartmentId and date validity
      const now = new Date();
      const relevantOffers = allOffers.filter(offer => {
        const isApplicable = offer.applicableApartments.length === 0 || offer.applicableApartments.includes(apartmentId);
        const isTimeValid = new Date(offer.startDate) <= now && new Date(offer.endDate) >= now;
        return isApplicable && isTimeValid;
      });
      setAvailableOffers(relevantOffers);
    });
  };

  const fetchBookedDates = async () => {
    setCheckingAvailability(true);
    try {
      // 1. Fetch bookings from local database (Firestore)
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
        // A booking from 1st to 5th means nights of 1, 2, 3, 4 are taken. 
        // 5th is check-out and free for next check-in.
        if (isBefore(start, end)) {
          const interval = eachDayOfInterval({ start, end: addDays(end, -1) });
          dates.push(...interval);
        }
      });

      // 1b. Fetch universal blocks (all apartments)
      const qAll = query(
        collection(db, 'blocks'),
        where('apartmentId', 'in', ['all', 'toate'])
      );
      const allSnapshot = await getDocs(qAll);
      allSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.startDate && data.endDate) {
          const start = new Date(data.startDate);
          const end = new Date(data.endDate);
          const interval = eachDayOfInterval({ 
            start, 
            end: addDays(end, -1) 
          });
          dates.push(...interval);
        }
      });

      // 1c. Fetch specific manual blocks
      const qSpecific = query(
        collection(db, 'blocks'),
        where('apartmentId', '==', apartmentId)
      );
      const specificSnapshot = await getDocs(qSpecific);
      specificSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.startDate && data.endDate) {
          const start = new Date(data.startDate);
          const end = new Date(data.endDate);
          const interval = eachDayOfInterval({ 
            start, 
            end: addDays(end, -1) 
          });
          dates.push(...interval);
        }
      });
      try {
        const response = await fetch(`/api/blocked-dates/${slug}`);
        if (response.ok) {
          const data = await response.json();
          if (data.blockedDates && Array.isArray(data.blockedDates)) {
            data.blockedDates.forEach((dateStr: string) => {
              dates.push(parseISO(dateStr));
            });
          }
        }
      } catch (apiError) {
        console.error('Error fetching external blocked dates:', apiError);
      }

      setBookedDates(dates);
    } catch (error) {
      console.error('Error fetching booked dates:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const disabledDays = bookedDates.map(d => format(d, 'yyyy-MM-dd'));

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date())) || disabledDays.includes(format(date, 'yyyy-MM-dd'));
  };

  const handleRangeSelect = (newRange: DateRange | undefined) => {
    if (newRange?.from && newRange?.to) {
      // Check if any day in the range (excluding the last day) is disabled
      const stayInterval = eachDayOfInterval({ 
        start: startOfDay(newRange.from), 
        end: addDays(startOfDay(newRange.to), -1) 
      });
      
      const hasConflict = stayInterval.some(date => isDateDisabled(date));
      
      if (hasConflict) {
        toast.error('Perioada selectată conține zile deja rezervate.');
        setRange(undefined);
        return;
      }
    }
    setRange(newRange);
  };

  const calculateNights = () => {
    if (range?.from && range?.to) {
      const nights = differenceInDays(range.to, range.from);
      return Math.max(1, nights); 
    }
    return 0;
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    if (nights === 0) return 0;
    
    const subtotal = nights * pricePerNight;
    
    let discount = 0;
    if (selectedOffer) {
      // Check min nights condition
      if (offerConditionMet(selectedOffer)) {
        if (selectedOffer.discountType === 'percentage') {
          discount = (subtotal * selectedOffer.discountValue) / 100;
        } else {
          discount = selectedOffer.discountValue;
        }
      }
    }
    
    return Math.max(0, subtotal - discount);
  };

  const offerConditionMet = (offer: SpecialOffer) => {
    const nights = calculateNights();
    return !offer.minNights || nights >= offer.minNights;
  };

  const handleBooking = async () => {
    if (checkingAvailability) {
      toast.info('Încă verificăm disponibilitatea. Te rugăm să aștepți o secundă.');
      return;
    }
    
    console.log('handleBooking triggered');
    if (!range?.from || !range?.to) {
      toast.error('Te rugăm să selectezi perioada rezervării.');
      return;
    }

    // Bug fix: Check if stay is at least 1 night
    if (format(range.from, 'yyyy-MM-dd') === format(range.to, 'yyyy-MM-dd')) {
      toast.error('Perioada rezervării trebuie să fie de minim o noapte.');
      return;
    }

    if (!user) {
      toast.error('Te rugăm să te autentifici pentru a rezerva.');
      return;
    }

    if (selectedOffer && !offerConditionMet(selectedOffer)) {
      toast.error(`Această ofertă necesită minim ${selectedOffer.minNights} nopți.`);
      return;
    }

    setLoading(true);
    console.log('Starting booking process for:', apartmentName);
    
    try {
      // 1. Final availability check across the entire selected interval
      console.log('Checking availability for interval...');
      
      // Get all days in the requested stay
      // Note: we check up until the day BEFORE check-out, as check-out day is usually available for a new check-in
      const checkIn = startOfDay(range.from);
      const checkOut = startOfDay(range.to);
      
      // Basic check: at least 1 night
      if (isBefore(checkOut, addDays(checkIn, 1)) && format(checkIn, 'yyyy-MM-dd') === format(checkOut, 'yyyy-MM-dd')) {
        toast.error('Perioada rezervării trebuie să fie de minim o noapte.');
        setLoading(false);
        return;
      }

      const stayInterval = eachDayOfInterval({ 
        start: checkIn, 
        end: addDays(checkOut, -1) // Usually check-out day is available for next guest
      });

      const hasConflict = stayInterval.some(date => isDateDisabled(date));

      if (hasConflict) {
        console.warn('Conflict detected in stay interval');
        toast.error('Din păcate, una sau mai multe zile din perioada selectată sunt indisponibile.');
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
          offerId: selectedOffer?.id || null,
          offerTitle: selectedOffer?.title || null
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
    <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-4 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10">
            <CalendarIcon className="text-white" size={22} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-neutral-900">Programare Sejur</h3>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">Disponibilitate în timp real</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-full border border-neutral-100">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Live Sync</span>
        </div>
      </div>

      <div className="mb-8 flex justify-center w-full">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={handleRangeSelect}
          disabled={isDateDisabled}
          numberOfMonths={1}
          locale={ro}
          className="w-full"
          classNames={{
            months: "w-full relative px-1",
            month: "w-full space-y-6",
            month_caption: "flex justify-center pt-2 relative items-center mb-10 min-h-12",
            caption_label: "text-lg font-black uppercase tracking-[0.3em] text-neutral-900 border-b-2 border-neutral-900 pb-1 px-4 z-10",
            nav: "absolute top-2 left-0 right-0 flex items-center justify-between w-full h-12 z-40 pointer-events-none",
            button_previous: "h-12 w-12 bg-white hover:bg-neutral-50 rounded-2xl flex items-center justify-center transition-all border border-neutral-100 hover:border-black active:scale-90 disabled:opacity-20 cursor-pointer shadow-md pointer-events-auto",
            button_next: "h-12 w-12 bg-white hover:bg-neutral-50 rounded-2xl flex items-center justify-center transition-all border border-neutral-100 hover:border-black active:scale-90 disabled:opacity-20 cursor-pointer shadow-md pointer-events-auto",
            month_grid: "w-full border-collapse",
            weekdays: "flex w-full mb-4",
            weekday: "text-neutral-300 font-black uppercase tracking-widest text-[10px] flex-1 text-center font-sans",
            week: "flex w-full mt-2",
            day: "relative flex-1 aspect-square p-0 text-center flex items-center justify-center",
            day_button: "h-[92%] w-[92%] p-0 font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center rounded-xl hover:bg-neutral-50 cursor-pointer m-0 border-0 outline-none",
            selected: "!bg-black !text-white rounded-xl shadow-lg shadow-black/10",
            range_start: "!bg-black !text-white rounded-xl",
            range_end: "!bg-black !text-white rounded-xl",
            range_middle: "!bg-neutral-900 !text-white !rounded-none !opacity-80",
            today: "text-black border-2 border-neutral-900/10 font-black",
            disabled: "text-neutral-200 line-through opacity-30 cursor-not-allowed hover:bg-transparent",
            outside: "invisible",
          }}
        />
      </div>

      {/* Special Offers Selection */}
      {availableOffers.length > 0 && (
        <div className="mb-8 relative">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4 block">Oferte Disponibile</label>
          <button
            onClick={() => setIsOfferDropdownOpen(!isOfferDropdownOpen)}
            className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-black transition-all group"
          >
            <div className="flex items-center gap-3">
              <Tag size={16} className={selectedOffer ? 'text-black' : 'text-neutral-300'} />
              <span className={`text-[11px] font-black uppercase tracking-widest ${selectedOffer ? 'text-black' : 'text-neutral-400'}`}>
                {selectedOffer ? selectedOffer.title : 'Alege o ofertă'}
              </span>
            </div>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isOfferDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isOfferDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border border-neutral-100 shadow-2xl p-2 overflow-hidden"
              >
                <div 
                  className={`p-4 rounded-xl cursor-pointer flex items-center gap-3 transition-colors ${!selectedOffer ? 'bg-black text-white' : 'hover:bg-neutral-50 text-neutral-600'}`}
                  onClick={() => { setSelectedOffer(null); setIsOfferDropdownOpen(false); }}
                >
                  <div className="flex-grow">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Fără ofertă</p>
                  </div>
                  {!selectedOffer && <Check size={14} />}
                </div>
                {availableOffers.map((offer) => {
                  const isMet = offerConditionMet(offer);
                  return (
                    <div 
                      key={offer.id}
                      className={`p-4 rounded-xl cursor-pointer flex items-center gap-3 transition-colors mt-1 ${selectedOffer?.id === offer.id ? 'bg-black text-white' : 'hover:bg-neutral-50 text-neutral-600'}`}
                      onClick={() => { setSelectedOffer(offer); setIsOfferDropdownOpen(false); }}
                    >
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[10px] font-black uppercase tracking-widest leading-none">{offer.title}</p>
                          <span className="text-[8px] font-black px-2 py-0.5 bg-neutral-200 text-black rounded-full">
                            -{offer.discountValue}{offer.discountType === 'percentage' ? '%' : ' RON'}
                          </span>
                        </div>
                        {offer.minNights && (
                          <p className={`text-[8px] font-bold uppercase tracking-tight ${!isMet ? 'text-red-400' : 'opacity-50'}`}>
                            Min. {offer.minNights} nopți {!isMet && '(Condiție neîndeplinită)'}
                          </p>
                        )}
                      </div>
                      {selectedOffer?.id === offer.id && <Check size={14} />}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {range?.from && range?.to && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-neutral-900 rounded-3xl text-white shadow-xl shadow-black/10 space-y-3 mb-6"
        >
          <div className="flex justify-between items-center text-xs font-bold gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 shrink-0">Nopți</span>
            <span className="text-right text-white">{calculateNights()} nopți</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 shrink-0">Perioada</span>
            <span className="text-[10px] font-bold text-white text-right truncate">
              {format(range.from, 'dd MMM')} - {format(range.to, 'dd MMM yyyy')}
            </span>
          </div>
          {selectedOffer && offerConditionMet(selectedOffer) && (
             <div className="flex justify-between items-center text-green-400 gap-2 py-2 border-y border-neutral-800">
                <span className="text-[9px] font-black uppercase tracking-widest shrink-0">Ofertă Aplicată</span>
                <span className="text-xs font-bold text-right text-green-400">-{selectedOffer.discountValue}{selectedOffer.discountType === 'percentage' ? '%' : ' RON'}</span>
             </div>
          )}
          <div className="flex justify-between items-center pt-4 border-t border-neutral-800 gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 shrink-0">Total</span>
            <span className="text-base sm:text-lg font-black text-white text-right">
              {calculateTotal()} RON
            </span>
          </div>
        </motion.div>
      )}

      <button
        onClick={handleBooking}
        disabled={loading || (selectedOffer && !offerConditionMet(selectedOffer))}
        className={`w-full py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.25em] transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] ${
          !range?.from || !range?.to 
            ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' 
            : 'bg-black text-white hover:bg-neutral-800 hover:scale-[1.01] shadow-black/20'
        }`}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : !range?.from || !range?.to ? (
          <>
            <CalendarIcon size={18} />
            Alege Perioada
          </>
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
