import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  back?: boolean;
}

const PageHeader = ({ title, back }: PageHeaderProps) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background sticky top-0 z-30">
      {back && (
        <button onClick={() => navigate(-1)} className="touch-target flex items-center justify-center -ml-2">
          <ArrowLeft size={24} />
        </button>
      )}
      <h1 className="text-xl font-bold">{title}</h1>
    </div>
  );
};

export default PageHeader;
