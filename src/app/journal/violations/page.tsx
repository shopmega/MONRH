"use client";

import { useEffect, useState } from "react";

type Violation = {
  id: string;
  type: string;
  description: string;
  occurredAt: string;
  createdAt: string;
};

export default function ViolationsPage() {
  const [items, setItems] = useState<Violation[]>([]);
  const [form, setForm] = useState({
    type: "salary_delayed",
    description: "",
    occurredAt: new Date().toISOString().slice(0, 10),
  });

  async function load() {
    const response = await fetch("/api/journal/violations");
    const data = (await response.json()) as { ok: boolean; items?: Violation[] };
    if (data.ok && data.items) setItems(data.items);
  }

  useEffect(() => {
    let active = true;
    async function initialLoad() {
      const response = await fetch("/api/journal/violations");
      const data = (await response.json()) as { ok: boolean; items?: Violation[] };
      if (active && data.ok && data.items) setItems(data.items);
    }
    initialLoad();
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetch("/api/journal/violations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm((current) => ({ ...current, description: "" }));
    load();
  }

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6">
          <h1 className="display-font text-4xl font-semibold">Violation Journal</h1>
        </section>
        <form onSubmit={onSubmit} className="soft-card mt-5 grid gap-3 rounded-3xl p-5 sm:grid-cols-3">
          <label className="text-sm font-semibold">
            Type
            <select className="input-shell mt-1" value={form.type} onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))}>
              <option value="salary_delayed">Salary delayed</option>
              <option value="unpaid_overtime">Unpaid overtime</option>
              <option value="harassment">Harassment</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Date
            <input className="input-shell mt-1" type="date" value={form.occurredAt} onChange={(e) => setForm((c) => ({ ...c, occurredAt: e.target.value }))} />
          </label>
          <label className="text-sm font-semibold sm:col-span-3">
            Description
            <textarea className="input-shell mt-1 min-h-24" value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} />
          </label>
          <button className="btn-primary sm:col-span-3 px-4 py-2.5 text-sm" type="submit">Ajouter entree</button>
        </form>

        <section className="mt-4 space-y-2">
          {items.map((item) => (
            <article key={item.id} className="soft-card rounded-2xl p-4 text-sm">
              <p className="font-semibold">{item.type}</p>
              <p className="mt-1 text-[var(--ink-soft)]">{item.description}</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">{item.occurredAt}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
