import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, User, ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { BlogPost } from '../types';
import { Reveal3D, TextReveal } from '../components/AnimatedComponents';

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'blog'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setPosts([
          {
            id: '1',
            title: "Cele mai bune cafenele de specialitate din Brașov",
            excerpt: "Brașovul a devenit un hub al cafelei de specialitate. Iată unde poți savura cel mai bun espresso sau flat white în centrul vechi.",
            content: "...",
            image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800",
            author: "Echipa Pera",
            date: "2026-03-20T10:00:00Z",
            slug: "cafenele-specialitate-brasov"
          },
          {
            id: '2',
            title: "O zi în Cristian: Bijuteria săsească de lângă Brașov",
            excerpt: "Descoperă farmecul satului Cristian, de la biserica fortificată până la străduțele pline de istorie și liniște.",
            content: "...",
            image: "https://images.unsplash.com/photo-1589979481223-bed89d742528?auto=format&fit=crop&q=80&w=800",
            author: "Andrei Pera",
            date: "2026-03-18T12:00:00Z",
            slug: "o-zi-in-cristian"
          },
          {
            id: '3',
            title: "Trasee montane ușoare pentru o după-amiază relaxantă",
            excerpt: "Nu trebuie să fii expert în alpinism pentru a te bucura de priveliștile Postăvarului. Iată 3 trasee accesibile oricui.",
            content: "...",
            image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800",
            author: "Echipa Pera",
            date: "2026-03-15T09:00:00Z",
            slug: "trasee-montane-usoare"
          },
          {
            id: '4',
            title: "Unde mănânci cel mai bun gulaș tradițional",
            excerpt: "Am testat restaurantele din zonă și am găsit locul unde gulașul se gătește exact ca la bunica acasă.",
            content: "...",
            image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800",
            author: "Echipa Pera",
            date: "2026-03-12T14:00:00Z",
            slug: "cel-mai-bun-gulas"
          },
          {
            id: '5',
            title: "Cetatea Râșnov: Istorie și panoramă la 15 minute distanță",
            excerpt: "O vizită la Cetatea Râșnov este obligatorie. Află care este cel mai bun moment al zilei pentru fotografii spectaculoase.",
            content: "...",
            image: "https://images.unsplash.com/photo-1587975841722-96537383099b?auto=format&fit=crop&q=80&w=800",
            author: "Andrei Pera",
            date: "2026-03-08T11:00:00Z",
            slug: "cetatea-rasnov-ghid"
          },
          {
            id: '6',
            title: "Piața Sfatului și Biserica Neagră: Inima Brașovului",
            excerpt: "Simbolurile orașului Brașov explicate pe scurt pentru oaspeții noștri care vor să înțeleagă istoria locală.",
            content: "...",
            image: "https://images.unsplash.com/photo-1565108940356-0690680e9532?auto=format&fit=crop&q=80&w=800",
            author: "Echipa Pera",
            date: "2026-03-05T10:00:00Z",
            slug: "piata-sfatului-biserica-neagra"
          }
        ]);
      } else {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
        setPosts(data);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching blog posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-32 pb-24 bg-[#fcfaf7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal3D>
          <div className="text-center mb-20">
            <span className="text-xs uppercase tracking-[0.3em] font-bold text-neutral-400 mb-4 block">Ghidul Orașului</span>
            <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter mb-6">Inspiră-te pentru <span className="italic font-light text-neutral-400">următoarea aventură.</span></h1>
            <p className="max-w-2xl mx-auto text-neutral-600 leading-relaxed font-bold italic">
              Recomandări locale, evenimente culturale și secretele ascunse ale orașului, curatoriate special pentru oaspeții noștri.
            </p>
          </div>
        </Reveal3D>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="space-y-24">
            {/* Featured Post */}
            {posts.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group cursor-pointer overflow-hidden rounded-[2rem] shadow-2xl"
              >
                <div className="aspect-[21/9] relative">
                  <img 
                    src={posts[0].image} 
                    alt={posts[0].title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-8 md:p-16 text-white max-w-3xl">
                    <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/60 mb-4 block">Recomandarea Săptămânii</span>
                    <h2 className="text-3xl md:text-5xl font-serif mb-6 leading-tight">{posts[0].title}</h2>
                    <p className="text-white/90 text-sm md:text-lg mb-8 line-clamp-2 font-medium">{posts[0].excerpt}</p>
                    <Link to={`/blog/${posts[0].slug}`} className="inline-flex items-center bg-white text-black px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-100 transition-all">
                      Citește Articolul
                      <ArrowRight className="ml-2" size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Grid Posts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-20">
              {posts.slice(1).map((post, i) => (
                <motion.article 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-8 shadow-sm">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex items-center space-x-4 text-[10px] uppercase tracking-widest text-neutral-400 mb-4">
                    <span>{new Date(post.date).toLocaleDateString('ro-RO')}</span>
                    <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
                    <span>{post.author}</span>
                  </div>
                  <h3 className="text-2xl font-serif mb-4 group-hover:text-neutral-600 transition-colors leading-tight">{post.title}</h3>
                  <p className="text-neutral-700 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">{post.excerpt}</p>
                  <Link to={`/blog/${post.slug}`} className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest group/link border-b border-black/10 pb-1 hover:border-black transition-all">
                    Citește mai mult
                    <ArrowRight className="ml-2 group-hover/link:translate-x-2 transition-transform" size={12} />
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
