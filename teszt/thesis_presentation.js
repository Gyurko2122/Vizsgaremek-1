const fs = require("fs");
const PptxGenJS = require("pptxgenjs");
const QRCode = require("qrcode");

const SITE_URL = "https://vizsga-ic7v.onrender.com";

// Color scheme from the application
const colors = {
  darkBg: "0F172A", // Main background
  darkSecondary: "1A2332", // Secondary background
  lightText: "E5E7EB", // Main text
  brightText: "F5F5F5", // Header/bright text
  accent1: "334155", // Accent color
  accent2: "64748B", // Secondary accent
  codeBg: "1E293B", // Code background
};

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE";
pres.author = "Kézműves Piactér Csapat";
pres.title = "Kézműves Piactér - Szoftver Szakdolgozat";

// Define master slide with consistent header
pres.defineSlideMaster({
  title: "MASTER_SLIDE",
  background: { color: colors.darkBg },
  objects: [
    // Header bar
    {
      rect: {
        x: 0,
        y: 0,
        w: "100%",
        h: 0.7,
        fill: { color: colors.accent1 },
      },
    },
    // Title in header
    {
      text: {
        text: "Kézműves Piactér",
        options: {
          x: 0.4,
          y: 0.15,
          w: 12.5,
          h: 0.4,
          fontSize: 20,
          color: colors.brightText,
          bold: true,
          fontFace: "Arial",
        },
      },
    },
  ],
});

// Helper functions
function addTitleSlide(title, subtitle = "") {
  const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });
  slide.addText(title, {
    x: 0.5,
    y: 1.8,
    w: 12.3,
    h: 1.5,
    fontSize: 48,
    bold: true,
    color: colors.brightText,
    align: "center",
    fontFace: "Arial",
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5,
      y: 3.4,
      w: 12.3,
      h: 1.2,
      fontSize: 26,
      color: colors.lightText,
      align: "center",
      wrap: true,
      fontFace: "Arial",
    });
  }
}

function addBulletSlide(title, bullets) {
  const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });

  // Title
  slide.addText(title, {
    x: 0.5,
    y: 0.85,
    w: 12.3,
    h: 0.6,
    fontSize: 36,
    bold: true,
    color: colors.brightText,
    fontFace: "Arial",
  });

  // Decorative line under title
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5,
    y: 1.5,
    w: 2,
    h: 0.05,
    fill: { color: colors.accent2 },
    line: { type: "none" },
  });

  // Bullets
  const bulletItems = bullets.map((text) => ({
    text: text,
    options: {
      bullet: true,
      breakLine: true,
      fontSize: 22,
      color: colors.lightText,
    },
  }));

  slide.addText(bulletItems, {
    x: 0.7,
    y: 1.7,
    w: 11.8,
    h: 5.1,
    fontSize: 22,
    color: colors.lightText,
    lineSpacing: 36,
    fontFace: "Arial",
    margin: 0,
  });
}

function addTwoColumnSlide(
  title,
  leftTitle,
  leftBullets,
  rightTitle,
  rightBullets,
) {
  const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });

  // Title
  slide.addText(title, {
    x: 0.5,
    y: 0.85,
    w: 12.3,
    h: 0.6,
    fontSize: 36,
    bold: true,
    color: colors.brightText,
    fontFace: "Arial",
  });

  // Decorative line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5,
    y: 1.5,
    w: 2,
    h: 0.05,
    fill: { color: colors.accent2 },
    line: { type: "none" },
  });

  // Left column
  slide.addText(leftTitle, {
    x: 0.5,
    y: 1.7,
    w: 5.8,
    h: 0.4,
    fontSize: 22,
    bold: true,
    color: colors.accent2,
    fontFace: "Arial",
  });

  const leftItems = leftBullets.map((text) => ({
    text: text,
    options: { bullet: true, breakLine: true, fontSize: 16 },
  }));

  slide.addText(leftItems, {
    x: 0.7,
    y: 2.15,
    w: 5.5,
    h: 4,
    fontSize: 16,
    color: colors.lightText,
    lineSpacing: 20,
    fontFace: "Arial",
    margin: 0,
  });

  // Right column
  slide.addText(rightTitle, {
    x: 6.8,
    y: 1.7,
    w: 5.8,
    h: 0.4,
    fontSize: 22,
    bold: true,
    color: colors.accent2,
    fontFace: "Arial",
  });

  const rightItems = rightBullets.map((text) => ({
    text: text,
    options: { bullet: true, breakLine: true, fontSize: 16 },
  }));

  slide.addText(rightItems, {
    x: 6.8,
    y: 2.15,
    w: 5.8,
    h: 4,
    fontSize: 16,
    color: colors.lightText,
    lineSpacing: 20,
    fontFace: "Arial",
    margin: 0,
  });
}

