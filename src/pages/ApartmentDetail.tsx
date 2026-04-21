import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Bed, 
  Bath, 
  Wifi, 
  Coffee, 
  Wind, 
  Tv, 
  MapPin,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Star,
  LogIn,
  Award,
  ChevronDown,
  BookOpen,
  X
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { AuthModal } from '../components/AuthModal';
import { Apartment } from '../types';
import { toast } from 'sonner';
import { BookingCalendar } from '../components/BookingCalendar';
import { Helmet } from 'react-helmet-async';
import { TiltCard, Magnetic, GlowWrapper, TextReveal, ParallaxImage, AnimatedSection, Reveal3D, SmoothIn, FloatingElement, PhotoAlbum, VibrantGallery, NanoBanana } from '../components/AnimatedComponents';

const detailTranslations = {
  ro: {
    loading: "Se încarcă...",
    notFound: "Apartamentul nu a fost găsit.",
    backToList: "Înapoi la listă",
    reviews: "recenzii",
    capacity: "Oaspeți",
    maxCapacity: "Capacitate Max",
    rooms: "Camere",
    room: "Cameră",
    flexConfig: "Configurație Flexibilă",
    bathrooms: "Băi",
    bathroom: "Baie",
    fullyEquipped: "Complet Utilată",
    about: "Despre acest spațiu",
    amenities: "Facilități incluse",
    pricePerNight: "noapte",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Oaspeți",
    person: "Persoană",
    persons: "Persoane",
    requestBooking: "Solicită Rezervare",
    processing: "Se procesează...",
    notChargedYet: "Nu vei fi taxat încă",
    nights: "nopți",
    cleaningFee: "Taxă curățenie",
    total: "Total",
    bookingSuccess: "Cererea de rezervare a fost trimisă! Te vom contacta în curând.",
    bookingError: "A apărut o eroare. Te rugăm să încerci din nou.",
    selectDates: "Te rugăm să selectezi datele sejurului."
  },
  en: {
    loading: "Loading...",
    notFound: "Apartment not found.",
    backToList: "Back to list",
    reviews: "reviews",
    capacity: "Guests",
    maxCapacity: "Max Capacity",
    rooms: "Rooms",
    room: "Room",
    flexConfig: "Flexible Configuration",
    bathrooms: "Bathrooms",
    bathroom: "Bathroom",
    fullyEquipped: "Fully Equipped",
    about: "About this space",
    amenities: "Included amenities",
    pricePerNight: "night",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Guests",
    person: "Person",
    persons: "People",
    requestBooking: "Request Booking",
    processing: "Processing...",
    notChargedYet: "You won't be charged yet",
    nights: "nights",
    cleaningFee: "Cleaning fee",
    total: "Total",
    bookingSuccess: "Booking request sent! We will contact you soon.",
    bookingError: "An error occurred. Please try again.",
    selectDates: "Please select your stay dates."
  }
};

