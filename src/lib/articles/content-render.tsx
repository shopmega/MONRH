import type { ReactNode } from "react";

const AUTO_LINK_REGEX =
  /((?:https?:\/\/[^\s]+)|(?:\/(?:simulate|simulateurs|documents|bibliotheque|articles|sujets|tools|outils|salaire|contrat-depart|conges-cnss|litiges|modeles|carriere|rh-pro)\/[a-z0-9\-_/]+))/gi;

function titleCaseWords(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function friendlyLabelForHref(href: string): string {
  if (!href.startsWith("/")) {
    return href;
  }
  const cleaned = href.replace(/\/+$/, "");
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length === 0) return href;

  const section = parts[0];
  const slug = parts.slice(1).join("/");
  const slugLabel = titleCaseWords(slug.replace(/[/-]+/g, " "));

  if (section === "simulateurs" || section === "simulate") {
    return slugLabel ? `Simulateur ${slugLabel}` : "Simulateur";
  }
  if (section === "salaire") {
    return slugLabel ? `Salaire ${slugLabel}` : "Salaire";
  }
  if (section === "contrat-depart") {
    return slugLabel ? `Contrat et depart ${slugLabel}` : "Contrat et depart";
  }
  if (section === "conges-cnss") {
    return slugLabel ? `Conges et CNSS ${slugLabel}` : "Conges et CNSS";
  }
  if (section === "litiges") {
    return slugLabel ? `Litige ${slugLabel}` : "Litiges";
  }
  if (section === "modeles") {
    return slugLabel ? `Modele ${slugLabel}` : "Modeles";
  }
  if (section === "carriere") {
    return slugLabel ? `Carriere ${slugLabel}` : "Carriere";
  }
  if (section === "rh-pro") {
    return slugLabel ? `RH Pro ${slugLabel}` : "RH Pro";
  }
  if (section === "documents") {
    return slugLabel ? `Document ${slugLabel}` : "Document";
  }
  if (section === "bibliotheque") {
    return slugLabel ? `Bibliotheque ${slugLabel}` : "Bibliotheque";
  }
  if (section === "articles") {
    return slugLabel ? `Article ${slugLabel}` : "Article";
  }
  if (section === "sujets") {
    return slugLabel ? `Guide ${slugLabel}` : "Guide";
  }
  if (section === "outils" || section === "tools") {
    return slugLabel ? `Outil ${slugLabel}` : "Outil";
  }

  return href;
}

function isSafeHref(href: string): boolean {
  return href.startsWith("/") || href.startsWith("https://") || href.startsWith("http://");
}

