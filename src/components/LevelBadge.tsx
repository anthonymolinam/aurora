"use client";
import { Badge } from "@/components/ui/badge";

type Nivel = "Insuficiente" | "Básico" | "Satisfactorio" | "Avanzado";

const colorByNivel: Record<Nivel, string> = {
  Insuficiente: "bg-rose-600 text-white",
  Básico: "bg-amber-500 text-black",
  Satisfactorio: "bg-blue-600 text-white",
  Avanzado: "bg-emerald-600 text-white",
};

export default function LevelBadge({ nivel }: { nivel: Nivel }) {
  const cls = colorByNivel[nivel] ?? "bg-zinc-200 text-zinc-900";
  return <Badge className={cls}>{nivel}</Badge>;
}
