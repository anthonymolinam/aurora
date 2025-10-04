"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function RequirePasswordChange({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [mustChange, setMustChange] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (data.mustChangePassword) {
          setMustChange(true);
          router.replace("/auth/change-password"); // redirigir
        } else {
          setMustChange(false);
        }
      } else {
        setMustChange(false);
      }
    })();
  }, [user, loading, router]);

  if (loading || mustChange === null) return <p>Cargando sesión…</p>;
  if (mustChange) return null; // ya redirigió
  return <>{children}</>;
}
