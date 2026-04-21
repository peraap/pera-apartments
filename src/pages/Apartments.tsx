import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Bed, 
  Search,
  ChevronRight,
  Star,
  MapPin,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Apartment, SpecialOffer as SpecialOfferType } from '../types';
import { Helmet } from 'react-helmet-async';
import { Tag, ArrowRight, Home as HomeIcon } from 'lucide-react';
import { TiltCard, Magnetic, GlowWrapper, TextReveal, ParallaxImage, AnimatedSection, Reveal3D, FloatingElement, SmoothIn, PhotoAlbum, NanoBanana, VibrantGallery } from '../components/AnimatedComponents';

const apartmentsTranslations = {
  ro: {
    hero: {
      tag: "",
      title: "APARTAMENTELE NOASTRE",
      subtitle: "Descoperă rafinamentul și confortul la poalele muntelui. Unități complet utilate, design modern și o locație de vis."
    },
    filter: {
      tag: "Rezervări",
      title: "Alege spațiul potrivit.",
      searchPlaceholder: "Caută...",
      capacity: "Capacitate",
      twoPersons: "2 Persoane",
      fourPersons: "4+ Persoane"
    },
    apartment: {
      premium: "Cazare Premium",
      activities: "Activități",
      details: "Vezi Detalii",
      persons: "Persoane",
      rooms: "Camere",
      noResults: "Nu am găsit apartamente care să corespundă criteriilor tale."
    },
    whyChoose: {
      tag: "O Experiență Diferită",
      title: "De ce să alegi Pera Apartments?",
      description: "Alegerea Pera Apartments îți oferă echilibrul ideal între accesibilitatea rapidă către Brașov și liniștea unei locații din Cristian, unde designul modern și calitatea finisajelor sunt completate de o discreție totală, totul fiind gândit special pentru a asigura un sejur confortabil, fără niciun compromis.",
      features: [
        { title: "Liniște Deplină", desc: "Cristian este locul unde timpul pare că stă în loc. Te bucuri de liniște adevărată." },
        { title: "Confort Modern", desc: "Am pus preț pe tot ce ai nevoie: paturi bune, cafea proaspătă și un design cald." },
        { title: "Brașovul la doi pași", desc: "Ești destul de aproape de oraș pentru distracție, dar destul de departe pentru relaxare." },
        { title: "O primire caldă", desc: "Suntem o familie care iubește să primească oaspeți. Te vei simți ca acasă." }
      ],
      testimonial: "Extraordinar! Tot sejurul a fost perfect datorită locației minunate și gazdei primitoare, precum și a împrejurimilor. Vom reveni cu siguranță! Putem doar să recomandăm!",
      guest: "Irina",
      verified: "Oaspete Verificat"
    },
    location: {
      tag: "Locație",
      title: "Inima Transilvaniei.",
      description: "Te așteptăm în centrul comunei Cristian, într-un decor nobil și liniștit, la doar câteva minute de agitația Brașovului. Este colțul tău de relaxare, aproape de tot ce ai nevoie.",
      points: [
        { name: "Centrul Brașovului", dist: "7 min", type: "city" },
        { name: "Poiana Brașov", dist: "15 min", type: "mountain" },
        { name: "Castelul Bran", dist: "25 min", type: "castle" },
        { name: "Cetatea Râșnov", dist: "10 min", type: "castle" },
        { name: "Dino Parc", dist: "10 min", type: "park" },
        { name: "Aeroportul Brașov", dist: "12 min", type: "airport" }
      ]
    },
    offers: {
      sub: "Pachete & Oferte",
      title: "Rezervă inteligent.",
      btnBook: "Vezi Oferta",
      minNights: "nopți minim"
    },
    gallery: {
      tag: "Galerie Foto",
      title: "Momente de relaxare."
    }
  },
  en: {
    hero: {
      tag: "",
      title: "OUR APARTMENTS",
      subtitle: "Discover refinement and comfort at the foot of the mountain. Fully equipped units, modern design, and a dream location."
    },
    filter: {
      tag: "Reservations",
      title: "Choose the right space.",
      searchPlaceholder: "Search...",
      capacity: "Capacity",
      twoPersons: "2 People",
      fourPersons: "4+ People"
    },
    apartment: {
      premium: "Premium Accommodation",
      activities: "Activities",
      details: "View Details",
      persons: "People",
      rooms: "Rooms",
      noResults: "We couldn't find any apartments matching your criteria."
    },
    whyChoose: {
      tag: "A Different Experience",
      title: "Why choose Pera Apartments?",
      description: "We await you in the center of Cristian village, in a noble and quiet setting, just a few minutes from the hustle and bustle of Brașov. It is your corner of relaxation, close to everything you need.",
      features: [
        { title: "Complete Peace", desc: "Cristian is where time seems to stand still. Enjoy true tranquility." },
        { title: "Modern Comfort", desc: "We value everything you need: good beds, fresh coffee, and a warm design." },
        { title: "Brașov Nearby", desc: "Close enough to the city for fun, yet far enough for relaxation." },
        { title: "A Warm Welcome", desc: "We are a family that loves hosting guests. You'll feel right at home." }
      ],
      testimonial: "Extraordinary! Score: 10. The whole stay was perfect thanks to the wonderful location & warm host, as well as the surroundings. We will back for sure! We can only recommend it!",
      guest: "Irina",
      verified: "Verified Guest"
    },
    location: {
      tag: "Location",
      title: "The Heart of Transylvania.",
      description: "Nestled in the noble heart of Cristian village, just minutes from Brașov, our complex offers the perfect balance between rural peace and urban accessibility.",
      points: [
        { name: "Brașov Center", dist: "7 min", type: "city" },
        { name: "Poiana Brașov", dist: "15 min", type: "mountain" },
        { name: "Bran Castle", dist: "25 min", type: "castle" },
        { name: "Râșnov Fortress", dist: "10 min", type: "castle" },
        { name: "Dino Parc", dist: "10 min", type: "park" },
        { name: "Brașov Airport", dist: "12 min", type: "airport" }
      ]
    },
    gallery: {
      tag: "Photo Gallery",
      title: "Moments of relaxation."
    }
  }
};

