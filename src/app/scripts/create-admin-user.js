import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";

// ⚠️ Ajusta la ruta si tu serviceAccount está en otro lugar
const serviceAccount = JSON.parse(
  fs.readFileSync("C:/Users/TONY/Downloads/aurora-privatekey.json", "utf8")
);

initializeApp({ credential: cert(serviceAccount) });

const EMAIL = "admm1225@gmail.com";
const SCHOOL_ID = "COL001"; // <-- cámbialo si aplica
const TEMP_PASSWORD = "Temp#Aurora_2025!"; // temporal, que lo cambie al primer ingreso

async function main() {
  // 1) Crea el usuario (si ya existe, omite este paso)
  let user;
  try {
    user = await getAuth().createUser({
      email: EMAIL,
      password: TEMP_PASSWORD,
      displayName: "Admin Colegio COL001",
      emailVerified: true,
      disabled: false,
    });
    console.log("✅ Usuario creado:", user.uid);
  } catch (e) {
    if (e.errorInfo?.code === "auth/email-already-exists") {
      user = await getAuth().getUserByEmail(EMAIL);
      console.log("ℹ️ Ya existía. UID:", user.uid);
    } else {
      throw e;
    }
  }

  // 2) Asigna los custom claims (rol y colegio)
  await getAuth().setCustomUserClaims(user.uid, {
    role: "admin",
    schoolId: SCHOOL_ID,
  });
  console.log(
    "✅ Claims asignados: { role: 'admin', schoolId:",
    SCHOOL_ID,
    "}"
  );

  // 3) (Opcional) Forzar refresh de token en el cliente tras el próximo login:
  //    el usuario debe cerrar/abrir sesión para que el frontend lea los nuevos claims.

  // 4) (Opcional) Enviar link de cambio de contraseña:
  // const link = await getAuth().generatePasswordResetLink(EMAIL);
  // console.log("🔗 Enlace de restablecimiento de contraseña:", link);

  console.log("🎉 Listo. Email:", EMAIL);
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
