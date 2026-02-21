import type { ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = regex.exec(text);
  let i = 0;

  while (match) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(<strong key={`${keyPrefix}-strong-${i}`}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
    i += 1;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
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

export function renderArticleContentBlocks(blocks: string[], keyPrefix: string): ReactNode[] {
  const rendered: ReactNode[] = [];

  blocks.forEach((rawBlock, blockIndex) => {
    const block = rawBlock.trim();
    if (!block) return;

    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const singleLine = lines.join(" ");
    const headingMatch = singleLine.match(/^#{1,2}\s+(.+)$/);

    if (headingMatch) {
      const headingContent = headingMatch[1].trim();
      const { lead, items } = splitBulletTrail(headingContent);
      rendered.push(
        <h2 key={`${keyPrefix}-h2-${blockIndex}`} className="text-xl font-semibold leading-tight">
          {renderInline(lead, `${keyPrefix}-h2-inline-${blockIndex}`)}
        </h2>,
      );
      if (items.length > 0) {
        rendered.push(
          <ul key={`${keyPrefix}-ul-${blockIndex}`} className="list-disc space-y-1 pl-5">
            {items.map((item, itemIndex) => (
              <li key={`${keyPrefix}-li-${blockIndex}-${itemIndex}`}>
                {renderInline(item, `${keyPrefix}-li-inline-${blockIndex}-${itemIndex}`)}
              </li>
            ))}
          </ul>,
        );
      }
      return;
    }

    const allBulletLines = lines.every((line) => /^[-*]\s+/.test(line));
    if (allBulletLines) {
      rendered.push(
        <ul key={`${keyPrefix}-ul-lines-${blockIndex}`} className="list-disc space-y-1 pl-5">
          {lines.map((line, itemIndex) => (
            <li key={`${keyPrefix}-line-li-${blockIndex}-${itemIndex}`}>
              {renderInline(line.replace(/^[-*]\s+/, ""), `${keyPrefix}-line-inline-${blockIndex}-${itemIndex}`)}
            </li>
          ))}
        </ul>,
      );
      return;
    }

    rendered.push(
      <p key={`${keyPrefix}-p-${blockIndex}`}>
        {renderInline(singleLine, `${keyPrefix}-p-inline-${blockIndex}`)}
      </p>,
    );
  });

  return rendered;
}
