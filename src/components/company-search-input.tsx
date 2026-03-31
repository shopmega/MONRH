"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CompanyOption = {
  id: string;
  name: string;
  slug?: string | null;
  city: string | null;
  overall_rating: number | null;
  category: string | null;
  is_claimed?: boolean;
};

const DEBOUNCE_MS = 150;
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
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchOptions = useCallback(async (q: string) => {
    if (q.length < MIN_QUERY_LENGTH) {
      setOptions([]);
      setLastSearchedQuery("");
      return;
    }
    
    // Prevent duplicate searches
    if (q === lastSearchedQuery) {
      return;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setLastSearchedQuery(q);
    
    try {
      const params = new URLSearchParams({ q: q.trim(), limit: "5" });
      const res = await fetch(`/api/reviewly/companies?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) {
        throw new Error("Failed to fetch");
      }
      const data = (await res.json()) as {
        results?: Array<{
          id: string;
          name: string;
          slug?: string | null;
          city?: string | null;
          overall_rating?: number | null;
          category?: string | null;
          is_claimed?: boolean;
        }>;
      };
      const list = Array.isArray(data.results) ? data.results : [];
      setOptions(
        list.map((result) => ({
          id: result.id,
          name: result.name,
          slug: result.slug ?? null,
          city: result.city ?? null,
          overall_rating: result.overall_rating ?? null,
          category: result.category ?? null,
          is_claimed: result.is_claimed ?? false,
        })),
      );
      setSelectedIndex(-1);
    } catch (error: any) {
      if (error.name === "AbortError") return;
      setOptions([]);
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [lastSearchedQuery]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setOptions([]);
      setOpen(false);
      setLoading(false);
      setLastSearchedQuery("");
      return;
    }
    
    setLoading(true);
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
    const nextValue = e.target.value;
    setQuery(nextValue);
    onChange(nextValue);
    if (onSelect && !nextValue.trim()) {
      setLastSearchedQuery("");
      onSelect({
        id: "",
        name: "",
        slug: null,
        city: null,
        overall_rating: null,
        category: null,
        is_claimed: false,
      });
    }
  }

  const handleSelect = useCallback((company: CompanyOption) => {
    // Prevent re-triggering by checking if already selected
    if (query === company.name && options.some(opt => opt.id === company.id)) {
      setOpen(false);
      return;
    }
    
    onChange(company.name);
    setQuery(company.name);
    setOptions([]);
    setOpen(false);
    setLastSearchedQuery(company.name);
    onSelect?.(company);
  }, [query, options, onChange, onSelect]);

  const showDropdown = useMemo(() => open && (options.length > 0 || loading), [open, options.length, loading]);

  return (
    <div ref={containerRef} className={`relative block space-y-3 ${className}`}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Input
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
        error={ariaInvalid ? "Ce champ est requis" : undefined}
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
              <li className="px-3 py-2 text-sm text-[var(--ink-soft)]">Aucun resultat</li>
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
                  e.stopPropagation();
                  handleSelect(company);
                }}
              >
                <span className="font-medium">{company.name}</span>
                {(company.city || company.overall_rating != null) && (
                  <span className="ml-2 text-[var(--ink-soft)]">
                    {[company.city, company.overall_rating != null ? `Note ${company.overall_rating}` : null]
                      .filter(Boolean)
                      .join(" | ")}
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