const SpecialOffers = ({ t, lang }: { t: any, lang: string }) => {
  const [offers, setOffers] = useState<SpecialOfferType[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'specialOffers'), where('isActive', '==', true));
    const unsub = onSnapshot(q, (snapshot) => {
      setOffers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpecialOfferType)));
    });
    return unsub;
  }, []);

  if (offers.length === 0) return null;

  return (
    <section className="py-40 bg-slate-50 relative overflow-hidden rounded-[4rem] my-40 mx-4 md:mx-12 shadow-2xl border border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <Reveal3D>
            <span className="text-[10px] uppercase tracking-[0.5em] font-black text-neutral-400 mb-8 block">{t.offers.sub}</span>
            <h2 className="text-5xl md:text-8xl font-display font-black text-neutral-900 leading-[0.9] tracking-tighter">
              <TextReveal text={t.offers.title} />
            </h2>
          </Reveal3D>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {offers.map((offer, i) => (
            <SmoothIn key={offer.id} direction="up" delay={i * 0.1}>
              <TiltCard className="h-full">
                <GlowWrapper className="h-full">
                  <div className="bg-indigo-50/30 rounded-[3rem] p-12 h-full border border-indigo-100 shadow-sm flex flex-col group">
                    <div className="flex justify-between items-start mb-10">
                      <div className="bg-black text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest">
                        -{offer.discountValue}{offer.discountType === 'percentage' ? '%' : ' RON'}
                      </div>
                      <Tag size={20} className="text-neutral-300 group-hover:text-black transition-colors" />
                    </div>
                    <h3 className="text-3xl font-display font-black mb-6 tracking-tight leading-tight">{offer.title}</h3>
                    <p className="text-sm text-neutral-500 font-bold italic mb-10 line-clamp-3">{offer.description}</p>
                    
                    <div className="mt-auto pt-10 border-t border-neutral-100 space-y-4">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-400">
                          <span>Valabilitate</span>
                          <span className="text-black">{new Date(offer.startDate).toLocaleDateString(lang === 'ro' ? 'ro-RO' : 'en-US')}</span>
                       </div>
                       <Magnetic>
                         <button 
                           onClick={() => {
                             const el = document.getElementById('lista');
                             if (el) el.scrollIntoView({ behavior: 'smooth' });
                           }}
                           className="w-full py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center group/btn"
                         >
                           {t.offers.btnBook}
                           <ArrowRight className="ml-3 group-hover/btn:translate-x-2 transition-transform" size={16} />
                         </button>
                       </Magnetic>
                    </div>
                  </div>
                </GlowWrapper>
              </TiltCard>
            </SmoothIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function Apartments({ lang = 'ro' }: { lang?: string }) {
  const t = apartmentsTranslations[lang as keyof typeof apartmentsTranslations];
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [capacity, setCapacity] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImageIndex(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const galleryImages = [
    "/4587fe93-7975-453c-b289-7d2c0d99c50d.jpg",
    "/6cb8aae8-197b-4810-bbb5-4ef5aa20268a.jpg",
    "/740f0b90-e7ce-42f5-80fc-322333332540.jpg",
    "/cc4887fc-429b-4e77-9b14-db7ac9117ef5.jpg",
    "/796a0c21-506d-4a55-9041-055117366e5f.jpg",
    "/23546336-79f7-4f7d-969a-c3ff93a58c0e.jpg",
    "/845e3f2f-3737-4564-9ec4-04f2db023a36.jpg",
    "/a3be2a84-8555-4e07-9437-71c828448bbe.jpg"
  ];

  useEffect(() => {
    // Set fallback immediately to avoid spinner
    const fallbackData: Apartment[] = [
      {
        id: '1',
        name: lang === 'ro' ? "Cameră King" : "King Room",
        shortDescription: lang === 'ro' ? "Eleganță și confort suprem cu un pat king-size generos." : "Elegance and supreme comfort with a generous king-size bed.",
        description: lang === 'ro' ? "O cameră spațioasă și rafinată, ideală pentru momente de relaxare deplină, dotată cu un pat king-size pentru un somn odihnitor." : "A spacious and refined room, ideal for moments of complete relaxation, equipped with a king-size bed for a restful sleep.",
        pricePerNight: 324,
        originalPrice: 360,
        capacity: 2,
        rooms: 1,
        bathrooms: 1,
        amenities: ["Baie privată", "Articole toaletă", "Duș", "Papuci", "Uscător păr", "Vedere munte", "Seif", "TV ecran plat", "Prosoape", "Lenjerie pat", "Încălzire", "Garderobă", "Aer condiționat", "Frigider", "Aparat cafea/ceai"],
        images: ["/54af473d-3cf2-40a4-9c03-d26751e4ff65-1.jpg", "/3e764a85-4926-4f96-94b8-2635381d7e82.jpg"],
        location: "Cristian, Brașov",
        slug: "apartament-premium-king",
        bookingUrl: "https://www.booking.com/Share-vCX4Bz"
      },
      {
        id: '2',
        name: lang === 'ro' ? "Cameră dublă deluxe" : "Deluxe Double Room",
        shortDescription: lang === 'ro' ? "Confort modern și vedere spectaculoasă spre munte." : "Modern comfort and spectacular mountain views.",
        description: lang === 'ro' ? "Bucură-te de liniștea muntelui într-o cameră dublă dotată cu facilități premium și un design contemporan." : "Enjoy the mountain's peace in a double room equipped with premium facilities and a contemporary design.",
        pricePerNight: 324,
        originalPrice: 360,
        capacity: 2,
        rooms: 1,
        bathrooms: 1,
        amenities: ["Baie privată", "Articole toaletă", "Duș", "Papuci", "Uscător păr", "Vedere munte", "Seif", "TV ecran plat", "Prosoape", "Lenjerie pat", "Încălzire", "Garderobă", "Aer condiționat", "Frigider", "Aparat cafea/ceai"],
        images: ["/740f0b90-e7ce-42f5-80fc-322333332540.jpg", "/713256990.jpg"],
        location: "Cristian, Brașov",
        slug: "apartament-deluxe-double",
        bookingUrl: "https://www.booking.com/Share-vCX4Bz"
      },
      {
        id: '3',
        name: lang === 'ro' ? "Cameră de familie deluxe" : "Family Deluxe Room",
        shortDescription: lang === 'ro' ? "Spațiul ideal pentru întreaga familie, cu cea mai bună vedere spre terenul de tenis." : "The ideal space for the whole family, with the best view of the tennis court.",
        description: lang === 'ro' ? "O unitate generoasă, perfectă pentru familii, oferind intimitate și toate dotările necesare unei șederi prelungite. Această cameră oferă cea mai bună vedere panoramică spre terenul de tenis al complexului." : "A generous unit, perfect for families, offering privacy and all the amenities needed for an extended stay. This room offers the best panoramic view of the complex's tennis court.",
        pricePerNight: 413,
        originalPrice: 459,
        capacity: 4,
        rooms: 2,
        bathrooms: 1,
        amenities: ["Chicinetă privată", "Frigider", "Ustensile bucătărie", "Prăjitor pâine", "Aparat cafea/ceai", "Cană fierbător", "Zonă luat masa", "Baie privată", "Articole toaletă", "Duș", "Papuci", "Uscător păr", "Balcon", "Vedere munte", "Seif", "TV ecran plat", "Prosoape", "Lenjerie pat", "Canapea extensibilă", "Încălzire", "Garderobă", "Aer condiționat"],
        images: ["/793bc1c7-9fda-4077-b1be-e098f0325f97.jpg", "/2187ff16-ad7e-45f4-9802-c466a89be635.jpg"],
        location: "Cristian, Brașov",
        slug: "apartament-family-deluxe",
        bookingUrl: "https://www.booking.com/Share-vCX4Bz"
      },
      {
        id: '4',
        name: lang === 'ro' ? "Cameră de familie standard" : "Family Room",
        shortDescription: lang === 'ro' ? "Confort și funcționalitate cu un pat XL și canapea extensibilă." : "Comfort and functionality with an XL bed and sofa bed.",
        description: lang === 'ro' ? "O opțiune excelentă pentru familii, dotată cu un pat XL confortabil și o canapea extensibilă, oferind un raport calitate-preț imbatabil fără a face compromisuri la confort." : "An excellent option for families, equipped with a comfortable XL bed and a sofa bed, offering unbeatable value for money without compromising on comfort.",
        pricePerNight: 413,
        originalPrice: 459,
        capacity: 4,
        rooms: 2,
        bathrooms: 1,
        amenities: ["Chicinetă privată", "Frigider", "Ustensile bucătărie", "Prăjitor pâine", "Aparat cafea/ceai", "Cană fierbător", "Zonă luat masa", "Baie privată", "Articole toaletă", "Duș", "Papuci", "Uscător păr", "Balcon", "Vedere munte", "Seif", "TV ecran plat", "Prosoape", "Lenjerie pat", "Pat XL", "Canapea extensibilă", "Încălzire", "Garderobă", "Aer condiționat"],
        images: ["/60ec7951-8ef3-46b5-aa79-375b228417cc.jpg", "/01159e24-68b8-4e3b-a79e-9033ac44336c.jpg"],
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
        amenities: ["Baie privată", "Articole toaletă", "Duș", "Papuci", "Uscător păr", "Vedere munte", "Seif", "TV ecran plat", "Prosoape", "Lenjerie pat", "Încălzire", "Garderobă", "Aer condiționat", "Frigider", "Aparat cafea/ceai"],
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
        amenities: ["Chicinetă privată", "Frigider", "Ustensile bucătărie", "Prăjitor pâine", "Aparat cafea/ceai", "Cană fierbător", "Zonă luat masa", "Baie privată", "Articole toaletă", "Duș", "Papuci", "Uscător păr", "Balcon", "Vedere munte", "Seif", "TV ecran plat", "Prosoape", "Lenjerie pat", "Canapea extensibilă", "Încălzire", "Garderobă", "Aer condiționat"],
        images: ["/peraconfort-7.jpg", "/peraduo-5.jpg", "/peraconfort-2.jpg", "/peraconfort-3.jpg", "/peraconfort-4.jpg", "/peraconfort-6.jpg"],
        location: "Cristian, Brașov",
        slug: "peraconfort",
        bookingUrl: "https://www.booking.com/Share-vCX4Bz"
      }
    ];

    setApartments(fallbackData);
    setLoading(false);

    const q = query(collection(db, 'apartments'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const apts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Apartment));
        setApartments(apts);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching apartments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [lang]);

  useEffect(() => {
    if (window.location.hash === '#lista') {
      const element = document.getElementById('lista');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [apartments]);

  const filteredApartments = apartments.filter(apt => {
    const matchesSearch = apt.name.toLowerCase().includes(filter.toLowerCase()) || 
                         apt.location.toLowerCase().includes(filter.toLowerCase());
    const matchesCapacity = capacity ? (apt.capacity >= capacity || apt.slug === 'teren-tenis') : true;
    return matchesSearch && matchesCapacity;
  });

  return (
    <div className="pb-40 bg-white">
      <Helmet>
        <title>{lang === 'ro' ? 'Apartamentele Noastre' : 'Our Apartments'} | Pera Apartments</title>
        <meta name="description" content={t.hero.subtitle} />
      </Helmet>

      {/* Hero Section with Parallax */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden mb-32 bg-[#0a0a0a]">
        <motion.div 
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "linear" }}
          className="absolute inset-0 z-0"
        >
          <ParallaxImage 
            src="/6f0ac557-4bd0-4f6f-a395-20852779b012.jpg" 
            alt="Pera Apartments Hero" 
            className="w-full h-full object-cover brightness-[0.4]"
          />
        </motion.div>
        
        {/* Floating Background Text */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none select-none">
          <FloatingElement duration={20} yOffset={30}>
            <div className="text-[30vw] font-display font-black leading-none tracking-tighter text-white">PERA</div>
          </FloatingElement>
        </div>

        <div className="relative z-10 text-center text-white px-4 max-w-5xl">
          <SmoothIn direction="down">
            <span className="text-[10px] uppercase tracking-[1em] font-black mb-10 block text-white/50">
              {t.hero.tag || "COLLECTION"}
            </span>
          </SmoothIn>
          <h1 className="text-6xl md:text-9xl font-display font-black mb-10 leading-[0.85] tracking-tighter text-white">
            <TextReveal text={t.hero.title} />
          </h1>
          <SmoothIn direction="up" delay={0.4}>
            <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto font-bold italic border-t border-white/10 pt-10 mt-10">
              {t.hero.subtitle}
            </p>
          </SmoothIn>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <FloatingElement duration={2}>
            <div className="w-[1px] h-24 bg-gradient-to-b from-white to-transparent"></div>
          </FloatingElement>
        </motion.div>
      </section>

      <div id="lista" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-32">
          <div className="flex flex-col lg:flex-row justify-between items-end gap-16 mb-24">
            <div className="max-w-2xl">
              <Reveal3D>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.5em] font-black text-vibrant-indigo mb-8 block">{t.filter.tag}</span>
                  <h2 className="text-5xl md:text-8xl font-display font-black text-neutral-900 leading-[0.9] tracking-tighter">
                    <TextReveal text={t.filter.title.split('potrivit')[0]} />
                    <span className="italic font-light text-vibrant-indigo block">
                       <TextReveal text={lang === 'ro' ? 'potrivit.' : 'right space.'} />
                    </span>
                  </h2>
                </div>
              </Reveal3D>
            </div>
            
            {/* Advanced Filters */}
            <SmoothIn direction="left" delay={0.5}>
              <div className="flex flex-col md:flex-row gap-6 p-2 bg-indigo-50/50 rounded-full border border-neutral-100 shadow-xl items-center">
                <div className="relative flex-grow w-full md:w-80">
                  <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input 
                    type="text" 
                    placeholder={t.filter.searchPlaceholder} 
                    className="w-full pl-16 pr-8 py-5 bg-white rounded-full border border-neutral-100 focus:ring-2 focus:ring-black outline-none text-[10px] font-black uppercase tracking-widest text-neutral-900 transition-all shadow-sm"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
                <div className="h-10 w-[1px] bg-neutral-200 hidden md:block"></div>
                <select 
                  className="bg-transparent px-8 py-5 text-[10px] font-black uppercase tracking-widest outline-none border-none focus:ring-0 cursor-pointer text-neutral-900"
                  onChange={(e) => setCapacity(Number(e.target.value) || null)}
                >
                  <option value="">{t.filter.capacity}</option>
                  <option value="2">{t.filter.twoPersons}</option>
                  <option value="4">{t.filter.fourPersons}</option>
                </select>
              </div>
            </SmoothIn>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 border-t-4 border-black rounded-full mb-8 shadow-2xl"
            ></motion.div>
            <span className="text-[10px] font-black uppercase tracking-[1em] text-neutral-400 animate-pulse">LOADING COLLECTION</span>
          </div>
        ) : (
          <div className="space-y-48 mb-40">
            {filteredApartments.map((apt, i) => (
              <Reveal3D key={apt.id} delay={i * 0.1}>
                <div className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-16 lg:gap-32 items-center group mb-48`}>
                  {/* Image Side */}
                  <div className="w-full lg:w-[60%] relative">
                    <Link to={`/apartamente/${apt.slug}`} className="block">
                      <TiltCard>
                        <GlowWrapper>
                          <NanoBanana>
                            <div className="relative aspect-[16/10] overflow-hidden rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] bg-slate-50 group">
                              <motion.img 
                                whileHover={{ scale: 1.15, rotate: -1 }}
                                transition={{ duration: 1.2, ease: [0.2, 0.65, 0.3, 0.9] }}
                                src={apt.images[0] || "/6f0ac557-4bd0-4f6f-a395-20852779b012.jpg"} 
                                alt={apt.name} 
                                className="w-full h-full object-cover"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                              
                              {/* Overlay Info */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-center justify-center backdrop-blur-[2px]">
                                <Magnetic>
                                  <div className="w-24 h-24 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-black uppercase tracking-widest shadow-2xl transform scale-0 group-hover:scale-100 transition-transform duration-500">
                                    EXPLORE
                                  </div>
                                </Magnetic>
                              </div>

                              {apt.slug === 'teren-tenis' && (
                                <div className="absolute top-10 left-10 bg-white text-black px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl z-20">
                                  {lang === 'ro' ? 'SPORT' : 'SPORTS'}
                                </div>
                              )}
                            </div>
                          </NanoBanana>
                        </GlowWrapper>
                      </TiltCard>
                    </Link>
                    
                    {/* Floating Decorative Elements */}
                    <div className={`absolute -bottom-10 ${i % 2 === 0 ? '-right-10' : '-left-10'} z-20 hidden xl:block`}>
                      <FloatingElement duration={8} yOffset={20}>
                        <div className="text-[12vw] font-display font-black text-neutral-100/50 leading-none select-none pointer-events-none">0{i+1}</div>
                      </FloatingElement>
                    </div>
                  </div>
                  
                  {/* Content Side */}
                  <div className="w-full lg:w-[40%] flex flex-col items-start">
                    <SmoothIn direction="up">
                      <span className="text-[10px] font-black uppercase tracking-[0.6em] text-neutral-400 mb-8 block bg-[#fcfaf7] px-6 py-2 rounded-full border border-neutral-100">
                        {apt.slug === 'teren-tenis' ? t.apartment.activities : t.apartment.premium}
                      </span>
                    </SmoothIn>
                    
                    <h3 className="text-5xl md:text-7xl font-display font-black mb-10 leading-[0.9] tracking-tighter text-neutral-900 group-hover:translate-x-4 transition-transform duration-700">
                      <TextReveal text={apt.name} />
                    </h3>
                    
                    <p className="text-xl text-neutral-500 leading-relaxed mb-12 font-bold italic border-l-4 border-neutral-100 pl-10">
                      {apt.shortDescription}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-8 mb-16 w-full">
                      {apt.capacity > 0 && (
                        <NanoBanana>
                          <div className="flex items-center space-x-6 group/spec">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-vibrant-indigo group-hover/spec:bg-vibrant-indigo group-hover/spec:text-white transition-all shadow-sm">
                              <Users size={24} />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-widest block text-neutral-300 mb-1">GUESTS</span>
                              <span className="text-lg font-black text-neutral-900">{apt.capacity}</span>
                            </div>
                          </div>
                        </NanoBanana>
                      )}
                      {apt.rooms > 0 && (
                        <NanoBanana>
                          <div className="flex items-center space-x-6 group/spec">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-vibrant-indigo group-hover/spec:bg-vibrant-indigo group-hover/spec:text-white transition-all shadow-sm">
                              <Bed size={24} />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-widest block text-neutral-300 mb-1">ROOMS</span>
                              <span className="text-lg font-black text-neutral-900">{apt.rooms}</span>
                            </div>
                          </div>
                        </NanoBanana>
                      )}
                    </div>

                      <div className="flex items-center justify-between w-full p-10 bg-indigo-50/50 rounded-[2.5rem] border border-vibrant-indigo/10 group-hover:bg-vibrant-indigo group-hover:text-white transition-all duration-700">
                        <div>
                          {apt.originalPrice && (
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xs text-vibrant-rose line-through font-bold opacity-60">{apt.originalPrice} lei</span>
                              <span className="bg-vibrant-rose text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">OFFER</span>
                            </div>
                          )}
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-display font-black tracking-tighter">{apt.pricePerNight} lei</span>
                            <span className="opacity-50 text-[9px] uppercase font-black tracking-widest">/ night</span>
                          </div>
                        </div>
                        
                        <Magnetic>
                          <Link 
                            to={`/apartamente/${apt.slug}`} 
                            className="w-16 h-16 rounded-full bg-vibrant-indigo text-white flex items-center justify-center hover:scale-110 group-hover:bg-white group-hover:text-vibrant-indigo transition-all shadow-2xl group/btn"
                          >
                            <ChevronRight size={24} className="group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                        </Magnetic>
                      </div>
                  </div>
                </div>
              </Reveal3D>
            ))}
          </div>
        )}

        {!loading && filteredApartments.length === 0 && (
          <SmoothIn direction="up">
            <div className="text-center py-40 bg-neutral-50 rounded-[4rem] border border-dashed border-neutral-200">
              <p className="text-2xl font-display font-black text-neutral-300 italic uppercase tracking-widest">
                {t.apartment.noResults}
              </p>
            </div>
          </SmoothIn>
        )}

        {/* Why Choose Us Section - Overhaul */}
        <SpecialOffers t={t} lang={lang} />
        <section className="py-40 bg-[#0a0a0a] text-white rounded-[4rem] px-12 md:px-24 my-40 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-white opacity-[0.03] rounded-full blur-[100px] -mr-[25vw] -mt-[25vw]"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center relative z-10">
            <div>
              <Reveal3D>
                <span className="text-[10px] uppercase tracking-[1em] font-black text-white/30 mb-8 block">{t.whyChoose.tag}</span>
                <h2 className="text-5xl md:text-8xl font-display font-black text-white mb-16 leading-[0.9] tracking-tighter">
                  <TextReveal text={t.whyChoose.title.split('Pera Apartments?')[0]} />
                  <span className="italic font-light text-white/20 block">
                    {lang === 'ro' ? 'Pera Apartments?' : 'Pera Apartments?'}
                  </span>
                </h2>
              </Reveal3D>
              
              <SmoothIn direction="up">
                <p className="text-xl text-white/50 mb-20 leading-relaxed font-bold italic border-l-4 border-white/10 pl-10 max-w-xl">
                  {t.whyChoose.description}
                </p>
              </SmoothIn>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {t.whyChoose.features.map((feature: any, idx: number) => (
                  <SmoothIn key={idx} direction="up" delay={idx * 0.1}>
                    <div className="group/feat p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:bg-white hover:text-black transition-all duration-700">
                      <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-8 group-hover/feat:bg-black group-hover/feat:scale-110 transition-all">
                        {idx === 0 ? <MapPin size={24} /> : idx === 1 ? <Star size={24} /> : idx === 2 ? <ChevronRight size={24} /> : <Users size={24} />}
                      </div>
                      <h4 className="text-xl font-display font-black uppercase tracking-tight mb-4">{feature.title}</h4>
                      <p className="text-sm opacity-60 leading-relaxed font-bold">{feature.desc}</p>
                    </div>
                  </SmoothIn>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <SmoothIn direction="right">
                <TiltCard>
                  <GlowWrapper>
                    <div className="aspect-[4/5] rounded-[4rem] overflow-hidden border-8 border-white/5 shadow-2xl">
                      <ParallaxImage 
                        src="/e27fa483-a5c6-40da-8117-b72cee32f1b4.jpg" 
                        alt="Interior Pera" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </GlowWrapper>
                </TiltCard>
              </SmoothIn>
              
              <div className="absolute -bottom-16 -left-16 hidden xl:block z-30">
                <FloatingElement duration={5}>
                  <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-[320px] text-black border-4 border-neutral-100 transform -rotate-6">
                    <p className="text-2xl font-display font-black italic mb-8 leading-tight">"{t.whyChoose.testimonial}"</p>
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-black text-white flex items-center justify-center font-black text-xl shadow-xl">
                        {t.whyChoose.guest[0]}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">{t.whyChoose.verified}</p>
                        <p className="text-lg font-black uppercase tracking-tighter">{t.whyChoose.guest}</p>
                      </div>
                    </div>
                  </div>
                </FloatingElement>
              </div>
            </div>
          </div>
        </section>

        {/* Location Section - Overhaul */}
        <section className="py-40 bg-vibrant-rose/10 rounded-[4rem] relative overflow-hidden border border-vibrant-rose/20 shadow-2xl mb-40 mx-4 md:mx-12">
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-vibrant-rose/20 to-transparent"></div>
          
          <div className="flex flex-col lg:flex-row gap-32 items-center relative z-10 px-12 md:px-24">
            <div className="w-full lg:w-1/2">
              <Reveal3D>
                <span className="text-[10px] uppercase tracking-[1em] font-black text-vibrant-rose mb-8 block">{t.location.tag}</span>
                <h2 className="text-5xl md:text-8xl font-display font-black text-neutral-900 mb-16 leading-[0.9] tracking-tighter">
                  <TextReveal text={t.location.title.split('Transilvaniei.')[0]} />
                  <span className="italic font-light text-vibrant-rose block">
                    {lang === 'ro' ? 'Transilvaniei.' : 'Transylvania.'}
                  </span>
                </h2>
              </Reveal3D>
              
              <SmoothIn direction="up">
                <p className="text-xl text-neutral-600 mb-16 leading-relaxed font-bold italic border-l-4 border-vibrant-rose/20 pl-10 max-w-xl">
                  {t.location.description}
                </p>
              </SmoothIn>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {t.location.points.map((point: any, idx: number) => (
                  <SmoothIn key={idx} direction="up" delay={idx * 0.1}>
                    <NanoBanana>
                      <div className="group/loc flex items-center gap-6 p-8 bg-white border border-neutral-100 rounded-[2.5rem] hover:bg-vibrant-rose hover:text-white transition-all duration-700 shadow-sm hover:shadow-2xl hover:scale-105">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-vibrant-indigo flex items-center justify-center shadow-md group-hover/loc:bg-white group-hover/loc:text-vibrant-rose transition-colors">
                          <MapPin size={20} />
                        </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest mb-1">{point.name}</p>
                            <p className="text-[10px] opacity-60 uppercase tracking-[0.2em] font-black">{point.dist}</p>
                          </div>
                      </div>
                    </NanoBanana>
                  </SmoothIn>
                ))}
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 group">
              <TiltCard>
                <div className="aspect-video bg-neutral-100 rounded-[4rem] overflow-hidden relative shadow-2xl border-8 border-neutral-50 group">
                  <iframe 
                    src="https://maps.google.com/maps?q=Pera%20Apartments%20Gherasim%20Popa%201-3%20Cristian%20Brasov&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                    className="w-full h-full border-none grayscale contrast-[1.2] brightness-[0.9] hover:grayscale-0 hover:brightness-100 transition-all duration-1000 ease-in-out"
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                </div>
              </TiltCard>
            </div>
          </div>
        </section>

        {/* Gallery Section - Cinematic Overhaul */}
        <section className="py-40 bg-white">
          <Reveal3D>
            <div className="text-center mb-12">
              <span className="text-[10px] uppercase tracking-[1.5em] font-black text-vibrant-indigo mb-8 block">{t.gallery.tag}</span>
              <h2 className="text-6xl md:text-9xl font-display font-black leading-none tracking-tighter">
                <TextReveal text={t.gallery.title.split('relaxare.')[0]} />
                <span className="italic font-light text-vibrant-indigo block mt-4">
                  {lang === 'ro' ? 'relaxare.' : 'relaxation.'}
                </span>
              </h2>
            </div>
          </Reveal3D>

          <VibrantGallery 
            images={galleryImages}
            onImageClick={(index) => {
              setSelectedImageIndex(index);
            }}
          />
        </section>

        {/* Lightbox for Gallery */}
        <AnimatePresence>
          {selectedImageIndex !== null && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12"
              onClick={() => setSelectedImageIndex(null)}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.button 
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  className="absolute top-5 right-5 md:top-10 md:right-10 text-white hover:text-primary-accent transition-all p-4 z-50 bg-white/5 hover:bg-white/10 rounded-full border border-white/10"
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(null); }}
                >
                  <X size={32} />
                </motion.button>
                
                <motion.img 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 100 }}
                  src={galleryImages[selectedImageIndex]} 
                  className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10"
                  referrerPolicy="no-referrer"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logo Section - Grand Finale */}
        <SmoothIn direction="up">
          <div className="flex flex-col items-center justify-center py-40 border-t border-neutral-100">
            <Magnetic>
              <div className="text-center group cursor-default">
                <span className="text-6xl md:text-9xl font-display font-black tracking-tighter block mb-4 group-hover:tracking-normal transition-all duration-1000">
                  PERA
                </span>
                <span className="text-2xl md:text-4xl font-display font-light italic text-neutral-300 block group-hover:text-black transition-all duration-700">
                  Apartments
                </span>
                <div className="w-40 h-[2px] bg-neutral-200 mx-auto mt-12 overflow-hidden relative">
                  <motion.div 
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-black"
                  ></motion.div>
                </div>
              </div>
            </Magnetic>
          </div>
        </SmoothIn>
      </div>
    </div>
  );
}