function renderTextWithLinks(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  AUTO_LINK_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null = AUTO_LINK_REGEX.exec(text);
  let i = 0;

  while (match) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const trailingPunctuation = match[0].match(/[.,;:!?)]+$/)?.[0] ?? "";
    const href = trailingPunctuation ? match[0].slice(0, -trailingPunctuation.length) : match[0];
    const isExternal = href.startsWith("http://") || href.startsWith("https://");
    const label = friendlyLabelForHref(href);
    nodes.push(
      <a
        key={`${keyPrefix}-link-${i}`}
        href={href}
        className="font-semibold text-[var(--accent)] underline underline-offset-2"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {label}
      </a>,
    );
    if (trailingPunctuation) {
      nodes.push(trailingPunctuation);
    }
    lastIndex = match.index + match[0].length;
    i += 1;
    match = AUTO_LINK_REGEX.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /(`([^`]+)`)|\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = regex.exec(text);
  let i = 0;

  while (match) {
    if (match.index > lastIndex) {
      nodes.push(...renderTextWithLinks(text.slice(lastIndex, match.index), `${keyPrefix}-text-${i}`));
    }

    if (match[2]) {
      nodes.push(
        <code key={`${keyPrefix}-code-${i}`} className="rounded bg-[var(--surface-muted)] px-1 py-0.5 text-[0.92em]">
          {match[2]}
        </code>,
      );
    } else if (match[3]) {
      nodes.push(<strong key={`${keyPrefix}-strong-${i}`}>{renderInline(match[3], `${keyPrefix}-strong-inline-${i}`)}</strong>);
    } else if (match[4] && match[5] && isSafeHref(match[5])) {
      const href = match[5];
      const isExternal = href.startsWith("http://") || href.startsWith("https://");
      nodes.push(
        <a
          key={`${keyPrefix}-markdown-link-${i}`}
          href={href}
          className="font-semibold text-[var(--accent)] underline underline-offset-2"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
        >
          {renderInline(match[4], `${keyPrefix}-markdown-link-inline-${i}`)}
        </a>,
      );
    } else if (match[6]) {
      nodes.push(<em key={`${keyPrefix}-em-${i}`}>{renderInline(match[6], `${keyPrefix}-em-inline-${i}`)}</em>);
    } else {
      nodes.push(match[0]);
    }

    lastIndex = match.index + match[0].length;
    i += 1;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(...renderTextWithLinks(text.slice(lastIndex), `${keyPrefix}-tail`));
  }

  return nodes;
}

function splitBulletTrail(text: string): { lead: string; items: string[] } {
  const parts = text
    .split(/\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 1) {
    return { lead: text.trim(), items: [] };
  }
  return {
    lead: parts[0],
    items: parts.slice(1),
  };
}

function isTableLine(line: string): boolean {
  return /^\|.+\|$/.test(line);
}

function isTableSeparator(line: string): boolean {
  return /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|$/.test(line);
}

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

type RenderArticleContentOptions = {
  headingId?: (heading: string, blockIndex: number) => string;
};

export function renderArticleContentBlocks(
  blocks: string[],
  keyPrefix: string,
  options: RenderArticleContentOptions = {},
): ReactNode[] {
  const rendered: ReactNode[] = [];

  function renderHeading(line: string, key: string, blockIndex: number) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (!headingMatch) return false;

    const headingLevel = headingMatch[1].length;
    const headingContent = headingMatch[2].trim();
    const { lead, items } = splitBulletTrail(headingContent);
    const id = options.headingId?.(lead, blockIndex);

    if (headingLevel >= 3) {
      rendered.push(
        <h3 key={`${key}-h3`} id={id} className="scroll-mt-28 text-lg font-semibold leading-tight">
          {renderInline(lead, `${key}-h3-inline`)}
        </h3>,
      );
    } else {
      rendered.push(
        <h2 key={`${key}-h2`} id={id} className="scroll-mt-28 text-xl font-semibold leading-tight">
          {renderInline(lead, `${key}-h2-inline`)}
        </h2>,
      );
    }

    if (items.length > 0) {
      rendered.push(
        <ul key={`${key}-ul`} className="list-disc space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={`${key}-li-${itemIndex}`}>
              {renderInline(item, `${key}-li-inline-${itemIndex}`)}
            </li>
          ))}
        </ul>,
      );
    }

    return true;
  }

  blocks.forEach((rawBlock, blockIndex) => {
    const block = rawBlock.trim();
    if (!block) return;

    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    let lineIndex = 0;
    while (lineIndex < lines.length) {
      const line = lines[lineIndex];
      const key = `${keyPrefix}-block-${blockIndex}-line-${lineIndex}`;

      if (isTableLine(line) && lineIndex + 1 < lines.length && isTableSeparator(lines[lineIndex + 1])) {
        const headers = splitTableRow(line);
        const rows: string[][] = [];
        lineIndex += 2;
        while (lineIndex < lines.length && isTableLine(lines[lineIndex]) && !isTableSeparator(lines[lineIndex])) {
          rows.push(splitTableRow(lines[lineIndex]));
          lineIndex += 1;
        }
        rendered.push(
          <div key={`${key}-table-wrap`} className="overflow-x-auto rounded-2xl border border-[var(--line)]">
            <table className="min-w-full divide-y divide-[var(--line)] text-sm">
              <thead className="bg-[var(--surface-muted)]">
                <tr>
                  {headers.map((header, headerIndex) => (
                    <th key={`${key}-th-${headerIndex}`} scope="col" className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">
                      {renderInline(header, `${key}-th-inline-${headerIndex}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {rows.map((row, rowIndex) => (
                  <tr key={`${key}-tr-${rowIndex}`}>
                    {headers.map((_, cellIndex) => (
                      <td key={`${key}-td-${rowIndex}-${cellIndex}`} className="px-4 py-3 align-top text-[var(--foreground)]">
                        {renderInline(row[cellIndex] ?? "", `${key}-td-inline-${rowIndex}-${cellIndex}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        continue;
      }

      if (/^>\s?/.test(line)) {
        const quoteLines: string[] = [];
        while (lineIndex < lines.length && /^>\s?/.test(lines[lineIndex])) {
          quoteLines.push(lines[lineIndex].replace(/^>\s?/, ""));
          lineIndex += 1;
        }
        rendered.push(
          <blockquote key={`${key}-blockquote`} className="border-l-4 border-[var(--accent)] bg-[var(--surface-muted)] px-4 py-3 italic text-[var(--ink-soft)]">
            <p>{renderInline(quoteLines.join(" "), `${key}-blockquote-inline`)}</p>
          </blockquote>,
        );
        continue;
      }

      if (renderHeading(line, key, blockIndex)) {
        lineIndex += 1;
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        const items: string[] = [];
        while (lineIndex < lines.length && /^[-*]\s+/.test(lines[lineIndex])) {
          items.push(lines[lineIndex].replace(/^[-*]\s+/, ""));
          lineIndex += 1;
        }
        rendered.push(
          <ul key={`${key}-ul-lines`} className="list-disc space-y-1 pl-5">
            {items.map((item, itemIndex) => (
              <li key={`${key}-line-li-${itemIndex}`}>
                {renderInline(item, `${key}-line-inline-${itemIndex}`)}
              </li>
            ))}
          </ul>,
        );
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        const items: string[] = [];
        while (lineIndex < lines.length && /^\d+\.\s+/.test(lines[lineIndex])) {
          items.push(lines[lineIndex].replace(/^\d+\.\s+/, ""));
          lineIndex += 1;
        }
        rendered.push(
          <ol key={`${key}-ol-lines`} className="list-decimal space-y-1 pl-5">
            {items.map((item, itemIndex) => (
              <li key={`${key}-line-oli-${itemIndex}`}>
                {renderInline(item, `${key}-line-ol-inline-${itemIndex}`)}
              </li>
            ))}
          </ol>,
        );
        continue;
      }

      const paragraphLines: string[] = [];
      while (
        lineIndex < lines.length &&
        !(isTableLine(lines[lineIndex]) && lineIndex + 1 < lines.length && isTableSeparator(lines[lineIndex + 1])) &&
        !/^>\s?/.test(lines[lineIndex]) &&
        !/^(#{1,3})\s+/.test(lines[lineIndex]) &&
        !/^[-*]\s+/.test(lines[lineIndex]) &&
        !/^\d+\.\s+/.test(lines[lineIndex])
      ) {
        paragraphLines.push(lines[lineIndex]);
        lineIndex += 1;
      }

      rendered.push(
        <p key={`${key}-p`}>
          {renderInline(paragraphLines.join(" "), `${key}-p-inline`)}
        </p>,
      );
    }
  });

  return rendered;
}
