import React, { useState, useEffect } from 'react';
import { format, addDays, isBefore, isAfter, startOfDay, eachDayOfInterval, isWithinInterval, differenceInDays, parseISO } from 'date-fns';
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
        const interval = eachDayOfInterval({ start, end });
        dates.push(...interval);
      });

      // 2. Fetch external bookings from iCal (Airbnb/Booking.com) via our API
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

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date())) || bookedDates.some(bookedDate => 
      format(bookedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
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
    <div className="bg-white rounded-[2rem] border border-neutral-100 p-4 sm:px-8 sm:py-6 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center shrink-0">
          <CalendarIcon className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-[11px] sm:text-sm font-black uppercase tracking-widest text-neutral-900">Rezervă Direct</h3>
          <p className="text-[9px] sm:text-[10px] text-neutral-400 font-bold uppercase tracking-tighter">Cel mai bun preț garantat</p>
        </div>
      </div>

      <div className="mb-6 flex justify-center">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
          disabled={isDateDisabled}
          numberOfMonths={1}
          className="border-none font-sans !m-0"
          classNames={{
            month: "space-y-4",
            selected: "rounded-full !bg-black !text-white",
            range_start: "rounded-l-full !bg-black !text-white",
            range_end: "rounded-r-full !bg-black !text-white",
            range_middle: "!rounded-none !bg-neutral-100 !text-black",
            today: "text-black font-black underline",
            day: "h-9 w-9 sm:h-10 sm:w-10 p-0 text-[11px] sm:text-xs font-bold hover:bg-neutral-100 rounded-full transition-all flex items-center justify-center",
            head_cell: "text-[10px] font-black uppercase tracking-wider text-neutral-400 pb-2 w-9 sm:w-10",
            cell: "p-0",
            nav: "flex items-center gap-1",
            table: "w-full border-collapse",
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0"
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
          className="space-y-3 mb-6 p-4 sm:p-5 bg-neutral-50 rounded-2xl border border-neutral-100"
        >
          <div className="flex justify-between items-center text-xs font-bold text-neutral-900 gap-2">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-neutral-400 shrink-0">Nopți</span>
            <span className="text-right">{calculateNights()} nopți</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-neutral-400 shrink-0">Perioada</span>
            <span className="text-[10px] sm:text-xs font-bold text-neutral-900 text-right truncate">
              {format(range.from, 'dd MMM')} - {format(range.to, 'dd MMM yyyy')}
            </span>
          </div>
          {selectedOffer && offerConditionMet(selectedOffer) && (
             <div className="flex justify-between items-center text-green-600 gap-2">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest shrink-0">Ofertă Aplicată</span>
                <span className="text-xs font-bold text-right">-{selectedOffer.discountValue}{selectedOffer.discountType === 'percentage' ? '%' : ' RON'}</span>
             </div>
          )}
          <div className="flex justify-between items-center pt-4 border-t border-neutral-200 gap-2">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-neutral-400 shrink-0">Total</span>
            <span className="text-base sm:text-lg font-display font-black text-neutral-900 text-right">
              {calculateTotal()} RON
            </span>
          </div>
        </motion.div>
      )}

      <button
        onClick={handleBooking}
        disabled={loading || checkingAvailability || !range?.from || !range?.to || (selectedOffer && !offerConditionMet(selectedOffer))}
        className="w-full bg-black text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50"
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