function addCodeSlide(title, code) {
  const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });

  slide.addText(title, {
    x: 0.5,
    y: 0.85,
    w: 12.3,
    h: 0.6,
    fontSize: 36,
    bold: true,
    color: colors.brightText,
    fontFace: "Arial",
  });

  // Code background box
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.4,
    y: 1.6,
    w: 12.5,
    h: 5,
    fill: { color: colors.codeBg },
    line: { color: colors.accent2, width: 1 },
  });

  // Code text
  slide.addText(code, {
    x: 0.55,
    y: 1.75,
    w: 12.25,
    h: 4.75,
    fontSize: 11,
    color: colors.lightText,
    fontFace: "Courier New",
    align: "left",
    valign: "top",
    lineSpacing: 14,
    wrap: true,
    margin: 0.1,
  });
}

function addImageSlide(title, imagePath, description) {
  const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });

  slide.addText(title, {
    x: 0.5,
    y: 0.85,
    w: 12.3,
    h: 0.6,
    fontSize: 36,
    bold: true,
    color: colors.brightText,
    fontFace: "Arial",
  });

  try {
    slide.addImage({
      path: imagePath,
      x: 1,
      y: 1.7,
      w: 11.3,
      h: 4.5,
    });
  } catch (err) {
    // If image not found, show placeholder
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1,
      y: 1.7,
      w: 11.3,
      h: 4.5,
      fill: { color: colors.darkSecondary },
      line: { color: colors.accent2, width: 2 },
    });
    slide.addText("[Kép nem elérhető]", {
      x: 1,
      y: 3.5,
      w: 11.3,
      h: 1,
      fontSize: 20,
      color: colors.accent2,
      align: "center",
      fontFace: "Arial",
    });
  }

  if (description) {
    slide.addText(description, {
      x: 1,
      y: 6.3,
      w: 11.3,
      h: 0.8,
      fontSize: 14,
      color: colors.lightText,
      align: "center",
      fontFace: "Arial",
    });
  }
}