export default function ApartmentDetail({ lang = 'ro' }: { lang?: string }) {
  const t = detailTranslations[lang as keyof typeof detailTranslations];
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImageIndex(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollGallery = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const fallbackApts: Apartment[] = [
      {
        id: '1',
        name: lang === 'ro' ? "Cameră King" : "Premium King Apartment",
        shortDescription: lang === 'ro' ? "Eleganță și confort suprem cu un pat king-size generos." : "Elegance and supreme comfort with a generous king-size bed.",
        description: lang === 'ro' ? "O cameră spațioasă și rafinată, ideală pentru momente de relaxare deplină, dotată cu un pat king-size pentru un somn odihnitor." : "A spacious and refined room, ideal for moments of complete relaxation, equipped with a king-size bed for a restful sleep.",
        pricePerNight: 324,
        originalPrice: 360,
        capacity: 2,
        rooms: 1,
        bathrooms: 1,
        amenities: lang === 'ro' ? ["Baie privată", "Articole toaletă", "Duș", "Papuci", "Uscător păr", "Vedere munte", "Seif", "TV ecran plat", "Prosoape", "Lenjerie pat", "Încălzire", "Garderobă", "Aer condiționat", "Frigider", "Aparat cafea/ceai"] : ["Private bathroom", "Toiletries", "Shower", "Slippers", "Hairdryer", "Mountain view", "Safe", "Flat-screen TV", "Towels", "Bed linen", "Heating", "Wardrobe", "Air conditioning", "Fridge", "Coffee/tea maker"],
        images: [
          "/3e764a85-4926-4f96-94b8-2635381d7e82.jpg",
          "/54af473d-3cf2-40a4-9c03-d26751e4ff65-1.jpg",
          "/3333a7d2-a3c7-4bfa-b200-2a4c388f6197.jpg",
          "/f4a34b0c-9a53-4143-a308-3093fa9a34df-1.jpg"
        ],
        location: "Cristian, Brașov",
        slug: "apartament-premium-king",
        bookingUrl: "https://www.booking.com/Share-vCX4Bz"
      },
      {
        id: '2',
        name: lang === 'ro' ? "Cameră dublă deluxe" : "Deluxe Double Apartment",
        shortDescription: lang === 'ro' ? "Confort modern și vedere spectaculoasă spre munte." : "Modern comfort and spectacular mountain views.",
        description: lang === 'ro' ? "Bucură-te de liniștea muntelui într-o cameră dublă dotată cu facilități premium și un design contemporan." : "Enjoy the mountain's peace in a double room equipped with premium facilities and a contemporary design.",
        pricePerNight: 324,
        originalPrice: 360,
        capacity: 2,
        rooms: 1,
        bathrooms: 1,
        amenities: lang === 'ro' ? ["Baie privată", "Articole toaletă", "Duș", "Papuci", "Uscător păr", "Vedere munte", "Seif", "TV ecran plat", "Prosoape", "Lenjerie pat", "Încălzire", "Garderobă", "Aer condiționat", "Frigider", "Aparat cafea/ceai"] : ["Private bathroom", "Toiletries", "Shower", "Slippers", "Hairdryer", "Mountain view", "Safe", "Flat-screen TV", "Towels", "Bed linen", "Heating", "Wardrobe", "Air conditioning", "Fridge", "Coffee/tea maker"],
        images: [
          "/713256990.jpg",
          "/740f0b90-e7ce-42f5-80fc-322333332540.jpg",
          "/763019094.jpg"
        ],
        location: "Cristian, Brașov",
        slug: "apartament-deluxe-double",
        bookingUrl: "https://www.booking.com/Share-vCX4Bz"
      },
      {
        id: '3',
        name: lang === 'ro' ? "Cameră de familie deluxe" : "Family Deluxe Apartment",
        shortDescription: lang === 'ro' ? "Spațiul ideal pentru întreaga familie, cu cea mai bună vedere spre terenul de tenis." : "The ideal space for the whole family, with the best view of the tennis court.",
        description: lang === 'ro' ? "O unitate generoasă, perfectă pentru familii, oferind intimitate și toate dotările necesare unei șederi prelungite. Această cameră oferă cea mai bună vedere panoramică spre terenul de tenis al complexului." : "A generous unit, perfect for families, offering privacy and all the amenities needed for an extended stay. This room offers the best panoramic view of the complex's tennis court.",
        pricePerNight: 413,
        originalPrice: 459,
        capacity: 4,
        rooms: 2,
        bathrooms: 1,
        amenities: lang === 'ro' ? ["Chicinetă privată", "Frigider", "Ustensile bucătărie", "Prăjitor pâine", "Aparat cafea/ceai", "Cană fierbător", "Zonă luat masa", "Baie privată", "Articole toaletă", "Duș", "Papuci", "Uscător păr", "Balcon", "Vedere munte", "Seif", "TV ecran plat", "Prosoape", "Lenjerie pat", "Canapea extensibilă", "Încălzire", "Garderobă", "Aer condiționat"] : ["Private kitchenette", "Fridge", "Kitchen utensils", "Toaster", "Coffee/tea maker", "Electric kettle", "Dining area", "Private bathroom", "Toiletries", "Shower", "Slippers", "Hairdryer", "Balcony", "Mountain view", "Safe", "Flat-screen TV", "Towels", "Bed linen", "Sofa bed", "Heating", "Wardrobe", "Air conditioning"],
        images: [
          "/2187ff16-ad7e-45f4-9802-c466a89be635.jpg",
          "/793bc1c7-9fda-4077-b1be-e098f0325f97.jpg",
          "/796a0c21-506d-4a55-9041-055117366e5f.jpg",
          "/f8d66e83-5317-43f1-86e4-112c669e2217.jpg",
          "/09b78d8f-35b4-466b-9b4c-87c7ae642a6f.jpg"
        ],
        location: "Cristian, Brașov",
        slug: "apartament-family-deluxe",
        bookingUrl: "https://www.booking.com/Share-vCX4Bz"
      },
      {
        id: '4',
        name: lang === 'ro' ? "Cameră de familie standard" : "Family Standard Apartment",
        shortDescription: lang === 'ro' ? "Confort și funcționalitate cu un pat XL și canapea extensibilă." : "Comfort and functionality with an XL bed and sofa bed.",
        description: lang === 'ro' ? "O opțiune excelentă pentru familii, dotată cu un pat XL confortabil și o canapea extensibilă, oferind un raport calitate-preț imbatabil fără a face compromisuri la confort." : "An excellent option for families, equipped with a comfortable XL bed and a sofa bed, offering unbeatable value for money without compromising on comfort.",
        pricePerNight: 413,
        originalPrice: 459,
        capacity: 4,
        rooms: 2,
        bathrooms: 1,
        amenities: lang === 'ro' ? ["Chicinetă privată", "Frigider", "Ustensile bucătărie", "Prăjitor pâine", "Aparat cafea/ceai", "Cană fierbător", "Zonă luat masa", "Baie privată", "Articole toaletă", "Duș", "Papuci", "Uscător păr", "Balcon", "Vedere munte", "Seif", "TV ecran plat", "Prosoape", "Lenjerie pat", "Pat XL", "Canapea extensibilă", "Încălzire", "Garderobă", "Aer condiționat"] : ["Private kitchenette", "Fridge", "Kitchen utensils", "Toaster", "Coffee/tea maker", "Electric kettle", "Dining area", "Private bathroom", "Toiletries", "Shower", "Slippers", "Hairdryer", "Balcony", "Mountain view", "Safe", "Flat-screen TV", "Towels", "Bed linen", "XL Bed", "Sofa bed", "Heating", "Wardrobe", "Air conditioning"],
        images: [
          "/01159e24-68b8-4e3b-a79e-9033ac44336c.jpg",
          "/60ec7951-8ef3-46b5-aa79-375b228417cc.jpg",
          "/a1ed67e3-60cb-4b6b-b440-71d151c2a0f1.jpg",
          "/1b7242ae-736a-4b06-9825-94106c880657.jpg",
          "/4587fe93-7975-453c-b289-7d2c0d99c50d.jpg"
        ],
        location: "Cristian, Brașov",
        slug: "apartament-family-standard",
        bookingUrl: "https://www.booking.com/Share-vCX4Bz"
      },
      {
        id: '5',
        name: "PeraDuo",
        shortDescription: lang === 'ro' ? "Rafinament și intimitate pentru două persoane." : "Refinement and intimacy for two people.",
        description: lang === 'ro' ? "PeraDuo oferă un spațiu modern și primitor, perfect pentru cupluri care caută confort și relaxare într-un cadru elegant." : "PeraDuo offers a modern and welcoming space, perfect for couples seeking comfort and relaxation in an elegant setting.",
        pricePerNight: 365,
        originalPrice: 405,
        capacity: 2,
        rooms: 2,
        bathrooms: 1,
        amenities: lang === 'ro' ? ["Baie privată", "Articole toaletă", "Duș", "Papuci", "Uscător păr", "Vedere munte", "Seif", "TV ecran plat", "Prosoape", "Lenjerie pat", "Încălzire", "Garderobă", "Aer condiționat", "Frigider", "Aparat cafea/ceai"] : ["Private bathroom", "Toiletries", "Shower", "Slippers", "Hairdryer", "Mountain view", "Safe", "Flat-screen TV", "Towels", "Bed linen", "Heating", "Wardrobe", "Air conditioning", "Fridge", "Coffee/tea maker"],
        images: ["/peraduo-2.jpg", "/peraduo-1.jpg", "/peraduo-3.jpg", "/peraduo-4.jpg", "/peraconfort-1.jpg", "/peraconfort-5.jpg"],
        location: "Cristian, Brașov",
        slug: "peraduo",
        bookingUrl: "https://www.booking.com/Share-vCX4Bz"
      },
      {
        id: '6',
        name: "PeraConfort",
        shortDescription: lang === 'ro' ? "Spațiu generos și confort maxim pentru grupuri sau familii." : "Generous space and maximum comfort for groups or families.",
        description: lang === 'ro' ? "PeraConfort este alegerea ideală pentru cei care călătoresc în grup sau cu familia, oferind toate dotările necesare pentru un sejur relaxant și lipsit de griji." : "PeraConfort is the ideal choice for those traveling in groups or with family, offering all the necessary amenities for a relaxing and worry-free stay.",
        pricePerNight: 324,
        originalPrice: 360,
        capacity: 4,
        rooms: 2,
        bathrooms: 1,
        amenities: lang === 'ro' ? ["Chicinetă privată", "Frigider", "Ustensile bucătărie", "Prăjitor pâine", "Aparat cafea/ceai", "Cană fierbător", "Zonă luat masa", "Baie privată", "Articole toaletă", "Duș", "Papuci", "Uscător păr", "Balcon", "Vedere munte", "Seif", "TV ecran plat", "Prosoape", "Lenjerie pat", "Canapea extensibilă", "Încălzire", "Garderobă", "Aer condiționat"] : ["Private kitchenette", "Fridge", "Kitchen utensils", "Toaster", "Coffee/tea maker", "Electric kettle", "Dining area", "Private bathroom", "Toiletries", "Shower", "Slippers", "Hairdryer", "Balcony", "Mountain view", "Safe", "Flat-screen TV", "Towels", "Bed linen", "Sofa bed", "Heating", "Wardrobe", "Air conditioning"],
        images: ["/peraconfort-7.jpg", "/peraduo-5.jpg", "/peraconfort-2.jpg", "/peraconfort-3.jpg", "/peraconfort-4.jpg", "/peraconfort-6.jpg"],
        location: "Cristian, Brașov",
        slug: "peraconfort",
        bookingUrl: "https://www.booking.com/Share-vCX4Bz"
      },
      {
        id: '7',
        name: lang === 'ro' ? "Teren Tenis" : "Tennis Court",
        shortDescription: lang === 'ro' ? "Facilități sportive de top pentru oaspeții noștri." : "Top sports facilities for our guests.",
        description: lang === 'ro' ? "Bucură-te de un meci de tenis pe terenul nostru profesionist, situat chiar în incinta complexului. O modalitate excelentă de a te menține activ în timpul vacanței." : "Enjoy a tennis match on our professional court, located right within the complex. A great way to stay active during your vacation.",
        pricePerNight: 0,
        capacity: 0,
        rooms: 0,
        bathrooms: 0,
        amenities: lang === 'ro' ? ["Echipament inclus", "Nocturnă"] : ["Equipment included", "Night lighting"],
        images: [],
        location: "Cristian, Brașov",
        slug: "teren-tenis",
        bookingUrl: "https://www.booking.com/Share-vCX4Bz"
      }
    ];

    // Set fallback immediately to avoid spinner
    const foundFallback = fallbackApts.find(a => a.slug === slug);
    if (foundFallback) {
      setApartment(foundFallback);
      setLoading(false);
    }

    const q = query(collection(db, 'apartments'), where('slug', '==', slug));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as Apartment;
        setApartment({ id: snapshot.docs[0].id, ...data });
        setLoading(false);
      } else if (!foundFallback) {
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching apartment:", error);
      if (!foundFallback) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [slug, lang]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  );

  if (!apartment) return (
    <div className="h-screen flex flex-col items-center justify-center">
      <h2 className="text-2xl font-serif mb-4">{t.notFound}</h2>
      <button onClick={() => navigate('/apartamente')} className="text-sm font-bold uppercase tracking-widest border-b-2 border-black">{t.backToList}</button>
    </div>
  );

  return (
    <div className="pt-32 pb-40 bg-white">
      <Helmet>
        <title>{apartment.name} | Pera Apartments</title>
        <meta name="description" content={apartment.shortDescription} />
      </Helmet>

      {/* Hero Header with Cinematic Parallax */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="flex flex-col lg:flex-row gap-20 items-end">
          <div className="flex-grow">
            <Reveal3D>
              <div className="flex items-center space-x-6 text-neutral-300 text-[10px] uppercase font-black tracking-[1em] mb-10">
                <div className="flex items-center text-vibrant-indigo">
                  <MapPin size={12} className="mr-3" />
                  <span className="text-vibrant-indigo">{apartment.location}</span>
                </div>
                <div className="w-10 h-[1px] bg-neutral-100"></div>
                <div className="flex items-center text-primary-accent">
                  <Star size={12} fill="currentColor" />
                  <span className="ml-3 font-black">4.9 / 5.0</span>
                </div>
              </div>
            </Reveal3D>

            <h1 className="text-6xl md:text-9xl font-display font-black mb-10 leading-[0.85] tracking-tighter text-neutral-900">
              <TextReveal text={apartment.name} />
            </h1>
            
            <SmoothIn direction="up" delay={0.5}>
              <div className="flex flex-wrap gap-12 mt-16">
                <div className="flex items-center space-x-6 group">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-50 flex items-center justify-center border border-neutral-100 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                    <Users size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest block text-neutral-500 mb-1">CAPACITY</span>
                    <span className="text-xl font-black text-neutral-900">{apartment.capacity} {t.capacity}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-6 group">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-50 flex items-center justify-center border border-neutral-100 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                    <Bed size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest block text-neutral-500 mb-1">ROOMS</span>
                    <span className="text-xl font-black text-neutral-900">
                      {apartment.rooms} {apartment.rooms === 1 ? t.room : t.rooms}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-6 group">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-50 flex items-center justify-center border border-neutral-100 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                    <Bath size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest block text-neutral-500 mb-1">BATHROOMS</span>
                    <span className="text-xl font-black text-neutral-900">
                      {apartment.bathrooms} {apartment.bathrooms === 1 ? t.bathroom : t.bathrooms}
                    </span>
                  </div>
                </div>
              </div>
            </SmoothIn>
          </div>
          
          <div className="hidden lg:block">
            <Magnetic>
              <div className="w-40 h-40 rounded-full border-2 border-neutral-200 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.5em] text-neutral-500 animate-spin-slow">
                AUTHENTIC • LUXURY •
              </div>
            </Magnetic>
          </div>
        </div>
      </section>

      {/* Cinematic Image Gallery Overhaul - Vibrant Grid Style */}
      <section className="w-full mb-40 relative group/gallery overflow-hidden py-40">
        <div className="absolute inset-x-0 bottom-0 top-1/4 bg-slate-50 -z-10 translate-y-40"></div>
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none select-none z-0">
          <div className="text-[25vw] font-display font-black leading-none tracking-tighter text-vibrant-indigo">GALLERY</div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Reveal3D>
            <div className="text-center mb-24">
              <span className="text-[10px] font-black uppercase tracking-[1em] text-vibrant-indigo mb-6 block">MEMORY ALBUM</span>
              <h2 className="text-5xl md:text-8xl font-display font-black text-neutral-900 tracking-tighter leading-none">
                <TextReveal text={lang === 'ro' ? 'Descoperă apartamentul' : 'Discover the apartment'} />
              </h2>
            </div>
          </Reveal3D>

          <VibrantGallery 
            images={apartment.images} 
            onImageClick={(index) => setSelectedImageIndex(index)} 
          />

          <div className="flex justify-center items-center space-x-10 mt-20">
            <div className="h-[1px] flex-grow bg-neutral-200"></div>
            <div className="flex items-center space-x-4 text-neutral-400 group cursor-help">
              <BookOpen size={20} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em]">
                {lang === 'ro' ? 'INTERACȚIONEAZĂ CU ALBUMUL' : 'INTERACT WITH THE ALBUM'}
              </span>
            </div>
            <div className="h-[1px] flex-grow bg-neutral-200"></div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-24 items-start">
          {/* Main Story Content */}
          <div className="lg:col-span-3 space-y-24 md:space-y-32">
            <AnimatedSection>
              <Reveal3D>
                <div className="mb-12">
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-600 mb-6 block">EXPERIENCE</span>
                  <h3 className="text-4xl md:text-6xl font-display font-black text-neutral-900 leading-[0.9] tracking-tighter">
                    {t.about}
                  </h3>
                </div>
              </Reveal3D>
              <p className="text-2xl md:text-4xl leading-[1.2] text-neutral-800 font-display italic border-l-8 border-neutral-100 pl-12 font-bold tracking-tight">
                {apartment.description}
              </p>
            </AnimatedSection>

            <AnimatedSection>
              <Reveal3D>
                <div className="mb-16">
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-600 mb-6 block">FEATURES</span>
                  <h3 className="text-4xl md:text-6xl font-display font-black text-neutral-900 leading-[0.9] tracking-tighter">
                    <TextReveal text={t.amenities} className="text-vibrant-rose" />
                  </h3>
                </div>
              </Reveal3D>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                {apartment.amenities.map((item, i) => (
                  <SmoothIn key={i} direction="up" delay={i * 0.05}>
                    <NanoBanana>
                      <Reveal3D>
                        <div className="flex items-center space-x-6 group p-8 bg-indigo-50/30 rounded-[2.5rem] border border-neutral-100 hover:bg-vibrant-indigo hover:text-white transition-all duration-700 shadow-sm hover:shadow-2xl">
                          <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform">
                            <CheckCircle2 size={24} className="text-primary-accent" />
                          </div>
                          <span className="text-lg font-black uppercase tracking-tight leading-none">{item}</span>
                        </div>
                      </Reveal3D>
                    </NanoBanana>
                  </SmoothIn>
                ))}
              </div>
            </AnimatedSection>
            
            {/* Story Card */}
            <SmoothIn direction="up">
              <NanoBanana>
                <TiltCard>
                  <div className="bg-vibrant-indigo text-white p-16 rounded-[4rem] relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -mr-48 -mt-48 transition-all duration-1000 group-hover:scale-150"></div>
                    <Award size={64} className="text-primary-accent mb-12 opacity-80" />
                    <h4 className="text-4xl md:text-5xl font-display font-black mb-10 leading-none">A standard for modern comfort.</h4>
                    <p className="text-xl text-white/70 leading-relaxed font-bold italic mb-0">
                      {lang === 'ro' 
                        ? "Fiecare detaliu din acest apartament a fost ales cu grijă pentru a crea o atmosferă de calm și rafinament, asigurându-vă un sejur memorabil în inima Transilvaniei."
                        : "Every detail in this apartment has been carefully chosen to create an atmosphere of calm and refinement, ensuring a memorable stay in the heart of Transylvania."}
                    </p>
                  </div>
                </TiltCard>
              </NanoBanana>
            </SmoothIn>
          </div>

          {/* Booking Sidebar - Modern Overhaul */}
          <div className="lg:col-span-2">
            <div className="sticky top-40">
              <Reveal3D>
                <div className="bg-white border border-neutral-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] rounded-[3.5rem] p-3 sm:p-6 lg:p-8 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-8 bg-black"></div>
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20 z-10"></div>
                  
                  <div className="mb-6 mt-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-vibrant-indigo mb-4 block">STARTING FROM</span>
                    <div className="flex flex-wrap items-baseline gap-4 mb-4">
                      <span className="text-6xl font-display font-black text-neutral-900 tracking-tighter">{apartment.pricePerNight}</span>
                      <span className="text-2xl font-black text-neutral-900 uppercase">LEI</span>
                      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block">/ {t.pricePerNight}</span>
                    </div>
                    
                    {apartment.originalPrice && (
                      <div className="flex items-center gap-4 mt-4">
                        <span className="text-xl text-vibrant-rose line-through font-bold opacity-50">{apartment.originalPrice} lei</span>
                        <div className="bg-vibrant-emerald text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg">EXCLUSIVE OFFER</div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6 pt-12 border-t border-neutral-100 mb-12">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-500 mb-10">BOOKING OPTIONS</p>
                    <Magnetic>
                      <a 
                        href={apartment.bookingUrl || "https://www.booking.com/Share-vCX4Bz"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-black text-white py-8 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-neutral-800 transition-all flex items-center justify-center gap-4 rounded-[2rem] shadow-2xl relative overflow-hidden group/btn"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                        <CheckCircle2 size={18} className="text-primary-accent" />
                        INSTANT BOOKING
                      </a>
                    </Magnetic>
                  </div>
                  
                  {/* Calendar Integration */}
                  <div className="mt-12">
                    <TiltCard>
                      <BookingCalendar 
                        apartmentId={apartment.id} 
                        apartmentName={apartment.name} 
                        pricePerNight={apartment.pricePerNight} 
                      />
                    </TiltCard>
                  </div>
                </div>
              </Reveal3D>
              
              {/* Trust Badges */}
              <div className="mt-12 flex items-center justify-center gap-12 grayscale opacity-30">
                <FloatingElement duration={4} yOffset={5}>
                   <div className="text-[10px] font-black uppercase tracking-widest">SECURE PAYMENT</div>
                </FloatingElement>
                <FloatingElement duration={5} yOffset={5}>
                   <div className="text-[10px] font-black uppercase tracking-widest">VERIFIED HOST</div>
                </FloatingElement>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="flex justify-center mt-64 opacity-10">
        <TextReveal text="THE PERA EXPERIENCE • THE PERA EXPERIENCE • THE PERA EXPERIENCE" />
      </div>

      {/* Lightbox Carousel */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12 overflow-hidden"
            onClick={() => setSelectedImageIndex(null)}
          >
            <motion.button 
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              className="absolute top-5 right-5 md:top-10 md:right-10 text-white hover:text-primary-accent transition-all p-4 z-50 bg-white/5 hover:bg-white/10 rounded-full border border-white/10"
              onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(null); }}
            >
              <X size={32} />
            </motion.button>
            
            {/* Gallery Navigation UI */}
            <div className="absolute inset-y-0 left-4 md:left-10 flex items-center z-50">
              <Magnetic>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev !== null ? (prev === 0 ? apartment.images.length - 1 : prev - 1) : null));
                  }}
                  className="w-16 h-16 md:w-24 md:h-24 bg-white/5 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all border border-white/10"
                >
                  <ChevronLeft size={48} />
                </button>
              </Magnetic>
            </div>
            
            <div className="absolute inset-y-0 right-4 md:right-10 flex items-center z-50">
              <Magnetic>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev !== null ? (prev === apartment.images.length - 1 ? 0 : prev + 1) : null));
                  }}
                  className="w-16 h-16 md:w-24 md:h-24 bg-white/5 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all border border-white/10"
                >
                  <ChevronRight size={48} />
                </button>
              </Magnetic>
            </div>

            <AnimatePresence mode="wait">
              <motion.img 
                key={selectedImageIndex}
                initial={{ scale: 0.8, opacity: 0, x: 50 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 1.1, opacity: 0, x: -50 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                src={apartment.images[selectedImageIndex]} 
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl relative z-10"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>
            
            {/* Index Counter */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[1em] text-white/30">
              {selectedImageIndex + 1} / {apartment.images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
