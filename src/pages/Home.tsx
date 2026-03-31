import { motion, useScroll, useTransform } from 'motion/react';
import { 
  ChevronRight, 
  Wifi, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Star,
  ArrowRight,
  Trees,
  Flame,
  Trophy,
  Home as HomeIcon,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRef } from 'react';

const homeTranslations = {
  ro: {
    heroSub: "Experiență Unică la Poalele Postăvarului",
    heroTitle: "Acasă, departe de ",
    heroTitleItalic: "acasă.",
    heroBtnApts: "Vezi Apartamentele",
    heroBtnContact: "Contactează-ne",
    feat1Title: "Wi-Fi Ultra-Rapid",
    feat1Desc: "Conexiune stabilă ideală pentru muncă sau divertisment.",
    feat2Title: "Curățenie Profesională",
    feat2Desc: "Standarde riguroase de igienă pentru siguranța ta.",
    feat3Title: "Liniște Montană",
    feat3Desc: "Cristianul fiind retras de agitația orașului, oferă liniștea de care ai nevoie.",
    feat4Title: "Locație Ideală",
    feat4Desc: "Ești la poalele Postăvarului, într-un cadru natural deosebit.",
    feat5Title: "Spații Verzi Generoase",
    feat5Desc: "Zone ideale pentru relaxare, socializare și reconectare.",
    feat6Title: "Șemineu",
    feat6Desc: "Atmosferă caldă și primitoare pentru seri de neuitat.",
    feat7Title: "Teren de Tenis",
    feat7Desc: "Acces gratuit la terenul de tenis privat al complexului.",
    feat8Title: "Foișor din Lemn",
    feat8Desc: "Locul perfect pentru grătar și relaxare în aer liber.",
    aptsSub: "Apartamente",
    aptsTitle: "Spații care ",
    aptsTitleItalic: "inspiră.",
    aptsDesc: "Descoperă echilibrul perfect între designul modern și ospitalitatea caldă. Fiecare unitate este complet utilată pentru a-ți oferi o experiență fără griji.",
    aptsBtnAll: "Vezi Toate Unitățile",
    aptsBtnView: "Vezi camera",
    apt1Name: "Cameră King",
    apt1Tags: ["2 Persoane", "Pat King Size", "Design Premium"],
    apt2Name: "Cameră dublă deluxe",
    apt2Tags: ["2 Persoane", "Confort Sporit", "Vedere Montană"],
    apt3Name: "Cameră de familie deluxe",
    apt3Tags: ["3 Persoane", "Vedere Teren Tenis", "Ideal pentru Familii"],
    apt4Name: "Cameră de familie standard",
    apt4Tags: ["3 Persoane", "Confort", "Spațios"],
    reviewsSub: "Recenzii Clienți",
    reviewsTitle: "Ce spun ",
    reviewsTitleItalic: "oaspeții noștri.",
    reviewsBtnAll: "Vezi toate recenziile pe Booking.com",
    faqTitle: "Întrebări Frecvente",
    faqDesc: "Tot ce trebuie să știi pentru un sejur fără griji.",
    faq1Q: "Care sunt orele de check-in și check-out?",
    faq1A: "Check-in-ul se face între orele 15:00 și 23:00, iar check-out-ul este până la ora 11:00 (ora României).",
    faq2Q: "Există parcare disponibilă?",
    faq2A: "Oferim parcare privată gratuită chiar la proprietate, deci nu va trebui să îți faci griji pentru găsirea unui loc de parcare.",
    faq3Q: "Avem acces la bucătărie sau grătar?",
    faq3A: "Camerele de familie dispun de chicinetă privată complet echipată. De asemenea, oaspeții pot folosi grătarul situat în foișorul de lemn din curte, locul perfect pentru relaxare după un meci de tenis.",
    faq4Q: "Este permis fumatul?",
    faq4A: "Fumatul este strict interzis în interiorul camerelor. Acesta este permis doar în spațiile exterioare special amenajate.",
    tennisSub: "Activități & Sport",
    tennisTitle: "Teren de Tenis ",
    tennisTitleItalic: "privat.",
    tennisDesc: "Oaspeții noștri beneficiază de acces gratuit la terenul de tenis situat în incinta complexului. Indiferent dacă ești un jucător experimentat sau vrei doar să te relaxezi activ, terenul nostru este locul ideal. Camera de Familie Deluxe oferă cea mai bună vedere panoramică direct spre acest teren.",
    tennisItem1: "Acces gratuit pentru toți oaspeții",
    tennisItem2: "Rachete și mingi incluse",
    tennisItem3: "Disponibil pe tot parcursul zilei",
    tennisItem4: "Nocturnă inclusă",
    storySub: "Povestea Noastră",
    storyTitle: "O poveste despre ",
    storyTitleItalic: "liniște",
    storyTitleEnd: " și rafinament.",
    storyP1: "Pera Apartments oferă cazare modernă într-o zonă liniștită, aproape de munte. Locația a fost inaugurată în iulie 2025 și este concepută pentru a oferi un standard ridicat de confort și discreție.",
    storyP2: "Apartamentele sunt potrivite atât pentru escapade de weekend, cât și pentru sejururi, punând accent pe calitatea finisajelor și pe o atmosferă primitoare. Ne-am asigurat că fiecare detaliu este pus la punct, astfel încât oaspeții noștri să beneficieze de toate condițiile necesare unei experiențe de calitate.",
    storyBtnReserve: "Rezervă Experiența",
    storyBtnApts: "Vezi Apartamentele",
    storyBadgeNumber: "4",
    storyBadgeText: "unități de cazare unice",
    socialSub: "Social Media",
    socialTitle: "Urmărește-ne pe ",
    facilities: "FACILITĂȚI",
    motto: "ELEGANȚĂ • RELAXARE • NATURĂ",
  },
  en: {
    heroSub: "Unique Experience at the Foot of Postăvaru",
    heroTitle: "Home, away from ",
    heroTitleItalic: "home.",
    heroBtnApts: "View Apartments",
    heroBtnContact: "Contact Us",
    feat1Title: "Ultra-Fast Wi-Fi",
    feat1Desc: "Stable connection ideal for work or entertainment.",
    feat2Title: "Professional Cleaning",
    feat2Desc: "Rigorous hygiene standards for your safety.",
    feat3Title: "Mountain Tranquility",
    feat3Desc: "Cristian being away from the city bustle, offers the peace you need.",
    feat4Title: "Ideal Location",
    feat4Desc: "You are at the foot of Postăvaru, in a special natural setting.",
    feat5Title: "Generous Green Spaces",
    feat5Desc: "Ideal areas for relaxation, socialization and reconnection.",
    feat6Title: "Fireplace",
    feat6Desc: "Warm and welcoming atmosphere for unforgettable evenings.",
    feat7Title: "Tennis Court",
    feat7Desc: "Free access to the complex's private tennis court.",
    feat8Title: "Wooden Gazebo",
    feat8Desc: "The perfect place for barbecue and outdoor relaxation.",
    aptsSub: "Apartments",
    aptsTitle: "Spaces that ",
    aptsTitleItalic: "inspire.",
    aptsDesc: "Discover the perfect balance between modern design and warm hospitality. Each unit is fully equipped to offer you a worry-free experience.",
    aptsBtnAll: "View All Units",
    aptsBtnView: "View room",
    apt1Name: "King Room",
    apt1Tags: ["2 People", "King Size Bed", "Premium Design"],
    apt2Name: "Deluxe Double Room",
    apt2Tags: ["2 People", "Enhanced Comfort", "Mountain View"],
    apt3Name: "Deluxe Family Room",
    apt3Tags: ["3 People", "Tennis Court View", "Ideal for Families"],
    apt4Name: "Family Room",
    apt4Tags: ["3 People", "Comfort", "Spacious"],
    reviewsSub: "Guest Reviews",
    reviewsTitle: "What ",
    reviewsTitleItalic: "our guests say.",
    reviewsBtnAll: "View all reviews on Booking.com",
    faqTitle: "Frequently Asked Questions",
    faqDesc: "Everything you need to know for a worry-free stay.",
    faq1Q: "What are the check-in and check-out hours?",
    faq1A: "Check-in is between 3:00 PM and 11:00 PM, and check-out is until 11:00 AM (Romania time).",
    faq2Q: "Is parking available?",
    faq2A: "We offer free private parking right at the property, so you won't have to worry about finding a parking spot.",
    faq3Q: "Do we have access to a kitchen or grill?",
    faq3A: "Family rooms feature a fully equipped private kitchenette. Guests can also use the grill located in the wooden gazebo in the yard, the perfect spot for relaxing after a tennis match.",
    faq4Q: "Is smoking allowed?",
    faq4A: "Smoking is strictly prohibited inside the rooms. It is only allowed in designated outdoor spaces.",
    tennisSub: "Activities & Sport",
    tennisTitle: "Private Tennis ",
    tennisTitleItalic: "Court.",
    tennisDesc: "Our guests benefit from free access to the tennis court located within the complex. Whether you are an experienced player or just want to relax actively, our court is the ideal place. The Deluxe Family Room offers the best panoramic view directly to this court.",
    tennisItem1: "Free access for all guests",
    tennisItem2: "Rackets and balls included",
    tennisItem3: "Available throughout the day",
    tennisItem4: "Night lighting included",
    storySub: "Our Story",
    storyTitle: "A story about ",
    storyTitleItalic: "peace",
    storyTitleEnd: " and refinement.",
    storyP1: "Nestled in the noble heart of Cristian village, just a few minutes from Brașov, Pera Apartments represents the quintessence of Transylvanian refinement. Opened in July 2025, our location was conceived as a sanctuary of discretion and good taste, where modern design harmoniously intertwines with the warm hospitality of the region.",
    storyP2: "Whether you aspire to the profound peace of the mountains, a romantic getaway under the starry vault, or simply wish to escape the daily rhythm, here you will discover a universe dedicated to absolute comfort. We are a new presence in the tourist landscape, but we carry an unwavering promise: excellence in every detail.",
    storyBtnReserve: "Book the Experience",
    storyBtnApts: "View Apartments",
    storyBadgeNumber: "4",
    storyBadgeText: "Unique Accommodation Units",
    socialSub: "Social Media",
    socialTitle: "Follow us on ",
    facilities: "FACILITIES",
    motto: "ELEGANCE • RELAXATION • NATURE",
  }
};

