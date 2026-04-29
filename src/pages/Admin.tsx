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
  Clock,
  Tag,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Apartment, Booking, BlogPost, SpecialOffer } from '../types';

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

const SheetsBookingsTable = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sheet-bookings')
      .then(res => res.json())
      .then(data => {
        setBookings(data.bookings || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching sheet bookings:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-neutral-400">Se încarcă datele din Google Sheets...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-[10px] uppercase tracking-widest font-bold text-neutral-400">
          <tr>
            <th className="px-8 py-4">ID</th>
            <th className="px-8 py-4">Oaspete</th>
            <th className="px-8 py-4">Apartament</th>
            <th className="px-8 py-4">Perioadă</th>
            <th className="px-8 py-4">Preț</th>
            <th className="px-8 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {bookings.map((b, idx) => (
            <tr key={idx} className="hover:bg-neutral-50 transition-colors">
              <td className="px-8 py-6 font-mono text-neutral-400">{b[0]}</td>
              <td className="px-8 py-6">
                <span className="font-bold block">{b[2]}</span>
                <span className="text-[10px] text-neutral-400">{b[3]}</span>
              </td>
              <td className="px-8 py-6 text-neutral-600">{b[4]}</td>
              <td className="px-8 py-6 text-neutral-600">
                {b[5]} - {b[6]}
              </td>
              <td className="px-8 py-6 font-bold">{b[7]}</td>
              <td className="px-8 py-6">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  b[8] === 'confirmed' || b[8] === 'paid' ? 'bg-green-100 text-green-700' : 
                  b[8] === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {b[8]}
                </span>
              </td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr>
              <td colSpan={6} className="px-8 py-12 text-center text-neutral-400">Nicio rezervare găsită în Google Sheets.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const SheetsLogsTable = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/log-login')
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching sheet logs:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-neutral-400">Se încarcă logurile...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-[10px] uppercase tracking-widest font-bold text-neutral-400">
          <tr>
            <th className="px-8 py-4">ID</th>
            <th className="px-8 py-4">Dată/Oră</th>
            <th className="px-8 py-4">Utilizator</th>
            <th className="px-8 py-4">Metodă</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {logs.map((l, idx) => (
            <tr key={idx} className="hover:bg-neutral-50 transition-colors">
              <td className="px-8 py-6 font-mono text-neutral-400">{l[0]}</td>
              <td className="px-8 py-6 text-neutral-600">{l[1]}</td>
              <td className="px-8 py-6">
                <span className="font-bold block">{l[2]}</span>
                <span className="text-[10px] text-neutral-400">{l[3]}</span>
              </td>
              <td className="px-8 py-6">
                <span className="px-2 py-1 bg-neutral-100 rounded text-[10px] font-bold uppercase tracking-widest text-neutral-500">{l[4]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

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
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
      if (error.code === 'permission-denied') {
        toast.error("Acces refuzat: Nu aveți permisiuni de administrator.");
      }
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
          <span>Real-time Sync (Firestore)</span>
        </div>
      </div>

      {/* Firestore Users */}
      <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
        {/* ... existing table code kept for role management ... */}
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

      <div className="pt-12">
        <h4 className="text-xl font-serif mb-6">Log-uri Activitate (Google Sheets)</h4>
        <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
          <SheetsLogsTable />
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

const SyncInfo = () => {
  const icalLinks = [
    { name: "Premium King", slug: "apartament-premium-king" },
    { name: "Deluxe Double", slug: "apartament-deluxe-double" },
    { name: "Family Standard", slug: "apartament-family-standard" },
    { name: "Family Deluxe", slug: "apartament-family-deluxe" },
    { name: "Pera Duo", slug: "peraduo" },
    { name: "Pera Confort", slug: "peraconfort" },
  ];

  const baseUrl = window.location.origin;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
        <h3 className="text-lg font-serif mb-4 flex items-center gap-2">
          <Settings className="text-blue-500" size={20} />
          Sincronizare Calendare (iCal Export)
        </h3>
        <p className="text-sm text-blue-800 mb-4">
          Copiați aceste link-uri și adăugați-le în Airbnb sau Booking.com la secțiunea "Import Calendar" pentru a sincroniza rezervările de pe site.
        </p>
        {window.location.hostname.includes('ais-dev') && (
          <div className="mb-4 p-3 bg-blue-100 rounded-xl text-[10px] text-blue-700 font-bold border border-blue-200">
            NOTĂ: Pentru ca Airbnb/Booking să poată accesa aceste link-uri, trebuie să folosiți varianta "SHARE" a aplicației (Shared App URL), nu link-ul de test (Development URL).
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {icalLinks.map(link => (
            <div key={link.slug} className="bg-white p-4 rounded-2xl shadow-sm border border-blue-200/50">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-1">{link.name}</span>
              <code className="text-[10px] text-blue-600 break-all bg-blue-50 px-2 py-1 rounded block select-all">
                {`${baseUrl}/api/export-ical/${link.slug}.ics`}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const qB = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubB = onSnapshot(qB, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    }, (error) => {
      console.error("Error fetching bookings:", error);
    });

    const qA = query(collection(db, 'apartments'));
    const unsubA = onSnapshot(qA, (snapshot) => {
      setApartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Apartment)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching apartments:", error);
      setLoading(false);
    });

    return () => { unsubB(); unsubA(); };
  }, []);

  const handleFullSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/sync-calendars');
      const data = await response.json();
      toast.success("Sincronizare finalizată cu succes!");
      console.log("Sync results:", data.results);
    } catch (e) {
      toast.error("Eroare la sincronizare.");
    } finally {
      setSyncing(false);
    }
  };

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
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-serif">Dashboard Admin</h3>
        <button 
          onClick={handleFullSync}
          disabled={syncing}
          className={`flex items-center space-x-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
            syncing ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {syncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          <span>{syncing ? 'Sincronizare...' : 'Sincronizează Calendare'}</span>
        </button>
      </div>

      <SyncInfo />
      
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
          <h3 className="text-xl font-serif">Rezervări (Google Sheets)</h3>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
              <Check size={12} /> Sync Activ
            </span>
            <Link to="/admin/bookings" className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-black">Management Complet</Link>
          </div>
        </div>
        <SheetsBookingsTable />
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
    }, (error) => {
      console.error("Error fetching bookings manager:", error);
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

const BlocksManager = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newBlock, setNewBlock] = useState({
    apartmentId: 'all',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    const unsubB = onSnapshot(collection(db, 'manual_blocks'), (snapshot) => {
      setBlocks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubA = onSnapshot(collection(db, 'apartments'), (snapshot) => {
      setApartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Apartment)));
    });
    return () => { unsubB(); unsubA(); };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'manual_blocks'), {
        ...newBlock,
        createdAt: new Date().toISOString()
      });
      toast.success("Blocaj adăugat!");
      setIsAdding(false);
      setNewBlock({ apartmentId: 'all', startDate: '', endDate: '', reason: '' });
    } catch (e) {
      toast.error("Eroare la adăugare.");
    }
  };

  const deleteBlock = async (id: string) => {
    if (window.confirm("Ștergi acest blocaj?")) {
      try {
        await deleteDoc(doc(db, 'manual_blocks', id));
        toast.success("Blocaj șters.");
      } catch (e) {
        toast.error("Eroare la ștergere.");
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-serif">Management Blocaje Manuale</h3>
        <button 
          onClick={() => setIsAdding(true)} 
          className="bg-black text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Blocaj Nou</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-neutral-100">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-neutral-400">Apartament</label>
              <select 
                className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none"
                value={newBlock.apartmentId}
                onChange={e => setNewBlock({...newBlock, apartmentId: e.target.value})}
                required
              >
                <option value="all">Toate Apartamentele</option>
                {apartments.map(apt => (
                  <option key={apt.id} value={apt.slug}>{apt.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-neutral-400">Motiv (opțional)</label>
              <input 
                placeholder="Ex: Mentenanță, Curățenie..." 
                className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none"
                value={newBlock.reason}
                onChange={e => setNewBlock({...newBlock, reason: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-neutral-400">Data Început</label>
              <input 
                type="date"
                className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none"
                value={newBlock.startDate}
                onChange={e => setNewBlock({...newBlock, startDate: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-neutral-400">Data Sfârșit</label>
              <input 
                type="date"
                className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none"
                value={newBlock.endDate}
                onChange={e => setNewBlock({...newBlock, endDate: e.target.value})}
                required
              />
            </div>
            <div className="md:col-span-2 flex space-x-4 pt-4">
              <button type="submit" className="bg-black text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all">Salvează</button>
              <button type="button" onClick={() => setIsAdding(false)} className="text-neutral-400 text-xs font-bold uppercase tracking-widest hover:text-black">Anulează</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-[10px] uppercase tracking-widest font-bold text-neutral-400">
            <tr>
              <th className="px-8 py-4">Apartament</th>
              <th className="px-8 py-4">Perioadă</th>
              <th className="px-8 py-4">Motiv</th>
              <th className="px-8 py-4">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {blocks.map((block) => (
              <tr key={block.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-8 py-6 font-bold">{block.apartmentId === 'all' ? 'Toate' : block.apartmentId}</td>
                <td className="px-8 py-6 text-neutral-600">
                  {new Date(block.startDate).toLocaleDateString()} - {new Date(block.endDate).toLocaleDateString()}
                </td>
                <td className="px-8 py-6 text-neutral-400 text-xs italic">{block.reason || '-'}</td>
                <td className="px-8 py-6">
                  <button onClick={() => deleteBlock(block.id)} className="p-2 hover:bg-red-50 text-red-400 rounded-lg"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {blocks.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-12 text-center text-neutral-400 italic">Niciun blocaj manual adăugat.</td>
              </tr>
            )}
          </tbody>
        </table>
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
    }, (error) => {
      console.error("Error fetching blog:", error);
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

const OffersManager = () => {
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null);
  const [newOffer, setNewOffer] = useState<Partial<SpecialOffer>>({
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    applicableApartments: [],
    minNights: 1
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'specialOffers'), (snapshot) => {
      setOffers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpecialOffer)));
    }, (error) => {
      console.error("Error fetching specialOffers:", error);
    });
    const unsubApts = onSnapshot(collection(db, 'apartments'), (snapshot) => {
      setApartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Apartment)));
    }, (error) => {
      console.error("Error fetching apartments for offers:", error);
    });
    return () => { unsub(); unsubApts(); };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOffer) {
        await updateDoc(doc(db, 'specialOffers', editingOffer.id), newOffer);
        toast.success("Ofertă actualizată!");
      } else {
        await addDoc(collection(db, 'specialOffers'), {
          ...newOffer,
          isActive: true
        });
        toast.success("Ofertă adăugată!");
      }
      setIsAdding(false);
      setEditingOffer(null);
      setNewOffer({
        title: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        startDate: '',
        endDate: '',
        isActive: true,
        applicableApartments: [],
        minNights: 1
      });
    } catch (e) {
      console.error(e);
      toast.error("Eroare la salvare.");
    }
  };

  const startEdit = (offer: SpecialOffer) => {
    setEditingOffer(offer);
    setNewOffer(offer);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Sigur vrei să ștergi această ofertă?")) {
      try {
        await deleteDoc(doc(db, 'specialOffers', id));
        toast.success("Ofertă ștearsă.");
      } catch (e) {
        toast.error("Eroare la ștergere.");
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-serif">Management Oferte Speciale</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-black text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Ofertă Nouă</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-neutral-100">
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-neutral-400">Titlu Ofertă</label>
              <input 
                placeholder="Ex. Salvează 20% la pachetele de 3 nopți" 
                className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none"
                value={newOffer.title}
                onChange={e => setNewOffer({...newOffer, title: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-neutral-400">Tip Discount</label>
              <select 
                className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none"
                value={newOffer.discountType}
                onChange={e => setNewOffer({...newOffer, discountType: e.target.value as 'percentage' | 'fixed'})}
              >
                <option value="percentage">Procentual (%)</option>
                <option value="fixed">Sumă Fixă (RON)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-neutral-400">Valoare Discount</label>
              <input 
                type="number"
                placeholder="Valoare" 
                className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none"
                value={newOffer.discountValue}
                onChange={e => setNewOffer({...newOffer, discountValue: Number(e.target.value)})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-neutral-400">Nopți Minime</label>
              <input 
                type="number"
                placeholder="Zile minime" 
                className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none"
                value={newOffer.minNights}
                onChange={e => setNewOffer({...newOffer, minNights: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-neutral-400">Data Început</label>
              <input 
                type="date"
                className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none"
                value={newOffer.startDate}
                onChange={e => setNewOffer({...newOffer, startDate: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-neutral-400">Data Sfârșit</label>
              <input 
                type="date"
                className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none"
                value={newOffer.endDate}
                onChange={e => setNewOffer({...newOffer, endDate: e.target.value})}
                required
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] uppercase font-bold text-neutral-400">Descriere</label>
              <textarea 
                placeholder="Descrie oferta..." 
                className="w-full px-4 py-3 bg-neutral-50 rounded-xl outline-none h-32"
                value={newOffer.description}
                onChange={e => setNewOffer({...newOffer, description: e.target.value})}
                required
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] uppercase font-bold text-neutral-400">Apartamente Aplicabile</label>
              <div className="flex flex-wrap gap-3">
                {apartments.map(apt => (
                  <label key={apt.id} className="flex items-center space-x-2 bg-neutral-50 px-4 py-2 rounded-full cursor-pointer hover:bg-neutral-100 transition-colors">
                    <input 
                      type="checkbox"
                      checked={newOffer.applicableApartments?.includes(apt.id)}
                      onChange={(e) => {
                        const current = newOffer.applicableApartments || [];
                        if (e.target.checked) {
                          setNewOffer({...newOffer, applicableApartments: [...current, apt.id]});
                        } else {
                          setNewOffer({...newOffer, applicableApartments: current.filter(id => id !== apt.id)});
                        }
                      }}
                      className="rounded border-neutral-300 shadow-sm"
                    />
                    <span className="text-xs">{apt.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] uppercase font-bold text-neutral-400">Status Activ</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  checked={newOffer.isActive}
                  onChange={e => setNewOffer({...newOffer, isActive: e.target.checked})}
                  className="rounded border-neutral-300 shadow-sm w-5 h-5 focus:ring-black"
                />
                <span className="text-sm font-medium">Bifează dacă oferta este activă</span>
              </div>
            </div>
            <div className="flex space-x-4 pt-4">
              <button type="submit" className="bg-black text-white px-10 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl hover:bg-neutral-800 transition-all">
                {editingOffer ? 'Actualizează' : 'Salvează Ofertă'}
              </button>
              <button 
                type="button" 
                onClick={() => { setIsAdding(false); setEditingOffer(null); }} 
                className="text-neutral-400 text-xs font-bold uppercase tracking-widest hover:text-black transition-colors"
              >
                Anulează
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {offers.map(offer => (
          <div key={offer.id} className={`bg-white rounded-3xl overflow-hidden shadow-sm border ${offer.isActive ? 'border-neutral-100' : 'border-red-100 opacity-75'} group transition-all`}>
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 ${offer.isActive ? 'bg-neutral-50' : 'bg-red-50'} rounded-2xl flex items-center justify-center text-black`}>
                  <Tag size={20} className={offer.isActive ? '' : 'text-red-500'} />
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(offer)} className="p-2 hover:bg-neutral-50 rounded-lg text-neutral-400 hover:text-black hover:scale-110 transition-all"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(offer.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 hover:scale-110 transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
              <h4 className="font-serif text-xl mb-3">{offer.title}</h4>
              <p className="text-xs text-neutral-500 line-clamp-3 mb-6 leading-relaxed font-medium">{offer.description}</p>
              <div className="space-y-4 pt-4 border-t border-neutral-50">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black">
                  <span className="text-neutral-300">Discount</span>
                  <span className="text-black bg-neutral-50 px-3 py-1 rounded-full">{offer.discountValue}{offer.discountType === 'percentage' ? '%' : ' RON'}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black">
                  <span className="text-neutral-300">Valabilitate</span>
                  <span className="text-black">{new Date(offer.startDate).toLocaleDateString('ro-RO')} - {new Date(offer.endDate).toLocaleDateString('ro-RO')}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black">
                  <span className="text-neutral-300">Status</span>
                  <span className={offer.isActive ? 'text-green-500' : 'text-red-500'}>{offer.isActive ? 'ACTIV' : 'INACTIV'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {offers.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-neutral-100 rounded-[3rem]">
            <Tag size={40} className="mx-auto text-neutral-200 mb-4" />
            <p className="text-neutral-400 text-sm font-medium">Nicio ofertă activă. Creează prima ofertă specială!</p>
          </div>
        )}
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

  if (!user || (profile?.role !== 'admin' && user?.email !== 'petreandrei1979@gmail.com')) {
    console.log('Admin Page - Redirecting to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const sidebarLinks = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'Utilizatori', path: '/admin/users', icon: <UsersIcon size={18} /> },
    { name: 'Apartamente', path: '/admin/apartments', icon: <HomeIcon size={18} /> },
    { name: 'Rezervări', path: '/admin/bookings', icon: <Calendar size={18} /> },
    { name: 'Blocaje Manuale', path: '/admin/blocks', icon: <Clock size={18} /> },
    { name: 'Oferte', path: '/admin/offers', icon: <Tag size={18} /> },
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
          <Route path="/blocks" element={<BlocksManager />} />
          <Route path="/offers" element={<OffersManager />} />
          <Route path="/blog" element={<BlogManager />} />
          <Route path="/settings" element={<SettingsManager />} />
        </Routes>
      </main>
    </div>
  );
}
