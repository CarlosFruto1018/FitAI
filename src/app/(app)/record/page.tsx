import { RecordPage } from "@/components/record/RecordPage";

export default function RecordRoute() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Registrar</h1>
        <p className="text-sm text-zinc-500">Voz, foto o texto — la IA lo procesa</p>
      </div>
      <RecordPage />
    </div>
  );
}
