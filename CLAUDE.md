# Resta con me — memoria di progetto

Social network per animali, **vivi e non**. Ogni animale ha un profilo; quando muore il proprietario lo "accompagna sul **Ponte dell'Arcobaleno**" e il profilo si sposta nei Prati dell'Arcobaleno (foto, post e coccole restano). Nato il 30/10/2026 da Sara, riusando l'infrastruttura di **Vivo con te** (repo `Noncelafo/vivoconte`, stesso stack e stesse lezioni).

## 0. Come lavorare con Sara
- Si parla **in italiano**; Sara non è sviluppatrice: istruzioni passo passo, niente gergo, risposte brevi.
- **Chiedere conferma prima** di azioni irreversibili o di infrastruttura (DB di produzione, costi, cancellazioni, testi legali).
- Dopo ogni modifica: provarla in locale (`PORT=5055 npm run dev`), commit in italiano con le righe di attribuzione, push.
- A fine sessione aggiornare questo file.

## 1. Comunicazione (decisione chiave)
Messaggio **gioioso e positivo**: «tu sei il mio animale e resti con me ovunque io sia».
- Mai "morto", "cimitero", "lutto", "addio" in senso definitivo. Si dice: *attraversare il Ponte*, *Prati dell'Arcobaleno*, *resta con te*, *luce*, *dedica*.
- Il passaggio sul Ponte è un viaggio che continua, non una fine (vedi `rainbow-dialog.tsx`).
- Evitare il genere grammaticale dell'animale (niente "partito/partita"): usare forme neutre ("ha attraversato il Ponte").
- Lessico: like = **coccole**, commenti = **parole dolci**, seguire = **amici**, mi piace sul Ponte = **luce** (una al giorno per persona), messaggi sul Ponte = **dediche**.
- Palette: corallo (primario), sole, cielo, menta, lilla su crema; font Fredoka (titoli) + Nunito. Il Ponte usa `.rainbow-sky` / `.rainbow-bar`. **Non mettere emoji dentro `.rainbow-text`** (si rompono).

