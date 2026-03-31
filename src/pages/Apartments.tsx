import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Bed, 
  Search,
  ChevronRight,
  Star,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Apartment } from '../types';

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
      threePlusPersons: "3+ Persoane"
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
      threePlusPersons: "3+ People"
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

export default function Apartments({ lang = 'ro' }: { lang?: string }) {
  const t = apartmentsTranslations[lang as keyof typeof apartmentsTranslations];
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [capacity, setCapacity] = useState<number | null>(null);

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
        capacity: 3,
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
        capacity: 3,
        rooms: 2,
        bathrooms: 1,
        amenities: ["Chicinetă privată", "Frigider", "Ustensile bucătărie", "Prăjitor pâine", "Aparat cafea/ceai", "Cană fierbător", "Zonă luat masa", "Baie privată", "Articole toaletă", "Duș", "Papuci", "Uscător păr", "Balcon", "Vedere munte", "Seif", "TV ecran plat", "Prosoape", "Lenjerie pat", "Pat XL", "Canapea extensibilă", "Încălzire", "Garderobă", "Aer condiționat"],
        images: ["/60ec7951-8ef3-46b5-aa79-375b228417cc.jpg", "/01159e24-68b8-4e3b-a79e-9033ac44336c.jpg"],
        location: "Cristian, Brașov",
        slug: "apartament-family-standard",
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
    <div className="pb-24">
      {/* Hero Section */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden mb-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="/6f0ac557-4bd0-4f6f-a395-20852779b012.jpg" 
            alt="Pera Apartments Hero" 
            className="w-full h-full object-cover brightness-50"
          />
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-base uppercase tracking-[0.5em] font-bold mb-8 block text-white"
          >
            {t.hero.tag}
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif mb-8 leading-tight uppercase tracking-tighter font-bold text-white"
          >
            {t.hero.title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-bold"
          >
            {t.hero.subtitle}
          </motion.p>
        </div>
      </section>

      <div id="lista" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-20">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div className="max-w-xl">
              <span className="text-sm uppercase tracking-[0.4em] font-bold text-neutral-400 mb-6 block opacity-80">{t.filter.tag}</span>
              <h2 className="text-3xl md:text-6xl font-serif font-black">{t.filter.title.split('potrivit')[0]} <span className="italic font-light">{lang === 'ro' ? 'potrivit.' : 'right space.'}</span></h2>
              <div className="w-20 h-[1px] bg-black/10 mt-8 mb-12"></div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-neutral-50 p-4 rounded-2xl mt-8 md:mt-0 w-full md:w-auto border border-neutral-900">
              <div className="relative flex-grow w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                <input 
                  type="text" 
                  placeholder={t.filter.searchPlaceholder} 
                  className="w-full pl-10 pr-4 py-2 bg-white border-none rounded-xl focus:ring-1 focus:ring-black outline-none text-xs font-black uppercase tracking-widest text-neutral-500"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <select 
                className="bg-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest outline-none border-none focus:ring-1 focus:ring-black w-full md:w-auto text-neutral-500"
                onChange={(e) => setCapacity(Number(e.target.value) || null)}
              >
                <option value="">{t.filter.capacity}</option>
                <option value="2">{t.filter.twoPersons}</option>
                <option value="3">{t.filter.threePlusPersons}</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="space-y-32 mb-40">
            {filteredApartments.map((apt, i) => (
              <motion.div 
                key={apt.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-24 items-center`}
              >
                <div className="w-full lg:w-3/5">
                  <Link to={`/apartamente/${apt.slug}`} className="block group">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-3xl shadow-xl bg-neutral-100">
                      <img 
                        src={apt.images[0] || "/6f0ac557-4bd0-4f6f-a395-20852779b012.jpg"} 
                        alt={apt.name} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        loading="lazy"
                      />
                      {apt.slug === 'teren-tenis' && (
                        <div className="absolute bottom-6 left-6 bg-black text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
                          {lang === 'ro' ? 'Facilitate Sportivă' : 'Sports Facility'}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
                
                <div className="w-full lg:w-2/5">
                  <span className="text-sm uppercase tracking-[0.4em] font-bold text-neutral-400 mb-6 block opacity-80">
                    {apt.slug === 'teren-tenis' ? t.apartment.activities : t.apartment.premium}
                  </span>
                  <h3 className="text-3xl md:text-5xl font-serif mb-8 leading-tight font-black text-neutral-900">{apt.name}</h3>
                  <p className="text-neutral-800 text-base leading-relaxed mb-10 font-description italic border-l-2 border-neutral-100 pl-4 font-bold">
                    {apt.shortDescription}
                  </p>
                  
                  <div className="flex items-center space-x-8 text-neutral-400 mb-10">
                    {apt.capacity > 0 && (
                      <div className="flex items-center space-x-2">
                        <Users size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{apt.capacity} {t.apartment.persons}</span>
                      </div>
                    )}
                    {apt.rooms > 0 && (
                      <div className="flex items-center space-x-2">
                        <Bed size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {apt.rooms} {apt.rooms === 1 ? (lang === 'ro' ? 'Cameră' : 'room') : t.apartment.rooms}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    {apt.originalPrice && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-red-500 line-through font-medium">{apt.originalPrice} lei</span>
                        <span className="bg-green-600 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                          -10%
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-neutral-900">{apt.pricePerNight} lei</span>
                      <span className="text-neutral-400 text-[8px] uppercase font-black tracking-widest">/ noapte</span>
                    </div>
                  </div>

                  <Link 
                    to={`/apartamente/${apt.slug}`} 
                    className="inline-flex items-center text-sm font-bold uppercase tracking-widest group border-b-2 border-black pb-1 hover:opacity-60 transition-all"
                  >
                    {t.apartment.details}
                    <ChevronRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filteredApartments.length === 0 && (
          <div className="text-center py-20 mb-32">
            <p className="text-neutral-400 italic">{t.apartment.noResults}</p>
          </div>
        )}

        {/* Why Choose Us Section */}
        <section className="py-32 bg-neutral-900 text-white rounded-[3rem] px-8 md:px-16 my-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-accent/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
            <div>
              <span className="text-sm uppercase tracking-[0.3em] font-bold text-primary-accent mb-4 block">{t.whyChoose.tag}</span>
              <h2 className="text-4xl md:text-5xl font-serif mb-8 leading-tight text-white">{t.whyChoose.title.split('Pera Apartments?')[0]} <span className="italic font-light">Pera Apartments?</span></h2>
              <p className="text-neutral-300 mb-12 leading-relaxed font-bold">
                {t.whyChoose.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {t.whyChoose.features.map((feature: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="bg-white/5 p-3 rounded-xl h-fit text-primary-accent border border-white/10">
                      {idx === 0 ? <MapPin size={24} /> : idx === 1 ? <Star size={24} /> : idx === 2 ? <ChevronRight size={24} /> : <Users size={24} />}
                    </div>
                    <div>
                      <h4 className="font-sans font-bold uppercase tracking-wider text-lg mb-2 text-primary-accent">{feature.title}</h4>
                      <p className="text-sm md:text-base opacity-80 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-white/10">
                <img 
                  src="/e27fa483-a5c6-40da-8117-b72cee32f1b4.jpg" 
                  alt="Interior Pera" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 bg-white p-5 rounded-3xl shadow-2xl hidden md:block max-w-[240px] text-black">
                <p className="text-neutral-800 font-serif italic text-sm mb-4 font-bold">"{t.whyChoose.testimonial}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                    I
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest">{t.whyChoose.guest}</p>
                    <p className="text-xs text-neutral-400 uppercase tracking-widest">{t.whyChoose.verified}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section id="localizare" className="py-32 bg-neutral-900 text-white rounded-[3rem] px-8 md:px-16 my-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-accent/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          <div className="flex flex-col md:flex-row gap-16 items-center relative z-10">
            <div className="w-full md:w-1/2">
              <span className="text-sm uppercase tracking-[0.3em] font-bold text-primary-accent mb-4 block">{t.location.tag}</span>
              <h2 className="text-4xl md:text-5xl font-serif mb-8 leading-tight text-white">{t.location.title.split('Transilvaniei.')[0]} <span className="italic font-light">{lang === 'ro' ? 'Transilvaniei.' : 'Transylvania.'}</span></h2>
              <p className="text-neutral-300 mb-8 leading-relaxed font-bold">
                {t.location.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {t.location.points.map((point: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl group hover:bg-white hover:text-black transition-all duration-300 border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-sm group-hover:bg-primary-accent group-hover:text-black transition-colors">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest">{point.name}</p>
                      <p className="text-xs opacity-60 uppercase tracking-widest">{point.dist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-1/2 aspect-video bg-neutral-800 rounded-[2.5rem] overflow-hidden relative shadow-2xl border border-white/10">
              <iframe 
                src="https://maps.google.com/maps?q=Pera%20Apartments%20Gherasim%20Popa%201-3%20Cristian%20Brasov&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                className="w-full h-full border-none grayscale hover:grayscale-0 transition-all duration-700"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="py-24 border-t border-neutral-100">
          <div className="text-center mb-16">
            <span className="text-sm uppercase tracking-[0.3em] font-bold text-neutral-400 mb-4 block">{t.gallery.tag}</span>
            <h2 className="text-4xl md:text-5xl font-serif leading-tight">{t.gallery.title.split('relaxare.')[0]} <span className="italic font-light">{lang === 'ro' ? 'relaxare.' : 'relaxation.'}</span></h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="aspect-square rounded-2xl overflow-hidden">
              <img src="/4587fe93-7975-453c-b289-7d2c0d99c50d.jpg" alt="Gallery 1" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden">
              <img src="/6cb8aae8-197b-4810-bbb5-4ef5aa20268a.jpg" alt="Gallery 2" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden">
              <img src="/740f0b90-e7ce-42f5-80fc-322333332540.jpg" alt="Gallery 3" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden">
              <img src="/cc4887fc-429b-4e77-9b14-db7ac9117ef5.jpg" alt="Gallery 4" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden">
              <img src="/796a0c21-506d-4a55-9041-055117366e5f.jpg" alt="Gallery 5" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden">
              <img src="/23546336-79f7-4f7d-969a-c3ff93a58c0e.jpg" alt="Gallery 6" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden">
              <img src="/845e3f2f-3737-4564-9ec4-04f2db023a36.jpg" alt="Gallery 7" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="aspect-square rounded-2xl overflow-hidden">
              <img src="/a3be2a84-8555-4e07-9437-71c828448bbe.jpg" alt="Gallery 8" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
            </div>
          </div>
        </section>

        {/* Logo Section at the very bottom */}
        <div className="flex justify-center mt-24">
          <div className="text-center">
            <span className="text-3xl md:text-4xl font-serif font-bold tracking-tighter">
              PERA <span className="font-light italic text-neutral-400">Apartments</span>
            </span>
            <div className="w-20 h-0.5 bg-neutral-200 mx-auto mt-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