function addGanttSlide() {
  const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });

  slide.addText("Fejlesztési Timeline - Gantt Diagram", {
    x: 0.5,
    y: 0.85,
    w: 12.3,
    h: 0.6,
    fontSize: 36,
    bold: true,
    color: colors.brightText,
    fontFace: "Arial",
  });

  // Y positions for tasks - nagyobb térközökhöz
  const taskY = 1.6;
  const rowHeight = 0.5;
  const colWidth = 1.1;
  const startX = 2.2;
  const labelWidth = 1.8;

  // Header
  slide.addText("Tevékenység", {
    x: 0.5,
    y: taskY,
    w: labelWidth,
    h: rowHeight,
    fontSize: 14,
    bold: true,
    color: colors.brightText,
    fontFace: "Arial",
    valign: "middle",
  });

  const weeks = ["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8"];
  weeks.forEach((week, idx) => {
    slide.addText(week, {
      x: startX + idx * colWidth,
      y: taskY,
      w: colWidth - 0.1,
      h: rowHeight,
      fontSize: 13,
      bold: true,
      color: colors.accent2,
      align: "center",
      valign: "middle",
      fontFace: "Arial",
    });
  });

  // Tasks data: [name, team (0=SZ.M, 1=K.D, 2=both), start week, duration]
  const tasks = [
    ["Backend Setup", 0, 0, 2],
    ["Database Design", 0, 0, 2],
    ["Frontend Structure", 1, 1, 2],
    ["API Endpoints", 0, 2, 2],
    ["Auth System", 0, 2, 1],
    ["React Components", 1, 2, 3],
    ["Socket.IO Chat", 0, 3, 2],
    ["Integration", 2, 4, 2],
    ["Testing", 2, 5, 2],
  ];

  const teamColors = {
    0: "1E40AF", // Backend - dark blue
    1: "DC2626", // Frontend - red
    2: "16A34A", // Both - green
  };

  tasks.forEach((task, taskIdx) => {
    const [name, team, start, duration] = task;
    const y = taskY + rowHeight * (taskIdx + 1) + 0.08;

    // Task name
    slide.addText(name, {
      x: 0.5,
      y: y,
      w: labelWidth,
      h: rowHeight,
      fontSize: 13,
      color: colors.lightText,
      fontFace: "Arial",
      valign: "middle",
    });

    // Task bar
    slide.addShape(pres.shapes.RECTANGLE, {
      x: startX + start * colWidth,
      y: y + 0.08,
      w: duration * colWidth - 0.1,
      h: rowHeight - 0.15,
      fill: { color: teamColors[team] },
      line: { color: colors.accent2, width: 0.5 },
    });
  });

  // Legend
  const legendY = taskY + rowHeight * (tasks.length + 2.5);
  slide.addText("Jelmagyarázat:", {
    x: 0.5,
    y: legendY,
    w: 3,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: colors.brightText,
    fontFace: "Arial",
  });

  // Legend items - nagyobb térközzel
  const legendItemY = legendY + 0.5;
  const legendSpacing = 2.8;

  // SZ.M (Backend)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.8,
    y: legendItemY + 0.08,
    w: 0.25,
    h: 0.25,
    fill: { color: teamColors[0] },
  });
  slide.addText("SZ.M (Backend)", {
    x: 1.15,
    y: legendItemY,
    w: 1.8,
    h: 0.4,
    fontSize: 13,
    color: colors.lightText,
    fontFace: "Arial",
    valign: "middle",
  });

  // K.D (Frontend)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.8 + legendSpacing,
    y: legendItemY + 0.08,
    w: 0.25,
    h: 0.25,
    fill: { color: teamColors[1] },
  });
  slide.addText("K.D (Frontend)", {
    x: 1.15 + legendSpacing,
    y: legendItemY,
    w: 1.8,
    h: 0.4,
    fontSize: 13,
    color: colors.lightText,
    fontFace: "Arial",
    valign: "middle",
  });

  // Mindketten
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.8 + legendSpacing * 2,
    y: legendItemY + 0.08,
    w: 0.25,
    h: 0.25,
    fill: { color: teamColors[2] },
  });
  slide.addText("Mindketten", {
    x: 1.15 + legendSpacing * 2,
    y: legendItemY,
    w: 1.5,
    h: 0.4,
    fontSize: 13,
    color: colors.lightText,
    fontFace: "Arial",
    valign: "middle",
  });
}

