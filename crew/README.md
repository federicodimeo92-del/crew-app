# 🔥 Crew — Setup & Deploy

Tutti i passaggi per mettere online l'app in ~10 minuti.

---

## 1. Icone PWA (obbligatorio per installazione)

L'app ha bisogno di due icone PNG nella cartella principale:
- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)

**Come crearle velocemente:**
1. Vai su [favicon.io/emoji-favicons](https://favicon.io/emoji-favicons/)
2. Cerca "fire" (🔥), scarica il pacchetto
3. Rinomina i file con i nomi corretti e mettili nella cartella `crew/`

In alternativa usa [realfavicongenerator.net](https://realfavicongenerator.net).

---

## 2. Firestore: crea gli indici

Firebase richiede indici composti per alcune query. Vai su **Firestore → Indici** e crea:

| Collection  | Campo 1     | Campo 2    | Ordine    |
|-------------|-------------|------------|-----------|
| `events`    | `groupId`   | `date`     | Ascending |
| `notifications` | `toUserId` | `createdAt` | Descending |
| `notifications` | `toUserId` | `read` + `createdAt` | — |

Oppure: quando Firebase lancia un errore nella console del browser con link diretto, clicca il link → si crea automaticamente.

---

## 3. Firestore: regole di sicurezza

Vai su **Firestore → Regole** e sostituisci con:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Utenti: leggono tutti gli autenticati, scrivono solo su se stessi
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    // Gruppi: leggono i membri, scrivono gli autenticati
    match /groups/{groupId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    // Eventi + sottocollezioni
    match /events/{eventId} {
      allow read, write: if request.auth != null;
      match /{subcol}/{docId} {
        allow read, write: if request.auth != null;
      }
    }
    // Notifiche
    match /notifications/{notifId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 4. Deploy su Vercel

1. Vai su [vercel.com](https://vercel.com) → New Project
2. Trascina la cartella `crew/` nella zona di upload
3. Click **Deploy**
4. Vercel ti dà un URL tipo `crew-abc123.vercel.app`

L'app è online! 🎉

---

## 5. Imposta il tuo account come Admin

Dopo il **primo login** con il tuo Google Account:

1. Vai su Firebase Console → **Firestore**
2. Apri la collection `users`
3. Trova il tuo documento (cerca per email)
4. Modifica il campo `role` → `"admin"`

Da quel momento vedrai il bottone **"+ Nuovo gruppo"** nell'app.

> **Nota:** Il PRIMO utente a fare login viene automaticamente impostato come admin.
> Se sei il primo, non hai bisogno di fare niente manualmente.

---

## 6. Condividi il link invito

1. Crea un gruppo nell'app
2. Vedrai il codice invito (es: `AB3K7PQR`)
3. Clicca **"📋 Copia link"**
4. Invia il link ai tuoi amici su WhatsApp/Telegram

Quando aprono il link e fanno login, entrano automaticamente nel gruppo.

---

## Note tecniche

- **Foto copertina:** vengono compresse a 900px / 72% qualità prima di essere salvate in Firestore (no Storage necessario). Max ~150KB per foto.
- **Notifiche push in background** (quando l'app è chiusa): richiedono un passaggio aggiuntivo con Firebase Admin SDK. Funzionano già le notifiche **in-app** (campanellina).
- **Limite 20 utenti per gruppo:** Firestore ha un limite di 1MB per documento. Gli array `members` con foto e nomi rimangono abbondantemente sotto quel limite per 20 persone.

---

## Struttura Firestore

```
users/{uid}
  - displayName, email, photoURL, role, groups[], createdAt

groups/{gid}
  - name, emoji, inviteCode, createdBy, members[], createdAt

events/{eid}
  - groupId, title, date, time, location, organizer
  - description, coverUrl (base64), createdBy, createdAt
  + rsvp/{uid}        → status, name, photoURL, updatedAt
  + items/{iid}       → text, assignedTo, assignedName, assignedPhoto
  + comments/{cid}    → text, authorId, authorName, authorPhoto, mentions[]

notifications/{nid}
  - toUserId, type, eventId, eventTitle, text, read, createdAt
```
