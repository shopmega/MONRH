"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CompanyOption = {
  id: string;
  name: string;
  city: string | null;
  overall_rating: number | null;
  category: string | null;
};

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

type CompanySearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (company: CompanyOption) => void;
  placeholder?: string;
  id?: string;
  label?: string;
  "aria-invalid"?: boolean;
  className?: string;
};

export function CompanySearchInput({
  value,
  onChange,
  onSelect,
  placeholder = "Rechercher une entreprise...",
  id,
  label,
  "aria-invalid": ariaInvalid,
  className = "",
}: CompanySearchInputProps) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchOptions = useCallback(async (q: string) => {
    if (q.length < MIN_QUERY_LENGTH) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: q.trim(), limit: "5" });
      const res = await fetch(`/api/reviewly/companies?${params.toString()}`);
      const data = (await res.json()) as { results?: Array<{ id: string; name: string; city?: string | null; overall_rating?: number | null; category?: string | null }> };
      const list = Array.isArray(data.results) ? data.results : [];
      setOptions(
        list.map((r) => ({
          id: r.id,
          name: r.name,
          city: r.city ?? null,
          overall_rating: r.overall_rating ?? null,
          category: r.category ?? null,
        })),
      );
      setSelectedIndex(-1);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setOptions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchOptions(query);
      setOpen(true);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchOptions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    if (onSelect && !v.trim()) {
      onSelect({ id: "", name: "", city: null, overall_rating: null, category: null });
    }
  }

  function handleSelect(company: CompanyOption) {
    onChange(company.name);
    setQuery(company.name);
    setOptions([]);
    setOpen(false);
    onSelect?.(company);
  }

  const showDropdown = open && (options.length > 0 || loading);

  return (
    <div ref={containerRef} className={`relative block text-sm font-semibold ${className}`}>
      {label ? (
        <label htmlFor={id} className="block">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls={id ? `${id}-listbox` : undefined}
        aria-invalid={ariaInvalid}
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.trim().length >= MIN_QUERY_LENGTH && setOpen(true)}
        placeholder={placeholder}
        className={`input-shell mt-1 font-normal ${ariaInvalid ? "border-red-500" : ""}`}
      />
      {loading && (
        <p className="mt-1 text-xs text-[var(--ink-soft)]" aria-live="polite">
          Recherche...
        </p>
      )}
      {showDropdown && (
        <ul
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[var(--line)] bg-[var(--surface)] py-1 shadow-lg"
        >
          {options.length === 0 && !loading ? (
            <>
              <li className="px-3 py-2 text-sm text-[var(--ink-soft)]">Aucun résultat</li>
              <li className="border-t border-[var(--line)] px-3 py-2 text-xs text-[var(--ink-soft)]">
                Vous pouvez garder votre saisie pour utiliser ce nom.
              </li>
            </>
          ) : (
            options.map((company, index) => (
              <li
                key={company.id}
                role="option"
                aria-selected={selectedIndex === index}
                className={`cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-[var(--surface-muted)] ${
                  selectedIndex === index ? "bg-[var(--accent-soft)] text-[var(--foreground)]" : "text-[var(--foreground)]"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(company);
                }}
              >
                <span className="font-medium">{company.name}</span>
                {(company.city || company.overall_rating != null) && (
                  <span className="ml-2 text-[var(--ink-soft)]">
                    {[company.city, company.overall_rating != null ? `★ ${company.overall_rating}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
