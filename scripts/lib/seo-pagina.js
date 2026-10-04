// Leitura de uma página pública para medir os sinais de SEO (mesma extração usada pelo robô em buscarFontes).
// Uso: import { lerPagina, metricasHtml } from './lib/seo-pagina.js'
const limpa = (t) => t.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

// Métricas a partir do HTML (serve para página de concorrente e para o corpo dos nossos artigos)
export function metricasHtml(html, { titulo = '', descricao = '' } = {}) {
  const t = titulo || ((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const meta = descricao || (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i) || [])[1] || '';
  const corpo = html.replace(/<(script|style|noscript|nav|header|footer|aside)[\s\S]*?<\/\1>/gi, ' ');
  const texto = limpa(corpo);
  const imgs = [...corpo.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const h2 = [...corpo.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => limpa(m[1])).filter((x) => x.length >= 5 && x.length <= 120);
  const h3 = [...corpo.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].length;
  const data = (html.match(/(?:article:modified_time|dateModified|datePublished|article:published_time)["']?\s*[:=]?\s*["']?(\d{4}-\d{2}-\d{2})/i) || [])[1] || null;
  return {
    titulo: limpa(t).slice(0, 160), tituloChars: limpa(t).length, descricaoChars: meta.trim().length,
    palavras: texto ? texto.split(/\s+/).length : 0, h2: h2.length, h3, secoes: h2.slice(0, 20),
    imagens: imgs.length, imagensComAlt: imgs.filter((x) => /\balt=["'][^"']{8,}["']/i.test(x)).length,
    faq: /perguntas frequentes|\bfaq\b/i.test(html), schemaFaq: /"@type"\s*:\s*"FAQPage"/i.test(html),
    linksInternos: [...corpo.matchAll(/<a\b[^>]*href=["'](\/[^"'#?]*)["']/gi)].length, data,
  };
}

export async function lerPagina(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; Saude40Bot/1.0)', 'accept-language': 'pt-BR' }, signal: AbortSignal.timeout(25000), redirect: 'follow' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const html = await r.text();
  const host = new URL(url).hostname.replace(/^www\./, '');
  return { url, host, ...metricasHtml(html) };
}
