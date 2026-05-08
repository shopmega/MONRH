export default function AdminLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="soft-card h-32 rounded-3xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-[var(--surface)]" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-3xl bg-[var(--surface)]" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-64 rounded-3xl bg-[var(--surface)]" />
        ))}
      </div>
    </div>
  );
}
