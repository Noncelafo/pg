import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useSearch } from "wouter";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LogoMark } from "@/components/logo";
import { usePageTitle } from "@/components/page-title";
import { BrandPhoto } from "@/components/media/brand-photo";
import { FOTO } from "@/lib/brand-media";

const loginSchema = z.object({
  username: z.string().min(1, "Scrivi il tuo nome utente o la tua email"),
  password: z.string().min(1, "La password è obbligatoria"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Ripeti la password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  usePageTitle("Accedi o unisciti");
  const search = useSearch();
  const [tab, setTab] = useState(new URLSearchParams(search).get("tab") === "register" ? "register" : "login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", name: "", password: "", confirmPassword: "" },
  });

  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);

  return (
    <div className="mx-auto grid max-w-5xl items-stretch gap-8 px-4 py-10 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden rounded-[2rem] lg:block">
        <BrandPhoto src={FOTO.accesso.src} alt={FOTO.accesso.alt} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-8 pt-24 text-white">
          <p className="font-heading text-3xl">Resta con me.</p>
          <p className="mt-1 text-white/90">Tu sei il mio animale, e resti con me ovunque io sia.</p>
        </div>
      </div>
      <div className="soft-card mx-auto w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 text-center">
          <LogoMark className="mx-auto mb-3 h-14 w-14" />
          <h1 className="text-3xl">{tab === "login" ? "Bentornato!" : "Benvenuto in famiglia!"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "login" ? "I tuoi amici ti stavano aspettando." : "Crea il tuo account: ci vuole un attimo."}
          </p>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="login">Accedi</TabsTrigger>
            <TabsTrigger value="register">Unisciti</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4">
                <FormField control={loginForm.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome utente o email</FormLabel>
                    <FormControl><Input autoComplete="username" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={loginForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" size="lg" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Un attimo…" : "Entra"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="register">
            <Form {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(({ confirmPassword: _c, ...data }) => registerMutation.mutate(data))}
                className="space-y-4"
              >
                <FormField control={registerForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Come ti chiami?</FormLabel>
                    <FormControl><Input placeholder="Il tuo nome" autoComplete="name" {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome utente</FormLabel>
                    <FormControl><Input autoComplete="username" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ripeti la password</FormLabel>
                    <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" size="lg" className="w-full" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Un attimo…" : "Crea il mio account"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