## 2. Stack (identico a Vivo con te, semplificato)
React 18 + Vite + Tailwind/shadcn + wouter + TanStack Query · Express + Passport (sessioni in Postgres) · Drizzle/Postgres · ffmpeg-static per ottimizzare le foto (WebP, lato lungo 1600) · deploy Railway (`nixpacks.toml`, `railway.json`, Node ≥ 20).
- Comandi: `npm run dev` (porta 5000, `PORT` per cambiarla), `npm run build`, `npm run check` (tsc, oggi pulito).
- `.env` locale: `DATABASE_URL`, `SESSION_SECRET` (≥ 32 caratteri **obbligatorio in produzione**). Vedi `.env.example`.
- Foto caricate: sempre via `dataDir()/uploadsDir()` (mai `process.cwd()`); su Railway `DATA_DIR=/app/data` (volume).
- **Schema DB**: `shared/schema.ts` + gli stessi `CREATE TABLE IF NOT EXISTS` in `server/schema-updates.ts` (eseguiti all'avvio, idempotenti). **Non usare `drizzle-kit push` in produzione** (vuole eliminare la tabella `session`). Per una colonna nuova: aggiungere la riga `ALTER TABLE … ADD COLUMN IF NOT EXISTS` in `schema-updates.ts` **e** in `schema.ts`.
- Railway blocca le porte SMTP: se servirà l'email, usare l'API HTTP di Brevo come in Vivo con te.

## 3. Struttura
- `shared/schema.ts` (tabelle, validazioni zod, tipi API condivisi), `shared/species.ts` (specie + emoji).
- `server/routes.ts` (API), `queries.ts` (post/profili con conteggi), `auth.ts` (registrazione/login con nome utente **o email**, limite tentativi), `profanity.ts` (filtro parolacce, da Vivo con te), `vite.ts` (SEO dinamica per `/pet/:id`).
- `client/src/pages/`: landing/home, `esplora`, `ponte`, `pet-profile`, `pet-new`, `pet-edit`, `miei-animali`, `auth-page`.
- Pagina nuova ⇒ aggiungerla anche in `staticSeo` di `server/vite.ts` se pubblica.
- Modello dati: users → pets (status `alive`|`rainbow`) → posts → cuddles/comments; follows; lights (1/giorno/persona); tributes; reports.
- Regole: solo il proprietario posta a nome dell'animale; commenti/dediche eliminabili da autore, proprietario o admin; tutti i testi passano dal filtro parolacce.
- **Riporta tra noi** (`POST /api/pets/:id/return`, solo proprietario/admin): annulla un passaggio sul Ponte fatto per errore. Luci e dediche **non** si cancellano: restano nel DB, nascoste finché il profilo è "alive".

## 3b. Foto e video del sito (decisione di Sara del 30/10: il sito deve essere molto fotografico ed emozionale)
- Elenco unico in `client/src/lib/brand-media.ts`: per ogni spazio c'è il percorso del file, il testo alternativo e le parole chiave `cerca` per trovarlo su Pexels/Mixkit (licenza gratuita anche commerciale).
- File (31/10: le **10 foto ci sono**, **vere** (non AI: decisione di Sara del 1/11, le piccole cose che rendono felici devono essere reali), prese da Unsplash (licenza Unsplash, gratuita anche commerciale) e compresse a lato lungo 1600, JPG 100-360 KB; ID Unsplash: momento-1..6 = photo-1586537333626-238ebc85e19f, 1650860348894-df6aa1936076, 1610415221895-eae9db54b497, 1667017897583-307b78a79be1, 1779888111319-d50cc7414dc4, 1672041009119-d9c2db12b593; profilo = 1631413120698-96c6571ed9f6, coccole = 1496284427489-f59461d8a8e6, ponte = 1783441286721-893acb9a5a46, accesso = 1579119134757-5c38803f34fc (le vecchie foto AI sono in `_raw/`); i **4 video ci sono**, clip gratuite di Pexels (licenza Pexels) scelte a mano e compresse a 720p, max 15 s, senza audio, con anteprima .jpg: hero-corsa = Pexels 5469099, insieme = 5894717, ponte-tramonto = 4139459, ponte-abbraccio = 8498668; originali in `_raw/`, ignorata da git): `client/public/brand/video/{hero-corsa,insieme,ponte-tramonto,ponte-abbraccio}.mp4` (+ `.jpg` della prima immagine con lo stesso nome) e `client/public/brand/foto/{momento-1..6,funzione-profilo,funzione-coccole,funzione-ponte,accesso}.jpg`.
- Dove compaiono: home (video a tutto schermo, mosaico "Momenti", schede con foto, video "Insieme", anteprima del Ponte con video), Ponte (video in apertura + sezione video con persone e animali), pagina di accesso.
- Video: orizzontali, 10-20 s, senza scritte; prima di metterli comprimerli a 720p (~2-4 MB) con ffmpeg-static e ricavare il `.jpg` di anteprima. `BrandVideo` li fa partire solo quando sono visibili, muti e in loop; con "riduci movimento" mostra l'immagine ferma.
- **La rete di questo ambiente blocca pexels.com, mixkit.co, pixabay.com e unsplash.com**: per scaricarli Sara deve aggiungere quei domini nelle impostazioni di rete dell'ambiente, oppure caricare i file in una cartella Google Drive.
- Anche i contenuti degli utenti sono più fotografici: schede animale a foto piena, scheda "Foto" (galleria con ingrandimento) nel profilo, e sul Ponte una presentazione automatica "I momenti più belli di …" con le foto dei suoi post.

## 3c. Braccialetto NFC e negozio (decisione di Sara del 1/11: serve qualcosa da vendere)
- Idea: braccialetto con perlina grande, chip NFC dentro (NTAG213), nome o simbolo inciso (zampina, cagnolino, gattino, coniglietto, cuore) e colore. Avvicini il telefono e si apre il profilo; fa da filo conduttore a «resta con me ovunque io sia», anche dopo il Ponte. Niente metallo (blocca il segnale).
- Il chip contiene solo `/p/:id` (indirizzo breve in `server/routes.ts`, reindirizza a `/pet/:id?nfc=1`): non va mai riscritto.
- Fatto: pagina `/negozio` (personalizzatore con anteprima `components/shop/bracelet-art.tsx`, SVG su fondo trasparente), prenotazioni senza pagamento (`orders`, `/api/orders`), pagina `/ordini` (le mie; per gli admin tutte, con cambio stato), braccialetto sopra al video nella home e sezione dedicata. Catalogo e prezzo in `shared/shop.ts` (`PRICE_EURO` è `null`: da decidere).
- **Non fatto**: pagamento (serve account Stripe/PayPal di Sara), email di conferma, indirizzo di spedizione, termini di vendita/recesso/partita IVA (**da Sara/consulente: non inventarli**), foto vera del prototipo da mettere al posto dell'illustrazione SVG.
- Produzione: da decidere dopo i campioni. Piano: primi pezzi assemblati a mano (chip da ShopNFC/d-logic, perline da Naturali Import), in parallelo campioni da Cintapunto, braccialettirfid.com e fabbriche cinesi (Jiarfidtag, Fujian RFID Factory; MOQ 100-500). Prezzi visti negli annunci, non verificati.

## 4. Stato (30/10/2026, sera)
**Fatto e provato** (curl + browser Chrome, desktop e mobile): registrazione/login, profili animali (foto profilo e copertina), post con foto, coccole, commenti, seguire, feed "Per te"/"Chi segui", esplora con filtri, passaggio sul Ponte, luci, dediche, "Ricordi dal Ponte", segnalazioni (salvate in tabella), "Riporta tra noi", galleria foto e presentazione sul Ponte, video di sfondo (provati con file sintetici), build di produzione.
**Non ancora fatto**
1. Nome definitivo/dominio, logo vero (ora cuore+zampa SVG provvisorio), repo collegato a Railway + variabili (`DATABASE_URL`, `SESSION_SECRET`, `DATA_DIR`, `BASE_URL`) + volume.
2. **Pannello admin** per le segnalazioni (la tabella `reports` si riempie ma nessuno la legge) e moderatori; `is_admin` si imposta a mano nel DB.
3. Termini, privacy e cookie (**da Sara/consulente: non inventarli**), maggiore età/consenso, verifica email, recupero password, anteprima privata (da Vivo con te: `private-mode.ts`).
4. Notifiche (nuova coccola/commento, ricorrenze: compleanno e anniversario sul Ponte), PWA installabile (da Vivo con te), più foto per post, ricerca persone.
5. Foto e video del sito: fatti (vedi §3b); eventualmente sostituire le clip Pexels con riprese originali.
6. Test automatici: oggi solo prove manuali.
