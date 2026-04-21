import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageSquare, 
  Instagram, 
  Facebook, 
  Linkedin,
  Clock,
  ChevronRight,
  Globe,
  X
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { collection, addDoc, serverTimestamp, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';
import { AuthModal } from '../components/AuthModal';
import { Apartment } from '../types';
import { 
  TextReveal, 
  Magnetic, 
  GlowWrapper, 
  AnimatedSection, 
  TiltCard, 
  Reveal3D, 
  SmoothIn, 
  FloatingElement,
  NanoBanana
} from '../components/AnimatedComponents';

const contactTranslations = {
  ro: {
    tag: "Get in touch",
    title: "Suntem aici să te ajutăm.",
    description: "Ai întrebări despre apartamentele noastre sau vrei să faci o rezervare directă? Echipa noastră este disponibilă pentru a-ți oferi toate informațiile necesare.",
    email: "Email Direct",
    phone: "Telefon Rezervări",
    location: "Unde ne găsești",
    locationValue: "Strada Gherasim Popa 1-3, Cristian, Brașov",
    tabs: {
      message: "Scrie-ne un mesaj"
    },
    form: {
      nameLabel: "Numele Tău",
      namePlaceholder: "Cum te numiți?",
      emailLabel: "Adresa de Email",
      emailPlaceholder: "Unde te putem contacta?",
      subjectLabel: "Subiectul Mesajului",
      subjectPlaceholder: "Despre ce vrei să vorbim?",
      messageLabel: "Mesajul Tău",
      messagePlaceholder: "Povestește-ne mai multe...",
      submit: "Trimite Acum",
      submitting: "Se trimite..."
    },
    success: "Mesajul a fost trimis cu succes! Te vom contacta în curând.",
    error: "A apărut o eroare. Te rugăm să încerci din nou."
  },
  en: {
    tag: "Get in touch",
    title: "We're here to help you.",
    description: "Do you have questions about our apartments or want to make a direct booking? Our team is available to provide all the necessary information.",
    email: "Direct Email",
    phone: "Booking Hotline",
    location: "Find Us",
    locationValue: "Gherasim Popa Street 1-3, Cristian, Brașov",
    tabs: {
      message: "Send us a message"
    },
    form: {
      nameLabel: "Your Name",
      namePlaceholder: "What's your name?",
      emailLabel: "Email Address",
      emailPlaceholder: "Where can we reach you?",
      subjectLabel: "Subject",
      subjectPlaceholder: "What's on your mind?",
      messageLabel: "Your Message",
      messagePlaceholder: "Tell us more...",
      submit: "Send Now",
      submitting: "Sending..."
    },
    success: "Message sent successfully! We will contact you soon.",
    error: "An error occurred. Please try again."
  }
};

export default function Contact({ lang = 'ro' }: { lang?: string }) {
  const t = contactTranslations[lang as keyof typeof contactTranslations];
  const { user } = useAuth();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'apartments'), (snapshot) => {
      const apts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Apartment));
      setApartments(apts);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('https://formspree.io/f/mgopopzv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      await addDoc(collection(db, 'messages'), {
        ...formData,
        createdAt: serverTimestamp()
      });

      toast.success(t.success);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-40 pb-40 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal3D>
          <div className="bg-vibrant-indigo rounded-[4rem] p-12 md:p-24 lg:p-32 text-white shadow-[0_100px_150px_-50px_rgba(79,70,229,0.5)] relative overflow-hidden group">
            {/* Immersive Background Decor */}
            <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-white opacity-[0.05] rounded-full blur-[150px] -mr-[30vw] -mt-[30vw] transition-transform duration-1000 group-hover:scale-110"></div>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <FloatingElement duration={15} yOffset={50}>
                <div className="text-[30vw] font-display font-black leading-none tracking-tighter text-white">HI.</div>
              </FloatingElement>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-32 xl:gap-40 items-center">
              {/* Cinematic Contact Details */}
              <div className="space-y-24">
                <SmoothIn direction="down">
                  <span className="text-[10px] uppercase tracking-[1.5em] font-black text-white/50 mb-8 block">{t.tag}</span>
                  <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-black mb-12 leading-[0.85] tracking-tighter text-white">
                    <TextReveal text={t.title.split('te ajutăm')[0]} />
                    <span className="italic font-light text-white block">
                      <TextReveal text={lang === 'ro' ? 'te ajutăm.' : 'help you.'} />
                    </span>
                  </h1>
                  <p className="text-xl md:text-2xl text-white/60 leading-relaxed font-bold italic border-l-4 border-white/10 pl-10 max-w-sm">
                    {t.description}
                  </p>
                </SmoothIn>

                <div className="space-y-16">
                  {[
                    { label: t.email, value: "contact.peraapartments@gmail.com", icon: <Mail size={24} /> },
                    { label: t.phone, value: "+40 724 072 041", icon: <Phone size={24} /> },
                    { label: t.location, value: t.locationValue, icon: <MapPin size={24} /> }
                  ].map((item, idx) => (
                    <SmoothIn key={idx} direction="up" delay={0.2 + idx * 0.1}>
                      <NanoBanana>
                        <div className="group/item cursor-pointer flex items-center gap-10">
                          <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center border border-white/5 group-hover/item:bg-vibrant-indigo group-hover/item:text-white transition-all duration-700 shadow-2xl">
                            {item.icon}
                          </div>
                          <div>
                            <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40 mb-2">{item.label}</h4>
                            <p className="text-xl md:text-3xl font-display font-black text-white group-hover/item:text-vibrant-indigo group-hover/item:translate-x-4 transition-all duration-700 tracking-tight">{item.value}</p>
                          </div>
                        </div>
                      </NanoBanana>
                    </SmoothIn>
                  ))}
                </div>

                <div className="flex space-x-12 pt-12 border-t border-white/10">
                  <Magnetic>
                    <a href="https://www.instagram.com/pera.apartments" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 text-[10px] font-black uppercase tracking-[0.5em] text-white/50 hover:text-white transition-all group">
                      <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                        <Instagram size={16} />
                      </div>
                      <span>INSTAGRAM</span>
                    </a>
                  </Magnetic>
                  <Magnetic>
                    <a href="https://www.facebook.com/profile.php?id=61579446541292#" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 text-[10px] font-black uppercase tracking-[0.5em] text-white/50 hover:text-white transition-all group">
                      <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                        <Facebook size={16} />
                      </div>
                      <span>FACEBOOK</span>
                    </a>
                  </Magnetic>
                </div>
              </div>

              {/* Advanced Interactive Form */}
              <div className="relative">
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>
                <SmoothIn direction="right" delay={0.4}>
                  <TiltCard>
                    <GlowWrapper>
                      <div className="bg-white p-12 md:p-16 lg:p-20 rounded-[4rem] text-black shadow-2xl relative border-8 border-neutral-100">
                        <h3 className="text-2xl font-display font-black uppercase tracking-tight mb-12 flex items-center gap-6">
                           <div className="w-12 h-1 px bg-black"></div>
                           {t.tabs.message}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-12">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4 group">
                              <label className="text-[10px] uppercase tracking-[0.3em] font-black text-neutral-300 group-focus-within:text-black transition-colors">{t.form.nameLabel}</label>
                              <input 
                                type="text" 
                                required
                                className="w-full bg-neutral-50 border-none px-10 py-6 rounded-[2rem] text-sm focus:ring-4 focus:ring-black/5 outline-none transition-all placeholder:text-neutral-200 font-bold"
                                placeholder={t.form.namePlaceholder}
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                              />
                            </div>
                            <div className="space-y-4 group">
                              <label className="text-[10px] uppercase tracking-[0.3em] font-black text-neutral-300 group-focus-within:text-black transition-colors">{t.form.emailLabel}</label>
                              <input 
                                type="email" 
                                required
                                className="w-full bg-neutral-50 border-none px-10 py-6 rounded-[2rem] text-sm focus:ring-4 focus:ring-black/5 outline-none transition-all placeholder:text-neutral-200 font-bold"
                                placeholder={t.form.emailPlaceholder}
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-4 group">
                            <label className="text-[10px] uppercase tracking-[0.3em] font-black text-neutral-300 group-focus-within:text-black transition-colors">{t.form.subjectLabel}</label>
                            <input 
                              type="text" 
                              required
                              className="w-full bg-neutral-50 border-none px-10 py-6 rounded-[2rem] text-sm focus:ring-4 focus:ring-black/5 outline-none transition-all placeholder:text-neutral-200 font-bold"
                              placeholder={t.form.subjectPlaceholder}
                              value={formData.subject}
                              onChange={(e) => setFormData({...formData, subject: e.target.value})}
                            />
                          </div>
                          
                          <div className="space-y-4 group">
                            <label className="text-[10px] uppercase tracking-[0.3em] font-black text-neutral-300 group-focus-within:text-black transition-colors">{t.form.messageLabel}</label>
                            <textarea 
                              rows={5}
                              required
                              className="w-full bg-neutral-50 border-none px-10 py-6 rounded-[2rem] text-sm focus:ring-4 focus:ring-black/5 outline-none resize-none transition-all placeholder:text-neutral-200 font-bold"
                              placeholder={t.form.messagePlaceholder}
                              value={formData.message}
                              onChange={(e) => setFormData({...formData, message: e.target.value})}
                            ></textarea>
                          </div>
                          
                  <Magnetic>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-vibrant-indigo text-white py-10 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-[11px] hover:bg-neutral-800 transition-all flex items-center justify-center space-x-6 disabled:opacity-50 shadow-2xl relative overflow-hidden group/btn"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                      <span>{isSubmitting ? t.form.submitting : t.form.submit}</span>
                      {!isSubmitting && <Send size={20} className="text-primary-accent" />}
                    </button>
                  </Magnetic>
                        </form>
                      </div>
                    </GlowWrapper>
                  </TiltCard>
                </SmoothIn>
              </div>
            </div>
          </div>
        </Reveal3D>

        {/* Cinematic Map Section */}
        <section className="mt-40 relative group">
          <SmoothIn direction="up">
            <div className="mb-20 text-center">
              <span className="text-[10px] uppercase tracking-[1.5em] font-black text-neutral-300 mb-8 block">LOCATION</span>
              <h2 className="text-6xl md:text-8xl font-display font-black leading-none tracking-tighter">
                <TextReveal text="Cristian, Romania." />
              </h2>
            </div>
            
            <TiltCard>
              <div className="w-full aspect-[21/9] min-h-[500px] rounded-[4rem] overflow-hidden shadow-[0_100px_150px_-50px_rgba(0,0,0,0.2)] border-8 border-neutral-50 relative">
                <iframe 
                  src="https://maps.google.com/maps?q=Pera%20Apartments%20Gherasim%20Popa%201-3%20Cristian%20Brasov&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                  className="w-full h-full border-none grayscale contrast-[1.1] brightness-[0.95] hover:grayscale-0 hover:brightness-100 transition-all duration-1000"
                  allowFullScreen
                  loading="lazy"
                ></iframe>
                
                {/* Floating Map Label */}
                <div className="absolute bottom-16 left-16 z-20">
                  <FloatingElement duration={3}>
                    <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-neutral-100">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center">
                          <MapPin size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-1">COORDINATES</p>
                          <p className="text-lg font-display font-black uppercase tracking-tight">45.6247° N, 25.4851° E</p>
                        </div>
                      </div>
                    </div>
                  </FloatingElement>
                </div>
              </div>
            </TiltCard>
          </SmoothIn>
        </section>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
