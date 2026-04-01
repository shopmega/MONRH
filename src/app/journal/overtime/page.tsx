"use client";

import { useEffect, useMemo, useState } from "react";

type Overtime = {
  id: string;
  workDate: string;
  hoursDay: number;
  hoursNight: number;
  hoursWeekend: number;
  hoursHoliday: number;
  proofUrl?: string;
  note?: string;
};

type FormErrors = {
  workDate?: string;
  hoursDay?: string;
  hoursNight?: string;
  hoursWeekend?: string;
  hoursHoliday?: string;
};

type SortBy = "date-asc" | "date-desc" | "hours-asc" | "hours-desc";

export default function OvertimeJournalPage() {
  const [items, setItems] = useState<Overtime[]>([]);
  const [form, setForm] = useState({
    workDate: new Date().toISOString().slice(0, 10),
    hoursDay: "0",
    hoursNight: "0",
    hoursWeekend: "0",
    hoursHoliday: "0",
    proofUrl: "",
    note: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  const [filterMonth, setFilterMonth] = useState<string>("");

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.hoursDay += item.hoursDay;
        acc.hoursNight += item.hoursNight;
        acc.hoursWeekend += item.hoursWeekend;
        acc.hoursHoliday += item.hoursHoliday;
        acc.totalHours += item.hoursDay + item.hoursNight + item.hoursWeekend + item.hoursHoliday;
        return acc;
      },
      { hoursDay: 0, hoursNight: 0, hoursWeekend: 0, hoursHoliday: 0, totalHours: 0 },
    );
  }, [items]);

  const filteredAndSorted = useMemo(() => {
    let filtered = items;

    // Filter by month
    if (filterMonth) {
      filtered = filtered.filter((item) => item.workDate.startsWith(filterMonth));
    }

    // Sort
    const sorted = [...filtered];
    if (sortBy === "date-desc") {
      sorted.sort((a, b) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime());
    } else if (sortBy === "date-asc") {
      sorted.sort((a, b) => new Date(a.workDate).getTime() - new Date(b.workDate).getTime());
    } else if (sortBy === "hours-desc") {
      sorted.sort(
        (a, b) =>
          (b.hoursDay + b.hoursNight + b.hoursWeekend + b.hoursHoliday) -
          (a.hoursDay + a.hoursNight + a.hoursWeekend + a.hoursHoliday),
      );
    } else if (sortBy === "hours-asc") {
      sorted.sort(
        (a, b) =>
          (a.hoursDay + a.hoursNight + a.hoursWeekend + a.hoursHoliday) -
          (b.hoursDay + b.hoursNight + b.hoursWeekend + b.hoursHoliday),
      );
    }

    return sorted;
  }, [items, sortBy, filterMonth]);

  async function load() {
    try {
      const response = await fetch("/api/journal/overtime");
      const data = (await response.json()) as { ok: boolean; items?: Overtime[] };
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

    if (!form.workDate) {
      newErrors.workDate = "Date requise";
    } else if (new Date(form.workDate) > new Date()) {
      newErrors.workDate = "La date ne peut pas être dans le futur";
    }

    const day = parseFloat(form.hoursDay);
    const night = parseFloat(form.hoursNight);
    const weekend = parseFloat(form.hoursWeekend);
    const holiday = parseFloat(form.hoursHoliday);
    const total = day + night + weekend + holiday;

    if (total === 0) {
      newErrors.hoursDay = "Au moins une heure doit être enregistrée";
    }

    if (total > 24) {
      newErrors.hoursDay = "Total ne peut pas dépasser 24 heures par jour";
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
      const response = await fetch("/api/journal/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workDate: form.workDate,
          hoursDay: parseFloat(form.hoursDay),
          hoursNight: parseFloat(form.hoursNight),
          hoursWeekend: parseFloat(form.hoursWeekend),
          hoursHoliday: parseFloat(form.hoursHoliday),
          proofUrl: form.proofUrl || undefined,
          note: form.note || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout");
      }

      setForm((current) => ({
        ...current,
        hoursDay: "0",
        hoursNight: "0",
        hoursWeekend: "0",
        hoursHoliday: "0",
        note: "",
        proofUrl: "",
        workDate: new Date().toISOString().slice(0, 10),
      }));
      setErrors({});
      setFeedbackStatus({ type: "success", message: "Heures enregistrées avec succès" });
      await load();
    } catch (err) {
      setFeedbackStatus({ type: "error", message: err instanceof Error ? err.message : "Erreur inconnue" });
    } finally {
      setLoading(false);
    }
  }

  async function deleteOvertime(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet enregistrement ?")) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/journal/overtime/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      setFeedbackStatus({ type: "success", message: "Enregistrement supprimé" });
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
          <h1 className="display-font text-4xl font-semibold">Journal des Heures Supplémentaires</h1>
          <p className="mt-3 text-sm text-[var(--ink-soft)]">
            Enregistrez et suivez vos heures supplémentaires avec les justificatifs.
          </p>
        </section>

        {/* Stats */}
        <section className="mt-5 grid gap-3 sm:grid-cols-5">
          <article className="soft-card rounded-2xl border border-[var(--line)]/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">Total</p>
            <p className="display-font mt-2 text-3xl font-semibold">{totals.totalHours.toFixed(1)}h</p>
          </article>
          <article className="soft-card rounded-2xl border border-[var(--line)]/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">Jour</p>
            <p className="display-font mt-2 text-3xl font-semibold">{totals.hoursDay.toFixed(1)}h</p>
          </article>
          <article className="soft-card rounded-2xl border border-[var(--line)]/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">Nuit</p>
            <p className="display-font mt-2 text-3xl font-semibold">{totals.hoursNight.toFixed(1)}h</p>
          </article>
          <article className="soft-card rounded-2xl border border-[var(--line)]/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">Weekend</p>
            <p className="display-font mt-2 text-3xl font-semibold">{totals.hoursWeekend.toFixed(1)}h</p>
          </article>
          <article className="soft-card rounded-2xl border border-[var(--line)]/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">Fériés</p>
            <p className="display-font mt-2 text-3xl font-semibold">{totals.hoursHoliday.toFixed(1)}h</p>
          </article>
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
              Date du travail
              <input
                className={`input-shell mt-1 ${errors.workDate ? "border-red-500" : ""}`}
                type="date"
                value={form.workDate}
                onChange={(e) => {
                  setForm((c) => ({ ...c, workDate: e.target.value }));
                  setErrors((e) => ({ ...e, workDate: undefined }));
                }}
              />
              {errors.workDate && <p className="mt-1 text-xs text-red-500">{errors.workDate}</p>}
            </label>
          </div>

          <div>
            <label className="text-sm font-semibold">
              Heures jour (6h-22h)
              <input
                className={`input-shell mt-1 ${errors.hoursDay ? "border-red-500" : ""}`}
                type="number"
                step="0.5"
                min="0"
                max="16"
                value={form.hoursDay}
                onChange={(e) => {
                  setForm((c) => ({ ...c, hoursDay: e.target.value }));
                  setErrors((e) => ({ ...e, hoursDay: undefined }));
                }}
              />
            </label>
          </div>

          <div>
            <label className="text-sm font-semibold">
              Heures nuit (22h-6h)
              <input
                className="input-shell mt-1"
                type="number"
                step="0.5"
                min="0"
                max="8"
                value={form.hoursNight}
                onChange={(e) => setForm((c) => ({ ...c, hoursNight: e.target.value }))}
              />
            </label>
          </div>

          <div>
            <label className="text-sm font-semibold">
              Heures weekend
              <input
                className="input-shell mt-1"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={form.hoursWeekend}
                onChange={(e) => setForm((c) => ({ ...c, hoursWeekend: e.target.value }))}
              />
            </label>
          </div>

          <div>
            <label className="text-sm font-semibold">
              Heures fériés
              <input
                className="input-shell mt-1"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={form.hoursHoliday}
                onChange={(e) => setForm((c) => ({ ...c, hoursHoliday: e.target.value }))}
              />
            </label>
          </div>

          <div>
            <label className="text-sm font-semibold">
              Lien justificatif (optionnel)
              <input
                className="input-shell mt-1"
                type="url"
                placeholder="https://..."
                value={form.proofUrl}
                onChange={(e) => setForm((c) => ({ ...c, proofUrl: e.target.value }))}
              />
            </label>
          </div>

          <div className="sm:col-span-3">
            <label className="text-sm font-semibold">
              Notes (optionnel)
              <textarea
                className="input-shell mt-1 min-h-20"
                placeholder="Contexte, détails supplémentaires..."
                value={form.note}
                onChange={(e) => setForm((c) => ({ ...c, note: e.target.value }))}
              />
            </label>
          </div>

          <div className="sm:col-span-3 flex gap-2">
            <button
              className="btn-primary flex-1 px-4 py-2.5 text-sm disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Enregistrer heures"}
            </button>
            <button
              className="btn-muted px-4 py-2.5 text-sm"
              type="reset"
              onClick={() => {
                setForm((c) => ({
                  ...c,
                  hoursDay: "0",
                  hoursNight: "0",
                  hoursWeekend: "0",
                  hoursHoliday: "0",
                  note: "",
                  proofUrl: "",
                }));
                setErrors({});
              }}
            >
              Réinitialiser
            </button>
          </div>

          {errors.hoursDay && <p className="sm:col-span-3 text-xs text-red-500">{errors.hoursDay}</p>}
        </form>

        {/* Filters and Sort */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="input-shell text-sm"
          >
            <option value="">Tous les mois</option>
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const month = date.toISOString().slice(0, 7);
              return (
                <option key={month} value={month}>
                  {new Date(month).toLocaleDateString("fr-MA", { month: "long", year: "numeric" })}
                </option>
              );
            })}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="input-shell text-sm">
            <option value="date-desc">Date récente d'abord</option>
            <option value="date-asc">Date ancienne d'abord</option>
            <option value="hours-desc">Plus d'heures d'abord</option>
            <option value="hours-asc">Moins d'heures d'abord</option>
          </select>
        </div>

        {/* List */}
        <section className="mt-4 space-y-2">
          {filteredAndSorted.length === 0 ? (
            <div className="soft-card rounded-2xl p-6 text-center text-sm text-[var(--ink-soft)]">
              Aucune heure supplémentaire enregistrée.
            </div>
          ) : (
            filteredAndSorted.map((item) => {
              const itemTotal = item.hoursDay + item.hoursNight + item.hoursWeekend + item.hoursHoliday;
              return (
                <article key={item.id} className="soft-card rounded-2xl p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{new Date(item.workDate).toLocaleDateString("fr-MA")}</p>
                        <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
                          {itemTotal.toFixed(1)}h
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">
                        Jour: {item.hoursDay}h | Nuit: {item.hoursNight}h | Weekend: {item.hoursWeekend}h | Fériés:{" "}
                        {item.hoursHoliday}h
                      </p>
                      {item.note && <p className="mt-1 line-clamp-1 text-xs text-[var(--ink-soft)]">{item.note}</p>}
                      {item.proofUrl && (
                        <a href={item.proofUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[var(--accent)]">
                          📎 Justificatif
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => deleteOvertime(item.id)}
                      disabled={deleting === item.id}
                      className="shrink-0 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                    >
                      {deleting === item.id ? "..." : "Supprimer"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
