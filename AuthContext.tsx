import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, Send, Instagram, Facebook, Calendar, Users, Award, LogIn } from 'lucide-react';
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';
import { AuthModal } from '../components/AuthModal';
import { Apartment } from '../types';

const contactTranslations = {
  ro: {
    tag: "Contact & Rezervări",
    title: "Suntem aici să te ajutăm.",
    description: "Ai întrebări despre apartamentele noastre sau vrei să faci o rezervare directă? Echipa noastră este disponibilă pentru a-ți oferi toate informațiile necesare.",
    email: "Email",
    phone: "Telefon",
    location: "Locație",
    locationValue: "Strada Gherasim Popa 1-3, Cristian, Brașov",
    tabs: {
      message: "Trimite Mesaj"
    },
    form: {
      nameLabel: "Nume Complet",
      namePlaceholder: "Ex: Ion Popescu",
      emailLabel: "Email",
      emailPlaceholder: "Ex: ion@exemplu.ro",
      subjectLabel: "Subiect",
      subjectPlaceholder: "Cum te putem ajuta?",
      messageLabel: "Mesaj",
      messagePlaceholder: "Scrie mesajul tău aici...",
      submit: "Trimite Mesajul",
      submitting: "Se trimite..."
    },
    success: "Mesajul a fost trimis cu succes! Te vom contacta în curând.",
    error: "A apărut o eroare. Te rugăm să încerci din nou."
  },
  en: {
    tag: "Contact & Bookings",
    title: "We're here to help you.",
    description: "Do you have questions about our apartments or want to make a direct booking? Our team is available to provide all the necessary information.",
    email: "Email",
    phone: "Phone",
    location: "Location",
    locationValue: "Gherasim Popa Street 1-3, Cristian, Brașov",
    tabs: {
      message: "Send Message"
    },
    form: {
      nameLabel: "Full Name",
      namePlaceholder: "Ex: John Doe",
      emailLabel: "Email",
      emailPlaceholder: "Ex: john@example.com",
      subjectLabel: "Subject",
      subjectPlaceholder: "How can we help you?",
      messageLabel: "Message",
      messagePlaceholder: "Write your message here...",
      submit: "Send Message",
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
      // Submit to Formspree
      const response = await fetch('https://formspree.io/f/mgopopzv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Formspree submission failed');
      }

      // Also keep a record in Firestore
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
    <div className="pt-32 pb-24 bg-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-[3rem] p-8 md:p-16 lg:p-24 text-white shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Glow Effect */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-neutral-800 rounded-full blur-[120px] opacity-50"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-neutral-800 rounded-full blur-[120px] opacity-50"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20">
            {/* Contact Info */}
            <div>
              <span className="text-sm uppercase tracking-[0.5em] font-bold text-neutral-400 mb-6 block">{t.tag}</span>
              <h1 className="text-4xl md:text-6xl font-display font-black mb-8 leading-tight text-white">{t.title.split('te ajutăm')[0]} <span className="italic font-light text-neutral-400">{lang === 'ro' ? 'te ajutăm.' : 'help you.'}</span></h1>
              <p className="leading-relaxed mb-12 max-w-lg font-medium text-neutral-400">
                {t.description}
              </p>

              <div className="space-y-10 mb-12">
                <div className="space-y-2 group">
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-neutral-500 font-sans">{t.email}</h4>
                  <div className="flex items-center gap-3">
                    <Mail size={20} className="text-white" />
                    <p className="text-2xl font-black text-white">contact.peraapartments@gmail.com</p>
                  </div>
                </div>
                <div className="space-y-2 group">
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-neutral-500 font-sans">{t.phone}</h4>
                  <div className="flex items-center gap-3">
                    <Phone size={20} className="text-white" />
                    <p className="text-xl font-black text-white">+40 724 072 041</p>
                  </div>
                </div>
                <div className="space-y-2 group">
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-neutral-500 font-sans">{t.location}</h4>
                  <div className="flex items-center gap-3">
                    <MapPin size={20} className="text-white" />
                    <p className="text-xl font-black text-white">{t.locationValue}</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-8">
                <a href="https://www.instagram.com/pera.apartments" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">
                  <Instagram size={18} />
                  <span>Instagram</span>
                </a>
                <a href="https://www.facebook.com/profile.php?id=61579446541292#" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">
                  <Facebook size={18} />
                  <span>Facebook</span>
                </a>
              </div>
            </div>

            {/* Form Section */}
            <div className="bg-white/5 p-8 md:p-12 rounded-[2rem] border border-white/10 backdrop-blur-md">
              <div className="flex space-x-4 mb-10 p-1 bg-black/20 rounded-2xl">
                <div className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-white text-black shadow-lg text-center">
                  {t.tabs.message}
                </div>
              </div>

              <form 
                onSubmit={handleSubmit} 
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest font-black text-neutral-500">{t.form.nameLabel}</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-sm focus:ring-1 focus:ring-white/30 outline-none transition-all text-white placeholder:text-neutral-700 font-bold"
                      placeholder={t.form.namePlaceholder}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest font-black text-neutral-500">{t.form.emailLabel}</label>
                    <input 
                      type="email" 
                      required
                      className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-sm focus:ring-1 focus:ring-white/30 outline-none transition-all text-white placeholder:text-neutral-700 font-bold"
                      placeholder={t.form.emailPlaceholder}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest font-black text-neutral-500">{t.form.subjectLabel}</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-sm focus:ring-1 focus:ring-white/30 outline-none transition-all text-white placeholder:text-neutral-700 font-bold"
                    placeholder={t.form.subjectPlaceholder}
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest font-black text-neutral-500">{t.form.messageLabel}</label>
                  <textarea 
                    rows={4}
                    required
                    className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-sm focus:ring-1 focus:ring-white/30 outline-none resize-none transition-all text-white placeholder:text-neutral-700 font-bold"
                    placeholder={t.form.messagePlaceholder}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-white text-black py-5 rounded-full font-black uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                >
                  <span>{isSubmitting ? t.form.submitting : t.form.submit}</span>
                  {!isSubmitting && <Send size={18} />}
                </button>
              </form>
            </div>
          </div>
        </motion.div>

        {/* Interactive Map Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 w-full aspect-[16/6] min-h-[400px] rounded-[3rem] overflow-hidden shadow-2xl border border-neutral-100"
        >
          <iframe 
            src="https://maps.google.com/maps?q=Pera%20Apartments%20Gherasim%20Popa%201-3%20Cristian%20Brasov&t=&z=15&ie=UTF8&iwloc=&output=embed" 
            className="w-full h-full border-none grayscale hover:grayscale-0 transition-all duration-700"
            allowFullScreen
            loading="lazy"
          ></iframe>
        </motion.div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
