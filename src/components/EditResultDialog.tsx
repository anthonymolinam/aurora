"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Props = {
  id: string;
  onUpdated?: () => void;
};

export default function EditResultDialog({ id, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // campos
  const [estudiante, setEstudiante] = useState("");
  const [grado, setGrado] = useState<string>("");
  const [seccion, setSeccion] = useState("");
  const [materia, setMateria] = useState("");
  const [componente, setComponente] = useState("");
  const [competencia, setCompetencia] = useState("");
  const [nivel, setNivel] = useState<
    "Insuficiente" | "Básico" | "Satisfactorio" | "Avanzado"
  >("Satisfactorio");
  const [score, setScore] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      const snap = await getDoc(doc(db, "resultados", id));
      if (snap.exists()) {
        const d: any = snap.data();
        setEstudiante(d.estudiante ?? "");
        setGrado(String(d.grado ?? ""));
        setSeccion(d.seccion ?? "");
        setMateria(d.materia ?? "");
        setComponente(d.componente ?? "");
        setCompetencia(d.competencia ?? "");
        setNivel(d.nivel ?? "Satisfactorio");
        setScore(String(d.score ?? ""));
      }
    })();
  }, [open, id]);

  async function submit() {
    const scoreNum = Number(score);
    if (!estudiante || !grado || !materia || !componente || !competencia)
      return;
    if (Number.isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, "resultados", id), {
        estudiante,
        grado: Number(grado),
        seccion,
        materia,
        componente,
        competencia,
        nivel,
        score: scoreNum,
        updatedAt: new Date(),
      });
      setOpen(false);
      onUpdated?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar resultado</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <Label htmlFor="estudiante" className="mb-1 text-xs">
              Estudiante
            </Label>
            <Input
              id="estudiante"
              value={estudiante}
              onChange={(e) => setEstudiante(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <Label htmlFor="grado" className="mb-1 text-xs">
              Grado
            </Label>
            <Input
              id="grado"
              inputMode="numeric"
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <Label htmlFor="seccion" className="mb-1 text-xs">
              Sección
            </Label>
            <Input
              id="seccion"
              value={seccion}
              onChange={(e) => setSeccion(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <Label className="mb-1 text-xs">Materia</Label>
            <Input
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <Label className="mb-1 text-xs">Componente</Label>
            <Input
              value={componente}
              onChange={(e) => setComponente(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <Label className="mb-1 text-xs">Competencia</Label>
            <Input
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <Label className="mb-1 text-xs">Nivel</Label>
            <Select value={nivel} onValueChange={(v: any) => setNivel(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Insuficiente">Insuficiente</SelectItem>
                <SelectItem value="Básico">Básico</SelectItem>
                <SelectItem value="Satisfactorio">Satisfactorio</SelectItem>
                <SelectItem value="Avanzado">Avanzado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col">
            <Label htmlFor="score" className="mb-1 text-xs">
              Puntaje (0–100)
            </Label>
            <Input
              id="score"
              inputMode="numeric"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
