import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export async function POST() {
  // ---- items de ejemplo (metadatos del ítem) ----
  const items = [
    {
      materia: "Matemáticas",
      grado: 6,
      componente: "Numérico-variacional",
      competencia: "Razonamiento Cuantitativo",
      afirmacion: "Interpreta índices y tasas",
      complejidad: "Media",
      createdAt: Timestamp.now(),
    },
    {
      materia: "Lectura Crítica",
      grado: 6,
      componente: "Semántico",
      competencia: "Identificar Información Local",
      afirmacion: "Ubica información puntual en el texto",
      complejidad: "Baja",
      createdAt: Timestamp.now(),
    },
  ];

  // ---- resultados de ejemplo (puntajes por estudiante-ítem) ----
  // Usa los mismos campos que quieras filtrar luego para evitar joins
  const resultados = [
    {
      estudiante: "Juan Pérez",
      grado: 6,
      seccion: "A",
      materia: "Matemáticas",
      componente: "Numérico-variacional",
      competencia: "Razonamiento Cuantitativo",
      afirmacion: "Interpreta índices y tasas",
      complejidad: "Media",
      nivel: "Satisfactorio",
      score: 75,
      createdAt: Timestamp.now(),
    },
    {
      estudiante: "Ana García",
      grado: 6,
      seccion: "B",
      materia: "Matemáticas",
      componente: "Numérico-variacional",
      competencia: "Razonamiento Cuantitativo",
      afirmacion: "Interpreta índices y tasas",
      complejidad: "Media",
      nivel: "Básico",
      score: 62,
      createdAt: Timestamp.now(),
    },
    {
      estudiante: "Juan Pérez",
      grado: 6,
      seccion: "A",
      materia: "Lectura Crítica",
      componente: "Semántico",
      competencia: "Identificar Información Local",
      afirmacion: "Ubica información puntual en el texto",
      complejidad: "Baja",
      nivel: "Avanzado",
      score: 90,
      createdAt: Timestamp.now(),
    },
    {
      estudiante: "Ana García",
      grado: 6,
      seccion: "B",
      materia: "Lectura Crítica",
      componente: "Semántico",
      competencia: "Identificar Información Local",
      afirmacion: "Ubica información puntual en el texto",
      complejidad: "Baja",
      nivel: "Satisfactorio",
      score: 80,
      createdAt: Timestamp.now(),
    },
    // agrega +10–15 más si quieres
  ];

  try {
    const itemsCol = collection(db, "items");
    const resCol = collection(db, "resultados");
    await Promise.all(items.map((d) => addDoc(itemsCol, d)));
    await Promise.all(resultados.map((d) => addDoc(resCol, d)));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "seed error" },
      { status: 500 }
    );
  }
}
