import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("C:/Users/TONY/Downloads/aurora-privatekey.json", "utf8")
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function importCollection(collectionName, filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  console.log(`Cargando ${data.length} documentos en ${collectionName}...`);
  for (const doc of data) {
    await db.collection(collectionName).add(doc);
  }
  console.log(`✅ ${collectionName} cargado correctamente`);
}

await importCollection(
  "estudiantes",
  "C:/Users/TONY/Desktop/aurora/src/app/scripts/firebase_data/estudiantes_COL001.json"
);

await importCollection(
  "resultados",
  "C:/Users/TONY/Desktop/aurora/src/app/scripts/firebase_data/resultados_COL001.json"
);

await importCollection(
  "stats_by_cohort",
  "C:/Users/TONY/Desktop/aurora/src/app/scripts/firebase_data/stats_by_cohort_COL001.json"
);

console.log("🎉 ¡Todo se importó correctamente!");
