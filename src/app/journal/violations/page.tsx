"use client";

import { useEffect, useMemo, useState } from "react";

type Violation = {
  id: string;
  type: string;
  description: string;
  occurredAt: string;
  createdAt: string;
};

type FormErrors = {
  description?: string;
  occurredAt?: string;
  type?: string;
};

type SortBy = "date-asc" | "date-desc" | "created-asc" | "created-desc";

const VIOLATION_TYPE_LABELS: Record<string, string> = {
  salary_delayed: "Salaire retardé",
  unpaid_overtime: "Heures supplémentaires non payées",
  harassment: "Harcèlement",
  discrimination: "Discrimination",
  unsafe_conditions: "Conditions de travail dangereuses",
  illegal_deduction: "Déduction illégale",
  other: "Autre",
};

export default function ViolationsPage() {
  const [items, setItems] = useState<Violation[]>([]);
  const [form, setForm] = useState({
    type: "salary_delayed",
    description: "",
    occurredAt: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");

  const filteredAndSorted = useMemo(() => {
    let filtered = items;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.type === filterType);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.description.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          item.occurredAt.includes(q),
      );
    }

    // Sort
    const sorted = [...filtered];
    if (sortBy === "date-desc") {
      sorted.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    } else if (sortBy === "date-asc") {
      sorted.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
    } else if (sortBy === "created-desc") {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "created-asc") {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return sorted;
  }, [items, search, filterType, sortBy]);

  const typeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const type of Object.keys(VIOLATION_TYPE_LABELS)) {
      stats[type] = items.filter((item) => item.type === type).length;
    }
    return stats;
  }, [items]);

  async function load() {
    try {
      const response = await fetch("/api/journal/violations");
      const data = (await response.json()) as { ok: boolean; items?: Violation[] };
      if (data.ok && data.items) {
        setItems(data.items);
      }
    } catch (err) {
      setFeedbackStatus({ type: "error", message: "Erreur lors du chargement" });
    }
  }

  useEffect(() => {
    let active = true;
    load();
    return () => {
      active = false;
    };
  }, []);

  function validateForm(): boolean {
    const newErrors: FormErrors = {};

    if (!form.description.trim()) {
      newErrors.description = "Description requise";
    } else if (form.description.trim().length < 10) {
      newErrors.description = "Description trop courte (min 10 caractères)";
    }

    if (!form.occurredAt) {
      newErrors.occurredAt = "Date requise";
    } else if (new Date(form.occurredAt) > new Date()) {
      newErrors.occurredAt = "La date ne peut pas être dans le futur";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setFeedbackStatus(null);

    try {
      const response = await fetch("/api/journal/violations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout");
      }

      setForm((current) => ({
        ...current,
        description: "",
        occurredAt: new Date().toISOString().slice(0, 10),
      }));
      setErrors({});
      setFeedbackStatus({ type: "success", message: "Violation enregistrée avec succès" });
      await load();
    } catch (err) {
      setFeedbackStatus({ type: "error", message: err instanceof Error ? err.message : "Erreur inconnue" });
    } finally {
      setLoading(false);
    }
  }

  async function deleteViolation(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette violation ?")) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/journal/violations/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      setFeedbackStatus({ type: "success", message: "Violation supprimée" });
      await load();
    } catch (err) {
      setFeedbackStatus({ type: "error", message: err instanceof Error ? err.message : "Erreur inconnue" });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        {/* Header */}
        <section className="soft-card rounded-[2rem] p-6 sm:p-8">
          <h1 className="display-font text-4xl font-semibold">Journal des Violations</h1>
          <p className="mt-3 text-sm text-[var(--ink-soft)]">Enregistrez et suivez les violations du droit du travail rencontrées.</p>
        </section>

        {/* Stats */}
        <section className="mt-5 grid gap-3 sm:grid-cols-4">
          {Object.entries(typeStats)
            .filter(([, count]) => count > 0)
            .map(([type, count]) => (
              <article key={type} className="soft-card rounded-2xl border border-[var(--line)]/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">{VIOLATION_TYPE_LABELS[type] || type}</p>
                <p className="display-font mt-2 text-3xl font-semibold">{count}</p>
              </article>
            ))}
        </section>

        {/* Feedback */}
        {feedbackStatus && (
          <div
            className={`mt-5 rounded-2xl p-4 text-sm ${
              feedbackStatus.type === "success"
                ? "status-success"
                : feedbackStatus.type === "error"
                  ? "status-error"
                  : "status-info"
            }`}
          >
            {feedbackStatus.message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="soft-card mt-5 grid gap-4 rounded-3xl p-5 sm:grid-cols-3">
          <div>
            <label className="text-sm font-semibold">
              Type de violation
              <select
                className="input-shell mt-1"
                value={form.type}
                onChange={(e) => {
                  setForm((c) => ({ ...c, type: e.target.value }));
                  setErrors((e) => ({ ...e, type: undefined }));
                }}
              >
                {Object.entries(VIOLATION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label className="text-sm font-semibold">
              Date d'occurrence
              <input
                className={`input-shell mt-1 ${errors.occurredAt ? "border-red-500" : ""}`}
                type="date"
                value={form.occurredAt}
                onChange={(e) => {
                  setForm((c) => ({ ...c, occurredAt: e.target.value }));
                  setErrors((e) => ({ ...e, occurredAt: undefined }));
                }}
              />
              {errors.occurredAt && <p className="mt-1 text-xs text-red-500">{errors.occurredAt}</p>}
            </label>
          </div>

          <div className="flex items-end">
            <button
              className="btn-primary w-full px-4 py-2.5 text-sm disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Enregistrer violation"}
            </button>
          </div>

          <div className="sm:col-span-3">
            <label className="text-sm font-semibold">
              Description (minimum 10 caractères)
              <textarea
                className={`input-shell mt-1 min-h-24 ${errors.description ? "border-red-500" : ""}`}
                value={form.description}
                onChange={(e) => {
                  setForm((c) => ({ ...c, description: e.target.value }));
                  setErrors((e) => ({ ...e, description: undefined }));
                }}
                placeholder="Décrivez la violation rencontrée..."
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            </label>
          </div>
        </form>

        {/* Filters and Sort */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-shell text-sm"
            />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-shell text-sm">
            <option value="all">Tous les types</option>
            {Object.entries(VIOLATION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="input-shell text-sm">
            <option value="date-desc">Date récente d'abord</option>
            <option value="date-asc">Date ancienne d'abord</option>
            <option value="created-desc">Création récente d'abord</option>
            <option value="created-asc">Création ancienne d'abord</option>
          </select>
        </div>

        {/* List */}
        <section className="mt-4 space-y-2">
          {filteredAndSorted.length === 0 ? (
            <div className="soft-card rounded-2xl p-6 text-center text-sm text-[var(--ink-soft)]">
              Aucune violation enregistrée.
            </div>
          ) : (
            filteredAndSorted.map((item) => (
              <article key={item.id} className="soft-card rounded-2xl p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{VIOLATION_TYPE_LABELS[item.type] || item.type}</p>
                    <p className="mt-1 line-clamp-2 text-[var(--ink-soft)]">{item.description}</p>
                    <p className="mt-2 text-xs text-[var(--ink-soft)]">
                      Occurrence: {new Date(item.occurredAt).toLocaleDateString("fr-MA")} | Enregistrée:{" "}
                      {new Date(item.createdAt).toLocaleDateString("fr-MA")}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteViolation(item.id)}
                    disabled={deleting === item.id}
                    className="shrink-0 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                  >
                    {deleting === item.id ? "..." : "Supprimer"}
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
