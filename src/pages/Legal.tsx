import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';

const legalTranslations = {
  ro: {
    privacy: {
      title: "Politica de Confidențialitate",
      text: "La Pera Apartments, respectăm confidențialitatea datelor tale. Această politică explică modul în care colectăm, utilizăm și protejăm informațiile tale personale în conformitate cu GDPR.",
      sections: [
        {
          title: "1. Colectarea Datelor",
          content: "Colectăm informații precum numele, adresa de email și numărul de telefon exclusiv pentru procesarea rezervărilor și comunicarea cu oaspeții noștri."
        },
        {
          title: "2. Utilizarea Informațiilor",
          content: "Informațiile colectate sunt utilizate pentru confirmarea rezervărilor, trimiterea instrucțiunilor de check-in și îmbunătățirea serviciilor noastre."
        },
        {
          title: "3. Securitatea Datelor",
          content: "Implementăm măsuri de securitate tehnice și organizatorice pentru a proteja datele tale împotriva accesului neautorizat sau a pierderii."
        },
        {
          title: "4. Drepturile Tale",
          content: "Ai dreptul de a solicita accesul, rectificarea sau ștergerea datelor tale personale din baza noastră de date în orice moment."
        }
      ]
    },
    terms: {
      title: "Termeni și Condiții",
      text: "Utilizarea site-ului și rezervarea apartamentelor noastre implică acceptarea acestor termeni și condiții. Te rugăm să le citești cu atenție înainte de a finaliza o rezervare.",
      sections: [
        {
          title: "1. Rezervări",
          content: "Rezervările se confirmă prin plata unui avans sau a sumei integrale, conform politicii de rezervare selectate."
        },
        {
          title: "2. Anulări",
          content: "Politica de anulare depinde de tariful ales. Vă rugăm să verificați detaliile specifice în momentul rezervării."
        },
        {
          title: "3. Reguli de Casă",
          content: "Fumatul este strict interzis în interiorul apartamentelor. Vă rugăm să respectați orele de liniște între 22:00 și 08:00."
        },
        {
          title: "4. Răspundere",
          content: "Oaspeții sunt responsabili pentru orice daune cauzate proprietății în timpul sejurului lor."
        }
      ]
    }
  },
  en: {
    privacy: {
      title: "Privacy Policy",
      text: "At Pera Apartments, we respect your data privacy. This policy explains how we collect, use, and protect your personal information in accordance with GDPR.",
      sections: [
        {
          title: "1. Data Collection",
          content: "We collect information such as name, email address, and phone number exclusively for processing reservations and communicating with our guests."
        },
        {
          title: "2. Use of Information",
          content: "The collected information is used for confirming reservations, sending check-in instructions, and improving our services."
        },
        {
          title: "3. Data Security",
          content: "We implement technical and organizational security measures to protect your data against unauthorized access or loss."
        },
        {
          title: "4. Your Rights",
          content: "You have the right to request access, rectification, or deletion of your personal data from our database at any time."
        }
      ]
    },
    terms: {
      title: "Terms and Conditions",
      text: "Use of the website and booking our apartments implies acceptance of these terms and conditions. Please read them carefully before completing a reservation.",
      sections: [
        {
          title: "1. Reservations",
          content: "Reservations are confirmed by paying a deposit or the full amount, according to the selected booking policy."
        },
        {
          title: "2. Cancellations",
          content: "The cancellation policy depends on the chosen rate. Please check the specific details at the time of booking."
        },
        {
          title: "3. House Rules",
          content: "Smoking is strictly prohibited inside the apartments. Please respect the quiet hours between 10:00 PM and 08:00 AM."
        },
        {
          title: "4. Liability",
          content: "Guests are responsible for any damage caused to the property during their stay."
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
    <div className="pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-serif mb-12">{current.title}</h1>
          <div className="prose prose-neutral max-w-none text-neutral-800 leading-relaxed space-y-8 font-medium">
            <p>{current.text}</p>
            {current.sections.map((section, index) => (
              <div key={index}>
                <h3 className="text-xl font-bold text-black uppercase tracking-widest mt-12">{section.title}</h3>
                <p>{section.content}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
