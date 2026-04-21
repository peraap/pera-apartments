import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  points: number;
  role: 'admin' | 'user';
  lastLogin: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = "petreandrei1979@gmail.com";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser?.email);
      setUser(currentUser);
      
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const now = new Date().toISOString();
        
        console.log('Fetching profile for:', currentUser.uid);
        unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          console.log('Profile snapshot received. Exists:', docSnap.exists());
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setProfile(data);
            
            // Ensure admin role for ADMIN_EMAIL
            if (currentUser.email === ADMIN_EMAIL && data.role !== 'admin') {
              console.log('Upgrading user to admin role');
              setDoc(userDocRef, { role: 'admin' }, { merge: true }).catch(err => {
                console.error('Error upgrading to admin:', err);
              });
            }

            const lastUpdate = data.lastLogin ? new Date(data.lastLogin).getTime() : 0;
            if (Date.now() - lastUpdate > 5 * 60 * 1000) {
              setDoc(userDocRef, { lastLogin: now }, { merge: true }).catch(err => {
                // Silently handle background update errors
                if (err.code !== 'permission-denied') console.error('Error updating lastLogin:', err);
              });
            }
          } else {
            console.log('Creating initial profile...');
            const initialProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              points: 0,
              role: currentUser.email === ADMIN_EMAIL ? 'admin' : 'user',
              lastLogin: now,
              createdAt: now
            };
            setDoc(userDocRef, initialProfile).catch(err => {
              console.error('Error creating profile:', err);
            });
            setProfile(initialProfile);
          }
          setLoading(false);
        }, (error) => {
          console.error('Profile snapshot error:', error);
          // If we get permission denied, it might be because the doc hasn't been created yet
          // or the user logs in and we haven't synced. We'll wait.
          if (error.code === 'permission-denied') {
            // Check if we already have a user. If so, try to create doc if it fails read
            if (auth.currentUser) {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        });
      }
 else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      loginWithEmail,
      signupWithEmail,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
