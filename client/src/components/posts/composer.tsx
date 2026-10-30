import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";
import type { PetSummary } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PetAvatar } from "@/components/pets/pet-avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

/** Il riquadro "cosa combina oggi?" per scrivere a nome di uno dei propri animali. */
export function Composer({ pets, defaultPetId }: { pets: PetSummary[]; defaultPetId?: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [petId, setPetId] = useState<number>(defaultPetId ?? pets[0].id);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const pet = pets.find((p) => p.id === petId) ?? pets[0];
  const rainbow = pet.status === "rainbow";

  function pick(f: File | undefined) {
    if (!f) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function clearFile() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (input.current) input.current.value = "";
  }

  const publish = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.set("petId", String(petId));
      if (text.trim()) form.set("text", text.trim());
      if (file) form.set("image", file);
      await apiRequest("POST", "/api/posts", form);
    },
    onSuccess: () => {
      setText("");
      clearFile();
      qc.invalidateQueries();
      toast({ title: "Pubblicato! 🎉", description: `${pet.name} ha un nuovo post.` });
    },
    onError: (e: Error) => toast({ title: "Non riesco a pubblicare", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="soft-card space-y-3 p-4" data-testid="composer">
      <div className="flex items-center gap-3">
        <PetAvatar pet={pet} />
        {pets.length > 1 ? (
          <Select value={String(petId)} onValueChange={(v) => setPetId(Number(v))}>
            <SelectTrigger className="w-auto min-w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {pets.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}{p.status === "rainbow" ? " 🌈" : ""}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <span className="font-heading text-lg">{pet.name}</span>
        )}
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={rainbow ? `Un ricordo di ${pet.name}…` : `Cosa combina oggi ${pet.name}?`}
        rows={3}
        maxLength={1000}
      />
      {preview && (
        <div className="relative">
          <img src={preview} alt="Anteprima" className="max-h-72 w-full rounded-2xl object-cover" />
          <button
            type="button"
            onClick={clearFile}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"
            aria-label="Togli la foto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => pick(e.target.files?.[0])} />
        <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
          <ImagePlus /> Foto
        </Button>
        <Button onClick={() => publish.mutate()} disabled={publish.isPending || (!text.trim() && !file)} data-testid="publish">
          {publish.isPending ? "Pubblico…" : "Pubblica"}
        </Button>
      </div>
    </div>
  );
}
