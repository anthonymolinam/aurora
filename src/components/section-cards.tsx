import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import * as React from "react";

/** Fila flexible (solo necesitamos score aquí) */
type Row = { score?: number };

type Claims = {
  role?: "admin" | "docente" | "acudiente";
  superadmin?: boolean;
  subjects?: string[];
  grades?: string[];
  [k: string]: unknown;
};

type Stats = { n: number; mean: number; sd: number; median: number };

// Helpers (solo si no llega stats)
function mean(nums: number[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}
function median(nums: number[]) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}
function std(nums: number[]) {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const v =
    nums.reduce((acc, x) => acc + (x - m) * (x - m), 0) / (nums.length - 1);
  return Math.sqrt(v);
}

export function SectionCards({
  results = [],
  claims,
  stats,
}: {
  results: Row[];
  claims?: Claims | null;
  /** Estadísticos calculados por el gráfico (preferidos) */
  stats?: Stats | null;
}) {
  // Si no viene stats, calculamos rápido
  const computed = React.useMemo<Stats>(() => {
    if (stats) return stats;
    const scores = results
      .map((r) => (typeof r.score === "number" ? r.score : Number(r.score)))
      .filter((n) => Number.isFinite(n)) as number[];
    return {
      n: scores.length,
      mean: mean(scores),
      median: median(scores),
      sd: std(scores),
    };
  }, [results, stats]);

  const { n, mean: avg, median: med, sd } = computed;

  const role = claims?.role;
  const subtitle =
    role === "acudiente"
      ? "Resumen de los resultados del estudiante"
      : "Resumen de los resultados visibles";

  const F = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Promedio */}
      <Card className="@container/card" data-slot="card">
        <CardHeader>
          <CardDescription>Promedio</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {n ? F.format(avg) : "—"}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {subtitle} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">N = {n}</div>
        </CardFooter>
      </Card>

      {/* Mediana */}
      <Card className="@container/card" data-slot="card">
        <CardHeader>
          <CardDescription>Mediana</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {n ? F.format(med) : "—"}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Centralidad de los puntajes
          </div>
          <div className="text-muted-foreground">Basado en {n} registros</div>
        </CardFooter>
      </Card>

      {/* Registros */}
      <Card className="@container/card" data-slot="card">
        <CardHeader>
          <CardDescription>Registros</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {F.format(n)}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {role === "acudiente"
              ? "Evidencias del estudiante"
              : "Resultados en el rango"}
          </div>
          <div className="text-muted-foreground">
            {role === "acudiente"
              ? "Filtrado por rol de acudiente"
              : "Filtrado por materia, grado, componente y competencia (si aplica)"}
          </div>
        </CardFooter>
      </Card>

      {/* Desviación estándar */}
      <Card className="@container/card" data-slot="card">
        <CardHeader>
          <CardDescription>Desviación estándar</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {n ? F.format(sd) : "—"}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Dispersión de resultados
          </div>
          <div className="text-muted-foreground">
            {sd < 8
              ? "Baja dispersión (puntajes consistentes)"
              : sd < 15
              ? "Dispersión moderada"
              : "Alta dispersión"}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
