"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { updatePassword } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      await updatePassword(user, newPass);
      await updateDoc(doc(db, "users", user.uid), {
        mustChangePassword: false,
      });
      router.replace("/dashboard");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Establece tu nueva contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="newpass">Nueva contraseña</Label>
              <Input
                id="newpass"
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
              />
            </div>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Guardando…" : "Cambiar contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
