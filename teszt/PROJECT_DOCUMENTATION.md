# Piactér Projekt dokumentáció

## Projekt célja

A projekt célja egy kézműves termékeket értékesítő piactér létrehozása.
A felhasználók regisztrálhatnak, termékeket tölthetnek fel, kereshetnek, kedvencként menthetnek termékeket, és üzenetet küldhetnek egymásnak.

- A piactér fő célja a vevő és eladó közötti közvetlen kommunikáció támogatása.
- A fizetést és a termék átvételét a felek egymás között intézik, nincs beépített oldalakon történő fizetés.
- Az adásvétel részleteit (átadás, szállítás, fizetés) az üzenetküldésen keresztül egyeztetik a felhasználók.

## Használt technológiák

### Backend

- Node.js
- Express
- MongoDB / Mongoose
- Socket.IO (valós idejű üzenetküldés)
- JWT (`jsonwebtoken`) hitelesítéshez
- `bcryptjs` jelszó hash-hez
- `multer` fájlok feltöltéséhez
- `dotenv` környezeti változókhoz
- `cors` a frontend és backend közötti kommunikációhoz
- `express-mongo-sanitize` és egyedi NoSQL-szűrés a biztonság növeléséhez

### Frontend

- React
- Vite
- React Router DOM

### E-mail és értesítések

- `@sendgrid/mail`, `sendgrid`, `mailersend`, `nodemailer`
- E-mail értesítések új üzenet esetén

## Biztonsági és adatvédelmi megoldások

### Jelszókezelés

- A felhasználói jelszavakat soha nem tároljuk sima szövegként.
- A regisztráció során a jelszó `bcryptjs` segítségével kerül hashelésre.
- A bejelentkezésnél a beírt jelszót összevetjük a hashelt adattal.
- A hashelés erős algoritmusa megnehezíti a jelszavak visszafejtését.

### JWT alapú hitelesítés

- A bejelentkezés sikeres voltát követően a backend JWT tokent ad vissza.
- A token tartalmazza a `username` és `isAdmin` mezőket.
- A védelemhez szükséges endpointok (`/api/verify-token`, admin ellenőrzés stb.) JWT ellenőrzéssel rendelkeznek.
- A frontend a tokent `localStorage` vagy `sessionStorage`-ban tárolja a „maradjak bejelentkezve” beállítástól függően.

### NoSQL injection elleni védelem

- A backend saját `sanitizeValue` middleware-e eltávolítja a MongoDB-specifikus `$` és `.` operátorokat a bemenetekből.
- A regisztráció és bejelentkezés esetén nem fogad el nem string típusú értékeket.
- Több helyen is ellenőrzés történik, hogy csak megfelelő típusú bemenet kerüljön az adatbázisba.

### Üzenetek titkosítása

- A chat üzenetek a MongoDB-ben titkosítva tárolódnak.
- A `src/database.js` fájlban található `encryptMessage` és `decryptMessage` függvények AES-256-CBC titkosítást használnak.
- A `MESSAGE_ENCRYPTION_KEY` környezeti változó biztosítja a titkosítási kulcsot.

### Content Security Policy (CSP)

- A backend `server.js` fájljában CSP fejléc van beállítva.
- Ez korlátozza, honnan tölthetőek be erőforrások, képek és script-ek.

### Admin jogosultságok

- A regisztráció során nem engedélyezett az `isAdmin` mező beállítása külső kérésekből.
- Minden új felhasználó alapból `isAdmin: false` értékkel jön létre.
- Az adminisztrátori jogosultságot csak adatbázis szinten vagy külön admin végpont használatával lehet módosítani.

### E-mail értesítések és biztonság

- A rendszer értesítést küld a címzett e-mailjére, ha új üzenetet kap.
- Az e-mail küldés nem kritikus a regisztrációhoz, és a rendszer tovább működik akkor is, ha az értesítés sikertelen.

## A rendszer fő funkciói

### Felhasználói fiókok

- Regisztráció felhasználónév, e-mail és jelszó alapján
- Bejelentkezés
- JWT-alapú hitelesítés
- Felhasználói fiók védelme jelszóhasheléssel
- Admin szerep jelölése helyi adatbázis logikában

### Termékek kezelése

- Termékek feltöltése és szerkesztése
- Termékek listázása
- Termék részleteinek megtekintése
- Termékek képeinek feltöltése (MongoDB-ben tárolva)
- Kedvencek mentése

### Üzenetküldés és kapcsolatfelvétel

- Felhasználók közti valós idejű chat Socket.IO-val
- Üzenetek titkosított mentése az adatbázisban
- Értesítések küldése új üzenet esetén
- A vevő és eladó közti kommunikáció támogatása szállítás és fizetés megállapodására

## Alkalmazás architektúrája

### Fájlok és modulok

- `src/server.js`: az Express szerver, Socket.IO és központi middleware-ek
- `src/register.js`: felhasználói regisztráció kezelése
- `src/login.js`: bejelentkezés és hitelesítés
- `src/database.js`: MongoDB kapcsolat, sémák és titkosítás
- `src/auth.js`: frontend hitelesítési helper függvények
- `src/components/`: React komponensek a felhasználói felülethez

### Adatbázis modellek

- `Users`: felhasználók, e-mail, jelszó hash, profilkép, admin státusz, felfüggesztés
- `Products`: termékek adatai, ár, leírás, feltöltő, képek
- `Favorite`: kedvencek relációja felhasználó és termék között
- `Message`: üzenetek feladó, címzett, termék referencia, olvasottság
- `Image`: feltöltött képek bináris adatai és metaadatai

## Üzemeltetés és konfiguráció

### Futtatás

- `npm run dev` - backend és frontend egyszerre fejlesztésre
- `npm run dev:backend` - csak a backend futtatása
- `npm run dev:frontend` - csak a frontend futtatása
- `npm run build` - frontend build elkészítése
- `npm start` - szerver indítása

### Környezeti változók

- `MONGODB_URI` - MongoDB kapcsolati string
- `DATABASE_NAME` - (opcionális) adatbázis neve
- `JWT_SECRET` - JWT token aláírásához használatos titkos kulcs
- `MESSAGE_ENCRYPTION_KEY` - 64 karakteres hex kulcs az üzenetek titkosításához

## Megjegyzés

Ez a projekt olyan piacteret valósít meg, ahol a felhasználók közvetlenül egyeztetik az átvételt és a fizetést egymással.
A platform nem kezel online fizetést, így az ügylet lezárása nem történik a weboldalon keresztül.
