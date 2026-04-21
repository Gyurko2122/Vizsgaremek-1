# Testing Guide - Vizsgaremek Webalkalmazás

## Bevezetés

Ez a dokumentáció bemutatja, hogyan lehet teszteket írni és futtatni a Vizsgaremek webalkalmazáson. A projekt **Vitest** (React tesztelésre optimalizált keretrendszer) és **@testing-library/react**-ot használ.

## Telepítés

A tesztelési függőségek már telepítve vannak:

```bash
npm run test                    # Összes teszt futtatása watch módban
npm run test:ui               # Tesztek vizuális kezelőfelülettel
npm run test:coverage         # Kód-lefedettségi report
npm run test:component        # Csak komponens tesztek
npm run test:api              # Csak API integrációs tesztek
```

## Teszt Fájlok Lokációja

```
src/
  test/
    setup.js                  # Teszt environment setup
    mocks.js                  # API mock segédfunkciók
    LoginBody.test.jsx        # Bejelentkezési form tesztek
    RegisterBody.test.jsx     # Regisztrációs form tesztek
    App.test.jsx              # App komponens tesztek
    api.test.js               # API endpoint tesztek
```

## Fő Teszt Komponensek

### 1. LoginBody Teszt (`LoginBody.test.jsx`)

Teszteli:

- Login form megjelenítése
- Email/jelszó mezők validálása
- "Remember me" checkbox funkció
- Sikeres bejelentkezés
- Hibás adatok kezelése
- Felfüggesztett fiók kezelése

```bash
npm run test -- LoginBody.test.jsx
```

**Tesztelendő funkciók:**

- ✅ Email validation
- ✅ Password field
- ✅ Remember me checkbox
- ✅ Error messages display
- ✅ Suspended account handling

### 2. RegisterBody Teszt (`RegisterBody.test.jsx`)

Teszteli:

- Regisztrációs form megjelenítése
- Username/email/jelszó validálása
- Sikeres regisztráció
- Duplikált email kezelése
- Hálózati hibák kezelése

```bash
npm run test -- RegisterBody.test.jsx
```

**Tesztelendő funkciók:**

- ✅ Username field required
- ✅ Email field required
- ✅ Password field required
- ✅ Duplicate email error
- ✅ Network error handling

### 3. App Teszt (`App.test.jsx`)

Teszteli:

- App komponens renderelése
- Login/Register modals megjelenítése
- Modálok közötti navigáció
- Navbar szearch funkció
- Layout és strukturális elemek

### 4. API Tesztek (`api.test.js`)

Teszteli a szerver endpoint-okat:

**Hitelesítés:**

- POST `/api/register` - új felhasználó regisztrálása
- POST `/api/login` - bejelentkezés
- GET `/api/verify-token` - token validálása

**Termékek:**

- GET `/api/products` - összes termék lekérése
- GET `/api/products/:id` - egy termék lekérése

**Felhasználók:**

- GET `/api/user/:username` - publikus profil

**Keresés:**

- GET `/api/search?q=...` - felhasználók és termékek keresése

**Admin:**

- GET `/api/admin/check` - admin státusz ellenőrzése

## Teszt Futtatása

### Összes teszt futtatása

```bash
npm run test
```

### Csak komponens tesztek

```bash
npm run test:component
```

### Csak API tesztek (szerver futtatása szükséges!)

```bash
# Terminal 1: Szerver indítása
npm run dev:backend

# Terminal 2: API tesztek
npm run test:api
```

### Watch módban (automatikus újrafuttatás)

```bash
npm run test -- --watch
```

### UI-val tesztelés

```bash
npm run test:ui
```

Ez megnyit egy grafikus felületet a tesztek futásához és kezeléséhez.

## Szerver Funkciók Ellenőrzése

### Health Check Skript

A `health-check.js` script segít manuálisan ellenőrizni a szerver funkcionalitásait:

```bash
node src/test/health-check.js
```

Ez ellenőrzi:

- ✅ Szerver aktív-e (localhost:3000)
- ✅ Database kapcsolat
- ✅ Register endpoint
- ✅ Login endpoint
- ✅ Token verification
- ✅ Product routes
- ✅ Search functionality
- ✅ Message routes
- ✅ Admin routes

## Mock API Használata

A `mocks.js` fájl segédfunkciókat tartalmaz API válaszok mockinghoz:

```javascript
import {
  mockLoginSuccess,
  mockLoginFailure,
  mockRegisterSuccess,
  resetFetchMocks,
} from "./mocks";

// Teszt-ben
mockLoginSuccess(); // Sikeres login mock
global.fetch.mockClear(); // Mock törlése
```

## Gyakori Tesztelési Mintázatok

### 1. Komponens Render Test

```javascript
it("renders component", () => {
  render(<MyComponent />);
  expect(screen.getByText("Expected Text")).toBeInTheDocument();
});
```

### 2. User Interaction Test

```javascript
it("handles user input", async () => {
  const user = userEvent.setup();
  render(<Form />);

  await user.type(screen.getByPlaceholderText("Email"), "test@example.com");
  await user.click(screen.getByRole("button"));

  await waitFor(() => {
    expect(mockOnSubmit).toHaveBeenCalled();
  });
});
```

### 3. API Mock Test

```javascript
it("calls API on submit", async () => {
  mockLoginSuccess();
  const user = userEvent.setup();

  render(<LoginForm />);
  await user.type(screen.getByPlaceholderText("E-mail"), "test@example.com");
  await user.click(screen.getByRole("button"));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith("/api/login", expect.any(Object));
  });
});
```

## Refaktorálás Utáni Ellenőrzés

A refaktorálás után ellenőrizze:

### 1. Szerver Funkcionálitás

```bash
npm run dev:backend &
npm run test:api
```

### 2. Komponens Funkcionálitás

```bash
npm run test:component
```

### 3. Integrációs Teszt

```bash
npm run dev &
npm run test:ui
```

### 4. Build Ellenőrzés

```bash
npm run build
npm run preview
```

## Problémamegoldás

### Tesztek nem futnak

- Nyissa meg újra az IDE-t
- Törölje a `node_modules` mappát és futtassa az `npm install`-t

### Encoding problémák (magyar karakterek)

- A setup.js már konfigurálva van a megfelelő encoding-hoz
- Ha továbbra is probléma van, ellenőrizze a fájl karakterkódolása (UTF-8-nak kell lennie)

### API tesztek sikertelenek

- Biztosítsa, hogy a szerver fut (npm run dev:backend)
- Ellenőrizze, hogy az adatbázis elérhető

### Mock függvények nem hívódnak meg

- Biztosítsa, hogy a `resetFetchMocks()` hívást meghívta a `beforeEach`-ben
- Ellenőrizze a mock setup-ot

## Teszt Keretrendszer Info

- **Vitest**: Modern JavaScript test framework
- **React Testing Library**: Komponens tesztelésre
- **jsdom**: Browser environment szimulálása
- **@testing-library/user-event**: User interaction szimulálása

## Hozzájárulás

Új tesztek írásánál:

1. Kövesse a meglévő minta-struktúrát
2. Használjon értelmes teszt neveket
3. Mockingot használjon API hívásokhoz
4. Tesztelje a pozitív és negatív eseteket is

## További Recursos

- [Vitest dokumentáció](https://vitest.dev)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing JavaScript](https://testingjavascript.com)
