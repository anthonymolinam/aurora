import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex h-screen items-center justify-center">
      <div className="space-x-4">
        <Button variant="default">Aurora</Button>
        <Button variant="secondary">Secundario</Button>
        <Button variant="destructive">Destructivo</Button>
      </div>
    </main>
  );
}
