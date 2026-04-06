import { useState, useEffect } from 'react';
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
  Award
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { AuthModal } from '../components/AuthModal';
import { Apartment } from '../types';
import { toast } from 'sonner';

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
  
  // Booking Form State
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
        capacity: 3,
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
        capacity: 3,
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
        rooms: 1,
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
    <div className="pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 text-neutral-400 text-[9px] uppercase tracking-[0.3em] mb-3">
            <div className="flex items-center">
              <MapPin size={10} className="mr-1" />
              <span>{apartment.location}</span>
            </div>
            <span className="opacity-30">|</span>
            <div className="flex items-center text-yellow-500">
              <Star size={8} fill="currentColor" />
              <span className="ml-1.5 text-black font-bold">4.9</span>
              <span className="ml-1 text-neutral-400 font-medium lowercase">({t.reviews})</span>
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-serif mb-4 font-black tracking-tight text-neutral-900">{apartment.name}</h1>
          
          <div className="flex flex-wrap gap-4 text-neutral-400">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-100">
                <Users size={12} className="text-neutral-400" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{apartment.capacity} {t.capacity}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-100">
                <Bed size={12} className="text-neutral-400" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">
                {apartment.rooms} {apartment.rooms === 1 ? t.room : t.rooms}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-100">
                <Bath size={12} className="text-neutral-400" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">
                {apartment.bathrooms} {apartment.bathrooms === 1 ? t.bathroom : t.bathrooms}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Roll Gallery - No Cropping */}
      <div className="w-full mb-16 bg-neutral-100/50 py-12 overflow-hidden">
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-8 px-[5vw] md:px-[10vw] no-scrollbar pb-8">
          {apartment.images.map((img, i) => (
            <div key={i} className="flex-none h-[50vh] md:h-[75vh] snap-center">
              <div className="h-full bg-white shadow-2xl rounded-sm p-1 md:p-2 border border-neutral-200">
                <img 
                  src={img} 
                  alt={`${apartment.name} ${i + 1}`} 
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center items-center space-x-4 mt-2">
          <div className="h-[1px] w-12 bg-neutral-300"></div>
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-400">
            {lang === 'ro' ? 'Glisează pentru galerie' : 'Scroll for gallery'}
          </span>
          <div className="h-[1px] w-12 bg-neutral-300"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="mb-16">
              <h3 className="text-xs font-black mb-6 flex items-center uppercase tracking-[0.3em] text-neutral-900">
                <span className="w-8 h-[2px] bg-black mr-4"></span>
                {t.about}
              </h3>
              <p className="text-lg md:text-xl leading-relaxed text-neutral-800 font-description italic border-l-4 border-neutral-200 pl-8 font-bold">
                {apartment.description}
              </p>
            </div>

            <div className="mb-16">
              <h3 className="text-xs font-black mb-8 flex items-center uppercase tracking-[0.3em] text-neutral-900">
                <span className="w-8 h-[2px] bg-black mr-4"></span>
                {t.amenities}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {apartment.amenities.map((item, i) => (
                  <div key={i} className="flex items-center space-x-3 text-sm group">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">
                      <CheckCircle2 size={16} className="text-neutral-400 group-hover:text-white" />
                    </div>
                    <span className="text-neutral-900 font-bold tracking-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border-2 border-neutral-900 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-none p-8">
              <div className="flex justify-between items-end mb-8">
                <div>
                  {apartment.originalPrice && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base text-red-500 line-through font-bold">{apartment.originalPrice} lei</span>
                      <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 uppercase tracking-widest">
                        OFFER
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-neutral-900">{apartment.pricePerNight}</span>
                    <span className="text-xl font-black text-neutral-900">lei</span>
                  </div>
                  <span className="text-neutral-400 text-xs uppercase font-black tracking-widest block mt-1">/ {t.pricePerNight}</span>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-sm font-bold text-neutral-700 leading-relaxed">
                  {lang === 'ro' 
                    ? "Rezervările se fac prin Booking.com pentru siguranță maximă."
                    : "Bookings are handled via Booking.com for maximum security."}
                </p>

                <a 
                  href={apartment.bookingUrl || "https://www.booking.com/Share-vCX4Bz"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-black text-white py-5 text-xs font-black uppercase tracking-[0.3em] hover:bg-neutral-800 transition-all flex items-center justify-center"
                >
                  {lang === 'ro' ? "REZERVĂ ACUM" : "BOOK NOW"}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
