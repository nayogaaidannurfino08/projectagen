import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { auth, DEFAULT_AGEN_ID } from "../firebase/config";
import { getUserProfile, setUserProfile } from "../services/userService";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfileState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Demo fallback user state if testing locally with placeholder credentials
  const [demoUser, setDemoUser] = useState(() => {
    const saved = localStorage.getItem("demo_user_aps_agen");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    // If running in demo mode
    if (demoUser) {
      setCurrentUser({ uid: demoUser.uid, email: demoUser.email });
      setUserProfileState(demoUser);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          let profile = await getUserProfile(user.uid);
          if (!profile) {
            // Auto-create default profile for new login if not found
            profile = {
              uid: user.uid,
              nama: user.displayName || user.email?.split("@")[0] || "User Agen",
              role: user.email?.toLowerCase().includes("admin") ? "admin" : "kasir",
              agenId: DEFAULT_AGEN_ID,
              email: user.email,
              isActive: true
            };
            await setUserProfile(user.uid, profile);
          }
          setUserProfileState(profile);
        } catch (err) {
          console.error("Gagal mengambil profil user:", err);
          // Fallback profile
          setUserProfileState({
            uid: user.uid,
            nama: user.email?.split("@")[0] || "User Agen",
            role: "admin",
            agenId: DEFAULT_AGEN_ID,
            email: user.email,
            isActive: true
          });
        }
      } else {
        setUserProfileState(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [demoUser]);

  const login = async (email, password) => {
    // Check if using demo mode (useful if API keys are placeholder)
    if (import.meta.env.VITE_FIREBASE_API_KEY?.includes("Placeholder")) {
      const isRoleAdmin = email.toLowerCase().includes("admin");
      const mockProfile = {
        uid: "demo_uid_" + Date.now(),
        email,
        nama: isRoleAdmin ? "Admin Agen Sembako" : "Kasir Agen Sembako",
        role: isRoleAdmin ? "admin" : "kasir",
        agenId: DEFAULT_AGEN_ID,
        isActive: true
      };
      localStorage.setItem("demo_user_aps_agen", JSON.stringify(mockProfile));
      setDemoUser(mockProfile);
      setCurrentUser({ uid: mockProfile.uid, email });
      setUserProfileState(mockProfile);
      return mockProfile;
    }

    const res = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(res.user.uid);
    if (profile && profile.isActive === false) {
      await signOut(auth);
      throw new Error("Akun Anda dinonaktifkan. Silakan hubungi admin.");
    }
    return res.user;
  };

  const logout = async () => {
    localStorage.removeItem("demo_user_aps_agen");
    setDemoUser(null);
    setUserProfileState(null);
    setCurrentUser(null);
    try {
      await signOut(auth);
    } catch (e) {
      // Ignored if already signed out
    }
  };

  const value = {
    currentUser,
    userProfile,
    role: userProfile?.role || "kasir",
    isAdmin: userProfile?.role === "admin",
    isKasir: userProfile?.role === "kasir",
    agenId: userProfile?.agenId || DEFAULT_AGEN_ID,
    nama: userProfile?.nama || "Pengguna",
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
