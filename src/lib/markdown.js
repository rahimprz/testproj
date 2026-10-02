// Small, safe Markdown subset for blog posts: ## / ### headings, paragraphs, > quotes, - lists,
// **bold**, *italic*, [links](https://...). All text is HTML-escaped first, so the output is safe to inject.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

export function renderMarkdown(src = '') {
  return String(src).replace(/\r\n/g, '\n').split(/\n{2,}/).map((block) => {
    const b = block.trim();
    if (!b) return '';
    if (b.startsWith('### ')) return `<h3>${inline(b.slice(4))}</h3>`;
    if (b.startsWith('## ')) return `<h2>${inline(b.slice(3))}</h2>`;
    const lines = b.split('\n');
    if (lines.every((l) => /^\s*[-*] /.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*] /, ''))}</li>`).join('')}</ul>`;
    if (lines.every((l) => l.startsWith('>'))) return `<blockquote><p>${inline(lines.map((l) => l.replace(/^>\s?/, '')).join(' '))}</p></blockquote>`;
    return `<p>${lines.map(inline).join('<br>')}</p>`;
  }).join('\n');
}

export function formatDate(iso, opts = { year: 'numeric', month: 'long', day: 'numeric' }) {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', opts);
}
