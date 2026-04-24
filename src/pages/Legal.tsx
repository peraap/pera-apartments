import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Reveal3D } from '../components/AnimatedComponents';

const legalTranslations = {
  ro: {
    privacy: {
      title: "Politica de Confidențialitate",
      text: "La Pera Apartments, respectăm confidențialitatea datelor tale. Această politică explică modul în care colectăm, utilizăm și protejăm informațiile tale personale în conformitate cu Regulamentul General privind Protecția Datelor (GDPR).",
      sections: [
        {
          title: "1. Colectarea Datelor",
          content: "Colectăm informații personale pe care ni le furnizezi direct, cum ar fi numele, adresa de email, numărul de telefon și detalii despre plată atunci când faci o rezervare sau ne contactezi."
        },
        {
          title: "2. Utilizarea Informațiilor",
          content: "Folosim datele tale pentru a procesa rezervările, a asigura comunicarea necesară privind sejurul tău, a trimite confirmări și, dacă ești de acord, pentru a-ți transmite oferte speciale și noutăți."
        },
        {
          title: "3. Temeiul Juridic",
          content: "Prelucrarea datelor se bazează pe necesitatea executării unui contract (rezervarea ta), pe obligații legale sau pe consimțământul tău explicit în cazul newsletter-ului."
        },
        {
          title: "4. Divulgarea Către Terți",
          content: "Nu vindem și nu închiriem datele tale personale. Putem partaja datele cu furnizori de servicii strict necesari (procesatori de plăți, servicii de curățenie partenere) care respectă standardele noastre de confidențialitate."
        },
        {
          title: "5. Securitatea Datelor",
          content: "Utilizăm măsuri de securitate avansate, inclusiv criptare SSL și proceduri de stocare securizată, pentru a preveni accesul neautorizat, modificarea sau pierderea datelor tale."
        },
        {
          title: "6. Drepturile Tale",
          content: "Ai dreptul de a accesa, rectifica, șterge sau restricționa prelucrarea datelor tale. De asemenea, te poți opune prelucrării sau poți solicita portabilitatea datelor contactându-ne la adresa de email specificată."
        }
      ]
    },
    terms: {
      title: "Termeni și Condiții",
      text: "Bun venit la Pera Apartments. Utilizarea site-ului nostru și rezervarea serviciilor noastre implică acceptarea integrală a termenilor și condițiilor de mai jos.",
      sections: [
        {
          title: "1. Procesul de Rezervare",
          content: "Rezervările devin ferme doar după confirmarea disponibilității și, în funcție de tarif, după plata avansului sau a sumei integrale."
        },
        {
          title: "2. Politica de Anulare",
          content: "Anulările efectuate cu mai mult de 14 zile înainte de check-in sunt eligibile pentru rambursare integrală. Pentru anulările tardive, se pot aplica penalități conform condițiilor specifice fiecărei unități."
        },
        {
          title: "3. Check-in și Check-out",
          content: "Accesul în apartamente se face începând cu ora 15:00, iar eliberarea camerelor se face până la ora 11:00. Solicitările pentru early check-in sau late check-out sunt supuse disponibilității."
        },
        {
          title: "4. Reguli de Conduită",
          content: "Fumatul este strict interzis în interior. Este necesară respectarea orelor de liniște (22:00 - 08:00) și utilizarea responsabilă a echipamentelor puse la dispoziție."
        },
        {
          title: "5. Răspundere și Daune",
          content: "Oaspeții sunt direct responsabili pentru orice daune cauzate bunurilor și dotărilor apartamentului în timpul sejurului propriu."
        },
        {
          title: "6. Modificări ale Termenilor",
          content: "Pera Apartments își rezervă dreptul de a modifica acești termeni în orice moment. Modificările intră în vigoare din momentul publicării lor pe site."
        }
      ]
    }
  },
  en: {
    privacy: {
      title: "Privacy Policy",
      text: "At Pera Apartments, we respect your data privacy. This policy explains how we collect, use, and protect your personal information in accordance with the General Data Protection Regulation (GDPR).",
      sections: [
        {
          title: "1. Data Collection",
          content: "We collect personal information that you provide directly to us, such as your name, email address, phone number, and payment details when making a reservation or contacting us."
        },
        {
          title: "2. Use of Information",
          content: "We use your data to process bookings, ensure necessary communication regarding your stay, send confirmations, and, if you agree, to provide special offers and news."
        },
        {
          title: "3. Legal Basis",
          content: "Data processing is based on the necessity of performing a contract (your reservation), legal obligations, or your explicit consent for the newsletter."
        },
        {
          title: "4. Third-Party Disclosure",
          content: "We do not sell or rent your personal data. We may share data with strictly necessary service providers (payment processors, partner cleaning services) that comply with our privacy standards."
        },
        {
          title: "5. Data Security",
          content: "We use advanced security measures, including SSL encryption and secure storage procedures, to prevent unauthorized access, modification, or loss of your data."
        },
        {
          title: "6. Your Rights",
          content: "You have the right to access, rectify, delete, or restrict the processing of your data. You can also object to processing or request data portability by contacting us at the specified email address."
        }
      ]
    },
    terms: {
      title: "Terms and Conditions",
      text: "Welcome to Pera Apartments. Using our website and booking our services implies full acceptance of the terms and conditions below.",
      sections: [
        {
          title: "1. Booking Process",
          content: "Reservations are confirmed only after availability is verified and, depending on the rate, after payment of the deposit or the full amount."
        },
        {
          title: "2. Cancellation Policy",
          content: "Cancellations made more than 14 days before check-in are eligible for a full refund. For late cancellations, penalties may apply according to the specific conditions of each unit."
        },
        {
          title: "3. Check-in and Check-out",
          content: "Access to the apartments is from 3:00 PM, and checkout is by 11:00 AM. Requests for early check-in or late check-out are subject to availability."
        },
        {
          title: "4. Rules of Conduct",
          content: "Smoking is strictly prohibited inside. Respect for quiet hours (10:00 PM - 08:00 AM) and responsible use of the provided equipment is required."
        },
        {
          title: "5. Liability and Damages",
          content: "Guests are directly responsible for any damage caused to the property and amenities during their stay."
        },
        {
          title: "6. Changes to Terms",
          content: "Pera Apartments reserves the right to modify these terms at any time. Changes take effect from the moment they are published on the site."
        }
      ]
    }
  }
};

export default function Legal({ lang = 'ro' }: { lang?: string }) {
  const { type } = useParams();
  const t = legalTranslations[lang as keyof typeof legalTranslations];
  const current = t[type as keyof typeof t] || t.privacy;

  return (
    <div className="pt-32 pb-24 bg-[#fcfaf7]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal3D>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter mb-12">{current.title}</h1>
            <div className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed space-y-8 font-light italic">
              <p>{current.text}</p>
              {current.sections.map((section, index) => (
                <div key={index}>
                  <h3 className="text-xl font-display font-black text-black uppercase tracking-widest mt-12">{section.title}</h3>
                  <p className="not-italic font-sans font-light text-neutral-500">{section.content}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </Reveal3D>
      </div>
    </div>
  );
}
