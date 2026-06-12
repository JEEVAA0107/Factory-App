import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile, UserProfile } from "@/services/usersService";
import { isMockMode, getMockUserProfile } from "@/services/mockDb";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
  setUserProfile: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMockMode()) {
      setUser({
        uid: "demo-uid",
        displayName: "Demo Manager",
        email: "demo@factoryflow.com",
        phoneNumber: "+919876543210",
      } as any);
      setUserProfile(getMockUserProfile("demo-uid"));
      setLoading(false);
      
      // Setup a window listener to handle live changes in mock mode
      const handleStorageChange = () => {
        if (!isMockMode()) {
          setUser(null);
          setUserProfile(null);
        }
      };
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
        } catch {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signOut = async () => {
    if (isMockMode()) {
      localStorage.removeItem("use_mock_data");
    }
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
    window.location.reload(); // Reload to reset all states and services cleanly
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut, setUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
