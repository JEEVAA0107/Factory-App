import AppLayout from "@/components/AppLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { User, Globe, Layers, Package, LogOut, ChevronRight, Save, X, Moon, Sun, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";

const Settings = () => {
  const navigate = useNavigate();
  const { signOut, userProfile, setUserProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // States
  const [loading, setLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState(false);
  const [editingStages, setEditingStages] = useState(false);
  const [editingRoles, setEditingRoles] = useState(false);

  // Form Data
  const [name, setName] = useState("");
  const [role, setRole] = useState("worker");
  const [threshold, setThreshold] = useState(10);
  const [stages, setStages] = useState<string[]>([]);
  const [workerRoles, setWorkerRoles] = useState<string[]>([]);

  // Sync data from profile
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setRole(userProfile.role || "worker");
      setThreshold(userProfile.stockThreshold || 10);
      setStages(userProfile.productionStages || ["Cutting", "Stitching", "Dyeing", "Finishing", "Packing"]);
      setWorkerRoles(userProfile.workerRoles || ["Cutter", "Stitcher", "Dyer", "Finisher", "Packer"]);
    }
  }, [userProfile]);

  const saveToFirestore = async (data: any) => {
    const uid = userProfile?.id || auth.currentUser?.uid;
    if (!uid) {
      toast.error("You must be logged in to save changes.");
      return;
    }
    setLoading(true);
    try {
      const docRef = doc(db, "Users", uid);
      await updateDoc(docRef, data);
      
      // Get fresh data
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const freshProfile = { ...snap.data(), id: uid } as any;
        setUserProfile(freshProfile);
      }
      
      toast.success("Changes saved!");
      return true;
    } catch (error: any) {
      console.error("Save error:", error);
      if (error.code === 'not-found') {
        const docRef = doc(db, "Users", uid);
        await setDoc(docRef, data, { merge: true });
        toast.success("Changes saved (Profile Created)!");
        return true;
      }
      toast.error("Error saving: " + (error.message || "Check your internet"));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-10">
        <h1 className="text-xl font-bold mb-4">Settings</h1>

        {/* 1. PROFILE SECTION */}
        <section className="bg-card rounded-2xl p-4 border border-border shadow-sm mb-4">
          {!editingProfile ? (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {name[0] || "?"}
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground uppercase font-bold">{role}</p>
              </div>
              <button onClick={() => setEditingProfile(true)} className="text-xs font-bold text-primary px-3 py-2 bg-primary/5 rounded-lg active:scale-95 transition-transform">
                Edit
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">Edit Profile</span>
                <X size={18} className="text-muted-foreground cursor-pointer" onClick={() => setEditingProfile(false)} />
              </div>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary outline-none" 
                placeholder="Full Name" 
              />
              <div className="flex gap-2">
                {["owner", "worker"].map(r => (
                  <button 
                    key={r} 
                    onClick={() => setRole(r)} 
                    className={`flex-1 h-11 rounded-xl text-xs font-bold transition-all ${role === r ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
              <button 
                onClick={async () => {
                  const ok = await saveToFirestore({ name, role });
                  if (ok) setEditingProfile(false);
                }} 
                disabled={loading}
                className="w-full h-12 bg-primary text-white rounded-xl font-bold active:scale-[0.98] transition-transform shadow-lg shadow-primary/10"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </section>

        {/* 2. APPEARANCE (NEW) */}
        <section className="bg-card rounded-2xl border border-border shadow-sm mb-4 overflow-hidden">
          <div className="w-full flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sun size={20} className="dark:hidden" />
              <Moon size={20} className="hidden dark:block" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-foreground">Appearance</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{theme} mode active</p>
            </div>
            <div className="flex gap-1 bg-muted p-1 rounded-xl">
              <button 
                onClick={() => setTheme("light")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${theme === 'light' ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`}
              >
                Light
              </button>
              <button 
                onClick={() => setTheme("dark")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${theme === 'dark' ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`}
              >
                Dark
              </button>
            </div>
          </div>
        </section>

        {/* 3. PRODUCTION STAGES */}
        <section className="bg-card rounded-2xl border border-border shadow-sm mb-4 overflow-hidden">
          <button onClick={() => setEditingStages(!editingStages)} className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
              <Layers size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-foreground">Production Stages</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{stages.length} Stages</p>
            </div>
            <ChevronRight size={18} className={`text-muted-foreground transition-transform ${editingStages ? "rotate-90" : ""}`} />
          </button>
          
          {editingStages && (
            <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4 animate-in slide-in-from-top-2">
              <div className="flex flex-wrap gap-2">
                {stages.map((s, i) => (
                  <span key={i} className="bg-muted px-3 py-1.5 rounded-lg text-xs font-medium text-foreground flex items-center gap-2">
                    {s} <X size={14} className="text-danger cursor-pointer" onClick={() => setStages(stages.filter((_, idx) => idx !== i))} />
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  id="stage-in" 
                  type="text" 
                  placeholder="New Stage Name..." 
                  className="flex-1 h-11 px-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none" 
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById("stage-in") as HTMLInputElement;
                    if (input.value) { setStages([...stages, input.value]); input.value = ""; }
                  }} 
                  className="px-4 bg-primary text-white rounded-xl text-xs font-bold active:scale-95"
                >
                  Add
                </button>
              </div>
              <button onClick={() => saveToFirestore({ productionStages: stages })} disabled={loading} className="w-full h-11 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/15 transition-colors">
                Save All Stages
              </button>
            </div>
          )}
        </section>


        <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 bg-muted text-muted-foreground rounded-2xl border border-border mt-6 active:scale-[0.98] transition-all">
          <div className="w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center">
            <LogOut size={20} />
          </div>
          <span className="font-bold text-sm">Sign Out</span>
        </button>
      </div>
    </AppLayout>
  );
};

export default Settings;
