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

  async function load() {
    const response = await fetch("/api/journal/overtime");
    const data = (await response.json()) as { ok: boolean; items?: Overtime[] };
    if (data.ok && data.items) setItems(data.items);
  }

  useEffect(() => {
    let active = true;
    async function initialLoad() {
      const response = await fetch("/api/journal/overtime");
      const data = (await response.json()) as { ok: boolean; items?: Overtime[] };
      if (active && data.ok && data.items) setItems(data.items);
    }
    initialLoad();
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetch("/api/journal/overtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workDate: form.workDate,
        hoursDay: Number(form.hoursDay),
        hoursNight: Number(form.hoursNight),
        hoursWeekend: Number(form.hoursWeekend),
        hoursHoliday: Number(form.hoursHoliday),
        proofUrl: form.proofUrl || undefined,
        note: form.note || undefined,
      }),
    });
    setForm((current) => ({ ...current, note: "", proofUrl: "" }));
    load();
  }

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.hoursDay += item.hoursDay;
        acc.hoursNight += item.hoursNight;
        acc.hoursWeekend += item.hoursWeekend;
        acc.hoursHoliday += item.hoursHoliday;
        return acc;
      },
      { hoursDay: 0, hoursNight: 0, hoursWeekend: 0, hoursHoliday: 0 },
    );
  }, [items]);

  return (
    <main className="paper-bg min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6">
        <section className="soft-card rounded-[2rem] p-6">
          <h1 className="display-font text-4xl font-semibold">Overtime Logging Tool</h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Totaux cumules: jour {totals.hoursDay}h, nuit {totals.hoursNight}h, weekend {totals.hoursWeekend}h, ferie {totals.hoursHoliday}h.
          </p>
        </section>

        <form onSubmit={onSubmit} className="soft-card mt-5 grid gap-3 rounded-3xl p-5 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Date
            <input className="input-shell mt-1" type="date" value={form.workDate} onChange={(e) => setForm((c) => ({ ...c, workDate: e.target.value }))} />
          </label>
          <label className="text-sm font-semibold">
            Day hours
            <input className="input-shell mt-1" type="number" step="0.5" value={form.hoursDay} onChange={(e) => setForm((c) => ({ ...c, hoursDay: e.target.value }))} />
          </label>
          <label className="text-sm font-semibold">
            Night hours
            <input className="input-shell mt-1" type="number" step="0.5" value={form.hoursNight} onChange={(e) => setForm((c) => ({ ...c, hoursNight: e.target.value }))} />
          </label>
          <label className="text-sm font-semibold">
            Weekend hours
            <input className="input-shell mt-1" type="number" step="0.5" value={form.hoursWeekend} onChange={(e) => setForm((c) => ({ ...c, hoursWeekend: e.target.value }))} />
          </label>
          <label className="text-sm font-semibold">
            Holiday hours
            <input className="input-shell mt-1" type="number" step="0.5" value={form.hoursHoliday} onChange={(e) => setForm((c) => ({ ...c, hoursHoliday: e.target.value }))} />
          </label>
          <label className="text-sm font-semibold">
            Proof URL
            <input className="input-shell mt-1" type="url" value={form.proofUrl} onChange={(e) => setForm((c) => ({ ...c, proofUrl: e.target.value }))} />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Note
            <textarea className="input-shell mt-1 min-h-20" value={form.note} onChange={(e) => setForm((c) => ({ ...c, note: e.target.value }))} />
          </label>
          <button className="btn-primary sm:col-span-2 px-4 py-2.5 text-sm" type="submit">Ajouter log</button>
        </form>

        <section className="mt-4 space-y-2">
          {items.map((item) => (
            <article key={item.id} className="soft-card rounded-2xl p-4 text-sm">
              <p className="font-semibold">{item.workDate}</p>
              <p className="mt-1 text-[var(--ink-soft)]">
                day: {item.hoursDay}h | night: {item.hoursNight}h | weekend: {item.hoursWeekend}h | holiday: {item.hoursHoliday}h
              </p>
              {item.proofUrl ? <a href={item.proofUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-[var(--accent)]">proof</a> : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
