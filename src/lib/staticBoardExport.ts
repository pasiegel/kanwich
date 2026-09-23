import type { BoardT, CardT } from '../types'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderLabels(card: CardT, board: BoardT): string {
  const labels = card.labelIds
    .map((id) => board.labels.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l))
  if (labels.length === 0) return ''
  return `<div class="labels">${labels
    .map((l) => `<span class="label" style="background:${escapeHtml(l.color)}">${escapeHtml(l.name)}</span>`)
    .join('')}</div>`
}

function renderCard(card: CardT, board: BoardT): string {
  const total = card.subtasks.length
  const done = card.subtasks.filter((s) => s.completed).length
  const hasExtra = Boolean(card.description?.trim()) || total > 0

  const cover = card.coverImage ? `<img class="cover" src="${card.coverImage}" alt="" />` : ''

  const meta =
    total > 0 || card.dueDate
      ? `<div class="meta">
          ${total > 0 ? `<span class="chip">☑ ${done}/${total}</span>` : ''}
          ${
            card.dueDate
              ? `<span class="chip">📅 ${escapeHtml(new Date(card.dueDate).toLocaleDateString())}</span>`
              : ''
          }
        </div>`
      : ''

  const details = hasExtra
    ? `<details class="card-details">
        <summary>Details</summary>
        ${
          card.description?.trim()
            ? `<p class="description">${escapeHtml(card.description).replace(/\n/g, '<br>')}</p>`
            : ''
        }
        ${
          total > 0
            ? `<ul class="subtasks">${card.subtasks
                .map(
                  (s) =>
                    `<li class="${s.completed ? 'done' : ''}"><input type="checkbox" disabled${
                      s.completed ? ' checked' : ''
                    } /> ${escapeHtml(s.title)}</li>`,
                )
                .join('')}</ul>`
            : ''
        }
      </details>`
    : ''

  return `<div class="card">
    ${cover}
    ${renderLabels(card, board)}
    <p class="title">${escapeHtml(card.title)}</p>
    ${meta}
    ${details}
  </div>`
}

/**
 * Renders one board as a fully self-contained, read-only HTML page —
 * inline CSS, no external requests, cover images inlined as the same
 * base64 data URLs already stored on the card. Safe to email or host
 * anywhere; all user text is escaped since it may be shared publicly.
 */
export function generateBoardHtml(board: BoardT): string {
  const exportedAt = new Date().toLocaleString()
  const columns = board.columns
    .map((column) => {
      const cards = column.cardIds.map((id) => board.cards[id]).filter(Boolean)
      return `<section class="column">
        <header><h2>${escapeHtml(column.title)}</h2><span class="count">${cards.length}</span></header>
        <div class="cards">${
          cards.map((c) => renderCard(c, board)).join('') || '<p class="empty">No cards</p>'
        }</div>
      </section>`
    })
    .join('')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(board.title)} — Kanwich</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #f1f5f9;
    color: #0f172a;
  }
  header.top {
    padding: 16px 20px;
    border-bottom: 4px solid ${board.color};
    background: #fff;
  }
  header.top h1 { margin: 0 0 4px; font-size: 20px; }
  header.top p { margin: 0; font-size: 13px; opacity: .65; }
  main {
    display: flex;
    gap: 16px;
    padding: 20px;
    overflow-x: auto;
    align-items: flex-start;
  }
  .column {
    background: rgba(226,232,240,0.6);
    border-radius: 12px;
    padding: 10px;
    width: 280px;
    flex: 0 0 auto;
  }
  .column header { display: flex; align-items: center; justify-content: space-between; padding: 4px 6px 10px; }
  .column h2 { font-size: 14px; margin: 0; }
  .column .count { font-size: 12px; opacity: .6; }
  .cards { display: flex; flex-direction: column; gap: 8px; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
  .card .cover { width: 100%; border-radius: 6px; margin-bottom: 8px; display: block; max-height: 140px; object-fit: cover; }
  .card .title { margin: 0 0 6px; font-size: 14px; font-weight: 600; }
  .labels { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
  .label { color: #fff; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
  .meta { display: flex; gap: 10px; font-size: 12px; opacity: .75; }
  .chip { background: #f1f5f9; padding: 1px 6px; border-radius: 6px; }
  .card-details { margin-top: 8px; font-size: 13px; }
  .card-details summary { cursor: pointer; color: #d97706; font-weight: 600; font-size: 12px; }
  .description { white-space: pre-wrap; opacity: .85; }
  .subtasks { list-style: none; padding: 0; margin: 6px 0 0; display: flex; flex-direction: column; gap: 4px; }
  .subtasks li.done { opacity: .5; text-decoration: line-through; }
  .empty { font-size: 12px; opacity: .5; padding: 8px; }
  @media (prefers-color-scheme: dark) {
    body { background: #0f172a; color: #f1f5f9; }
    header.top, .card { background: #1e293b; border-color: #334155; }
    .column { background: rgba(30,41,59,0.6); }
    .chip { background: #334155; color: #cbd5e1; }
  }
</style>
</head>
<body>
  <header class="top">
    <h1>🥪 ${escapeHtml(board.title)}</h1>
    <p>Exported from Kanwich on ${escapeHtml(exportedAt)} — read-only snapshot.</p>
  </header>
  <main>${columns}</main>
</body>
</html>
`
}
