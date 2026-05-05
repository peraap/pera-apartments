import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'motion/react';
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
  Check,
  Instagram,
  Facebook,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  TiltCard, 
  Magnetic, 
  GlowWrapper, 
  TextReveal, 
  ParallaxImage, 
  AnimatedSection,
  Reveal3D,
  FloatingElement,
  SmoothIn,
  PhotoAlbum,
  VibrantGallery,
  NanoBanana
} from '../components/AnimatedComponents';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { SpecialOffer as SpecialOfferType } from '../types';
import { Tag } from 'lucide-react';

const homeTranslations = {
  ro: {
    heroSub: "Experiență Unică la Poalele Postăvarului",
    heroTitle: "Acasă, departe de ",
    heroTitleItalic: "casă.",
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
    apt3Tags: ["4 Persoane", "Vedere Teren Tenis", "Ideal pentru Familii"],
    apt4Name: "Cameră de familie standard",
    apt4Tags: ["4 Persoane", "Confort", "Spațios"],
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
    offersSub: "Oferte Speciale",
    offersTitle: "Profită de pachetele noastre ",
    offersTitleItalic: "exclusive.",
    offersBtnBook: "Rezervă cu Ofertă",
    offersMinNights: "nopți minim",
    storySub: "Povestea Noastră",
    storyTitle: "O poveste despre ",
    storyTitleItalic: "liniște",
    storyTitleEnd: " și rafinament.",
    storyP1: "Pera Apartments oferă cazare modernă într-o zonă liniștită, aproape de munte. Locația a fost inaugurată în iulie 2025 și este concepută pentru a oferi un standard ridicat de confort și discreție.",
    storyP2: "Apartamentele sunt potrivite atât pentru escapade de weekend, cât și pentru sejururi, punând accent pe calitatea finisajelor și pe o atmosferă primitoare. Ne-am asigurat că fiecare detaliu este pus la punct, astfel încât oaspeții noștri să beneficieze de toate condițiile necesare unei experiențe de calitate.",
    storyBtnReserve: "Rezervă Experiența",
    storyBtnApts: "Vezi Apartamentele",
    storyBadgeNumber: "6",
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
    apt3Tags: ["4 People", "Tennis Court View", "Ideal for Families"],
    apt4Name: "Family Room",
    apt4Tags: ["4 People", "Comfort", "Spacious"],
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
    storyBadgeNumber: "6",
    storyBadgeText: "Unique Accommodation Units",
    socialSub: "Social Media",
    socialTitle: "Follow us on ",
    facilities: "FACILITIES",
    motto: "ELEGANCE • RELAXATION • NATURE",
  }
};

