"use client";

import React, { useState, useEffect, useRef, memo } from "react";
import { 
  Calendar, 
  Coins, 
  ChevronUp, 
  ChevronDown, 
  Search, 
  X, 
  Check,
  Info,
  Plus,
  Minus
} from "lucide-react";

// --- Base Wrapper ---
interface InputWrapperProps {
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

const InputWrapper = ({ id, label, required, error, hint, children }: InputWrapperProps) => (
  <div className="sim-input-container">
    <label htmlFor={id} className={`sim-label ${required ? "sim-field-required" : ""}`}>
      {label}
    </label>
    <div className="sim-input-wrapper">
      {children}
    </div>
    {error ? (
      <div className="sim-hint sim-error-text">
        <Info size={14} />
        <span>{error}</span>
      </div>
    ) : hint ? (
      <div className="sim-hint">
        <Info size={14} />
        <span>{hint}</span>
      </div>
    ) : null}
  </div>
);

// --- 1. Date Input ---
export const SmartDate = memo(({
  value, 
  onChange, 
  ...props 
}: { 
  value: string; 
  onChange: (val: string) => void;
  label: string;
  id?: string;
  name?: string;
  required?: boolean;
  error?: string;
}) => {
  const today = new Date().toISOString().split("T")[0];
  return (
    <InputWrapper {...props}>
      <input
        id={props.id}
        name={props.name}
        type="date"
        max={today}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`sim-input ${props.error ? "sim-input-error" : ""}`}
        required={props.required}
      />
    </InputWrapper>
  );
});
SmartDate.displayName = "SmartDate";

// --- 2. Amount (DH) Input ---
export const SmartAmount = memo(({
  value, 
  onChange, 
  suffix = "DH",
  hint,
  ...props 
}: { 
  value: string | number; 
  onChange: (val: string) => void;
  label: string;
  id?: string;
  name?: string;
  suffix?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}) => {
  return (
    <InputWrapper {...props} hint={hint}>
      <Coins size={18} className="sim-icon-left" />
      <input
        id={props.id}
        name={props.name}
        type="number"
        min="0"
        step="100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`sim-input sim-input-with-icon sim-input-with-suffix ${props.error ? "sim-input-error" : ""}`}
        required={props.required}
      />
      <span className="sim-amount-suffix">{suffix}</span>
    </InputWrapper>
  );
});
SmartAmount.displayName = "SmartAmount";

// --- 3. Toggle Switch ---
export const SmartToggle = memo(({
  value, 
  onChange, 
  subtitle,
  ...props 
}: { 
  value: boolean; 
  onChange: (val: boolean) => void;
  label: string;
  id?: string;
  name?: string;
  subtitle?: string;
  error?: string;
}) => {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[var(--sim-border)] bg-[var(--sim-card)]">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-[var(--sim-text)]">{props.label}</span>
        {subtitle && <span className="text-xs text-[var(--sim-ink-soft)]">{subtitle}</span>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          id={props.id}
          name={props.name}
          type="checkbox" 
          className="sr-only" 
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="sim-toggle-track">
          <div className="sim-toggle-thumb" />
        </div>
      </label>
    </div>
  );
});
SmartToggle.displayName = "SmartToggle";

// --- 4. Radio Cards ---
export const SmartRadioCards = ({ 
  value, 
  onChange, 
  options,
  ...props 
}: { 
  value: string; 
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string; description?: string; icon?: React.ReactNode }>;
  label: string;
  id?: string;
  name?: string;
}) => {
  return (
    <div className="sim-input-container">
      <label className="sim-label">{props.label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            type="button"
            key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
              value === opt.value
                ? "border-[var(--sim-accent)] bg-[var(--sim-accent-soft)]"
                : "border-[var(--sim-border)] bg-[var(--sim-card)] hover:border-[var(--sim-ink-soft)]"
            }`}
          >
            <div className={`mt-1 ${value === opt.value ? "text-[var(--sim-accent)]" : "text-[var(--sim-ink-soft)]"}`}>
              {opt.icon || <div className="w-5 h-5 rounded-full border-2 border-current" />}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-sm font-bold ${value === opt.value ? "text-[var(--sim-text)]" : "text-[var(--sim-ink-soft)]"}`}>
                {opt.label}
              </span>
              {opt.description && <span className="text-xs text-[var(--sim-ink-soft)] leading-tight">{opt.description}</span>}
            </div>
          </button>
        ))}
      </div>
      <input type="hidden" id={props.id} name={props.name} value={value} />
    </div>
  );
};

