import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FABProps {
  to: string;
}

const FAB = ({ to }: FABProps) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
    >
      <Plus size={28} />
    </button>
  );
};

export default FAB;
