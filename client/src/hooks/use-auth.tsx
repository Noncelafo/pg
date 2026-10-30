import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import type { InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
};

type LoginData = { username: string; password: string };

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  loginMutation: UseMutationResult<AuthUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<AuthUser, Error, InsertUser>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { data: user, isLoading } = useQuery<AuthUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Dopo un cambio di account i dati personali (coccole, seguiti…) vanno riletti
  const refreshPersonalData = () => {
    queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "/api/user" });
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => (await apiRequest("POST", "/api/login", credentials)).json(),
    onSuccess: (u: AuthUser) => {
      queryClient.setQueryData(["/api/user"], u);
      refreshPersonalData();
      toast({ title: `Bentornato${u.name ? `, ${u.name}` : ""}! 🐾`, description: "Gli amici ti stavano aspettando." });
    },
    onError: (error: Error) => toast({ title: "Accesso non riuscito", description: error.message, variant: "destructive" }),
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => (await apiRequest("POST", "/api/register", data)).json(),
    onSuccess: (u: AuthUser) => {
      queryClient.setQueryData(["/api/user"], u);
      refreshPersonalData();
      toast({ title: "Benvenuto in famiglia! 🎉", description: "Il tuo account è pronto." });
    },
    onError: (error: Error) => toast({ title: "Registrazione non riuscita", description: error.message, variant: "destructive" }),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/logout"); },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      refreshPersonalData();
      toast({ title: "A presto! 👋", description: "Ti aspettiamo con le coccole pronte." });
    },
    onError: (error: Error) => toast({ title: "Uscita non riuscita", description: error.message, variant: "destructive" }),
  });

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, loginMutation, logoutMutation, registerMutation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
