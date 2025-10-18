/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  QueryConstraint,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import localData from "./data.json";

// --- tipos mínimos para la tabla ---
type Resultado = {
  id?: string;
  estudiante: string;
  grado: number;
  seccion: string;
  materia: string;
  componente: string;
  competencia: string;
  nivel: "Insuficiente" | "Básico" | "Satisfactorio" | "Avanzado";
  score: number;
};

// Helper: score -> nivel
function nivelFromScore(score: number): Resultado["nivel"] {
  if (score >= 80) return "Avanzado";
  if (score >= 60) return "Satisfactorio";
  if (score >= 40) return "Básico";
  return "Insuficiente";
}

// Helper: "6°" -> 6
function gradoToNumber(gr: unknown): number {
  if (typeof gr !== "string") return Number.NaN;
  const m = gr.match(/\d+/);
  return m ? parseInt(m[0], 10) : Number.NaN;
}

export default function Page() {
  const router = useRouter();

  // auth guard / estado
  const [checkingAuth, setCheckingAuth] = React.useState(true);
  const [claims, setClaims] = React.useState<Record<string, any> | null>(null);

  const [resultados, setResultados] = React.useState<Resultado[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // sincronizados con los filtros del gráfico:
  const [filteredResults, setFilteredResults] = React.useState<any[]>([]);
  const [filteredStats, setFilteredStats] = React.useState<{
    n: number;
    mean: number;
    sd: number;
    median: number;
  } | null>(null);

  // 1) Vigila sesión, obtiene claims y redirige si no hay usuario
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        setCheckingAuth(false);
        return;
      }
      try {
        const token = await user.getIdTokenResult();
        setClaims(token.claims as Record<string, any>);
      } catch {
        setClaims(null);
      } finally {
        setCheckingAuth(false);
      }
    });
    return () => unsub();
  }, [router]);

  // 2) Carga Firestore SOLO cuando ya se confirmó auth, con filtros por rol/colegio
  React.useEffect(() => {
    if (checkingAuth) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) return;

        const role = claims?.role as string | undefined;
        const isSuperAdmin = claims?.superadmin === true;
        const schoolId: string | undefined =
          (claims?.schoolId as string | undefined) ??
          (Array.isArray(claims?.schoolIds)
            ? (claims?.schoolIds as string[])[0]
            : undefined);

        const constraints: QueryConstraint[] = [];

        // Multi-tenant: restringe por colegio salvo superadmin
        if (schoolId && !isSuperAdmin) {
          constraints.push(where("schoolId", "==", schoolId));
        }
        if (!schoolId && !isSuperAdmin) {
          setResultados([]);
          setLoading(false);
          return;
        }

        // Por rol
        if (role === "docente") {
          constraints.push(where("docenteUid", "==", user.uid));
        } else if (role === "acudiente") {
          constraints.push(where("acudienteUid", "==", user.uid));
        } else if (role === "admin" || isSuperAdmin) {
          // sin extra
        } else {
          setResultados([]);
          setLoading(false);
          return;
        }

        const base = collection(db, "resultados");
        const q = constraints.length
          ? query(base, ...constraints)
          : query(base);
        const snap = await getDocs(q);

        const rows: Resultado[] = snap.docs.map((d) => {
          const v = d.data() as any;
          const scoreNum =
            typeof v.score === "number" ? v.score : Number(v.score ?? 0);

          return {
            id: d.id,
            estudiante: v.studentId ?? v.estudianteUid ?? "—",
            grado: gradoToNumber(v.grade),
            seccion: v.grupo ?? v.seccion ?? "",
            materia: v.subject ?? "",
            componente: v.component ?? "",
            competencia: v.affirmation ?? v.standard ?? "",
            nivel: nivelFromScore(scoreNum),
            score: scoreNum,
          };
        });

        setResultados(rows);
        // reset filtros derivados
        setFilteredResults([]);
        setFilteredStats(null);
      } catch (e: any) {
        console.error(e);
        setError(
          e?.message ??
            "Error al cargar datos. Verifica reglas, índices y credenciales."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [checkingAuth, claims]);

  if (checkingAuth) return null;

  // Si quieres que la tabla también siga filtros (recomendado):
  const dataForTable = (
    filteredResults.length ? filteredResults : resultados
  ) as any[];

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Tarjetas: usan filtrados + stats del gráfico si existen */}
              <SectionCards
                results={dataForTable}
                claims={claims}
                stats={filteredStats}
              />

              <div className="px-4 lg:px-6">
                <ChartAreaInteractive
                  results={resultados as any[]}
                  claims={claims}
                  onFilteredChange={(filtered, stats) => {
                    setFilteredResults(filtered);
                    setFilteredStats(stats);
                  }}
                />
              </div>

              {loading && (
                <div className="px-4 lg:px-6 text-sm text-muted-foreground">
                  Cargando resultados…
                </div>
              )}
              {error && (
                <div className="px-4 lg:px-6 text-sm text-red-600">{error}</div>
              )}

              <DataTable data={dataForTable} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