const Hero = ({ t }: { t: any }) => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/d6b549ee-a86d-4e0d-a3ec-2adc1a6ac383.jfif" 
          alt="Pera Apartments Living Room" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl">
        <motion.span 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-white text-xs uppercase tracking-[0.5em] font-bold mb-8 block opacity-80"
        >
          {t.heroSub}
        </motion.span>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-8xl font-display font-bold text-white mb-8 leading-tight tracking-tighter"
        >
          {t.heroTitle}<span className="italic font-light opacity-80">{t.heroTitleItalic}</span>
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6"
        >
          <Link 
            to="/apartamente" 
            className="bg-white text-black px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-neutral-100 transition-all flex items-center group"
          >
            {t.heroBtnApts}
            <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
          </Link>
          <Link 
            to="/contact" 
            className="text-white border border-white/30 backdrop-blur-sm px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            {t.heroBtnContact}
          </Link>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white opacity-50"
      >
        <div className="w-[1px] h-12 bg-white mx-auto"></div>
      </motion.div>
    </section>
  );
};

const Features = ({ t }: { t: any }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const xPera = useTransform(scrollYProgress, [0, 0.25], ["-100%", "0%"]);
  const xApartments = useTransform(scrollYProgress, [0.25, 0.5], ["150%", "0%"]);

  const features = [
    { icon: <Wifi size={32} />, title: t.feat1Title, desc: t.feat1Desc },
    { icon: <ShieldCheck size={32} />, title: t.feat2Title, desc: t.feat2Desc },
    { icon: <Clock size={32} />, title: t.feat3Title, desc: t.feat3Desc },
    { icon: <MapPin size={32} />, title: t.feat4Title, desc: t.feat4Desc },
    { icon: <Trees size={32} />, title: t.feat5Title, desc: t.feat5Desc },
    { icon: <Flame size={32} />, title: t.feat6Title, desc: t.feat6Desc },
    { icon: <Trophy size={32} />, title: t.feat7Title, desc: t.feat7Desc },
    { icon: <HomeIcon size={32} />, title: t.feat8Title, desc: t.feat8Desc },
  ];

  return (
    <section id="facilitati" ref={containerRef} className="relative">
      {/* Top Transition with PERA */}
      <div className="bg-white pt-10 overflow-hidden">
        <motion.div 
          style={{ x: xPera }}
          className="whitespace-nowrap"
        >
          <span className="text-[12vw] font-serif font-bold uppercase leading-none text-black opacity-10">PERA</span>
        </motion.div>
      </div>

      {/* Main Facilities Content */}
      <div className="bg-[#0a0a0a] py-32 text-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <span className="text-base uppercase tracking-[0.5em] font-bold text-primary-accent mb-6 block">{t.motto}</span>
            <h2 className="text-4xl md:text-6xl font-sans font-bold text-white uppercase tracking-[0.2em]">{t.facilities}</h2>
            <div className="w-24 h-[1px] bg-primary-accent/30 mx-auto mt-8"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                className="text-center group"
              >
                <div className="mb-8 flex justify-center text-primary-accent transition-transform duration-700 group-hover:scale-110 opacity-80">{f.icon}</div>
                <h3 className="text-base font-sans uppercase tracking-[0.2em] mb-4 text-primary-accent font-black">{f.title}</h3>
                <p className="description-small max-w-[260px] mx-auto font-bold text-white/80">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Transition with APARTMENTS */}
      <div className="bg-[#0a0a0a] pb-10 overflow-hidden">
        <motion.div 
          style={{ x: xApartments }}
          className="whitespace-nowrap text-right"
        >
          <span className="text-[12vw] font-serif font-bold uppercase leading-none text-white opacity-10">APARTMENTS</span>
        </motion.div>
      </div>
    </section>
  );
};