// --- 5. Stepper ---
export const SmartStepper = memo(({
  value, 
  onChange, 
  min = 0, 
  max = 10,
  ...props 
}: { 
  value: number; 
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  label: string;
  id?: string;
  name?: string;
}) => {
  const increment = () => value < max && onChange(value + 1);
  const decrement = () => value > min && onChange(value - 1);

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--sim-border)] bg-[var(--sim-card)]">
      <label htmlFor={props.id} className="text-sm font-semibold text-[var(--sim-text)]">{props.label}</label>
      <div className="flex items-center gap-4 bg-[var(--sim-bg)] rounded-lg p-1 border border-[var(--sim-border)]">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="p-1.5 rounded-md hover:bg-[var(--sim-card)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--sim-text)]"
        >
          <Minus size={18} />
        </button>
        <input id={props.id} name={props.name} type="hidden" value={value} readOnly />
        <span className="w-8 text-center font-bold text-[var(--sim-text)] text-lg">{value}</span>
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="p-1.5 rounded-md hover:bg-[var(--sim-card)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--sim-text)]"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
});
SmartStepper.displayName = "SmartStepper";

// --- 6. Tag Input ---
export const SmartTagInput = ({ 
  value, 
  onChange, 
  suggestions = [],
  ...props 
}: { 
  value: string[]; 
  onChange: (val: string[]) => void;
  suggestions?: string[];
  label: string;
  id?: string;
  name?: string;
}) => {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const filteredSuggestions = suggestions
    .filter((s) => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s))
    .slice(0, 6);

  return (
    <div className="sim-input-container">
      <label htmlFor={props.id} className="sim-label">{props.label}</label>
      <div className="flex flex-wrap gap-2 p-2 min-h-[48px] rounded-lg border-1.5 border-[var(--sim-border)] bg-[var(--sim-card)] focus-within:border-[var(--sim-accent)]">
        {value.map((tag) => (
          <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--sim-accent)] text-white text-xs font-bold rounded-full">
            {tag}
            <X size={12} className="cursor-pointer" onClick={() => removeTag(tag)} />
          </span>
        ))}
        <input
          id={props.id}
          name={props.name}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(inputValue);
            }
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--sim-text)] min-w-[120px]"
          placeholder="Type and press Enter..."
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="mt-1 bg-[var(--sim-card)] border border-[var(--sim-border)] rounded-lg shadow-xl overflow-hidden z-20">
          {filteredSuggestions.map((s) => (
            <div
              key={s}
              onMouseDown={() => addTag(s)}
              className="px-4 py-2 text-sm text-[var(--sim-text)] hover:bg-[var(--sim-accent-soft)] hover:text-[var(--sim-accent)] cursor-pointer"
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- 7. Reference Lookup (Searchable Select) ---
export const SmartLookup = ({ 
  value, 
  onChange, 
  options,
  ...props 
}: { 
  value: string; 
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string }>;
  label: string;
  id?: string;
  name?: string;
  required?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = options
    .filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 10);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="sim-input-container" ref={containerRef}>
      <label htmlFor={props.id} className={`sim-label ${props.required ? "sim-field-required" : ""}`}>{props.label}</label>
      <div className="relative">
        <button
          id={props.id}
          name={props.name}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`sim-input flex items-center justify-between cursor-pointer ${isOpen ? "border-[var(--sim-accent)]" : ""}`}
        >
          <span className={selectedOption ? "text-[var(--sim-text)]" : "text-[var(--sim-ink-soft)]"}>
            {selectedOption ? selectedOption.label : "Select..."}
          </span>
          <Search size={16} className="text-[var(--sim-ink-soft)]" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 w-full mt-1 bg-[var(--sim-card)] border border-[var(--sim-border)] rounded-lg shadow-2xl z-30 overflow-hidden">
            <div className="p-2 border-b border-[var(--sim-border)]">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[var(--sim-bg)] border border-[var(--sim-border)] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[var(--sim-accent)]"
                placeholder="Search..."
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className="px-4 py-2.5 text-sm text-[var(--sim-text)] hover:bg-[var(--sim-accent-soft)] hover:text-[var(--sim-accent)] cursor-pointer flex items-center justify-between"
                  >
                    {opt.label}
                    {value === opt.value && <Check size={14} className="text-[var(--sim-accent)]" />}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-center text-[var(--sim-ink-soft)]">No results found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
