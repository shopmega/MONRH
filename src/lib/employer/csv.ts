export type CsvRecord = Record<string, string>;

function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

export function parseCsvRows(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && char === delimiter) {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }

  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

export function normalizeCsvHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function parseCsvRecords(text: string): CsvRecord[] {
  const [headerRow, ...rows] = parseCsvRows(text);
  if (!headerRow || rows.length === 0) return [];
  const headers = headerRow.map(normalizeCsvHeader);
  return rows.map((row) =>
    headers.reduce<CsvRecord>((record, header, index) => {
      if (header) record[header] = row[index] ?? "";
      return record;
    }, {}),
  );
}

export function readCsvField(record: CsvRecord, aliases: string[]) {
  for (const alias of aliases) {
    const value = record[normalizeCsvHeader(alias)];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function parseCsvNumber(value: string) {
  const normalized = value
    .replace(/\s/g, "")
    .replace(/MAD/gi, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
