"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import HistChart from "@/components/HistChart";
import BoxPlot from "@/components/BoxPlot";
import LevelBadge from "@/components/LevelBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import RequireAuth from "@/components/RequireAuth";
import RequirePasswordChange from "@/components/RequirePasswordChange";

// ---------- tipos ----------
type Resultado = {
  id?: string;
  estudiante: string;
  grado: number;
  seccion: string;
  materia: string;
  componente: string;
  competencia: string;
  afirmacion: string;
  complejidad: "Baja" | "Media" | "Alta";
  nivel: "Insuficiente" | "Básico" | "Satisfactorio" | "Avanzado";
  score: number;
};

// ---------- helpers estadísticos ----------
function mean(a: number[]) {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
}
function median(a: number[]) {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function quartiles(a: number[]) {
  if (!a.length) return { q1: NaN, q3: NaN };
  const s = [...a].sort((x, y) => x - y);
  const mid = Math.floor(s.length / 2);
  const lower = s.slice(0, mid);
  const upper = s.length % 2 ? s.slice(mid + 1) : s.slice(mid);
  const med = (arr: number[]) => {
    const n = arr.length,
      m = Math.floor(n / 2);
    return n % 2 ? arr[m] : (arr[m - 1] + arr[m]) / 2;
  };
  return { q1: med(lower), q3: med(upper) };
}
function stddev(a: number[]) {
  if (a.length < 2) return NaN;
  const m = mean(a);
  const v = a.reduce((acc, x) => acc + (x - m) ** 2, 0) / (a.length - 1);
  return Math.sqrt(v);
}

export default function DashboardPage() {
  const [data, setData] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros en cascada
  const [materia, setMateria] = useState<string>("Todas");
  const [componente, setComponente] = useState<string>("Todos");
  const [competencia, setCompetencia] = useState<string>("Todas");
  const [grado, setGrado] = useState<string>("Todos");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "resultados"));
      const rows: Resultado[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setData(rows);
      setLoading(false);
    })();
  }, []);

  // opciones dinámicas (dependen de la selección anterior)
  const materias = useMemo(
    () => ["Todas", ...Array.from(new Set(data.map((d) => d.materia)))],
    [data]
  );

  const componentes = useMemo(() => {
    const source =
      materia === "Todas" ? data : data.filter((d) => d.materia === materia);
    return ["Todos", ...Array.from(new Set(source.map((d) => d.componente)))];
  }, [data, materia]);

  const competencias = useMemo(() => {
    const mFiltered =
      materia === "Todas" ? data : data.filter((d) => d.materia === materia);
    const cFiltered =
      componente === "Todos"
        ? mFiltered
        : mFiltered.filter((d) => d.componente === componente);
    return [
      "Todas",
      ...Array.from(new Set(cFiltered.map((d) => d.competencia))),
    ];
  }, [data, materia, componente]);

  const grados = useMemo(
    () => [
      "Todos",
      ...Array.from(new Set(data.map((d) => d.grado))).sort(
        (a: any, b: any) => a - b
      ),
    ],
    [data]
  );

  // filtrado final
  const filtrados = useMemo(() => {
    return data.filter(
      (r) =>
        (materia === "Todas" || r.materia === materia) &&
        (componente === "Todos" || r.componente === componente) &&
        (competencia === "Todas" || r.competencia === competencia) &&
        (grado === "Todos" || r.grado === Number(grado))
    );
  }, [data, materia, componente, competencia, grado]);

  const notas = filtrados.map((d) => d.score);

  // stats
  const m = mean(notas);
  const med = median(notas);
  const { q1, q3 } = quartiles(notas);
  const sd = stddev(notas);

  // cuando cambie "materia", resetea dependientes para evitar selecciones inválidas
  useEffect(() => {
    setComponente("Todos");
    setCompetencia("Todas");
  }, [materia]);
  useEffect(() => {
    setCompetencia("Todas");
  }, [componente]);

  return (
    <RequireAuth>
      <RequirePasswordChange>
        <main className="p-6 space-y-6">
          {/* Barra de filtros */}
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <h1 className="text-2xl font-bold">Aurora — Dashboard</h1>

            <div className="flex flex-wrap gap-4">
              {/* Materia */}
              <div className="flex flex-col w-[200px]">
                <Label
                  htmlFor="materia"
                  className="text-xs font-medium text-muted-foreground mb-1"
                >
                  Materia
                </Label>
                <Select value={materia} onValueChange={setMateria}>
                  <SelectTrigger id="materia">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {materias.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Componente */}
              <div className="flex flex-col w-[220px]">
                <Label
                  htmlFor="componente"
                  className="text-xs font-medium text-muted-foreground mb-1"
                >
                  Componente
                </Label>
                <Select value={componente} onValueChange={setComponente}>
                  <SelectTrigger id="componente">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {componentes.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Competencia */}
              <div className="flex flex-col w-[260px]">
                <Label
                  htmlFor="competencia"
                  className="text-xs font-medium text-muted-foreground mb-1"
                >
                  Competencia
                </Label>
                <Select value={competencia} onValueChange={setCompetencia}>
                  <SelectTrigger id="competencia">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {competencias.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Grado */}
              <div className="flex flex-col w-[140px]">
                <Label
                  htmlFor="grado"
                  className="text-xs font-medium text-muted-foreground mb-1"
                >
                  Grado
                </Label>
                <Select value={grado} onValueChange={setGrado}>
                  <SelectTrigger id="grado">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {grados.map((v: any) => (
                      <SelectItem key={v} value={String(v)}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Promedio</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {isNaN(m) ? "—" : m.toFixed(1)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Mediana</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {isNaN(med) ? "—" : med.toFixed(1)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Q1 / Q3</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {isNaN(q1) || isNaN(q3)
                  ? "—"
                  : `${q1.toFixed(1)} / ${q3.toFixed(1)}`}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Desviación Estándar</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {isNaN(sd) ? "—" : sd.toFixed(1)}
              </CardContent>
            </Card>
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Histograma</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <p>Cargando…</p> : <HistChart values={notas} />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Diagrama de Caja</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <p>Cargando…</p> : <BoxPlot values={notas} />}
              </CardContent>
            </Card>
          </div>

          {/* Vista rápida */}
          <Card>
            <CardHeader>
              <CardTitle>Resultados (muestra)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid md:grid-cols-2 gap-2 text-sm">
                {filtrados.slice(0, 12).map((r) => (
                  <li
                    key={r.id}
                    className="border rounded p-2 flex items-center justify-between gap-2"
                  >
                    <div>
                      <b>{r.estudiante}</b> — {r.materia} (G{r.grado}
                      {r.seccion}) · {r.competencia}
                    </div>
                    <div className="flex items-center gap-2">
                      <LevelBadge nivel={r.nivel} />
                      <b>{r.score}</b>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </main>
      </RequirePasswordChange>
    </RequireAuth>
  );
}
