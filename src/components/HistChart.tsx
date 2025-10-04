// /src/components/HistChart.tsx
"use client";
import { useEffect, useMemo, useRef } from "react";

function mean(a: number[]) {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
}
function stddev(a: number[]) {
  if (a.length < 2) return NaN;
  const m = mean(a);
  const v = a.reduce((acc, x) => acc + (x - m) ** 2, 0) / (a.length - 1);
  return Math.sqrt(v);
}
function normalPdf(x: number, mu: number, sigma: number) {
  if (!isFinite(mu) || !isFinite(sigma) || sigma <= 0) return 0;
  const c = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const e = Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma));
  return c * e;
}

export default function HistChart({ values }: { values: number[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const m = mean(values);
    const s = stddev(values);
    // Rango para la curva: μ ± 3σ, con fallback a min/max si s no existe
    const vMin = Math.min(...values);
    const vMax = Math.max(...values);
    const min = isFinite(s) ? m - 3 * s : vMin;
    const max = isFinite(s) ? m + 3 * s : vMax;
    // generar 100 puntos
    const xs = Array.from(
      { length: 100 },
      (_, i) => min + (i * (max - min)) / 99
    );
    const ys = xs.map((x) => normalPdf(x, m, s));
    return { m, s, xs, ys };
  }, [values]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const Plotly: any = await import("plotly.js-dist-min");
      if (!mounted || !ref.current) return;

      // 1) Histograma como densidad (área = 1)
      const hist = {
        x: values,
        type: "histogram",
        histnorm: "probability density",
        marker: { color: "#7c3aed" }, // tu primary (violet)
        opacity: 0.75,
        autobinx: true,
      };

      // 2) Curva normal teórica (misma escala de densidad)
      const line = {
        x: stats.xs,
        y: stats.ys,
        type: "scatter",
        mode: "lines",
        line: { width: 3 },
        name: "Gauss (μ, σ)",
      };

      const layout = {
        title: "Distribución de Notas (con Gauss teórica)",
        xaxis: { title: "Nota" },
        yaxis: { title: "Densidad" },
        margin: { t: 40, r: 20, b: 50, l: 50 },
        showlegend: false,
      };

      await Plotly.newPlot(ref.current, [hist, line], layout, {
        responsive: true,
      });
    })();
    return () => {
      mounted = false;
    };
  }, [values, stats]);

  return <div className="w-full h-96" ref={ref} />;
}
