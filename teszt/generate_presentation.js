const fs = require("fs");
const PptxGenJS = require("pptxgenjs");
const QRCode = require("qrcode");

const SITE_URL = "https://vizsga-ic7v.onrender.com";
const PROJECT_DOC = fs.existsSync("project_documentation.md")
  ? fs.readFileSync("project_documentation.md", "utf8")
  : "";
const TUTORIAL_DOC = fs.existsSync("pptxgenjs.md")
  ? fs.readFileSync("pptxgenjs.md", "utf8")
  : "";

const loginCode = fs.readFileSync("src/login.js", "utf8");
const databaseCode = fs.readFileSync("src/database.js", "utf8");

function snippet(text, start, end) {
  return text
    .split("\n")
    .slice(start - 1, end)
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n");
}

const loginSnippet = snippet(loginCode, 1, 18);
const encryptionSnippet = snippet(databaseCode, 18, 34);

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE";
pres.author = "Kézműves Piactér";
pres.title = "Szakdolgozati bemutató - Kézműves Piactér";

const colors = {
  background: "0F172A",
  header: "F5F5F5",
  text: "E5E7EB",
  accent: "334155",
  accent2: "64748B",
  codeBg: "1A2332",
};

pres.defineSlideMaster({
  title: "MASTER_SLIDE",
  background: { color: colors.background },
  objects: [
    {
      rect: {
        x: 0,
        y: 0,
        w: "100%",
        h: 0.8,
        fill: { color: colors.accent },
      },
    },
    {
      text: {
        text: "Kézműves Piactér",
        options: {
          x: 0.4,
          y: 0.18,
          w: 12.5,
          h: 0.5,
          fontSize: 22,
          color: colors.header,
          bold: true,
        },
      },
    },
  ],
});

function addTitleSlide(title, subtitle) {
  const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });
  slide.addText(title, {
    x: 0.5,
    y: 1.4,
    w: 12.3,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: colors.header,
  });
  slide.addText(subtitle, {
    x: 0.5,
    y: 3.0,
    w: 12.3,
    h: 1.2,
    fontSize: 24,
    color: colors.text,
    wrap: true,
  });
}

function addBulletSlide(title, bullets) {
  const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });
  slide.addText(title, {
    x: 0.5,
    y: 0.9,
    w: 12.3,
    h: 1,
    fontSize: 34,
    color: colors.header,
    bold: true,
  });
  const bulletText = bullets.map((text) => ({
    text,
    options: { bullet: true, breakLine: true, indentLevel: 0 },
  }));
  slide.addText(bulletText, {
    x: 0.5,
    y: 2.1,
    w: 12.3,
    h: 4.9,
    fontSize: 26,
    color: colors.text,
    lineSpacing: 32,
    wrap: true,
    margin: 0,
    paraSpaceAfter: 10,
  });
}

function addTextSlide(title, text) {
  const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });
  slide.addText(title, {
    x: 0.5,
    y: 0.9,
    w: 12.3,
    h: 1,
    fontSize: 34,
    color: colors.header,
    bold: true,
  });
  slide.addText(text, {
    x: 0.5,
    y: 2.1,
    w: 12.3,
    h: 4.9,
    fontSize: 24,
    color: colors.text,
    lineSpacing: 32,
    wrap: true,
    margin: 0,
    paraSpaceAfter: 10,
  });
}

function addCodeSlide(title, code) {
  const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });
  slide.addText(title, {
    x: 0.5,
    y: 0.95,
    w: 12.3,
    h: 1,
    fontSize: 34,
    color: colors.header,
    bold: true,
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.4,
    y: 2.15,
    w: 12.5,
    h: 4.75,
    fill: { color: colors.codeBg, transparency: 0 },
    line: { color: colors.accent2, width: 1.2 },
  });
  slide.addText(code, {
    x: 0.45,
    y: 2.25,
    w: 12.4,
    h: 4.6,
    fontSize: 10,
    color: colors.text,
    fontFace: "Consolas",
    align: "left",
    valign: "top",
    lineSpacing: 16,
    wrap: true,
    margin: 0.1,
    breakLine: true,
  });
}

function addQrSlide(title, url, qrData) {
  const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });
  slide.addText(title, {
    x: 0.5,
    y: 1.2,
    w: 12.3,
    h: 1,
    fontSize: 34,
    color: colors.header,
    bold: true,
  });
  slide.addText("A projekt elérhető az alábbi címen:", {
    x: 0.5,
    y: 2.3,
    w: 7.5,
    h: 1,
    fontSize: 24,
    color: colors.text,
  });
  slide.addText(url, {
    x: 0.5,
    y: 3.3,
    w: 7.5,
    h: 1,
    fontSize: 20,
    color: colors.accent2,
  });
  slide.addImage({
    data: qrData,
    x: 8.3,
    y: 2.3,
    w: 3.4,
    h: 3.4,
  });
}

