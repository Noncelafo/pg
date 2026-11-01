import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import Footer from "@/components/layout/footer";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import Esplora from "@/pages/esplora";
import Ponte from "@/pages/ponte";
import Negozio from "@/pages/negozio";
import Ordini from "@/pages/ordini";
import PetProfilePage from "@/pages/pet-profile";
import PetNew from "@/pages/pet-new";
import PetEdit from "@/pages/pet-edit";
import MieiAnimali from "@/pages/miei-animali";
import NotFound from "@/pages/not-found";

// Cambiando pagina si riparte sempre dall'alto
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/esplora" component={Esplora} />
      <Route path="/ponte" component={Ponte} />
      <Route path="/negozio" component={Negozio} />
      <ProtectedRoute path="/ordini" component={Ordini} />
      <Route path="/pet/:id" component={PetProfilePage} />
      <ProtectedRoute path="/pet/:id/modifica" component={PetEdit} />
      <ProtectedRoute path="/nuovo-animale" component={PetNew} />
      <ProtectedRoute path="/miei-animali" component={MieiAnimali} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <div className="site-shell flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 overflow-x-clip">
              <ScrollToTop />
              <Router />
            </main>
            <Footer />
            <BottomNav />
          </div>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