const Hero = ({ t }: { t: any }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  return (
    <section ref={containerRef} className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
      <Helmet>
        <title>Pera Apartments | Home</title>
      </Helmet>
      {/* Background Image */}
      <motion.div style={{ y, scale }} className="absolute inset-0 z-0 opacity-60">
        <img 
          src="/d6b549ee-a86d-4e0d-a3ec-2adc1a6ac383.jpg" 
          alt="Pera Apartments Living Room" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
      </motion.div>

      <motion.div style={{ opacity }} className="relative z-10 text-center px-4 max-w-5xl">
        <Reveal3D>
          <motion.span 
            initial={{ opacity: 0, letterSpacing: "1em" }}
            animate={{ opacity: 1, letterSpacing: "0.5em" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="text-primary-accent text-[10px] md:text-xs uppercase font-black mb-10 block"
          >
            {t.heroSub}
          </motion.span>
          <h1 className="text-6xl md:text-9xl font-display font-black text-white mb-10 leading-[0.85] tracking-tighter">
            <TextReveal text={t.heroTitle} />
            <span className="italic font-light text-primary-accent opacity-60 block md:inline">
              <TextReveal text={t.heroTitleItalic} />
            </span>
          </h1>
          <div className="flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-8">
            <SmoothIn direction="up" delay={0.6}>
              <Magnetic>
                <Link 
                  to="/apartamente" 
                  className="bg-white text-black px-12 py-5 rounded-full font-black uppercase tracking-widest hover:bg-neutral-100 transition-all flex items-center group shadow-2xl hover:scale-105"
                >
                  {t.heroBtnApts}
                  <ChevronRight className="ml-3 group-hover:translate-x-2 transition-transform" size={20} />
                </Link>
              </Magnetic>
            </SmoothIn>
            <SmoothIn direction="up" delay={0.8}>
              <Magnetic>
                <Link 
                  to="/contact" 
                  className="text-white border-2 border-white/20 backdrop-blur-md px-12 py-5 rounded-full font-black uppercase tracking-widest hover:bg-white/10 transition-all shadow-2xl hover:border-white/40 hover:scale-105"
                >
                  {t.heroBtnContact}
                </Link>
              </Magnetic>
            </SmoothIn>
          </div>
        </Reveal3D>
      </motion.div>

      {/* Floating Background Icons */}
      <div className="absolute bottom-1/4 left-1/4 opacity-10 pointer-events-none">
        <FloatingElement duration={8} yOffset={30}>
          <HomeIcon size={120} className="text-white rotate-12" />
        </FloatingElement>
      </div>
      <div className="absolute top-1/4 right-1/4 opacity-10 pointer-events-none">
        <FloatingElement duration={12} delay={2} yOffset={40}>
          <Trees size={150} className="text-white -rotate-12" />
        </FloatingElement>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 15, 0], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white flex flex-col items-center space-y-4"
      >
        <div className="text-[10px] font-black uppercase tracking-[0.4em] rotate-180 [writing-mode:vertical-lr]">SCROLL</div>
        <div className="w-[2px] h-16 bg-gradient-to-b from-white to-transparent"></div>
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.8 } 
    }
  };

  return (
    <section id="facilitati" ref={containerRef} className="relative overflow-hidden">
      {/* Top Transition with PERA */}
      <div className="bg-vibrant-indigo py-14 overflow-hidden border-b border-white/10">
        <motion.div 
          style={{ x: xPera }}
          className="whitespace-nowrap"
        >
          <span className="text-[15vw] font-display font-black uppercase leading-none text-white opacity-20 tracking-tighter">PERA • PERA • PERA</span>
        </motion.div>
        <motion.div 
          style={{ x: xApartments }}
          className="whitespace-nowrap mt-4"
        >
          <span className="text-[10vw] font-display font-light italic uppercase leading-none text-white opacity-20 tracking-tighter ml-[10vw]">APARTMENTS • APARTMENTS</span>
        </motion.div>
      </div>

      {/* Main Facilities Content */}
      <div className="bg-[#0a0a0a] py-40 text-white relative z-10 overflow-hidden">
        {/* Decorative Floating Icon in Background */}
        <div className="absolute top-1/4 -right-20 opacity-5 pointer-events-none">
          <FloatingElement duration={15} yOffset={100}>
            <Trophy size={400} />
          </FloatingElement>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal3D>
            <div className="text-center mb-32">
              <span className="text-[10px] uppercase tracking-[1em] font-black text-white/40 mb-8 block">{t.motto}</span>
              <h2 className="text-5xl md:text-8xl font-display font-black text-white mb-10 leading-none tracking-tighter">
                <TextReveal text={t.facilities} />
              </h2>
              <div className="w-40 h-[1px] bg-white/20 mx-auto"></div>
            </div>
          </Reveal3D>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12"
          >
            {features.map((f, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants} 
                className="group relative"
              >
                <TiltCard className="h-full">
                  <GlowWrapper className="h-full">
                    <div className="h-full bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-sm transition-all duration-500 hover:bg-white hover:text-black hover:border-white shadow-[0_0_50px_rgba(255,255,255,0)] hover:shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                      <div className="mb-10 text-white group-hover:text-black transition-colors duration-500 transform group-hover:scale-110 group-hover:rotate-6 origin-left">
                        {f.icon}
                      </div>
                      <h3 className="text-xl font-display font-black mb-6 tracking-tight leading-none">{f.title}</h3>
                      <p className="text-sm text-white/40 group-hover:text-black/60 transition-colors duration-500 font-bold leading-relaxed">{f.desc}</p>
                      
                      <div className="absolute top-6 right-8 text-4xl font-display font-black text-white/5 group-hover:text-black/5 transition-colors duration-500">
                        0{i + 1}
                      </div>
                    </div>
                  </GlowWrapper>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ApartmentPreview = ({ t, lang }: { t: any, lang: string }) => {
  const apartments = [
    {
      name: t.apt1Name,
      image: "/54af473d-3cf2-40a4-9c03-d26751e4ff65-1.jpg",
      tags: t.apt1Tags
    },
    {
      name: t.apt2Name,
      image: "/740f0b90-e7ce-42f5-80fc-322333332540.jpg",
      tags: t.apt2Tags
    },
    {
      name: t.apt3Name,
      image: "/793bc1c7-9fda-4077-b1be-e098f0325f97.jpg",
      tags: t.apt3Tags
    },
    {
      name: t.apt4Name,
      image: "/60ec7951-8ef3-46b5-aa79-375b228417cc.jpg",
      tags: t.apt4Tags
    },
    {
      name: "PeraDuo",
      image: "/peraduo-2.jpg",
      tags: lang === 'ro' ? ["2 Persoane", "Rafinament", "Intimitate"] : ["2 People", "Refinement", "Intimacy"]
    },
    {
      name: "PeraConfort",
      image: "/peraconfort-7.jpg",
      tags: lang === 'ro' ? ["4 Persoane", "Spațios", "Confort Maxim"] : ["4 People", "Spacious", "Maximum Comfort"]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 40 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.8 }
    }
  };

  return (
    <section id="apartamente" className="py-40 bg-white relative overflow-hidden">
      {/* Decorative Text background */}
      <div className="absolute top-0 right-0 py-20 opacity-[0.06] select-none pointer-events-none">
        <FloatingElement duration={20} yOffset={20}>
          <div className="text-[25vw] font-display font-black leading-none tracking-tighter">PERA</div>
        </FloatingElement>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="flex flex-col md:flex-row justify-between items-end mb-24"
        >
          <div className="max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.5em] font-black text-neutral-600 mb-8 block">{t.aptsSub}</span>
            <h2 className="text-5xl md:text-8xl font-display font-black mb-10 leading-[0.9] text-neutral-900 tracking-tighter">
              <TextReveal text={t.aptsTitle} />
              <span className="italic font-light text-neutral-500 block">
                <TextReveal text={t.aptsTitleItalic} />
              </span>
            </h2>
            <p className="text-lg md:text-xl leading-relaxed text-neutral-800 font-bold border-l-4 border-neutral-200 pl-8 italic">
              {t.aptsDesc}
            </p>
          </div>
          <SmoothIn direction="up" delay={0.4}>
            <Magnetic>
              <Link 
                to="/apartamente" 
                className="mt-12 md:mt-0 text-[10px] font-black uppercase tracking-[0.3em] bg-black text-white px-10 py-5 rounded-full hover:bg-neutral-800 transition-all shadow-2xl flex items-center group"
              >
                {t.aptsBtnAll}
                <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform" size={18} />
              </Link>
            </Magnetic>
          </SmoothIn>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {apartments.map((apt, i) => (
            <Reveal3D key={i} className="h-full">
              <div className="group h-full">
                <TiltCard className="h-full">
                <GlowWrapper className="h-full">
                  <FloatingElement duration={4 + i} yOffset={8}>
                    <div className="bg-white rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-neutral-100 h-full flex flex-col">
                      <div className="aspect-[4/5] overflow-hidden relative group-hover:after:opacity-40 after:absolute after:inset-0 after:bg-black after:opacity-0 after:transition-opacity">
                        <motion.img 
                          whileHover={{ scale: 1.15, rotate: 2 }}
                          transition={{ duration: 1.2, ease: [0.2, 0.65, 0.3, 0.9] }}
                          src={apt.image} 
                          alt={apt.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-6 right-6 z-20">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 transform group-hover:scale-110 group-hover:rotate-12 transition-all">
                            <HomeIcon size={16} />
                          </div>
                        </div>
                      </div>
                      <div className="p-8 flex-grow flex flex-col">
                        <div className="flex flex-wrap gap-2 mb-6">
  {apt.tags.map((tag, j) => (
    <span key={j} className="text-[9px] font-black uppercase tracking-widest text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full group-hover:bg-black group-hover:text-white transition-all duration-500">
      {tag}
    </span>
  ))}
                        </div>
                        <h3 className="text-xl md:text-2xl font-display font-black mb-8 leading-tight tracking-tight text-neutral-900 group-hover:text-black transition-colors">{apt.name}</h3>
                        <div className="mt-auto pt-6 border-t border-neutral-50">
                          <Magnetic>
                            <Link 
                              to="/apartamente" 
                              className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-neutral-900 group-hover:text-black hover:tracking-[0.4em] transition-all"
                            >
                              {t.aptsBtnView}
                              <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={14} />
                            </Link>
                          </Magnetic>
                        </div>
                      </div>
                    </div>
                  </FloatingElement>
                </GlowWrapper>
                </TiltCard>
              </div>
            </Reveal3D>
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
    { name: "Cosmin (România)", text: "O locație foarte curată, îngrijit cu o liniște deosebită. Recomand cu încredere. Mulțumesc și Succes pe mai departe.", rating: 5 },
  ];

  const bookingLink = "https://www.booking.com/Share-vCX4Bz";

  return (
    <section className="py-40 bg-[#0a0a0a] text-white overflow-hidden relative">
      {/* Decorative Text background */}
      <div className="absolute top-0 right-0 w-full h-full opacity-10 select-none pointer-events-none flex items-center justify-center">
        <FloatingElement duration={25} yOffset={50}>
          <div className="text-[40vw] font-display font-black leading-none tracking-tighter">PERA</div>
        </FloatingElement>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal3D>
          <div className="text-center mb-32">
            <span className="text-[10px] uppercase tracking-[1em] font-black text-white/30 mb-8 block">{t.reviewsSub}</span>
            <h2 className="text-5xl md:text-8xl font-display font-black text-white mb-10 leading-none tracking-tighter">
              <TextReveal text={t.reviewsTitle} />
              <span className="italic font-light text-white/30 block mt-4">
                <TextReveal text={t.reviewsTitleItalic} />
              </span>
            </h2>
          </div>
        </Reveal3D>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-24">
          {reviews.map((r, i) => (
            <SmoothIn key={i} direction="up" delay={i * 0.2}>
              <NanoBanana>
                <TiltCard className="h-full">
                  <GlowWrapper className="h-full">
                    <div className="h-full bg-white/5 border border-white/10 p-12 rounded-[2.5rem] backdrop-blur-md flex flex-col group hover:bg-vibrant-indigo hover:text-white transition-all duration-700 shadow-2xl">
                      <div className="flex justify-between items-center mb-10">
                        <div className="flex text-primary-accent transition-colors">
                          {[...Array(r.rating)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                        </div>
                        <div className="text-white/10 text-6xl font-display font-black group-hover:text-white/20 transition-colors leading-none">”</div>
                      </div>
                      <p className="text-lg font-bold italic mb-10 leading-relaxed flex-grow">"{r.text}"</p>
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-[1px] bg-white/30 group-hover:bg-white/50 transition-colors"></div>
                        <span className="text-xs uppercase tracking-[0.3em] font-black">— {r.name}</span>
                      </div>
                    </div>
                  </GlowWrapper>
                </TiltCard>
              </NanoBanana>
            </SmoothIn>
          ))}
        </div>

        <div className="text-center">
          <SmoothIn direction="up" delay={0.6}>
            <Magnetic>
              <a 
                href={bookingLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-10 py-5 bg-white text-black rounded-full text-xs font-black uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-2xl group"
              >
                {t.reviewsBtnAll}
                <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform" size={16} />
              </a>
            </Magnetic>
          </SmoothIn>
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
    <section id="faq" className="py-40 bg-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-1/2 -left-20 opacity-[0.03] select-none pointer-events-none">
        <FloatingElement duration={15} yOffset={30}>
          <div className="text-[30vw] font-display font-black leading-none tracking-tighter">FAQ</div>
        </FloatingElement>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal3D>
          <div className="text-center mb-32">
            <span className="text-[10px] uppercase tracking-[1em] font-black text-neutral-500 mb-8 block">SUPORT</span>
            <h2 className="text-5xl md:text-8xl font-display font-black text-neutral-900 mb-10 leading-none tracking-tighter">
              <TextReveal text={t.faqTitle} />
            </h2>
            <p className="text-xl text-neutral-600 font-bold italic max-w-2xl mx-auto">
              {t.faqDesc}
            </p>
          </div>
        </Reveal3D>

        <div className="space-y-6">
          {items.map((item, i) => (
            <SmoothIn key={i} direction="up" delay={i * 0.1}>
              <NanoBanana>
                <TiltCard>
                  <GlowWrapper>
                    <div className="group bg-indigo-50/50 border border-neutral-100 p-10 rounded-[2.5rem] transition-all duration-500 hover:bg-vibrant-indigo hover:text-white shadow-xl hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]">
                      <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center space-x-6">
                          <span className="text-6xl font-display font-black text-vibrant-indigo opacity-20 group-hover:text-white/20 transition-colors leading-none tracking-tighter">0{i+1}</span>
                          <h3 className="text-xl md:text-2xl font-display font-black leading-tight tracking-tight">
                            <TextReveal text={item.q} />
                          </h3>
                        </div>
                        <div className="w-12 h-12 rounded-full border border-vibrant-indigo/20 group-hover:border-white/20 flex items-center justify-center transition-all group-hover:rotate-45">
                          <ArrowRight size={20} className="transform group-hover:-rotate-45 transition-transform" />
                        </div>
                      </div>
                      <p className="text-lg text-neutral-600 group-hover:text-white/60 leading-relaxed pl-[92px] font-bold border-l-2 border-vibrant-indigo group-hover:border-white/20 transition-all">{item.a}</p>
                    </div>
                  </GlowWrapper>
                </TiltCard>
              </NanoBanana>
            </SmoothIn>
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
    <section ref={containerRef} className="relative py-40 bg-[#0a0a0a] overflow-hidden">
      {/* Background Text Transition */}
      <div className="absolute top-0 left-0 w-full overflow-hidden pointer-events-none z-0">
        <motion.div 
          style={{ x: xText }}
          className="whitespace-nowrap"
        >
          <span className="text-[20vw] font-display font-black uppercase leading-none text-white opacity-[0.03] tracking-tighter">{t.tennisSub}</span>
        </motion.div>
      </div>

      {/* Floating Tennis Icons */}
      <div className="absolute top-1/4 right-1/4 opacity-10 pointer-events-none z-0">
        <FloatingElement duration={5} yOffset={20}>
          <Trophy size={100} className="text-white rotate-45" />
        </FloatingElement>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <SmoothIn direction="left">
            <div className="relative">
              <Reveal3D>
                <div className="bg-white/5 border border-white/10 p-16 rounded-[3rem] backdrop-blur-xl group hover:bg-white hover:text-black transition-all duration-700 shadow-2xl">
                  <span className="text-[10px] uppercase tracking-[1em] font-black text-white/30 group-hover:text-black/30 transition-colors mb-8 block">PRO SPORT</span>
                  <h2 className="text-5xl md:text-7xl font-display font-black mb-10 leading-none tracking-tighter">
                    <TextReveal text={t.tennisTitle} />
                    <span className="italic font-light text-white/20 group-hover:text-black/20 block">
                      <TextReveal text={t.tennisTitleItalic} />
                    </span>
                  </h2>
                  <p className="text-lg text-white/60 group-hover:text-black/60 font-bold leading-relaxed mb-12 italic">
                    {t.tennisDesc}
                  </p>
                  <ul className="space-y-6">
                    {[t.tennisItem1, t.tennisItem2, t.tennisItem3, t.tennisItem4].map((item, i) => (
                      <li key={i} className="flex items-center group/item">
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mr-6 group-hover:bg-black/5 transition-all">
                          <Check className="text-white group-hover:text-black" size={18} strokeWidth={4} />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal3D>
              
              {/* Badge */}
              <FloatingElement duration={3} yOffset={10}>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white text-black rounded-full flex flex-col items-center justify-center border-8 border-[#0a0a0a] z-20 transform -rotate-12 shadow-2xl scale-0 animate-[scaleIn_0.5s_ease-out_forwards] delay-1000">
                  <span className="text-4xl font-display font-black leading-none">FREE</span>
                  <span className="text-[8px] font-black tracking-widest uppercase">ACCESS</span>
                </div>
              </FloatingElement>
            </div>
          </SmoothIn>

          <div className="grid grid-cols-2 gap-8 relative items-start">
            <SmoothIn direction="up">
              <TiltCard>
                <GlowWrapper>
                  <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl">
                    <ParallaxImage 
                      src="/47c15380-62ba-479c-8720-c45112e0cc76.jpg" 
                      alt="Tennis Court" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </GlowWrapper>
              </TiltCard>
            </SmoothIn>
            <SmoothIn direction="up" delay={0.2} className="mt-20">
              <TiltCard>
                <GlowWrapper>
                  <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl">
                    <ParallaxImage 
                      src="/603bc507-195c-43f5-8de7-02d10220a4aa.jpg" 
                      alt="Tennis Action" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </GlowWrapper>
              </TiltCard>
            </SmoothIn>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0) rotate(-45deg); opacity: 0; }
          to { transform: scale(1) rotate(-12deg); opacity: 1; }
        }
      `}</style>
    </section>
  );
};

export default function Home({ lang }: { lang: 'ro' | 'en' }) {
  const t = homeTranslations[lang];
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImageIndex(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const socialImages = [
    "/54af473d-3cf2-40a4-9c03-d26751e4ff65-1.jpg",
    "/740f0b90-e7ce-42f5-80fc-322333332540.jpg",
    "/793bc1c7-9fda-4077-b1be-e098f0325f97.jpg",
    "/d6b549ee-a86d-4e0d-a3ec-2adc1a6ac383.jpg"
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white"
    >
      <Hero t={t} />
      <Features t={t} />
      <ApartmentPreview t={t} lang={lang} />
      <TennisCourt t={t} />
      
      {/* About Section */}
      <section className="py-40 bg-vibrant-emerald/10 overflow-hidden relative rounded-[4rem] my-40 mx-4 md:mx-12 border border-vibrant-emerald/20 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] select-none pointer-events-none flex items-center justify-center">
          <FloatingElement duration={30} yOffset={100}>
            <div className="text-[50vw] font-display font-black leading-none tracking-tighter text-vibrant-emerald">STORY</div>
          </FloatingElement>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-32 items-center">
            <SmoothIn direction="left">
              <NanoBanana>
                <div className="relative">
                  <TiltCard>
                    <GlowWrapper>
                      <div className="relative z-10 overflow-hidden rounded-[4rem] shadow-2xl aspect-[4/5] border-8 border-vibrant-emerald/10">
                        <ParallaxImage 
                          src="/1d745365-58af-4c7f-aee2-f80e2012d2e1.jpg" 
                          alt="Pera Apartments Story" 
                          className="w-full h-full"
                        />
                      </div>
                    </GlowWrapper>
                  </TiltCard>
                  <motion.div 
                    initial={{ scale: 0, rotate: -30, x: 50 }}
                    whileInView={{ scale: 1, rotate: -12, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.5 }}
                    className="absolute -bottom-12 -right-12 bg-vibrant-emerald text-white p-12 hidden lg:flex flex-col items-center justify-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] rounded-[3rem] z-20 border-8 border-white"
                  >
                    <span className="text-8xl font-display font-black leading-none mb-2">{t.storyBadgeNumber}</span>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-white/60 text-center max-w-[80px]">
                      {t.storyBadgeText}
                    </p>
                  </motion.div>
                </div>
              </NanoBanana>
            </SmoothIn>

            <div>
              <Reveal3D>
                <div className="mb-12">
                  <span className="text-[10px] uppercase tracking-[0.8em] font-black text-vibrant-emerald mb-8 block">{t.storySub}</span>
                  <h2 className="text-5xl md:text-8xl font-display font-black mb-12 leading-[0.9] tracking-tighter text-neutral-900">
                    <TextReveal text={t.storyTitle} />
                    <span className="italic font-light text-vibrant-emerald block my-2">
                      <TextReveal text={t.storyTitleItalic} />
                    </span>
                    <TextReveal text={t.storyTitleEnd} />
                  </h2>
                </div>
              </Reveal3D>
              
              <SmoothIn direction="up">
                <div className="space-y-8 text-xl leading-relaxed text-neutral-600 font-bold italic mb-16 border-l-4 border-vibrant-emerald/20 pl-10">
                  <p>{t.storyP1}</p>
                  <p>{t.storyP2}</p>
                </div>
              </SmoothIn>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-10">
                <SmoothIn direction="up" delay={0.4}>
                  <Magnetic>
                    <Link 
                      to="/apartamente"
                      className="inline-flex items-center px-12 py-6 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-neutral-800 transition-all rounded-full shadow-2xl group"
                    >
                      {t.storyBtnReserve}
                      <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform" size={16} />
                    </Link>
                  </Magnetic>
                </SmoothIn>
                <SmoothIn direction="up" delay={0.6}>
                  <Magnetic>
                    <Link to="/apartamente" className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.3em] group text-neutral-400 hover:text-black transition-colors">
                      {t.storyBtnApts}
                      <span className="ml-4 w-12 h-[1px] bg-neutral-200 group-hover:w-20 group-hover:bg-black transition-all"></span>
                    </Link>
                  </Magnetic>
                </SmoothIn>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Testimonials t={t} />
      <FAQ t={t} />

      {/* Social Feed */}
      <section className="py-40 bg-[#fcfaf7] overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal3D>
            <div className="text-center mb-10">
              <span className="text-[10px] uppercase tracking-[1em] font-black text-neutral-400 mb-8 block">{t.socialSub}</span>
              <h2 className="text-5xl md:text-8xl font-display font-black text-neutral-900 tracking-tighter">
                <TextReveal text={t.socialTitle} />
                <span className="italic font-light text-neutral-300 block mt-4">Instagram</span>
              </h2>
            </div>
          </Reveal3D>

          <VibrantGallery 
            images={socialImages}
            onImageClick={(index) => {
              setSelectedImageIndex(index);
            }}
          />
          
          <div className="mt-10 text-center">
            <SmoothIn direction="up">
              <Magnetic>
                <a 
                  href="https://www.instagram.com/pera.apartments" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.5em] group text-neutral-400 hover:text-black transition-all"
                >
                  FOLLOW @PERA.APARTMENTS
                  <ArrowRight className="ml-4 group-hover:translate-x-2 transition-transform" size={16} />
                </a>
              </Magnetic>
            </SmoothIn>
          </div>
        </div>

        {/* Lightbox for Social */}
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
                  src={socialImages[selectedImageIndex]} 
                  className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10"
                  referrerPolicy="no-referrer"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </motion.div>
  );
}