async function generate() {
  addTitleSlide(
    "Kézműves Piactér",
    "Szakdolgozati bemutató - a projekt célja, architektúrája és fejlesztése",
  );

  addBulletSlide("Célunk", [
    "Egy direkt online piactér létrehozása kézműves termékekhez.",
    "A vevő és eladó közvetlen kommunikációja a fő platformfunkció.",
    "A fizetés és átvétel a felhasználók között történik, összetett online fizetés nélkül.",
  ]);

  addBulletSlide("Mi az alkalmazás célja?", [
    "A helyi kézműves termékek elérhetőbbé tétele egy könnyen használható felületen.",
    "A biztonságos regisztráció és hitelesítés garantálja a megbízható használatot.",
    "A közvetlen chat lehetősége támogatja a szállítás és fizetés egyeztetését.",
  ]);

  addBulletSlide("Érdekes statisztika", [
    "A közvetlen vásárlói-eladói kapcsolatok növelik az ügyfélbizalmat.",
    "A helyi kézműves termékek piaci kereslete ma erős rugalmasságot mutat.",
    "A felhasználók többsége értékeli a személyes kapcsolattartást az interneten keresztül.",
  ]);

  addBulletSlide("Személyes kötődés", [
    "A házi készítésű, egyedi termékek iránti személyes érdeklődés adta az ötletet.",
    "A projekt célja a helyi közösségek és kézműves alkotók támogatása.",
    "A bemutató szakmai keretben mutatja be a piaci, technológiai és fejlesztési folyamatokat.",
  ]);

  addBulletSlide("Tervünk", [
    "Felhasználóbarát regisztráció és belépés JWT-vel.",
    "Termékek feltöltése, keresése és részletes megjelenítése.",
    "Valós idejű üzenetküldés és titkosított chat kapcsolat.",
  ]);

  addBulletSlide("Kik használják?", [
    "Eladók: termékfeltöltés, árképzés és kommunikáció.",
    "Vevők: keresés, kedvencek és üzenetküldés.",
    "Adminok: felhasználói és tartalmi felügyelet, moderáció.",
  ]);

  addBulletSlide("Funkciók szerepkör szerint", [
    "Eladók: termékfeltöltés, képek feltöltése, chat-elérés.",
    "Vevők: termékek böngészése, kedvencek és üzenetek kezelése.",
    "Admin: felhasználói státusz ellenőrzése és moderáció.",
  ]);

  addBulletSlide("Használt technológiák", [
    "Backend: Node.js, Express, MongoDB/Mongoose, Socket.IO.",
    "Frontend: React, Vite, React Router.",
    "Biztonság: bcryptjs, JWT, NoSQL szűrés, AES titkosítás.",
    "Értesítés: SendGrid/Nodemailer és e-mail értesítések.",
  ]);

  addBulletSlide("Hogyan dolgoztunk?", [
    "Kanban-alapú feladatkezelés, projektnapló és csapatkommunikáció.",
    "GitHub és Trello stílusú feladatlista, sprint-szerű iterációval.",
    "Állandó egyeztetés a frontend és backend fejlesztők között.",
  ]);

  addBulletSlide("Munkamegosztás", [
    "Frontend: felhasználói felület és React komponensek fejlesztése.",
    "Backend: auth, API végpontok, adatmodell és titkosítás.",
    "Integráció: az autentikáció, chat és képfeltöltés összehangolása.",
  ]);

  addBulletSlide("A kész szoftver", [
    "Regisztráció és bejelentkezés erős jelszóhash-sel és JWT-vel.",
    "Termékek feltöltése, részletek, kedvencek és keresés.",
    "Valós idejű és titkosított chat a felhasználók között.",
  ]);

  addCodeSlide("Forráskód: login.js", loginSnippet);
  addCodeSlide("Forráskód: titkosítás", encryptionSnippet);

  if (TUTORIAL_DOC) {
    addBulletSlide("PptxGenJS felépítés", [
      "A bemutató a pptxgenjs.md dokumentáció alapelvei szerint készült.",
      "Slide-ok felépítése: addText, addShape, addImage, master slide egységesség.",
      "Kódblokkoknál wrap: true, margin: 0 és monospace betűtípus használata.",
    ]);
  }

  addTextSlide(
    "Köszönjük a figyelmet!",
    "A projekt bemutatása során részletesen ismertettük a célokat, a technológiákat, a fejlesztési módszertant és a kulcsfontosságú forráskódot.",
  );

  const qrData = await QRCode.toDataURL(SITE_URL, { width: 640 });
  addQrSlide("Elérhetőség és demó", SITE_URL, qrData);

  await pres.writeFile({
    fileName: "Kezmuves_Piactere_Szakdolgozati_Prezentacio_v1.pptx",
  });
  console.log(
    "Prezentáció elkészült: Kezmuves_Piactere_Szakdolgozati_Prezentacio_v1.pptx",
  );
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
