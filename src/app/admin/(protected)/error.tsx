"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="soft-card max-w-md rounded-2xl p-6 text-center">
        <h2 className="display-font text-xl font-semibold">Une erreur est survenue</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Le chargement de cette page a échoué. Veuillez réessayer.
        </p>
        <button onClick={reset} className="btn-primary mt-4 px-4 py-2 text-sm">
          Réessayer
        </button>
      </div>
    </div>
  );
}
