import { useState, useEffect, useMemo } from 'react';
import { 
  Routes, 
  Route, 
  Link, 
  useNavigate, 
  useLocation,
  Navigate
} from 'react-router-dom';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { 
  LayoutDashboard, 
  Home as HomeIcon, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X,
  Users as UsersIcon,
  Shield,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Apartment, Booking, BlogPost } from '../types';

interface UserProfileData {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  points: number;
  lastLogin: string;
  createdAt: string;
  photoURL?: string;
}

const UsersManager = () => {
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPoints, setEditingPoints] = useState<{id: string, current: number} | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState(10);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('lastLogin', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfileData)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const toggleRole = async (user: UserProfileData) => {
    if (user.email === 'petreandrei1979@gmail.com') {
      toast.error("Nu poți schimba rolul administratorului principal.");
      return;
    }
    
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', user.id), { role: newRole });
      toast.success(`Rol actualizat pentru ${user.email}`);
    } catch (e) {
      toast.error("Eroare la actualizarea rolului.");
    }
  };

  const handleAddPoints = async () => {
    if (!editingPoints) return;
    try {
      await updateDoc(doc(db, 'users', editingPoints.id), { 
        points: (editingPoints.current || 0) + Number(pointsToAdd) 
      });
      toast.success(`S-au adăugat ${pointsToAdd} puncte.`);
      setEditingPoints(null);
    } catch (e) {
      toast.error("Eroare la adăugarea punctelor.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-serif">Utilizatori & Activitate</h3>
        <div className="flex items-center space-x-2 text-xs text-neutral-400 uppercase tracking-widest">
          <Clock size={14} />
          <span>Ultima activitate în timp real</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-[10px] uppercase tracking-widest font-bold text-neutral-400">
              <tr>
                <th className="px-8 py-4">Utilizator</th>
                <th className="px-8 py-4">Rol</th>
                <th className="px-8 py-4">Puncte</th>
                <th className="px-8 py-4">Ultima Autentificare</th>
                <th className="px-8 py-4">Creat la</th>
                <th className="px-8 py-4">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UsersIcon size={14} className="text-neutral-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold block">{u.displayName || 'Utilizator'}</span>
                        <span className="text-[10px] text-neutral-400">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-black">{u.points || 0}</span>
                      <button 
                        onClick={() => setEditingPoints({id: u.id, current: u.points || 0})}
                        className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-black transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-neutral-600">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString('ro-RO') : 'Niciodată'}
                  </td>
                  <td className="px-8 py-6 text-neutral-600">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ro-RO') : '-'}
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => toggleRole(u)}
                      className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors"
                    >
                      <Shield size={14} />
                      <span>Schimbă Rol</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Points Modal */}
      {editingPoints && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl"
          >
            <h4 className="text-xl font-serif mb-4">Adaugă Puncte</h4>
            <p className="text-xs text-neutral-400 uppercase tracking-widest mb-6">
              Introdu numărul de puncte de loialitate pentru acest client.
            </p>
            <div className="space-y-4">
              <input 
                type="number"
                className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-bold outline-none focus:border-black transition-all"
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(Number(e.target.value))}
              />
              <div className="flex space-x-3 pt-2">
                <button 
                  onClick={handleAddPoints}
                  className="flex-1 bg-black text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all"
                >
                  Confirmă
                </button>
                <button 
                  onClick={() => setEditingPoints(null)}
                  className="flex-1 bg-neutral-100 text-neutral-600 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all"
                >
                  Anulează
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qB = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubB = onSnapshot(qB, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    });

    const qA = query(collection(db, 'apartments'));
    const unsubA = onSnapshot(qA, (snapshot) => {
      setApartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Apartment)));
      setLoading(false);
    });

    return () => { unsubB(); unsubA(); };
  }, []);

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
      toast.success(`Status actualizat: ${status}`);
    } catch (e) {
      toast.error("Eroare la actualizare.");
    }
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
          <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 block mb-2">Total Rezervări</span>
          <span className="text-4xl font-serif">{bookings.length}</span>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
          <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 block mb-2">Apartamente Active</span>
          <span className="text-4xl font-serif">{apartments.length}</span>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
          <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 block mb-2">Venit Estimat</span>
          <span className="text-4xl font-serif">{bookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0)} RON</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="p-8 border-b border-neutral-100 flex justify-between items-center">
          <h3 className="text-xl font-serif">Rezervări Recente</h3>
          <Link to="/admin/bookings" className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-black">Vezi Tot</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-[10px] uppercase tracking-widest font-bold text-neutral-400">
              <tr>
                <th className="px-8 py-4">Oaspete</th>
                <th className="px-8 py-4">Apartament</th>
                <th className="px-8 py-4">Perioadă</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {bookings.slice(0, 5).map((b) => (
                <tr key={b.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-8 py-6">
                    <span className="font-bold block">{b.guestName}</span>
                    <span className="text-[10px] text-neutral-400">{b.guestEmail}</span>
                  </td>
                  <td className="px-8 py-6 text-neutral-600">{b.apartmentId}</td>
                  <td className="px-8 py-6 text-neutral-600">
                    {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                      b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex space-x-2">
                      <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="p-2 hover:bg-green-50 text-green-600 rounded-lg"><Check size={16} /></button>
                      <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="p-2 hover:bg-red-50 text-red-600 rounded-lg"><X size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ApartmentsManager = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingApt, setEditingApt] = useState<Apartment | null>(null);
  const [newApt, setNewApt] = useState<Partial<Apartment>>({
    name: '',
    description: '',
    shortDescription: '',
    pricePerNight: 0,
    capacity: 2,
    rooms: 1,
    bathrooms: 1,
    location: '',
    slug: '',
    amenities: [],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800']
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'apartments'), (snapshot) => {
      setApartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Apartment)));
    });
    return unsub;
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingApt) {
        await updateDoc(doc(db, 'apartments', editingApt.id), {
          ...newApt,
          slug: newApt.name?.toLowerCase().replace(/ /g, '-')
        });
        toast.success("Apartament actualizat!");
      } else {
        await addDoc(collection(db, 'apartments'), {
          ...newApt,
          slug: newApt.name?.toLowerCase().replace(/ /g, '-')
        });
        toast.success("Apartament adăugat!");
      }
      setIsAdding(false);
      setEditingApt(null);
    } catch (e) {
      toast.error("Eroare la salvare.");
    }
  };

  const startEdit = (apt: Apartment) => {
    setEditingApt(apt);
    setNewApt(apt);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Sigur vrei să ștergi acest apartament?")) {
      try {
        await deleteDoc(doc(db, 'apartments', id));
        toast.success("Apartament șters.");
      } catch (e) {
        toast.error("Eroare la ștergere.");
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-serif">Management Apartamente</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-black text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Adaugă Nou</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-neutral-100">
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input 
              placeholder="Nume Apartament" 
              className="px-4 py-3 bg-neutral-50 rounded-xl outline-none"
              value={newApt.name}
              onChange={e => setNewApt({...newApt, name: e.target.value})}
              required
            />
            <input 
              type="number" 
              placeholder="Preț per Noapte (RON)" 
              className="px-4 py-3 bg-neutral-50 rounded-xl outline-none"
              value={newApt.pricePerNight}
              onChange={e => setNewApt({...newApt, pricePerNight: Number(e.target.value)})}
              required
            />
            <input 
              placeholder="Locație" 
              className="px-4 py-3 bg-neutral-50 rounded-xl outline-none"
              value={newApt.location}
              onChange={e => setNewApt({...newApt, location: e.target.value})}
              required
            />
            <input 
              type="number" 
              placeholder="Capacitate" 
              className="px-4 py-3 bg-neutral-50 rounded-xl outline-none"
              value={newApt.capacity}
              onChange={e => setNewApt({...newApt, capacity: Number(e.target.value)})}
              required
            />
            <input 
              type="number" 
              placeholder="Camere" 
              className="px-4 py-3 bg-neutral-50 rounded-xl outline-none"
              value={newApt.rooms}
              onChange={e => setNewApt({...newApt, rooms: Number(e.target.value)})}
              required
            />
            <input 
              type="number" 
              placeholder="Băi" 
              className="px-4 py-3 bg-neutral-50 rounded-xl outline-none"
              value={newApt.bathrooms}
              onChange={e => setNewApt({...newApt, bathrooms: Number(e.target.value)})}
              required
            />
            <textarea 
              placeholder="Scurtă Descriere" 
              className="px-4 py-3 bg-neutral-50 rounded-xl outline-none md:col-span-2"
              value={newApt.shortDescription}
              onChange={e => setNewApt({...newApt, shortDescription: e.target.value})}
              required
            />
            <textarea 
              placeholder="Descriere Completă" 
              className="px-4 py-3 bg-neutral-50 rounded-xl outline-none md:col-span-2 h-32"
              value={newApt.description}
              onChange={e => setNewApt({...newApt, description: e.target.value})}
              required
            />
            <textarea 
              placeholder="Facilități (separate prin virgulă)" 
              className="px-4 py-3 bg-neutral-50 rounded-xl outline-none md:col-span-2"
              value={newApt.amenities?.join(', ')}
              onChange={e => setNewApt({...newApt, amenities: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
            />
            <textarea 
              placeholder="Imagini (cale/URL, separate prin virgulă)" 
              className="px-4 py-3 bg-neutral-50 rounded-xl outline-none md:col-span-2"
              value={newApt.images?.join(', ')}
              onChange={e => setNewApt({...newApt, images: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
            />
            <div className="md:col-span-2 flex space-x-4">
              <button type="submit" className="bg-black text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest">
                {editingApt ? 'Actualizează' : 'Salvează'}
              </button>
              <button type="button" onClick={() => { setIsAdding(false); setEditingApt(null); }} className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Anulează</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {apartments.map(apt => (
          <div key={apt.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-neutral-100 group">
            <div className="aspect-video relative">
              <img src={apt.images[0]} alt={apt.name} className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(apt)} className="p-2 bg-white rounded-lg text-neutral-600 shadow-lg hover:bg-neutral-50"><Edit size={14} /></button>
                <button onClick={() => handleDelete(apt.id)} className="p-2 bg-white rounded-lg text-red-600 shadow-lg hover:bg-red-50"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="p-6">
              <h4 className="font-serif text-lg mb-2">{apt.name}</h4>
              <div className="flex justify-between items-center text-xs text-neutral-400 uppercase tracking-widest">
                <span>{apt.location}</span>
                <span className="font-bold text-black">{apt.pricePerNight} RON</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BookingsManager = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    });
    return unsub;
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
      toast.success("Status actualizat!");
    } catch (e) {
      toast.error("Eroare la actualizare.");
    }
  };

  const deleteBooking = async (id: string) => {
    if (window.confirm("Ștergi această rezervare?")) {
      try {
        await deleteDoc(doc(db, 'bookings', id));
        toast.success("Rezervare ștearsă.");
      } catch (e) {
        toast.error("Eroare la ștergere.");
      }
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-serif">Management Rezervări</h3>
      <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-[10px] uppercase tracking-widest font-bold text-neutral-400">
              <tr>
                <th className="px-8 py-4">Oaspete</th>
                <th className="px-8 py-4">Apartament</th>
                <th className="px-8 py-4">Perioadă</th>
                <th className="px-8 py-4">Total</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-8 py-6">
                    <span className="font-bold block">{b.guestName}</span>
                    <span className="text-[10px] text-neutral-400">{b.guestEmail}</span>
                  </td>
                  <td className="px-8 py-6 text-neutral-600">{b.apartmentId}</td>
                  <td className="px-8 py-6 text-neutral-600">
                    {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 font-bold">{b.totalPrice} RON</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                      b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex space-x-2">
                      <button onClick={() => updateStatus(b.id, 'confirmed')} className="p-2 hover:bg-green-50 text-green-600 rounded-lg"><Check size={16} /></button>
                      <button onClick={() => updateStatus(b.id, 'cancelled')} className="p-2 hover:bg-red-50 text-red-600 rounded-lg"><X size={16} /></button>
                      <button onClick={() => deleteBooking(b.id)} className="p-2 hover:bg-neutral-100 text-neutral-400 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const BlogManager = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newPost, setNewPost] = useState<Partial<BlogPost>>({
    title: '',
    content: '',
    excerpt: '',
    author: 'Admin',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800'
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'blog'), (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost)));
    });
    return unsub;
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'blog'), {
        ...newPost,
        date: new Date().toISOString(),
        slug: newPost.title?.toLowerCase().replace(/ /g, '-')
      });
      toast.success("Articol publicat!");
      setIsAdding(false);
    } catch (e) {
      toast.error("Eroare la publicare.");
    }
  };

  const deletePost = async (id: string) => {
    if (window.confirm("Ștergi acest articol?")) {
      try {
        await deleteDoc(doc(db, 'blog', id));
        toast.success("Articol șters.");
      } catch (e) {
        toast.error("Eroare la ștergere.");
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-serif">Management Blog</h3>
        <button onClick={() => setIsAdding(true)} className="bg-black text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest flex items-center space-x-2">
          <Plus size={16} />
          <span>Articol Nou</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-neutral-100">
          <form onSubmit={handleAdd} className="space-y-6">
            <input 
              placeholder="Titlu Articol" 
              className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none"
              onChange={e => setNewPost({...newPost, title: e.target.value})}
              required
            />
            <textarea 
              placeholder="Rezumat (Excerpt)" 
              className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none h-24"
              onChange={e => setNewPost({...newPost, excerpt: e.target.value})}
              required
            />
            <textarea 
              placeholder="Conținut Articol" 
              className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none h-64"
              onChange={e => setNewPost({...newPost, content: e.target.value})}
              required
            />
            <div className="flex space-x-4">
              <button type="submit" className="bg-black text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest">Publică</button>
              <button type="button" onClick={() => setIsAdding(false)} className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Anulează</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map(post => (
          <div key={post.id} className="bg-white p-6 rounded-3xl border border-neutral-100 flex space-x-6 items-start">
            <img src={post.image} alt={post.title} className="w-24 h-24 rounded-2xl object-cover" />
            <div className="flex-grow">
              <h4 className="font-serif text-lg mb-1">{post.title}</h4>
              <p className="text-xs text-neutral-400 line-clamp-2 mb-4">{post.excerpt}</p>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-300">{new Date(post.date).toLocaleDateString()}</span>
                <button onClick={() => deletePost(post.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsManager = () => {
  const [settings, setSettings] = useState({
    contactEmail: 'contact@pera-apartments.ro',
    contactPhone: '+40 722 000 000',
    instagramUrl: 'https://instagram.com/pera.apartments',
    facebookUrl: 'https://facebook.com/pera.apartments'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Setări salvate local (Demo)!");
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h3 className="text-2xl font-serif">Setări Platformă</h3>
      <form onSubmit={handleSave} className="bg-white p-10 rounded-3xl shadow-sm border border-neutral-100 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Email Contact</label>
          <input 
            value={settings.contactEmail}
            onChange={e => setSettings({...settings, contactEmail: e.target.value})}
            className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Telefon Contact</label>
          <input 
            value={settings.contactPhone}
            onChange={e => setSettings({...settings, contactPhone: e.target.value})}
            className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Instagram URL</label>
          <input 
            value={settings.instagramUrl}
            onChange={e => setSettings({...settings, instagramUrl: e.target.value})}
            className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none"
          />
        </div>
        <button type="submit" className="bg-black text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest">Salvează Modificările</button>
      </form>
    </div>
  );
};

export default function Admin() {
  const { user, profile, logout, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Admin Page Mounted');
  }, []);

  console.log('Admin Page - Auth State:', { 
    user: user?.email, 
    profileRole: profile?.role, 
    authLoading 
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    console.log('Admin Page - Redirecting to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const sidebarLinks = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'Utilizatori', path: '/admin/users', icon: <UsersIcon size={18} /> },
    { name: 'Apartamente', path: '/admin/apartments', icon: <HomeIcon size={18} /> },
    { name: 'Rezervări', path: '/admin/bookings', icon: <Calendar size={18} /> },
    { name: 'Blog', path: '/admin/blog', icon: <FileText size={18} /> },
    { name: 'Setări', path: '/admin/settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-100 flex flex-col fixed h-full z-10">
        <div className="p-8 border-b border-neutral-100">
          <Link to="/" className="text-xl font-display font-bold tracking-tighter">
            PERA <span className="font-light italic text-neutral-400">Admin</span>
          </Link>
        </div>
        <nav className="flex-grow p-6 space-y-2">
          {sidebarLinks.map(link => (
            <Link 
              key={link.path} 
              to={link.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                (link.path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(link.path)) 
                  ? 'bg-black text-white' 
                  : 'text-neutral-500 hover:bg-neutral-50'
              }`}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-neutral-100">
          <button 
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium transition-all"
          >
            <LogOut size={18} />
            <span>Ieșire</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow ml-64 p-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 mb-2">Panou de Control</h2>
            <h1 className="text-3xl font-display font-bold">{profile?.displayName || user.email}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <span className="block text-xs font-bold uppercase tracking-widest">{user.email}</span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Administrator</span>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-white shadow-md bg-neutral-200 flex items-center justify-center overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UsersIcon size={20} className="text-neutral-400" />
              )}
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UsersManager />} />
          <Route path="/apartments" element={<ApartmentsManager />} />
          <Route path="/bookings" element={<BookingsManager />} />
          <Route path="/blog" element={<BlogManager />} />
          <Route path="/settings" element={<SettingsManager />} />
        </Routes>
      </main>
    </div>
  );
}
