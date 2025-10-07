"use client";
import { Button } from "@/components/ui/button";

type Row = Record<string, any>;

function toCSV(rows: Row[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    // escapa comillas y separadores
    const needsQuotes = /[",\n;]/.test(s);
    const body = s.replace(/"/g, '""');
    return needsQuotes ? `"${body}"` : body;
  };
  const head = headers.join(",");
  const body = rows
    .map((r) => headers.map((h) => escape(r[h])).join(","))
    .join("\n");
  return head + "\n" + body;
}

export default function ExportCSVButton({
  rows,
  filename = "aurora_resultados.csv",
  disabled,
}: {
  rows: Row[];
  filename?: string;
  disabled?: boolean;
}) {
  function download() {
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      variant="secondary"
      onClick={download}
      disabled={disabled || rows.length === 0}
    >
      Exportar CSV
    </Button>
  );
}
