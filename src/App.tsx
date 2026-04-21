import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation 
} from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { motion, AnimatePresence, useScroll, useSpring, useMotionValue } from 'motion/react';
import { 
  Menu, 
  X, 
  Instagram, 
  Facebook, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  User,
  LayoutDashboard,
  ChevronDown,
  Globe
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { AuthProvider, useAuth } from './AuthContext';
import { AuthModal } from './components/AuthModal';
import { Magnetic, GlowWrapper, Reveal3D, FloatingElement, SmoothIn, TextReveal, SkewScroll } from './components/AnimatedComponents';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Apartments = lazy(() => import('./pages/Apartments'));
const ApartmentDetail = lazy(() => import('./pages/ApartmentDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const Admin = lazy(() => import('./pages/Admin'));
const Legal = lazy(() => import('./pages/Legal'));
const Auth = lazy(() => import('./pages/Auth'));
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'));
import { DiscountPopup } from './components/DiscountPopup';

const translations = {
  ro: {
    home: 'Acasă',
    apartments: 'Apartamente',
    guide: 'Ghidul Orașului',
    contact: 'Contact',
    info: 'Info',
    facilities: 'Facilități',
    location: 'Localizare',
    reserve: 'Rezervă Acum',
    footerDesc: 'Ospitalitate de lux în regim hotelier. Apartamente moderne, complet utilate, pentru o experiență de neuitat la poalele Postăvarului.',
    navigation: 'Navigare',
    newsletter: 'Newsletter',
    newsletterDesc: 'Abonează-te pentru oferte exclusive și noutăți.',
    rights: 'Toate drepturile rezervate.',
    privacy: 'Politica de Confidențialitate',
    terms: 'Termeni și Condiții',
    faq: 'Întrebări Frecvente',
    locationValue: 'Strada Gherasim Popa 1-3, Cristian, Brașov',
    emailPlaceholder: 'Email',
    subscribeBtn: 'OK',
    admin: 'Admin'
  },
  en: {
    home: 'Home',
    apartments: 'Apartments',
    guide: 'City Guide',
    contact: 'Contact',
    info: 'Info',
    facilities: 'Facilities',
    location: 'Location',
    reserve: 'Book Now',
    footerDesc: 'Luxury hospitality in hotel regime. Modern, fully equipped apartments for an unforgettable experience at the foot of Postăvaru.',
    navigation: 'Navigation',
    newsletter: 'Newsletter',
    newsletterDesc: 'Subscribe for exclusive offers and news.',
    rights: 'All rights reserved.',
    privacy: 'Privacy Policy',
    terms: 'Terms and Conditions',
    faq: 'FAQ',
    locationValue: 'Gherasim Popa Street 1-3, Cristian, Brașov',
    emailPlaceholder: 'Email',
    subscribeBtn: 'OK',
    admin: 'Admin'
  }
};

const Navbar = ({ lang, setLang }: { lang: 'ro' | 'en', setLang: (l: 'ro' | 'en') => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const t = translations[lang];
  const { user, profile, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHeaderSolid = scrolled || !['/', '/apartamente', '/contact'].includes(location.pathname);

  const navLinks = [
    { name: t.home, path: '/' },
    { name: t.contact, path: '/contact' },
  ];

  const infoLinks = [
    { name: t.apartments, path: '/apartamente' },
    { name: t.facilities, path: '/#facilitati' },
    { name: t.location, path: '/apartamente#localizare' },
    { name: t.faq, path: '/#faq' },
  ];

  const bookingLink = "https://www.booking.com/Share-QTimNJq";

  return (
    <nav className={`fixed w-full z-[150] transition-all duration-1000 ${isHeaderSolid ? 'bg-[#fcfaf7]/90 backdrop-blur-2xl shadow-xl py-3 border-b border-neutral-100' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center group">
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className={`text-2xl font-display font-bold tracking-tighter transition-colors duration-500 ${isHeaderSolid ? 'text-black' : 'text-white'}`}
            >
              PERA <span className={`font-light italic transition-colors duration-500 ${isHeaderSolid ? 'text-neutral-500' : 'text-white/70'}`}>Apartments</span>
            </motion.span>
          </Link>

          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link, i) => (
              <motion.div
                key={link.path}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Magnetic>
                  <Link 
                    to={link.path}
                    className={`text-[15px] font-semibold tracking-tight transition-all duration-500 hover:opacity-50 relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-current after:transition-all hover:after:w-full ${isHeaderSolid ? 'text-black' : 'text-white'}`}
                  >
                    {link.name}
                  </Link>
                </Magnetic>
              </motion.div>
            ))}

            {/* Info Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="relative group/info" onMouseEnter={() => setIsInfoOpen(true)} onMouseLeave={() => setIsInfoOpen(false)}>
                <button className={`flex items-center text-[15px] font-semibold tracking-tight transition-all duration-500 hover:opacity-50 ${isHeaderSolid ? 'text-black' : 'text-white'}`}>
                  {t.info}
                  <ChevronDown size={14} className={`ml-1 transition-transform duration-300 ${isInfoOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isInfoOpen && (
                    <motion.div 
                      initial={{ opacity: 0, rotateX: -15, y: 10, transformOrigin: "top" }}
                      animate={{ opacity: 1, rotateX: 0, y: 0 }}
                      exit={{ opacity: 0, rotateX: -15, y: 10 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-[#fcfaf7] shadow-2xl rounded-xl overflow-hidden py-2 border border-neutral-100"
                    >
                      {infoLinks.map((link) => (
                        <HashLink 
                          key={link.path}
                          to={link.path}
                          className="block px-6 py-3 text-xs font-semibold tracking-tight text-black hover:bg-neutral-50 transition-colors"
                        >
                          {link.name}
                        </HashLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* User Profile / Auth */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="relative group/user" onMouseEnter={() => setIsUserOpen(true)} onMouseLeave={() => setIsUserOpen(false)}>
                {user ? (
                  <div className="flex items-center space-x-3 cursor-pointer">
                    <div className="text-right hidden lg:block">
                      <p className={`text-xs font-bold tracking-tight ${isHeaderSolid ? 'text-black' : 'text-white'}`}>
                        {profile?.displayName || user.email?.split('@')[0]}
                      </p>
                      <p className="text-base font-black text-yellow-500 tracking-tight">
                        {profile?.points || 0} <span className="text-[10px] uppercase">pts</span>
                      </p>
                    </div>
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all duration-500 shadow-xl ${isHeaderSolid ? 'border-black' : 'border-white/30'}`}
                    >
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={18} className={isHeaderSolid ? 'text-black' : 'text-white'} />
                      )}
                    </motion.div>
                  </div>
                ) : (
                  <Link 
                    to="/login"
                    className={`flex items-center space-x-2 text-[15px] font-semibold tracking-tight transition-all duration-500 hover:opacity-50 ${isHeaderSolid ? 'text-black' : 'text-white'}`}
                  >
                    <User size={16} />
                    <span>Login</span>
                  </Link>
                )}

                <AnimatePresence>
                  {isUserOpen && user && (
                    <motion.div 
                      initial={{ opacity: 0, rotateX: 15, y: 10, transformOrigin: "top" }}
                      animate={{ opacity: 1, rotateX: 0, y: 0 }}
                      exit={{ opacity: 0, rotateX: 15, y: 10 }}
                      className="absolute top-full right-0 mt-2 w-56 bg-[#fcfaf7] shadow-2xl rounded-2xl overflow-hidden py-2 border border-neutral-100"
                    >
                      <div className="px-6 py-4 border-b border-neutral-50 bg-neutral-50/50">
                        <p className="text-[10px] font-bold tracking-tight text-neutral-400 mb-1">Puncte Loialitate</p>
                        <p className="text-xl font-black text-black">{profile?.points || 0} <span className="text-[10px] text-yellow-600">PTS</span></p>
                      </div>
                      {profile?.role === 'admin' && (
                        <Link 
                          to="/admin"
                          className="flex items-center space-x-3 px-6 py-3 text-xs font-semibold tracking-tight text-black hover:bg-neutral-50 transition-colors"
                        >
                          <LayoutDashboard size={14} />
                          <span>{t.admin}</span>
                        </Link>
                      )}
                      <button 
                        onClick={() => logout()}
                        className="w-full flex items-center space-x-3 px-6 py-3 text-xs font-semibold tracking-tight text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <X size={14} />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Language Selector */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center space-x-2 border-l border-white/20 pl-6 ml-6">
                <button 
                  onClick={() => setLang('ro')}
                  className={`text-xs font-black transition-all ${lang === 'ro' ? (isHeaderSolid ? 'text-black' : 'text-white') : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  RO
                </button>
                <span className="text-neutral-500 text-xs">/</span>
                <button 
                  onClick={() => setLang('en')}
                  className={`text-xs font-black transition-all ${lang === 'en' ? (isHeaderSolid ? 'text-black' : 'text-white') : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  EN
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Magnetic>
                <Link 
                  to="/apartamente"
                  className={`px-10 py-4 rounded-full text-sm font-black uppercase tracking-widest transition-all duration-500 ${isHeaderSolid ? 'bg-black text-white hover:bg-neutral-800 shadow-2xl shadow-black/20' : 'bg-white text-black hover:bg-neutral-100'}`}
                >
                  {t.reserve}
                </Link>
              </Magnetic>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <button 
              onClick={() => setLang(lang === 'ro' ? 'en' : 'ro')}
              className={`text-xs font-bold tracking-tight ${isHeaderSolid ? 'text-black' : 'text-white'}`}
            >
              {lang === 'ro' ? 'EN' : 'RO'}
            </button>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className={isHeaderSolid ? 'text-black' : 'text-white'}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-[#fcfaf7] absolute top-full left-0 w-full shadow-xl py-8 px-4 border-b border-neutral-100"
          >
            <div className="flex flex-col space-y-6 items-center">
              <Link 
                to="/"
                onClick={() => setIsOpen(false)}
                className="text-lg font-semibold text-black tracking-tight"
              >
                {t.home}
              </Link>
              <div className="w-full border-t border-neutral-100 pt-6 flex flex-col items-center space-y-4">
                <span className="text-xs tracking-tight text-neutral-400 font-bold">{t.info}</span>
                {infoLinks.map((link) => (
                  <HashLink 
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-semibold text-black tracking-tight"
                  >
                    {link.name}
                  </HashLink>
                ))}
              </div>
              <Link 
                to="/contact"
                onClick={() => setIsOpen(false)}
                className="text-lg font-semibold text-black tracking-tight"
              >
                {t.contact}
              </Link>
              {!user && (
                <Link 
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-semibold text-black tracking-tight"
                >
                  Login
                </Link>
              )}
              <Link 
                to="/apartamente"
                onClick={() => setIsOpen(false)}
                className="w-full text-center bg-black text-white py-4 rounded-full font-bold tracking-tight"
              >
                {t.reserve}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </nav>
  );
};

const Footer = ({ lang }: { lang: 'ro' | 'en' }) => {
  const t = translations[lang];
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('https://formspree.io/f/mgopopzv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, type: 'Newsletter Subscription' })
      });
      if (response.ok) {
        toast.success(lang === 'ro' ? 'Te-ai abonat cu succes!' : 'Subscribed successfully!');
        setEmail('');
      } else {
        throw new Error('Formspree submission failed');
      }
    } catch (error) {
      console.error('Newsletter error:', error);
      toast.error(lang === 'ro' ? 'A apărut o eroare.' : 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#0a0a0a] text-white pt-40 pb-16 relative overflow-hidden border-t border-white/5">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-accent/10 blur-[150px] rounded-full pointer-events-none"></div>
      {/* Decorative Floating Elements */}
      <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
        <FloatingElement duration={10} yOffset={50}>
          <div className="text-[20rem] font-black leading-none select-none tracking-tighter">PERA</div>
        </FloatingElement>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-8 mb-24">
          <Reveal3D>
            <div>
              <Link to="/" className="inline-block mb-10 group">
                <span className="text-3xl font-display font-black tracking-tighter transition-all group-hover:tracking-widest duration-700">
                  PERA <span className="font-light italic text-white/60">Apartments</span>
                </span>
              </Link>
              <p className="text-white/60 text-sm leading-relaxed mb-10 max-w-xs font-bold italic">
                {t.footerDesc}
              </p>
              <div className="flex space-x-6">
                {[
                  { icon: <Instagram size={20} />, link: "https://www.instagram.com/pera.apartments" },
                  { icon: <Facebook size={20} />, link: "https://www.facebook.com/profile.php?id=61579446541292#" }
                ].map((social, i) => (
                  <Magnetic key={i}>
                    <a 
                      href={social.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500 border border-white/10"
                    >
                      {social.icon}
                    </a>
                  </Magnetic>
                ))}
              </div>
            </div>
          </Reveal3D>

          <Reveal3D>
            <div>
              <h4 className="text-xs uppercase tracking-[0.4em] font-black mb-10 text-white/30">{t.navigation}</h4>
              <ul className="space-y-4">
                <li><Link to="/" className="text-sm font-bold text-white/60 hover:text-white transition-colors duration-300 flex items-center group"><span className="w-0 group-hover:w-4 h-[1px] bg-white mr-0 group-hover:mr-3 transition-all duration-500 overflow-hidden"></span>{t.home}</Link></li>
                <li><Link to="/apartamente" className="text-sm font-bold text-white/60 hover:text-white transition-colors duration-300 flex items-center group"><span className="w-0 group-hover:w-4 h-[1px] bg-white mr-0 group-hover:mr-3 transition-all duration-500 overflow-hidden"></span>{t.apartments}</Link></li>
                <li><Link to="/contact" className="text-sm font-bold text-white/60 hover:text-white transition-colors duration-300 flex items-center group"><span className="w-0 group-hover:w-4 h-[1px] bg-white mr-0 group-hover:mr-3 transition-all duration-500 overflow-hidden"></span>{t.contact}</Link></li>
              </ul>
            </div>
          </Reveal3D>

          <Reveal3D>
            <div>
              <h4 className="text-xs uppercase tracking-[0.4em] font-black mb-10 text-white/30">{t.contact}</h4>
              <div className="space-y-6">
                <div className="flex items-start space-x-4 group cursor-pointer">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white group-hover:text-black transition-all">
                    <Mail size={18} />
                  </div>
                  <p className="text-sm text-white/60 font-bold leading-relaxed group-hover:text-white transition-colors break-all">contact.peraapartments@gmail.com</p>
                </div>
                <div className="flex items-center space-x-4 group cursor-pointer">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white group-hover:text-black transition-all">
                    <Phone size={18} />
                  </div>
                  <p className="text-sm text-white/70 font-black group-hover:text-white transition-colors">+40 724 072 041</p>
                </div>
                <div className="flex items-center space-x-4 group cursor-pointer">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white group-hover:text-black transition-all">
                    <MapPin size={18} />
                  </div>
                  <p className="text-sm text-white/60 font-bold group-hover:text-white transition-colors leading-relaxed">{t.locationValue}</p>
                </div>
              </div>
            </div>
          </Reveal3D>

          <Reveal3D>
            <div>
              <h4 className="text-xs uppercase tracking-[0.4em] font-black mb-10 text-white/30">{t.newsletter}</h4>
              <p className="text-sm text-white/60 mb-8 font-bold leading-relaxed">{t.newsletterDesc}</p>
              <GlowWrapper>
                <form onSubmit={handleNewsletterSubmit} className="flex space-x-2">
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder} 
                    className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary-accent outline-none transition-all placeholder:text-white/20 font-bold"
                  />
                  <Magnetic>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-primary-accent text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl"
                    >
                      {isSubmitting ? '...' : t.subscribeBtn}
                    </button>
                  </Magnetic>
                </form>
              </GlowWrapper>
            </div>
          </Reveal3D>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
          <p>© 2026 PERA APARTMENTS. {t.rights}</p>
          <div className="flex space-y-10 mt-6 md:mt-0">
            <Link to="/legal/privacy" className="hover:text-white transition-colors">{t.privacy}</Link>
            <Link to="/legal/terms" className="hover:text-white transition-colors">{t.terms}</Link>
            <Link to="/admin" className="flex items-center space-x-2 hover:text-white transition-colors">
              <LayoutDashboard size={10} />
              <span>{t.admin}</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const GlowCursor = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovering, setIsHovering] = useState(false);

  const springConfig = { damping: 25, stiffness: 150 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target as HTMLElement;
      const isInteractable = target.closest('a, button, [role="button"], .cursor-pointer');
      setIsHovering(!!isInteractable);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 bg-white rounded-full mix-blend-difference pointer-events-none z-[9999] hidden md:block"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isHovering ? 3 : 1,
          opacity: 1,
        }}
      />
      <motion.div
        className="fixed top-0 left-0 w-12 h-12 border border-white/20 rounded-full pointer-events-none z-[9998] hidden md:block"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          opacity: isHovering ? 0 : 0.5,
        }}
      />
    </>
  );
};

const SEO = ({ title, description, language }: { title?: string, description?: string, language: string }) => {
  const t = translations[language as 'ro' | 'en'];
  const baseTitle = "Pera Apartments";
  const fullTitle = title ? `${title} | ${baseTitle}` : `${baseTitle} | Luxury Cristian, Brașov`;
  const fullDescription = description || t.footerDesc;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content="/og-image.jpg" />
      <html lang={language} />
    </Helmet>
  );
};

const AppContent = ({ lang, setLang }: { lang: 'ro' | 'en', setLang: (l: 'ro' | 'en') => void }) => {
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#fcfaf7] text-black overflow-x-hidden">
      <SEO language={lang} />
      <GlowCursor />
      <Navbar lang={lang} setLang={setLang} />
      
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-black z-[200] origin-left"
        style={{ scaleX: useScroll().scrollYProgress }}
      />

      <main className="flex-grow">
        <SkewScroll>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7]">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-12 h-12 border-2 border-black border-t-transparent rounded-full"
              />
            </div>
          }>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
                transition={{ 
                  duration: 0.8, 
                  ease: [0.2, 0.65, 0.3, 0.9] 
                }}
              >
                <Routes location={location}>
                  <Route path="/" element={<Home lang={lang} />} />
                  <Route path="/apartamente" element={<Apartments lang={lang} />} />
                  <Route path="/apartamente/:slug" element={<ApartmentDetail lang={lang} />} />
                  <Route path="/contact" element={<Contact lang={lang} />} />
                  <Route path="/login" element={<Auth lang={lang} />} />
                  <Route path="/admin/*" element={<Admin />} />
                  <Route path="/legal/:type" element={<Legal lang={lang} />} />
                  <Route path="/booking-success" element={<BookingSuccess />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </SkewScroll>
      </main>
      <Footer lang={lang} />
      <DiscountPopup />
      <Toaster position="top-center" richColors />

      {/* Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[60] bg-black text-white p-4 rounded-full shadow-2xl hover:bg-neutral-800 transition-colors group"
          >
            <ChevronDown className="rotate-180 group-hover:-translate-y-1 transition-transform" size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState<'ro' | 'en'>('ro');

  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <AppContent lang={lang} setLang={setLang} />
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}
