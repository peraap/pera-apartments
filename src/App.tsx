import { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation 
} from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { motion, AnimatePresence } from 'motion/react';
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
import Home from './pages/Home';
import Apartments from './pages/Apartments';
import ApartmentDetail from './pages/ApartmentDetail';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Legal from './pages/Legal';
import Auth from './pages/Auth';

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
    <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/70 backdrop-blur-xl shadow-sm py-3' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center group">
            <span className={`text-2xl font-display font-bold tracking-tighter transition-colors duration-500 ${scrolled ? 'text-black' : 'text-white'}`}>
              PERA <span className={`font-light italic transition-colors duration-500 ${scrolled ? 'text-neutral-500' : 'text-white/70'}`}>Apartments</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-10">
            <Link 
              to="/"
              className={`text-[15px] font-semibold tracking-tight transition-all duration-500 hover:opacity-50 relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-current after:transition-all hover:after:w-full ${scrolled ? 'text-black' : 'text-white'}`}
            >
              {t.home}
            </Link>

            {/* Info Dropdown */}
            <div className="relative group/info" onMouseEnter={() => setIsInfoOpen(true)} onMouseLeave={() => setIsInfoOpen(false)}>
              <button className={`flex items-center text-[15px] font-semibold tracking-tight transition-all duration-500 hover:opacity-50 ${scrolled ? 'text-black' : 'text-white'}`}>
                {t.info}
                <ChevronDown size={14} className={`ml-1 transition-transform duration-300 ${isInfoOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isInfoOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-white shadow-2xl rounded-xl overflow-hidden py-2"
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

            <Link 
              to="/contact"
              className={`text-[15px] font-semibold tracking-tight transition-all duration-500 hover:opacity-50 relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-current after:transition-all hover:after:w-full ${scrolled ? 'text-black' : 'text-white'}`}
            >
              {t.contact}
            </Link>

            {/* User Profile / Auth */}
            <div className="relative group/user" onMouseEnter={() => setIsUserOpen(true)} onMouseLeave={() => setIsUserOpen(false)}>
              {user ? (
                <div className="flex items-center space-x-3 cursor-pointer">
                  <div className="text-right hidden lg:block">
                    <p className={`text-xs font-bold tracking-tight ${scrolled ? 'text-black' : 'text-white'}`}>
                      {profile?.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] font-bold text-yellow-500 tracking-tight">
                      {profile?.points || 0} PTS
                    </p>
                  </div>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all duration-500 ${scrolled ? 'border-black' : 'border-white/30'}`}>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className={scrolled ? 'text-black' : 'text-white'} />
                    )}
                  </div>
                </div>
              ) : (
                <Link 
                  to="/login"
                  className={`flex items-center space-x-2 text-[15px] font-semibold tracking-tight transition-all duration-500 hover:opacity-50 ${scrolled ? 'text-black' : 'text-white'}`}
                >
                  <User size={16} />
                  <span>Login</span>
                </Link>
              )}

              <AnimatePresence>
                {isUserOpen && user && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-white shadow-2xl rounded-2xl overflow-hidden py-2 border border-neutral-100"
                  >
                    <div className="px-6 py-4 border-b border-neutral-50 bg-neutral-50/50">
                      <p className="text-[10px] font-bold tracking-tight text-neutral-400 mb-1">Puncte Loialitate</p>
                      <p className="text-lg font-black text-black">{profile?.points || 0} <span className="text-[10px] text-yellow-600">PTS</span></p>
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

            {/* Language Selector */}
            <div className="flex items-center space-x-2 border-l border-white/20 pl-6 ml-6">
              <button 
                onClick={() => setLang('ro')}
                className={`text-xs font-bold transition-all ${lang === 'ro' ? (scrolled ? 'text-black' : 'text-white') : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                RO
              </button>
              <span className="text-neutral-500 text-xs">/</span>
              <button 
                onClick={() => setLang('en')}
                className={`text-xs font-bold transition-all ${lang === 'en' ? (scrolled ? 'text-black' : 'text-white') : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                EN
              </button>
            </div>

            <a 
              href={bookingLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-8 py-3 rounded-full text-sm font-bold tracking-tight transition-all duration-500 ${scrolled ? 'bg-black text-white hover:bg-neutral-800 shadow-lg shadow-black/10' : 'bg-white text-black hover:bg-neutral-100'}`}
            >
              {t.reserve}
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <button 
              onClick={() => setLang(lang === 'ro' ? 'en' : 'ro')}
              className={`text-xs font-bold tracking-tight ${scrolled ? 'text-black' : 'text-white'}`}
            >
              {lang === 'ro' ? 'EN' : 'RO'}
            </button>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className={scrolled ? 'text-black' : 'text-white'}
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
            className="md:hidden bg-white absolute top-full left-0 w-full shadow-xl py-8 px-4"
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
              <a 
                href={bookingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center bg-black text-white py-4 rounded-full font-bold tracking-tight"
              >
                {t.reserve}
              </a>
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
    <footer className="bg-neutral-900 text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <span className="text-2xl font-display font-bold tracking-tighter mb-6 block text-white">
              PERA <span className="font-light italic text-white/60">Apartments</span>
            </span>
            <p className="text-white/90 text-xs leading-relaxed mb-6 font-bold">
              {t.footerDesc}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-tight mb-6 text-white">{t.navigation}</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/" className="text-white hover:text-white/80">{t.home}</Link></li>
              <li><Link to="/apartamente" className="text-white hover:text-white/80">{t.apartments}</Link></li>
              <li><Link to="/contact" className="text-white hover:text-white/80">{t.contact}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-tight mb-6 text-white">{t.contact}</h4>
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-black text-neutral-500">Email</p>
                <div className="flex items-center space-x-3 text-white">
                  <Mail size={18} className="text-white" />
                  <span className="text-sm">contact.peraapartments@gmail.com</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-black text-neutral-500">Telefon</p>
                <div className="flex items-center space-x-3 text-white">
                  <Phone size={18} className="text-white" />
                  <span className="text-sm">+40 724 072 041</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-black text-neutral-500">Locație</p>
                <div className="flex items-center space-x-3 text-white">
                  <MapPin size={18} className="text-white" />
                  <span className="text-sm">{t.locationValue}</span>
                </div>
              </div>

              <div className="flex space-x-6 pt-4">
                <a href="https://www.instagram.com/pera.apartments" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 transition-colors">
                  <Instagram size={18} />
                </a>
                <a href="https://www.facebook.com/profile.php?id=61579446541292#" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 transition-colors">
                  <Facebook size={18} />
                </a>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-tight mb-6 text-white">{t.newsletter}</h4>
            <p className="text-xs text-white/90 mb-4 font-bold">{t.newsletterDesc}</p>
            <form onSubmit={handleNewsletterSubmit} className="flex">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder} 
                className="bg-neutral-800 border-none px-4 py-2 text-sm w-full focus:ring-1 focus:ring-white outline-none"
              />
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {isSubmitting ? '...' : t.subscribeBtn}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs uppercase tracking-widest text-white/50">
          <p>© 2026 Pera Apartments. {t.rights}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/legal/privacy" className="hover:text-white">{t.privacy}</Link>
            <Link to="/legal/terms" className="hover:text-white">{t.terms}</Link>
            <Link to="/admin" className="flex items-center space-x-1 hover:text-white">
              <LayoutDashboard size={10} />
              <span>{t.admin}</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const [lang, setLang] = useState<'ro' | 'en'>('ro');

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col font-sans bg-white text-black">
          <Navbar lang={lang} setLang={setLang} />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home lang={lang} />} />
              <Route path="/apartamente" element={<Apartments lang={lang} />} />
              <Route path="/apartamente/:slug" element={<ApartmentDetail lang={lang} />} />
              <Route path="/contact" element={<Contact lang={lang} />} />
              <Route path="/login" element={<Auth lang={lang} />} />
              <Route path="/admin/*" element={<Admin />} />
              <Route path="/legal/:type" element={<Legal lang={lang} />} />
            </Routes>
          </main>
          <Footer lang={lang} />
          <Toaster position="top-center" />
        </div>
      </Router>
    </AuthProvider>
  );
}