async function generatePresentation() {
  console.log("Szoftver szakdolgozat prezentáció generálása...");

  // ============================================
  // 1. TITLE SLIDE
  // ============================================
  addTitleSlide("Kézműves Piactér", "Szoftver Szakdolgozat Bemutató");

  // ============================================
  // SECTION 1: CÉLUNK (GOAL)
  // ============================================
  addTitleSlide("Célunk", "A projekt célja és motivációja");

  addBulletSlide("A Probléma", [
    "A helyi kézműves termékeket nehéz megtalálni a piacon",
    "Nincs szakosított platform az egyedi, kézzel készült termékekhez",
    "Az eladók és vevők között hiányzik a közvetlen kommunikációs csatorna",
    "A meglévő nagy e-kereskedelmi platformok nem illeszkednek a helyi közösségekhez",
  ]);

  addBulletSlide("Az Alkalmazás Célja", [
    "Egy dedikált online piactér a kézműves termékekhez",
    "Közvetlen vevő-eladó kommunikáció valós idejű chat-en keresztül",
    "Biztonságos regisztráció és felhasználókezelés",
    "Termékek könnyű feltöltése képekkel és részletes leírásokkal",
  ]);

  addBulletSlide("Érdekes Statisztika", [
    "A kézműves termékek piaca évi 10-15%-os növekedéssel büszkélkedik",
    "A millenniálok és Gen Z 72%-a előnyben részesíti az egyedi termékeket",
    "A 81% a vásárlók értékelnék a közvetlen eladóval való kommunikációt",
    "Az online kézműves piac 2025-ben eléri a 40 milliárd dollárt",
  ]);

  addBulletSlide("Személyes Kötődés", [
    "A csapattagok szenvedélye az egyedi, kézműves termékek iránt",
    "Közösségi értékek: a helyi alkotók támogatása és megélhetésének biztosítása",
    "A fenntarthatóság és a minőség előtérbe helyezése a tömegtermeléssel szemben",
    "Személyes élmények a helyi vásárokkal és kézműves közösségekkel",
  ]);

  // ============================================
  // SECTION 2: TERVÜNK (PLAN)
  // ============================================
  addTitleSlide("Tervünk", "Az alkalmazás funkcionális terve");

  addBulletSlide("Kik Fogják Használni?", [
    "Eladók: kézműves termékeket értékesítő egyéni vállalkozók és kis cégek",
    "Vevők: kézműves termékeket keresők, helyi vagy online vásárlók",
    "Adminisztrátorok: moderáció, felhasználókezelés és platform felügyelete",
  ]);

  addTwoColumnSlide(
    "Funkciók Szerepkörenként",
    "Eladó Funkciók",
    [
      "Regisztráció és profilkészítés",
      "Termékek feltöltése képekkel",
      "Ár és leírás megadása",
      "Valós idejű chat vevőkkel",
      "Korábbi értékesítések megtekintése",
    ],
    "Vevő Funkciók",
    [
      "Regisztráció és profil kezelése",
      "Termékek keresése és böngészése",
      "Termék részletei és képek",
      "Kedvencek gyűjtése",
      "Chat a szállítás és fizetésről",
    ],
  );

  addBulletSlide("Technológiák Överzetése", [
    "Backend: Node.js + Express (szerver keretrendszer)",
    "Adatbázis: MongoDB (NoSQL - rugalmas dokumentumkezelés)",
    "Frontend: React (UI komponensek) + Vite (gyors fejlesztő környezet)",
    "Biztonság: bcryptjs (jelszó hashelés) + JWT (token alapú auth)",
    "Valós idő: Socket.IO (WebSocket alapú chat)",
    "Titkosítás: AES-256-CBC (üzenet titkosítás)",
  ]);

  // ============================================
  // SECTION 3: HOGYAN DOLGOZTUNK (HOW WE WORKED)
  // ============================================
  addTitleSlide(
    "Hogyan Dolgoztunk?",
    "A fejlesztési folyamat és csapati munka",
  );

  addBulletSlide("Projektszervezési Eszközök", [
    "Kanban-tábla: Trello-szerű feladatkezelés (To Do | In Progress | Review | Done)",
    "GitHub Issues: nyomkövetés és kódkommentárok",
    "Sprint-szerű iterációs fejlesztés (1-2 hetes sprintek)",
    "Napi csapatmegbeszélések a folyamat egyeztetésére",
  ]);

  // Add Gantt diagram
  addGanttSlide();

  addBulletSlide("Munkamegosztás - Ki Mit Csinált?", [
    "SZ.M: Backend fejlesztés, API végpontok, adatbázis logika, autentikáció",
    "K.D: Frontend fejlesztés, React komponensek, felhasználói felület, CSS styling",
    "Biztonság/Full-stack: titkosítás, JWT, validáció implementálása",
    "Tesztelés: manual tesztelés, integrációs tesztek",
    "Dokumentáció: projekt dokumentáció, API dokumentáció",
  ]);

  addBulletSlide("Fejlesztési Módszertanok", [
    "Agile: rugalmas, iterátiv fejlesztés",
    "Code Review: pull request alapú kódértékelés",
    "Continuous Integration: automatikus tesztelés és deployment",
    "Responsive Design: mobil és asztali kompatibilitás",
    "Akadálymentesség: WCAG alapelvek figyelembevétele",
  ]);

  // ============================================
  // SECTION 4: TECHNIKAI MEGVALÓSÍTÁS (TECHNICAL DETAILS)
  // ============================================
  addTitleSlide(
    "Szoftver Technikai Megvalósítása",
    "Az architektura és forráskód",
  );

  addBulletSlide("Alkalmazás Architektúrája", [
    "Kliens-szerver modell: React frontend + Node.js backend",
    "REST API: HTTP végpontok az adatcsere és műveletekhez",
    "WebSocket: Socket.IO valós idejű kommunikációhoz",
    "MongoDB: felhasználók, termékek, kedvencek, üzenetek tárolása",
    "JWT hitelesítés: token-alapú biztonságos autentikáció",
  ]);

  addBulletSlide("Adatmodell - Fő Entitások", [
    "Users: felhasználónév, email, jelszó hash, profil képe, admin jelzés",
    "Products: cím, ár, leírás, feltöltő ID, kategória, képek",
    "Favorites: felhasználó-termék kapcsolat a kedvencekhez",
    "Messages: feladó, címzett, tartalom, termék hivatkozás, titkosítva",
    "Images: bináris képadatok MongoDB-ben a gyors eléréshez",
  ]);

  // ============================================
  // SECTION 5: FORRÁSKÓD PÉLDÁK
  // ============================================
  addCodeSlide(
    "Forráskód: Regisztráció (register.js)",
    `// Regisztráció JWT tokennel
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  // Jelszó hashelése bcryptjs-vel
  const hashedPassword = await bcryptjs.hash(password, 10);
  
  const user = new User({
    username,
    email,
    password: hashedPassword,
    isAdmin: false
  });
  
  await user.save();
  
  // JWT token generálása
  const token = jwt.sign(
    { username, isAdmin: user.isAdmin },
    process.env.JWT_SECRET
  );
  
  res.status(201).json({ token, user });
});`,
  );

  addCodeSlide(
    "Forráskód: Üzenet Titkosítása (database.js)",
    `// AES-256-CBC titkosítás
function encryptMessage(plaintext) {
  const key = Buffer.from(process.env.MESSAGE_ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

// Détitkosítás
function decryptMessage(ciphertext) {
  const key = Buffer.from(process.env.MESSAGE_ENCRYPTION_KEY, 'hex');
  const [iv, encrypted] = ciphertext.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}`,
  );

  addCodeSlide(
    "Forráskód: Socket.IO Chat (server.js)",
    `// Valós idejű üzenetküldés Socket.IO-val
io.on('connection', (socket) => {
  console.log('Felhasználó csatlakozott:', socket.id);
  
  socket.on('send_message', async (data) => {
    const { senderId, receiverId, message, productId } = data;
    
    // Üzenet titkosítása
    const encrypted = encryptMessage(message);
    
    // Üzenet mentése DB-be
    const msg = new Message({
      sender: senderId,
      receiver: receiverId,
      content: encrypted,
      product: productId
    });
    
    await msg.save();
    
    // Valós idejű küldés
    io.to(receiverId).emit('receive_message', {
      sender: senderId,
      content: message,
      timestamp: new Date()
    });
  });
});`,
  );

  addBulletSlide("Biztonsági Megoldások", [
    "Jelszóhashelés: bcryptjs 10-es salt round-dal",
    "JWT hitelesítés: token alapú, 24 órás lejárat",
    "NoSQL injection védelem: input szanitáció és típusellenőrzés",
    "Üzenet titkosítás: AES-256-CBC MongoDB-ben",
    "CORS: kereszt-domain request szűrés",
  ]);

  // ============================================
  // SECTION 6: A KÉSZ SZOFTVER (FINISHED SOFTWARE)
  // ============================================
  addTitleSlide("A Kész Szoftver", "Funkciók bemutatása");

  addBulletSlide("Főbb Funkciók - Regisztráció & Bejelentkezés", [
    "Regisztrációs form: felhasználónév, email, jelszó validációval",
    "Jelszó erősség ellenőrzés: minimum 8 karakter, speciális karakterek",
    "Email verifikáció: küldött verifikációs link",
    "Bejelentkezés: email/felhasználónév + jelszó",
    "Remember me: maradjon bejelentkezve (token lokálsztorage-ban)",
  ]);

  addBulletSlide("Főbb Funkciók - Termékkezelés", [
    "Termék feltöltés: cím, leírás, ár, kategória megadása",
    "Képfeltöltés: több kép támogatás, MongoDB-ben tárolva",
    "Termék szerkesztés: csak a feltöltő módosíthat",
    "Termék törlés: soft delete (nem véglegesen törlődik)",
    "Termék keresés: szöveges keresés és kategória szűrés",
  ]);

  addBulletSlide("Főbb Funkciók - Interakció & Kommunikáció", [
    "Kedvencek: termékek mentése a saját listára",
    "Valós idejű chat: Socket.IO alapú azonnali üzenetváltás",
    "Üzenet történet: múltbeli üzenetek megtekintése (titkosítva)",
    "E-mail értesítés: új üzenet esetén SendGrid értesítés",
    "Online státusz: felhasználók online-offline jelzése",
  ]);

  addBulletSlide("Főbb Funkciók - Admin Panelek", [
    "Felhasználó kezelés: adminozási jogok, felfüggesztés",
    "Termék moderáció: nem megfelelő tartalom eltávolítása",
    "Statisztika: felhasználó, termék és üzenet számok",
    "Rendszer felügyelet: szerver állapot és teljesítmény",
  ]);

  // ============================================
  // SECTION 7: FELHASZNÁLÓI FELÜLET
  // ============================================
  addBulletSlide("Felhasználói Élmény & Design", [
    "Modern Dark UI: a csapat preferenciája szerint",
    "Responsív dizájn: mobil és asztali kompatibilitás",
    "Gyors betöltés: Vite előkészítés és CSS optimalizálás",
    "Akadálymentesség: szövegek és kontrasztos szín",
    "Intuitív navigáció: egyértelmű menüpontok és ikonok",
  ]);

  addBulletSlide("Funkcionális Folyamatok", [
    "1. Felhasználó regisztrál → email verifikáció → profil szerkesztés",
    "2. Eladó feltölt terméket → képek → listázódik a piactéren",
    "3. Vevő keres terméket → részleteket néz → kedvencekhez adja",
    "4. Vevő üzenetet küld eladónak → chat megnyílik → titkosított",
    "5. Admin felülvizsgál → moderál → felhasználó kezelés",
  ]);

  // ============================================
  // SECTION 8: FEJLESZTÉS SORÁN HASZNÁLT ESZKÖZÖK
  // ============================================
  addBulletSlide("Fejlesztési Eszközök & Stack", [
    "Git & GitHub: verziókezelés, pull request workflow",
    "npm: függőségkezelés és script futtatás",
    "VS Code: fejlesztői szerkesztő, debugger kiterjesztésekkel",
    "Postman: API tesztelés és dokumentáció",
    "MongoDB Atlas: felhő alapú adatbázis hosting",
    "Render.com: backend szerver deployment",
  ]);

  addBulletSlide("Csapati Kollaboráció Eszközei", [
    "Trello: feladatok és sprintek kezelése",
    "Discord/Slack: napi kommunikáció és értesítések",
    "Shared Google Docs: dokumentumok és tervek",
    "GitHub Discussions: technikai kérdések és megoldások",
    "Google Calendar: meeting-ek és deadline-ok",
  ]);

  // ============================================
  // SECTION 9: DEPLOYMENT & ÜZEMELTETÉS
  // ============================================
  addBulletSlide("Üzemeltetés & Deployment", [
    "Frontend deployment: Render.com statikus hosting",
    "Backend deployment: Render.com Node.js dyno-k",
    "Adatbázis: MongoDB Atlas (felhő alapú, auto backup)",
    "E-mail: SendGrid SMTP integration",
    "Biztonság: HTTPS, CORS headers, rate limiting",
    "Monitoring: PM2 process manager, szerverlogok",
  ]);

  addBulletSlide("CI/CD Pipeline", [
    "GitHub Actions: automatikus tesztek push-ra",
    "Unit tesztek: backend API logika validálása",
    "Continuous Deployment: master branch auto deploy",
    "Code Quality: ESLint és Prettier kódstílus",
    "Performance: nyomkövetés és optimalizáció",
  ]);

  // ============================================
  // SECTION 10: CSAPATMUNKA ÉS SZEREPEK
  // ============================================
  addBulletSlide("A Csapaton Belüli Munkamegosztás", [
    "SZ.M: Backend architektúra, API design, DB modellek",
    "K.D: Frontend UI, React komponensek, styling",
    "Biztonsági fejlesztő: titkosítás implementáció, JWT",
    "Dokumentáció és tesztelés: projekt management",
  ]);

  addBulletSlide("Fejlesztési Csapatban Betöltött Szerep", [
    "Felelősség: teljes körű szoftver fejlesztés és karbantartás",
    "Kollaboráció: git workflow, code review, pair programming",
    "Tudásmegosztás: technikai meetingek és tudásbázis",
    "Iteráció: feedback alapú fejlesztési ciklus",
    "Agile: sprintekben szervezve, daily standup-ok",
  ]);

  // ============================================
  // SECTION 11: TANULSÁGOK ÉS FEJLESZTÉS
  // ============================================
  addBulletSlide("Fejlesztés során Tanult Leckék", [
    "Biztonság az első: hitelesítés és titkosítás alapvetően fontos",
    "Adatbázis tervezés: jó sémadesign csökkenti később a refactor-t",
    "Iteratív fejlesztés: gyakori feedback jobb végterméket hoz",
    "Tesztelés: early tesztelés sok hibát megelőz",
    "Dokumentáció: jó dokumentáció később időt spórol",
  ]);

  addBulletSlide("Jövőbeli Fejlesztési Lehetőségek", [
    "Beépített fizetési rendszer (Stripe, PayPal integráció)",
    "Logisztikai integrációk szállítás nyomkövetéshez",
    "Értékelési és feedback rendszer",
    "AI ajánlás motor a termékekhez",
    "Native mobilalkalmazás (iOS, Android)",
    "Internationalizáció (több nyelvű interface)",
  ]);

  // ============================================
  // FINAL SLIDE: THANK YOU + QR CODE
  // ============================================
  const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });

  slide.addText("Köszönjük a Figyelmet!", {
    x: 0.5,
    y: 1.8,
    w: 12.3,
    h: 1,
    fontSize: 48,
    bold: true,
    color: colors.brightText,
    align: "center",
    fontFace: "Arial",
  });

  slide.addText("Kérdések és megjegyzések?", {
    x: 0.5,
    y: 3.0,
    w: 12.3,
    h: 0.8,
    fontSize: 24,
    color: colors.lightText,
    align: "center",
    fontFace: "Arial",
  });

  // Generate QR code synchronously with callback
  try {
    // Generate QR code with higher error correction and larger size
    const qrCode = await QRCode.toDataURL(SITE_URL, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 2,
      color: {
        dark: colors.brightText,
        light: colors.darkBg,
      },
    });

    // Add QR code to slide
    slide.addImage({
      data: qrCode,
      x: 5.15,
      y: 3.95,
      w: 3,
      h: 3,
    });

    // Add URL text below QR
    slide.addText("Projekt: " + SITE_URL, {
      x: 0.5,
      y: 7.1,
      w: 12.3,
      h: 0.4,
      fontSize: 14,
      color: colors.accent2,
      align: "center",
      fontFace: "Arial",
    });
  } catch (err) {
    console.error("QR kód generálása sikertelen:", err);
    // Fallback: csak az URL
    slide.addText("Projekt: " + SITE_URL, {
      x: 0.5,
      y: 4.5,
      w: 12.3,
      h: 0.6,
      fontSize: 16,
      color: colors.accent2,
      align: "center",
      fontFace: "Arial",
    });
  }

  // Save presentation
  pres.writeFile({ fileName: "Thesis_Presentation.pptx" });
  console.log("Prezentáció sikeresen elkészült: Thesis_Presentation.pptx");
}

// Generate the presentation
generatePresentation().catch((err) => {
  console.error("Hiba a prezentáció generálása során:", err);
  process.exit(1);
});
