// src/global.d.ts
declare module "plotly.js-dist-min" {
  type PlotlyRoot = HTMLElement | null | undefined;

  interface PlotlyAPI {
    newPlot: (
      root: PlotlyRoot,
      data: any[],
      layout?: any,
      config?: any
    ) => Promise<void> | void;
    react: (
      root: PlotlyRoot,
      data: any[],
      layout?: any,
      config?: any
    ) => Promise<void> | void;
    purge: (root: PlotlyRoot) => void;
    Plots: { resize: (root: PlotlyRoot) => void };
  }

  const Plotly: PlotlyAPI;
  export default Plotly;
}
