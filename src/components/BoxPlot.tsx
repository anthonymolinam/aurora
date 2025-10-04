"use client";
import { useEffect, useRef } from "react";

export default function BoxPlot({ values }: { values: number[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const Plotly: any = await import("plotly.js-dist-min");
      if (!mounted || !ref.current) return;

      await Plotly.newPlot(
        ref.current,
        [
          {
            y: values,
            type: "box",
            boxpoints: "outliers",
          },
        ],
        { margin: { t: 20, r: 20, b: 40, l: 50 } },
        { responsive: true }
      );
    })();
    return () => {
      mounted = false;
    };
  }, [values]);

  return <div className="w-full h-96" ref={ref} />;
}
