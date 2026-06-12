import { useState, useEffect } from "react";
import { Factory, Smartphone, User, Shield, ArrowRight, Mail, Phone, Lock, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile, createUserProfile } from "@/services/usersService";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type LoginType = "phone";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [step, setStep] = useState<"input" | "otp">("input");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [profileForm, setProfileForm] = useState({ name: "", role: "owner" as "owner" | "worker" });

  const navigate = useNavigate();
  const { user, setUserProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user && !showProfileSetup) {
      navigate("/", { replace: true });
    }
  }, [user, navigate, showProfileSetup]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handlePhoneStart = async () => {
    if (!phoneNumber) {
      toast.error("Please enter phone number");
      return;
    }

    // Clean and format phone number
    let cleaned = phoneNumber.replace(/\D/g, "");
    let formattedPhone = phoneNumber.trim();

    if (!formattedPhone.startsWith('+')) {
      if (cleaned.length === 10) {
        formattedPhone = "+91" + cleaned;
      } else if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+" + cleaned;
      }
    }

    setLoading(true);
    try {
      // Clear any existing verifier to be safe
      if ((window as any).recaptchaVerifier) {
        try { (window as any).recaptchaVerifier.clear(); } catch (e) { }
        (window as any).recaptchaVerifier = null;
      }

      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
      (window as any).recaptchaVerifier = verifier;

      const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(result);
      setStep("otp");
      toast.success("OTP sent to " + formattedPhone);
    } catch (error: any) {
      console.error("Phone Auth Error:", error);
      let msg = error.message || "Failed to send OTP.";
      if (error.code === 'auth/invalid-phone-number') msg = "Invalid phone number format.";
      if (error.code === 'auth/too-many-requests') msg = "Too many attempts. Try again later.";
      if (error.code === 'auth/operation-not-allowed') msg = "Phone Auth is not enabled in Firebase Console.";

      toast.error(msg + " (" + (error.code || 'unknown') + ")");

      if ((window as any).recaptchaVerifier) {
        try { (window as any).recaptchaVerifier.clear(); } catch (e) { }
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      toast.error("Enter 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      if (!confirmationResult) throw new Error("No confirmation result");
      const result = await confirmationResult.confirm(otp);
      const uid = result.user.uid;
      const profile = await getUserProfile(uid);

      if (profile) {
        setUserProfile(profile);
        toast.success("Verified!");
        navigate("/", { replace: true });
      } else {
        setShowProfileSetup(true);
      }
    } catch (error: any) {
      console.error("OTP Error:", error);
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    if (!profileForm.name.trim()) {
      toast.error("Enter your name");
      return;
    }
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Not authenticated");
      const profile = await createUserProfile(uid, profileForm.name.trim(), profileForm.role);
      setUserProfile(profile);
      toast.success("Welcome to FactoryFlow!");
      navigate("/", { replace: true });
    } catch (error: any) {
      console.error("Profile error:", error);
      toast.error("Failed to create profile.");
    } finally {
      setLoading(false);
    }
  };

  if (showProfileSetup) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-[2rem] bg-primary flex items-center justify-center mb-8 shadow-2xl shadow-primary/30 rotate-6 transform hover:rotate-0 transition-transform duration-500">
          <Factory size={40} className="text-white -rotate-6" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black mb-3 tracking-tighter text-foreground">Complete Profile</h1>
          <p className="text-muted-foreground text-base font-medium px-4">
            Let's personalize your factory dashboard.
          </p>
        </div>

        <div className="w-full space-y-8">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block ml-1">Your Full Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full h-16 px-6 rounded-2xl border-2 border-border bg-card text-lg font-bold focus:outline-none focus:border-primary transition-all pr-4"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block ml-1">Your Factory Role</label>
              <div className="flex gap-3">
                {(["owner", "worker"] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setProfileForm({ ...profileForm, role })}
                    className={`flex-1 h-16 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-2 ${profileForm.role === role
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                        : "bg-card text-muted-foreground border-border hover:border-primary/30"
                      }`}
                  >
                    {role === "owner" ? <Shield size={18} strokeWidth={3} /> : <User size={18} strokeWidth={3} />}
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleProfileSubmit}
            disabled={loading}
            className="w-full h-18 py-5 rounded-[1.5rem] bg-primary text-white font-black text-xl active:scale-[0.97] transition-all shadow-2xl shadow-primary/30 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Workspace</span>
                <ArrowRight size={22} strokeWidth={3} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Subtle brand background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-primary/5 -skew-y-6 transform origin-top-left -z-10" />
      
      <div id="recaptcha-container"></div>
      
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        {step === "otp" ? (
          <div className="space-y-6">
            <div className="bg-card p-8 rounded-[2rem] border border-border shadow-xl">
              <button 
                onClick={() => setStep("input")}
                className="mb-6 w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mx-auto">
                <Smartphone size={32} className="text-primary" />
              </div>
              
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2 tracking-tight">Verify Number</h1>
                <p className="text-muted-foreground text-sm font-medium">
                  Enter the code sent to <br/>
                  <span className="text-foreground font-bold">{phoneNumber}</span>
                </p>
              </div>

              <div className="space-y-8 flex flex-col items-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(val) => setOtp(val)}
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot 
                        key={index} 
                        index={index} 
                        className="w-11 h-14 text-xl font-bold rounded-xl border-2 border-muted bg-background text-foreground" 
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length < 6}
                  className="w-full h-14 bg-primary text-white rounded-2xl font-bold active:scale-[0.98] transition-transform shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enter Workspace</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
                
                <button 
                  className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                  onClick={handlePhoneStart}
                >
                  Resend OTP Code
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Minimal Header */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                <Factory size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">FactoryFlow</h1>
              <p className="text-muted-foreground text-sm font-medium mt-1">Simple Factory Management</p>
            </div>

            {/* Login Card */}
            <div className="bg-card p-8 rounded-[2rem] border border-border shadow-xl">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block ml-1">Phone Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-12 flex items-center pointer-events-none border-r border-border my-3 pr-3">
                      <span className="text-foreground font-bold text-base">+91</span>
                    </div>
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      onKeyDown={(e) => e.key === 'Enter' && handlePhoneStart()}
                      className="w-full h-14 pl-24 pr-4 rounded-xl border border-input bg-background text-foreground text-lg font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePhoneStart}
                  disabled={loading}
                  className="w-full h-14 bg-primary text-white rounded-2xl font-bold active:scale-[0.98] transition-transform shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send OTP Message</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Or</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("use_mock_data", "true");
                    toast.success("Welcome to Demo Mode!");
                    window.location.reload();
                  }}
                  className="w-full h-14 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-2xl font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-border"
                >
                  <span>Explore App in Demo Mode</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-50">
                Authorized Access Only
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
