/**
 * Egyszeri migráció: meglévő fájlrendszer-alapú képek áthelyezése MongoDB-be.
 * Futtatás: node migrate-images.js
 */
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");

require("dotenv").config();

const { Users_model, Products_model, Image_model } = require("./src/database");

async function migrateImage(filePath) {
  // Query param eltávolítása
  const cleanPath = filePath.split("?")[0];
  const absolutePath = path.join(__dirname, cleanPath);

  if (!fs.existsSync(absolutePath)) {
    console.log(`  ⚠ Fájl nem található: ${absolutePath}`);
    return null;
  }

  const data = fs.readFileSync(absolutePath);
  const contentType = mime.lookup(absolutePath) || "application/octet-stream";
  const filename = path.basename(cleanPath);

  const newImage = new Image_model({
    data,
    contentType,
    filename,
  });

  const saved = await newImage.save();
  console.log(`  ✅ Migráció sikeres: ${filename} -> /api/images/${saved._id}`);
  return `/api/images/${saved._id}`;
}

async function main() {
  console.log("=== Kép migráció indítása ===\n");

  // 1) Termékek migrálása
  const products = await Products_model.find({});
  console.log(`${products.length} termék található.\n`);

  for (const product of products) {
    console.log(`Termék: "${product.productName}"`);

    // imageUrl
    if (product.imageUrl && product.imageUrl.startsWith("/uploads/")) {
      const newUrl = await migrateImage(product.imageUrl);
      if (newUrl) {
        product.imageUrl = newUrl;
      } else {
        product.imageUrl = "";
      }
    }

    // images tömb
    if (product.images && product.images.length > 0) {
      const newImages = [];
      for (const imgUrl of product.images) {
        if (imgUrl && imgUrl.startsWith("/uploads/")) {
          const newUrl = await migrateImage(imgUrl);
          if (newUrl) {
            newImages.push(newUrl);
          }
        } else if (imgUrl && imgUrl.startsWith("/api/images/")) {
          // Már migrálva
          newImages.push(imgUrl);
        }
      }
      product.images = newImages;
      if (
        newImages.length > 0 &&
        !product.imageUrl.startsWith("/api/images/")
      ) {
        product.imageUrl = newImages[0];
      }
    }

    await product.save();
    console.log(
      `  Mentve: imageUrl=${product.imageUrl}, images=[${product.images.join(", ")}]\n`,
    );
  }

  // 2) Felhasználó profilképek migrálása
  const users = await Users_model.find({});
  console.log(`\n${users.length} felhasználó található.\n`);

  for (const user of users) {
    if (user.picture && user.picture.startsWith("/uploads/")) {
      console.log(`Felhasználó: "${user.username}"`);
      const newUrl = await migrateImage(user.picture);
      if (newUrl) {
        user.picture = newUrl;
      } else {
        user.picture = "";
      }
      await user.save();
      console.log(`  Mentve: picture=${user.picture}\n`);
    }
  }

  console.log("\n=== Migráció kész! ===");
  const imageCount = await Image_model.countDocuments();
  console.log(`Összesen ${imageCount} kép a MongoDB-ben.`);
  process.exit(0);
}

// Várjunk a DB kapcsolatra
setTimeout(() => {
  main().catch((err) => {
    console.error("Migráció hiba:", err);
    process.exit(1);
  });
}, 3000);
