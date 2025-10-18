/* ChartAreaInteractive.tsx */
"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Resultado “flexible” que el gráfico entiende */
type ChartResult = {
  grade: string; // "3°" | "6°"
  subject: string; // "Matemáticas" | "Ciencias" ...
  component: string; // "Ecosistémico" | "Organísmico" ...
  affirmation?: string; // competencia / texto
  standard?: string;
  score: number; // 0–100
};

type Claims = {
  role?: "admin" | "docente" | "acudiente";
  superadmin?: boolean;
  subjects?: string[];
  grades?: string[];
  [k: string]: unknown;
};

export const description = "Distribución normal con filtros";

// ===== Helpers =====
const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));
function mean(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
function std(arr: number[]) {
  if (arr.length < 2) return 0.0001;
  const m = mean(arr);
  return Math.sqrt(
    arr.reduce((acc, x) => acc + (x - m) * (x - m), 0) / (arr.length - 1)
  );
}
function normalPDF(x: number, mu: number, sigma: number) {
  const a = 1 / (sigma * Math.sqrt(2 * Math.PI));
  return a * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
}
const chartConfig = {
  pdf: { label: "Densidad normal", color: "var(--primary)" },
} satisfies ChartConfig;

// Mapea tu fila (de cualquier forma) al formato que el gráfico necesita
function adaptRow(row: any): ChartResult | null {
  const gRaw = row.grade ?? row.grado;
  const grade = typeof gRaw === "number" ? `${gRaw}°` : gRaw ?? "";
  const subject = row.subject ?? row.materia ?? "";
  const component = row.component ?? row.componente ?? "";
  const affirmation = row.affirmation ?? row.competencia ?? row.standard ?? "";
  const score = typeof row.score === "number" ? row.score : Number(row.score);

  if (!Number.isFinite(score)) return null;
  if (!grade || !subject || !component) return null;

  return {
    grade,
    subject,
    component,
    affirmation,
    standard: row.standard,
    score,
  };
}

export function ChartAreaInteractive({
  results = [],
  claims,
  onFilteredChange,
}: {
  results: any[]; // tus resultados tal cual
  claims?: Claims | null; // claims opcionales
  onFilteredChange?: (
    filtered: any[],
    stats: { n: number; mean: number; sd: number; median: number }
  ) => void;
}) {
  const isMobile = useIsMobile();

  // Adaptar todos los resultados a ChartResult (ignorando los inválidos)
  const data: ChartResult[] = React.useMemo(
    () => results.map(adaptRow).filter(Boolean) as ChartResult[],
    [results]
  );

  // Limitar combos por rol (docente)
  const role = claims?.role;
  const allowedSubjects =
    role === "docente" && Array.isArray(claims?.subjects)
      ? claims?.subjects
      : undefined;
  const allowedGrades =
    role === "docente" && Array.isArray(claims?.grades)
      ? claims?.grades
      : undefined;

  // Catálogos
  const materiasAll = React.useMemo(() => {
    const s = uniq(data.map((r) => r.subject));
    return allowedSubjects ? s.filter((x) => allowedSubjects.includes(x)) : s;
  }, [data, allowedSubjects]);

  const gradosAll = React.useMemo(() => {
    const g = uniq(data.map((r) => r.grade));
    return allowedGrades ? g.filter((x) => allowedGrades.includes(x)) : g;
  }, [data, allowedGrades]);

  // Estado filtros
  const [materia, setMateria] = React.useState<string>("__ALL__");
  const [grado, setGrado] = React.useState<string>("__ALL__");
  const [componente, setComponente] = React.useState<string>("__ALL__");
  const [competencia, setCompetencia] = React.useState<string>("__ALL__");

  const componentesAll = React.useMemo(() => {
    const base = data
      .filter(
        (r) =>
          (materia === "__ALL__" || r.subject === materia) &&
          (grado === "__ALL__" || r.grade === grado)
      )
      .map((r) => r.component);
    return uniq(base);
  }, [data, materia, grado]);

  const competenciasAll = React.useMemo(() => {
    const base = data
      .filter(
        (r) =>
          (materia === "__ALL__" || r.subject === materia) &&
          (grado === "__ALL__" || r.grade === grado) &&
          (componente === "__ALL__" || r.component === componente)
      )
      .map((r) => r.affirmation ?? r.standard ?? "")
      .filter(Boolean);
    return uniq(base);
  }, [data, materia, grado, componente]);

  // Filtrado final + scores
  const filtrados = React.useMemo(() => {
    return data.filter((r) => {
      const okMat = materia === "__ALL__" || r.subject === materia;
      const okGra = grado === "__ALL__" || r.grade === grado;
      const okCom = componente === "__ALL__" || r.component === componente;
      const compText = r.affirmation ?? r.standard ?? "";
      const okCmp = competencia === "__ALL__" || compText === competencia;
      return okMat && okGra && okCom && okCmp;
    });
  }, [data, materia, grado, componente, competencia]);

  const scores = React.useMemo(
    () => filtrados.map((r) => r.score),
    [filtrados]
  );
  const mu = React.useMemo(() => mean(scores), [scores]);
  const sigma = React.useMemo(() => std(scores), [scores]);

  // Curva normal
  const pdfData = React.useMemo(() => {
    if (scores.length === 0) return [];
    const minX = Math.max(0, Math.floor(mu - 3 * sigma));
    const maxX = Math.min(100, Math.ceil(mu + 3 * sigma));
    const steps = Math.max(60, maxX - minX);
    const raw: { x: number; pdf: number }[] = [];
    let maxPdf = 0;
    for (let i = 0; i <= steps; i++) {
      const x = minX + (i * (maxX - minX)) / steps;
      const y = normalPDF(x, mu, sigma);
      raw.push({ x, pdf: y });
      if (y > maxPdf) maxPdf = y;
    }
    return raw.map((d) => ({ ...d, pdf: d.pdf / (maxPdf || 1) }));
  }, [mu, sigma, scores]);

  const domainX: [number, number] = React.useMemo(() => {
    if (scores.length === 0) return [0, 100];
    return [
      Math.max(0, Math.round(mu - 3 * sigma)),
      Math.min(100, Math.round(mu + 3 * sigma)),
    ];
  }, [mu, sigma, scores]);

  // ===== Animación de entrada (re-montar Area cuando aparecen datos) =====
  const dataReady = pdfData.length > 0;
  const [animateKey, setAnimateKey] = React.useState(0);
  React.useEffect(() => {
    if (dataReady) setAnimateKey((k) => k + 1);
  }, [dataReady]);

  // === Emisión controlada al padre para evitar bucles ===
  const lastEmittedRef = React.useRef<{
    n: number;
    mean: number;
    sd: number;
    median: number;
    hash: string;
  } | null>(null);

  React.useEffect(() => {
    if (!onFilteredChange) return;

    const n = scores.length;
    // mediana local
    const sorted = [...scores].sort((a, b) => a - b);
    const median = n
      ? n % 2
        ? sorted[(n - 1) / 2]
        : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : 0;

    // Hash simple para detectar cambios reales
    const hash = `${n}|${mu.toFixed(6)}|${sigma.toFixed(6)}|${median.toFixed(
      6
    )}`;

    if (lastEmittedRef.current?.hash === hash) {
      return; // nada cambió → no emitas
    }
    lastEmittedRef.current = { n, mean: mu, sd: sigma, median, hash };

    onFilteredChange(filtrados, { n, mean: mu, sd: sigma, median });
  }, [filtrados, scores, mu, sigma]); // intencionalmente sin onFilteredChange

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Distribución normal (curva de Gauss)</CardTitle>
        <CardDescription>
          {scores.length > 0 ? (
            <>
              Media μ = {mu.toFixed(1)} · DE σ = {sigma.toFixed(2)} · N ={" "}
              {scores.length}
            </>
          ) : (
            <>Sin datos para los filtros seleccionados</>
          )}
        </CardDescription>
        <CardAction>
          <div className="flex flex-wrap gap-2">
            {/* Materia */}
            <Select
              value={materia}
              onValueChange={(v) => {
                setMateria(v);
                setComponente("__ALL__");
                setCompetencia("__ALL__");
              }}
            >
              <SelectTrigger className="w-56" aria-label="Materia">
                <SelectValue placeholder="Materia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Todas las materias</SelectItem>
                {materiasAll.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Grado */}
            <Select
              value={grado}
              onValueChange={(v) => {
                setGrado(v);
                setComponente("__ALL__");
                setCompetencia("__ALL__");
              }}
            >
              <SelectTrigger className="w-56" aria-label="Grado">
                <SelectValue placeholder="Grado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Todos los grados</SelectItem>
                {gradosAll.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Componente */}
            <Select
              value={componente}
              onValueChange={(v) => {
                setComponente(v);
                setCompetencia("__ALL__");
              }}
            >
              <SelectTrigger className="w-56" aria-label="Componente">
                <SelectValue placeholder="Componente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Todos los componentes</SelectItem>
                {componentesAll.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Competencia */}
            <Select value={competencia} onValueChange={setCompetencia}>
              <SelectTrigger className="w-56" aria-label="Competencia">
                <SelectValue placeholder="Competencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Todas las competencias</SelectItem>
                {competenciasAll.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          {/* Evita render vacío; cuando haya datos, animamos la entrada */}
          {dataReady ? (
            <AreaChart data={pdfData}>
              <defs>
                <linearGradient id="fillPDF" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-pdf)"
                    stopOpacity={0.9}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-pdf)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="x"
                type="number"
                domain={domainX}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                label={{
                  value: "Puntaje",
                  position: "insideBottom",
                  offset: -5,
                }}
                tickFormatter={(v) => String(Math.round(Number(v)))}
              />
              <YAxis domain={[0, 1]} hide />

              <ChartTooltip
                cursor={false}
                defaultIndex={-1}
                formatter={(value: unknown) => {
                  const num = Number(value);
                  const val = Number.isFinite(num) ? num.toFixed(2) : "";
                  return [val, "Densidad normal"];
                }}
                labelFormatter={(label: unknown) => {
                  const n = Array.isArray(label)
                    ? Number(label[0])
                    : Number(label);
                  return `Puntaje: ${Number.isFinite(n) ? Math.round(n) : ""}`;
                }}
                content={<ChartTooltipContent indicator="dot" />}
              />

              <Area
                key={animateKey} // fuerza animación al aparecer datos
                dataKey="pdf"
                type="monotone"
                fill="url(#fillPDF)"
                stroke="var(--color-pdf)"
                name="Densidad normal"
                isAnimationActive={!isMobile}
                animationBegin={0}
                animationDuration={700}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          ) : (
            <div className="h-[280px]" /> // placeholder para mantener altura
          )}
        </ChartContainer>

        <div className="mt-3 text-xs text-muted-foreground">
          {scores.length > 0 ? (
            <>
              Representación de la PDF normal ajustada (escala relativa 0–1)
              para los filtros seleccionados.
            </>
          ) : (
            <>No hay puntajes para los filtros seleccionados.</>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
