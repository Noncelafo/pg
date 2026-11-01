import { useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Flag, Home, ImagePlus, MoreHorizontal, Pencil, Rainbow, Smartphone, Trash2, UserCheck, UserPlus } from "lucide-react";
import type { PetProfile } from "@shared/schema";
import { speciesInfo } from "@shared/species";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PetAvatar } from "@/components/pets/pet-avatar";
import { Composer } from "@/components/posts/composer";
import { PostList } from "@/components/posts/post-list";
import { LightButton } from "@/components/bridge/light-button";
import { Tributes } from "@/components/bridge/tributes";
import { RainbowDialog } from "@/components/bridge/rainbow-dialog";
import { ReportDialog } from "@/components/report-dialog";
import { PhotoGrid, usePetPhotos } from "@/components/pets/photo-grid";
import { MemorySlideshow } from "@/components/bridge/memory-slideshow";
import { usePageTitle } from "@/components/page-title";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ageLabel, lifeSpanLabel, longDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import NotFound from "./not-found";

export default function PetProfilePage() {
  const [, params] = useRoute("/pet/:id");
  const id = Number(params?.id);
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [rainbowOpen, setRainbowOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const key = [`/api/pets/${id}`];
  const { data: pet, isLoading, isError } = useQuery<PetProfile>({ queryKey: key, staleTime: 0 });
  const { data: photos } = usePetPhotos(id);
  usePageTitle(pet ? (pet.status === "rainbow" ? `${pet.name} sul Ponte dell'Arcobaleno` : pet.name) : undefined);

  const follow = useMutation({
    mutationFn: async (next: boolean) => { await apiRequest(next ? "POST" : "DELETE", `/api/pets/${id}/follow`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); qc.invalidateQueries({ queryKey: ["posts"] }); },
    onError: (e: Error) => toast({ title: "Non è andata", description: e.message, variant: "destructive" }),
  });

  const upload = useMutation({
    mutationFn: async ({ kind, file }: { kind: "avatar" | "cover"; file: File }) => {
      const form = new FormData();
      form.set("file", file);
      await apiRequest("POST", `/api/pets/${id}/${kind}`, form);
    },
    onSuccess: () => { qc.invalidateQueries(); toast({ title: "Che bella foto! 📸" }); },
    onError: (e: Error) => toast({ title: "Foto non caricata", description: e.message, variant: "destructive" }),
  });

  const bringBack = useMutation({
    mutationFn: async () => { await apiRequest("POST", `/api/pets/${id}/return`); },
    onSuccess: () => { qc.invalidateQueries(); toast({ title: "Bentornato tra noi! 🐾", description: "Il profilo è di nuovo tra gli amici di oggi." }); },
    onError: (e: Error) => toast({ title: "Non è andata", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async () => { await apiRequest("DELETE", `/api/pets/${id}`); },
    onSuccess: () => { qc.invalidateQueries(); toast({ title: "Profilo eliminato" }); navigate("/miei-animali"); },
    onError: (e: Error) => toast({ title: "Non riesco a eliminarlo", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return <div className="mx-auto max-w-2xl space-y-4 px-4 py-6"><Skeleton className="h-64 rounded-3xl" /><Skeleton className="h-40 rounded-3xl" /></div>;
  }
  if (isError || !pet) return <NotFound />;

  const rainbow = pet.status === "rainbow";
  const info = speciesInfo(pet.species);
  const age = rainbow ? lifeSpanLabel(pet.birthDate, pet.rainbowAt) : ageLabel(pet.birthDate);
  const mine = [{ id: pet.id, name: pet.name, species: pet.species, breed: pet.breed, avatarUrl: pet.avatarUrl, status: pet.status, rainbowAt: pet.rainbowAt }];

  function pick(kind: "avatar" | "cover", file?: File) {
    if (file) upload.mutate({ kind, file });
  }

  const stat = (n: number, label: string) => (
    <div className="text-center">
      <p className="font-heading text-xl">{n}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );

  const posts = (
    <PostList
      url={`/api/pets/${pet.id}/posts`}
      empty={
        <div className="py-10 text-center text-muted-foreground">
          <p className="text-4xl" aria-hidden="true">{rainbow ? "🌈" : "📸"}</p>
          <p className="mt-2">{pet.isOwner ? `Nessun post ancora: racconta il primo momento di ${pet.name}!` : `${pet.name} non ha ancora pubblicato niente.`}</p>
        </div>
      }
    />
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => { pick("avatar", e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => { pick("cover", e.target.files?.[0]); e.target.value = ""; }} />

      <div className="soft-card overflow-hidden">
        <div
          className={cn("relative h-40 sm:h-52", !pet.coverUrl && (rainbow ? "rainbow-sky" : "bg-gradient-to-br from-[hsl(var(--sun)/.6)] via-[hsl(var(--coral)/.35)] to-[hsl(var(--sky)/.5)]"))}
        >
          {pet.coverUrl && <img src={pet.coverUrl} alt="" className="h-full w-full object-cover" />}
          {rainbow && <div className="rainbow-bar absolute inset-x-0 bottom-0 h-2" aria-hidden="true" />}
        </div>

        <div className="relative px-5 pb-5">
          <div className="-mt-12 flex items-end justify-between gap-3">
            <PetAvatar pet={pet} className="h-24 w-24 border-4 border-card text-5xl" />
            <div className="flex items-center gap-2 pb-1">
              {!pet.isOwner && user && (
                <Button
                  variant={pet.isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={() => follow.mutate(!pet.isFollowing)}
                  disabled={follow.isPending}
                  data-testid="follow"
                >
                  {pet.isFollowing ? <><UserCheck /> Lo segui</> : <><UserPlus /> Segui</>}
                </Button>
              )}
              {!user && (
                <Button size="sm" asChild><Link href="/auth"><UserPlus /> Segui</Link></Button>
              )}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Altre azioni" data-testid="pet-menu"><MoreHorizontal /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    {pet.isOwner ? (
                      <>
                        <DropdownMenuItem onClick={() => navigate(`/pet/${pet.id}/modifica`)}><Pencil className="mr-2 h-4 w-4" /> Modifica il profilo</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => avatarInput.current?.click()}><Camera className="mr-2 h-4 w-4" /> Cambia foto profilo</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => coverInput.current?.click()}><ImagePlus className="mr-2 h-4 w-4" /> Cambia copertina</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/negozio?pet=${pet.id}`)}><Smartphone className="mr-2 h-4 w-4" /> Braccialetto NFC di {pet.name}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {rainbow ? (
                          <DropdownMenuItem onClick={() => setReturnOpen(true)} data-testid="open-return">
                            <Home className="mr-2 h-4 w-4" /> È stato un errore? Riporta tra noi
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setRainbowOpen(true)} data-testid="open-rainbow">
                            <Rainbow className="mr-2 h-4 w-4" /> Accompagna sul Ponte
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="mr-2 h-4 w-4" /> Elimina il profilo</DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem onClick={() => setReportOpen(true)}><Flag className="mr-2 h-4 w-4" /> Segnala</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="mt-3">
            <h1 className="text-3xl">{pet.name}{rainbow && " 🌈"}</h1>
            <p className="text-sm text-muted-foreground">
              {info.emoji} {pet.breed || info.label}
              {age && (rainbow ? ` · ha regalato ${age} di coccole` : ` · ${age}`)}
              {" · "}di {pet.ownerName}
            </p>
          </div>

          {pet.bio && <p className="mt-4 whitespace-pre-wrap">{pet.bio}</p>}
          {pet.favoriteThings && (
            <p className="mt-3 rounded-2xl bg-accent px-4 py-3 text-sm">
              <span className="font-bold">💛 Le cose che ama:</span> {pet.favoriteThings}
            </p>
          )}

          <div className="mt-5 flex justify-around border-t pt-4">
            {stat(pet.posts, "Post")}
            {stat(pet.followers, pet.followers === 1 ? "Amico" : "Amici")}
            {rainbow && stat(pet.lights, pet.lights === 1 ? "Luce" : "Luci")}
          </div>
        </div>
      </div>

      {rainbow && (
        <div className="rainbow-sky mt-4 space-y-3 rounded-3xl p-6 text-center text-slate-800" data-testid="rainbow-banner">
          {photos && photos.length > 0 && <MemorySlideshow photos={photos} petName={pet.name} />}
          <p className="font-heading text-2xl"><span className="rainbow-text">Resta con noi, nel cuore</span> 🌈</p>
          <p className="text-sm">
            {pet.rainbowAt ? `${pet.name} ha attraversato il Ponte dell'Arcobaleno il ${longDate(pet.rainbowAt)}.` : `${pet.name} ha attraversato il Ponte dell'Arcobaleno.`}
            {" "}Ora corre felice nei Prati, e ogni luce che si accende lo fa scodinzolare di più.
          </p>
          {pet.rainbowMessage && (
            <blockquote className="mx-auto max-w-md rounded-2xl bg-white/70 px-4 py-3 text-left font-medium italic">
              “{pet.rainbowMessage}”
              <footer className="mt-1 text-right text-xs not-italic text-slate-600">— {pet.ownerName}</footer>
            </blockquote>
          )}
          <LightButton petId={pet.id} petName={pet.name} lightedToday={pet.lightedToday} />
        </div>
      )}

      <div className="mt-5 space-y-4">
        {pet.isOwner && <Composer pets={mine} defaultPetId={pet.id} />}
        {rainbow ? (
          <Tabs defaultValue="ricordi">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ricordi">Ricordi</TabsTrigger>
              <TabsTrigger value="foto">Foto</TabsTrigger>
              <TabsTrigger value="dediche">Dediche</TabsTrigger>
            </TabsList>
            <TabsContent value="ricordi" className="mt-4">{posts}</TabsContent>
            <TabsContent value="foto" className="mt-4"><PhotoGrid petId={pet.id} petName={pet.name} /></TabsContent>
            <TabsContent value="dediche" className="mt-4"><Tributes petId={pet.id} petName={pet.name} /></TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="post">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="post">Post</TabsTrigger>
              <TabsTrigger value="foto">Foto</TabsTrigger>
            </TabsList>
            <TabsContent value="post" className="mt-4">{posts}</TabsContent>
            <TabsContent value="foto" className="mt-4"><PhotoGrid petId={pet.id} petName={pet.name} /></TabsContent>
          </Tabs>
        )}
      </div>

      {pet.isOwner && !rainbow && <RainbowDialog petId={pet.id} petName={pet.name} open={rainbowOpen} onOpenChange={setRainbowOpen} />}
      {reportOpen && <ReportDialog target={{ petId: pet.id }} open onOpenChange={setReportOpen} />}
      <AlertDialog open={returnOpen} onOpenChange={setReturnOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Riportare {pet.name} tra noi?</AlertDialogTitle>
            <AlertDialogDescription>
              Se il passaggio sul Ponte è stato fatto per errore, {pet.name} torna tra gli amici di oggi, con tutte le foto e i post.
              Le luci e le dediche ricevute non vengono cancellate: restano messe da parte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => bringBack.mutate()} data-testid="confirm-return">Riporta tra noi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il profilo di {pet.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Spariranno per sempre anche foto, post, commenti{rainbow ? ", luci e dediche" : ""}. Se {pet.name} non è più con te,
              forse ti basta accompagnarlo sul Ponte dell'Arcobaleno: così tutti i ricordi restano al sicuro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Lo tengo</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Elimina per sempre
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
