import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { petInputSchema } from "@shared/schema";
import { SPECIES } from "@shared/species";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export interface PetFormValues {
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  bio?: string;
  favoriteThings?: string;
}

export function PetForm({
  defaults,
  submitLabel,
  pending,
  onSubmit,
}: {
  defaults?: Partial<PetFormValues>;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: PetFormValues) => void;
}) {
  const form = useForm<PetFormValues>({
    resolver: zodResolver(petInputSchema) as never,
    defaultValues: { name: "", species: "", breed: "", birthDate: "", bio: "", favoriteThings: "", ...defaults },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Come si chiama?</FormLabel>
            <FormControl><Input placeholder="Briciola" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="species" render={({ field }) => (
          <FormItem>
            <FormLabel>Che amico è?</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl><SelectTrigger><SelectValue placeholder="Scegli la specie" /></SelectTrigger></FormControl>
              <SelectContent>
                {SPECIES.map((s) => <SelectItem key={s.id} value={s.id}>{s.emoji} {s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField control={form.control} name="breed" render={({ field }) => (
            <FormItem>
              <FormLabel>Razza (se ce l'ha)</FormLabel>
              <FormControl><Input placeholder="Meticcio, Europeo, Nano…" {...field} value={field.value ?? ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="birthDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Data di nascita</FormLabel>
              <FormControl><Input type="date" max={new Date().toISOString().slice(0, 10)} {...field} value={field.value ?? ""} /></FormControl>
              <FormDescription>Anche approssimativa va benissimo.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="bio" render={({ field }) => (
          <FormItem>
            <FormLabel>La sua storia</FormLabel>
            <FormControl><Textarea rows={4} placeholder="Come vi siete incontrati? Che carattere ha?" {...field} value={field.value ?? ""} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="favoriteThings" render={({ field }) => (
          <FormItem>
            <FormLabel>Le cose che ama</FormLabel>
            <FormControl><Textarea rows={2} placeholder="I croccantini, la palla gialla, dormire sul divano…" {...field} value={field.value ?? ""} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Un attimo…" : submitLabel}</Button>
      </form>
    </Form>
  );
}
