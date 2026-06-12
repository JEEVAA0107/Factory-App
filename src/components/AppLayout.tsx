import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import { BarChart3, Settings as SettingsIcon, Factory } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Factory size={18} className="text-primary" />
          <span className="font-bold text-lg text-primary tracking-tighter">FactoryFlow</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => navigate("/reports")} 
            className="p-2 hover:bg-card rounded-lg transition-colors text-muted-foreground hover:text-primary"
          >
            <BarChart3 size={20} />
          </button>
          <button 
            onClick={() => navigate("/settings")} 
            className="p-2 hover:bg-card rounded-lg transition-colors text-muted-foreground hover:text-primary"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 pb-20">
        {children}
      </main>

      <BottomNav />
    </div>
  );
};

export default AppLayout;