const ApartmentPreview = ({ t }: { t: any }) => {
  const apartments = [
    {
      name: t.apt1Name,
      image: "/54af473d-3cf2-40a4-9c03-d26751e4ff65-1.jfif",
      tags: t.apt1Tags
    },
    {
      name: t.apt2Name,
      image: "/740f0b90-e7ce-42f5-80fc-322333332540.jfif",
      tags: t.apt2Tags
    },
    {
      name: t.apt3Name,
      image: "/793bc1c7-9fda-4077-b1be-e098f0325f97.jfif",
      tags: t.apt3Tags
    },
    {
      name: t.apt4Name,
      image: "/60ec7951-8ef3-46b5-aa79-375b228417cc.jfif",
      tags: t.apt4Tags
    }
  ];

  return (
    <section id="apartamente" className="py-32 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div className="max-w-xl">
            <span className="text-xs uppercase tracking-[0.3em] font-bold text-neutral-400 mb-4 block">{t.aptsSub}</span>
            <h2 className="text-4xl md:text-6xl font-serif leading-tight mb-6 text-neutral-900">{t.aptsTitle}<span className="italic font-light text-neutral-500">{t.aptsTitleItalic}</span></h2>
            <p className="leading-relaxed text-neutral-800 font-medium">
              {t.aptsDesc}
            </p>
          </div>
          <Link to="/apartamente" className="mt-8 md:mt-0 text-sm font-bold uppercase tracking-widest border-b-2 border-black pb-1 hover:opacity-60 transition-opacity">
            {t.aptsBtnAll}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {apartments.map((apt, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer relative card-hover"
            >
              <div className="relative aspect-[4/5] overflow-hidden mb-6 rounded-xl">
                <img 
                  src={apt.image} 
                  alt={apt.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500"></div>
                
                {/* View Room Button */}
                <div className="absolute bottom-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <Link 
                    to="/apartamente#lista"
                    className="bg-white text-black px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl hover:bg-neutral-100 transition-colors"
                  >
                    {t.aptsBtnView}
                  </Link>
                </div>
              </div>
              <h3 className="text-xl font-serif mb-2 font-black">{apt.name}</h3>
              <div className="flex flex-wrap gap-2">
                {apt.tags.map((tag: string, j: number) => (
                  <span key={j} className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
                    {tag} {j < apt.tags.length - 1 && "•"}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Testimonials = ({ t }: { t: any }) => {
  const reviews = [
    { name: "Yna (România)", text: "O locație absolut superbă! Totul este impecabil de curat, nou și amenajat cu mult bun gust. Gazdele sunt extrem de primitoare și te fac să te simți ca acasă din primul moment. Complexul dispune de 4 apartamente și 2 garsoniere moderne cu bai de 9 mp, spațiu de grătar, foișor cochet, gazon îngrijit perfect și chiar teren de tenis de câmp, ideal pentru relaxare și distracție. Un loc unde confortul, liniștea și calitatea se îmbină perfect. Raport calitate-preț excelent! Recomand cu toată încrederea! 🙂", rating: 5 },
    { name: "Andrei M. (România)", text: "O experiență de neuitat! Apartamentul a fost impecabil, iar gazdele ne-au făcut să ne simțim ca acasă. Recomandăm cu drag!", rating: 5 },
    { name: "Cosmin (România)", text: "O locație foarte curată, îngrijită cu o liniște deosebită. Recomand cu încredere. Mulțumesc și Succes pe mai departe.", rating: 5 },
  ];

  const bookingLink = "https://www.booking.com/Share-vCX4Bz";

  return (
    <section className="py-32 bg-neutral-900 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
        <span className="text-[20vw] font-serif italic leading-none select-none">Pera</span>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <span className="text-xs uppercase tracking-[0.3em] font-bold text-neutral-500 mb-4 block">{t.reviewsSub}</span>
          <h2 className="text-4xl md:text-6xl font-serif text-neutral-400">{t.reviewsTitle}<span className="italic font-light">{t.reviewsTitleItalic}</span></h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {reviews.map((r, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-dark p-8 rounded-3xl flex flex-col max-w-sm card-hover"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex text-yellow-500">
                  {[...Array(r.rating)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}
                </div>
              </div>
              <p className="text-base font-serif italic mb-8 leading-relaxed flex-grow font-black text-white/90">"{r.text}"</p>
              <span className="text-sm uppercase tracking-widest font-bold text-white">— {r.name}</span>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <a 
            href={bookingLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-bold uppercase tracking-widest border-b border-neutral-500 pb-2 hover:text-neutral-300 transition-colors"
          >
            {t.reviewsBtnAll}
          </a>
        </div>
      </div>
    </section>
  );
};

const FAQ = ({ t }: { t: any }) => {
  const items = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
  ];

  return (
    <section id="faq" className="py-32 bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif mb-4">{t.faqTitle}</h2>
          <p className="text-neutral-500">{t.faqDesc}</p>
        </div>
        <div className="space-y-8">
          {items.map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border-b border-neutral-100 pb-8"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="text-neutral-300 mr-4 font-serif italic">0{i+1}</span>
                {item.q}
              </h3>
              <p className="text-neutral-700 leading-relaxed pl-10 font-medium">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TennisCourt = ({ t }: { t: any }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const xText = useTransform(scrollYProgress, [0, 0.4], ["-100%", "0%"]);

  return (
    <section ref={containerRef} className="relative py-32 bg-neutral-900 overflow-hidden">
      {/* Background Text Transition */}
      <div className="absolute top-0 left-0 w-full overflow-hidden pointer-events-none z-0 pt-10">
        <motion.div 
          style={{ x: xText }}
          className="whitespace-nowrap"
        >
          <span className="text-[12vw] font-serif font-bold uppercase leading-none text-white opacity-10">{t.tennisSub}</span>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="glass-dark p-10 rounded-[2rem] text-white">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-5xl font-serif mb-8 leading-tight font-black text-white">{t.tennisTitle}<span className="italic font-medium text-white/60">{t.tennisTitleItalic}</span></h2>
                <p className="text-neutral-400 font-sans font-bold leading-relaxed mb-8">
                  {t.tennisDesc}
                </p>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center text-white/80 font-bold">
                    <Check className="text-primary-accent mr-3" size={22} strokeWidth={3} />
                    {t.tennisItem1}
                  </li>
                  <li className="flex items-center text-white/80 font-bold">
                    <Check className="text-primary-accent mr-3" size={22} strokeWidth={3} />
                    {t.tennisItem2}
                  </li>
                  <li className="flex items-center text-white/80 font-bold">
                    <Check className="text-primary-accent mr-3" size={22} strokeWidth={3} />
                    {t.tennisItem3}
                  </li>
                  <li className="flex items-center text-white/80 font-bold">
                    <Check className="text-primary-accent mr-3" size={22} strokeWidth={3} />
                    {t.tennisItem4}
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
          <div className="order-1 lg:order-2 grid grid-cols-2 gap-4">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden">
              <img 
                src="/47c15380-62ba-479c-8720-c45112e0cc76.jfif" 
                alt="Tennis Court 1" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="aspect-[4/5] rounded-3xl overflow-hidden mt-8">
              <img 
                src="/603bc507-195c-43f5-8de7-02d10220a4aa.jfif" 
                alt="Tennis Court 2" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function Home({ lang }: { lang: 'ro' | 'en' }) {
  const t = homeTranslations[lang];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white"
    >
      <Hero t={t} />
      <Features t={t} />
      <ApartmentPreview t={t} />
      <TennisCourt t={t} />
      
      {/* About Section */}
      <section className="py-32 bg-neutral-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative z-10 overflow-hidden rounded-2xl shadow-2xl">
                <img 
                  src="/1d745365-58af-4c7f-aee2-f80e2012d2e1.jfif" 
                  alt="Pera Apartments Story" 
                  className="w-full aspect-[4/5] object-cover hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 bg-white p-8 hidden lg:flex items-center space-x-4 shadow-2xl rounded-xl z-20 border border-neutral-100">
                <span className="text-7xl font-serif font-bold text-black leading-none">{t.storyBadgeNumber}</span>
                <p className="text-sm uppercase tracking-[0.2em] font-bold text-neutral-400 max-w-[120px]">
                  {t.storyBadgeText}
                </p>
              </div>
              {/* Decorative element */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-neutral-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs uppercase tracking-[0.4em] font-bold text-neutral-400 mb-6 block">{t.storySub}</span>
              <h2 className="text-4xl md:text-6xl font-serif mb-10 leading-[1.1] font-black">{t.storyTitle}<span className="italic font-light">{t.storyTitleItalic}</span>{t.storyTitleEnd}</h2>
              <div className="space-y-6 !text-neutral-500 text-lg leading-relaxed !font-black">
                <p className="!font-black !text-neutral-500">{t.storyP1}</p>
                <p className="!font-black !text-neutral-500">{t.storyP2}</p>
              </div>
              <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <a 
                  href="https://www.booking.com/Share-vCX4Bz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-8 py-4 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors rounded-full"
                >
                  {t.storyBtnReserve}
                </a>
                <Link to="/apartamente" className="inline-flex items-center text-sm font-bold uppercase tracking-widest group border-b-2 border-transparent hover:border-black pb-1 transition-all">
                  {t.storyBtnApts}
                  <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" size={16} />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Testimonials t={t} />
      <FAQ t={t} />

      {/* Instagram Feed Placeholder */}
      <section className="py-24 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-xs uppercase tracking-[0.3em] font-bold text-neutral-400 mb-4 block">{t.socialSub}</span>
            <h2 className="text-3xl font-serif mb-12">{t.socialTitle}<a href="https://instagram.com/pera.apartments" className="italic hover:text-neutral-500 transition-colors">@pera.apartments</a></h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              "/f8d66e83-5317-43f1-86e4-112c669e2217.jfif",
              "/3e764a85-4926-4f96-94b8-2635381d7e82.jfif",
              "/b7d46158-77cd-4a02-ab2f-d121c351f5ce.jfif",
              "/d756fd30-26cf-43d4-bc3d-e4ed5226a59e.jfif",
              "/23546336-79f7-4f7d-969a-c3ff93a58c0e.jfif"
            ].map((img, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="aspect-square bg-neutral-100 overflow-hidden rounded-xl"
              >
                <img 
                  src={img} 
                  alt="Social Feed" 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
