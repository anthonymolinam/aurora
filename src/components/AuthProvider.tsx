"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { listenAuth, signOut } from "@/lib/auth-client";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};
const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(Ctx);
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = listenAuth((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);
  return (
    <Ctx.Provider value={{ user, loading, signOut }}>{children}</Ctx.Provider>
  );
}
