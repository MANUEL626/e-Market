import Link from "next/link";
import { ShieldAlert } from "lucide-react";

type AdminRequiredProps = {
  title?: string;
  description?: string;
};

export function AdminRequired({
  title = "Acces reserve aux administrateurs",
  description = "Cette section modifie des donnees sensibles de l'organisation. Demandez a un administrateur de realiser cette action.",
}: AdminRequiredProps) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-[8px] border border-amber-200 bg-amber-50 px-6 py-12 text-center text-amber-950">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-amber-700 shadow-sm">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h1 className="text-xl font-extrabold text-amber-950">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-amber-900/80">{description}</p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex rounded-full bg-amber-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-950"
      >
        Retour au dashboard
      </Link>
    </div>
  );
}
