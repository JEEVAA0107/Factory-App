import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffect, ReactNode } from "react";
import { App as CapacitorApp } from "@capacitor/app";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import AddOrder from "./pages/AddOrder";
import Production from "./pages/Production";
import Inventory from "./pages/Inventory";
import AddStock from "./pages/AddStock";
import Workers from "./pages/Workers";
import AddWorker from "./pages/AddWorker";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/contexts/ThemeContext";

const queryClient = new QueryClient();

// Back Button Handler Component
const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleBackButton = async () => {
      // If we are at the root (dashboard or login), we exit the app
      if (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/dashboard") {
        CapacitorApp.exitApp();
      } else {
        // Otherwise, go back one step in history
        navigate(-1);
      }
    };

    const listener = CapacitorApp.addListener("backButton", handleBackButton);

    return () => {
      listener.then((l) => l.remove());
    };
  }, [location, navigate]);

  return null;
};

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
    <Route path="/orders/add" element={<ProtectedRoute><AddOrder /></ProtectedRoute>} />
    <Route path="/production" element={<ProtectedRoute><Production /></ProtectedRoute>} />
    <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
    <Route path="/inventory/add" element={<ProtectedRoute><AddStock /></ProtectedRoute>} />
    <Route path="/workers" element={<ProtectedRoute><Workers /></ProtectedRoute>} />
    <Route path="/workers/add" element={<ProtectedRoute><AddWorker /></ProtectedRoute>} />
    <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="factoryflow-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <BackButtonHandler />
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
