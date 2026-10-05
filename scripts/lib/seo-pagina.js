// Leitura de uma página pública para medir os sinais de SEO (mesma extração usada pelo robô em buscarFontes).
// Uso: import { lerPagina, metricasHtml } from './lib/seo-pagina.js'
const limpa = (t) => t.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

// Métricas a partir do HTML (serve para página de concorrente e para o corpo dos nossos artigos)
const PARADA = new Set('para como mais pode uma uns umas com por que dos das nos nas ele ela seu sua seus suas isso essa esse este esta entre sobre quando onde muito muitos também tem ter são foi ser está estão pelo pela pelos pelas aos até mas ou ao em de da do na no os as um se não sim já só seja pessoas pessoa casos caso forma formas vez vezes ainda cada outros outras outro outra após antes depois durante ficar fica fazem faz fazer pois porque então assim lhe lhes vai vão você voce nosso nossa'.split(' '));
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
// Termos mais usados no texto (palavras e pares de palavras), para ver que vocabulário o concorrente usa
function termosFrequentes(texto) {
  const ws = texto.toLowerCase().replace(/[^a-záàâãéêíóôõúç\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !PARADA.has(w));
  const c = new Map(); const add = (k) => c.set(k, (c.get(k) || 0) + 1);
  ws.forEach((w, i) => { add(w); if (ws[i + 1]) add(`${w} ${ws[i + 1]}`); });
  return [...c].filter(([k, n]) => n >= (k.includes(' ') ? 3 : 5)).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).slice(0, 15).map(([k, n]) => `${k} (${n})`);
}
export function metricasHtml(html, { titulo = '', descricao = '', keyword = '' } = {}) {
  const t = titulo || ((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const meta = descricao || (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i) || [])[1] || '';
  const corpo = html.replace(/<(script|style|noscript|nav|header|footer|aside)[\s\S]*?<\/\1>/gi, ' ');
  const texto = limpa(corpo);
  const imgs = [...corpo.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const h2 = [...corpo.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => limpa(m[1])).filter((x) => x.length >= 5 && x.length <= 120);
  const h3 = [...corpo.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].length;
  const data = (html.match(/(?:article:modified_time|dateModified|datePublished|article:published_time)["']?\s*[:=]?\s*["']?(\d{4}-\d{2}-\d{2})/i) || [])[1] || null;
  const h1 = limpa((corpo.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
  const primeiroP = limpa((corpo.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || '');
  const kn = norm(keyword).trim();
  const tem = (x) => (kn ? norm(x).includes(kn) : null);
  const nKw = kn ? (norm(texto).split(kn).length - 1) : null;
  const alts = imgs.map((x) => (x.match(/\balt=["']([^"']*)["']/i) || [])[1] || '').filter((a) => a.trim().length >= 8);
  const externos = [...new Set([...corpo.matchAll(/<a\b[^>]*href=["'](https?:\/\/[^"']+)["']/gi)].map((m) => m[1]))].filter((u) => /(gov\.br|nih\.gov|medlineplus|who\.int|scielo|einstein\.br|hospitalsiriolibanes|cdc\.gov|nhs\.uk|\.edu|sbn\.org|cardiol\.br|endocrino\.org|diabetes\.org|pubmed|bvsms)/i.test(u)).slice(0, 8);
  return {
    h1: h1.slice(0, 140), kwNoTitulo: tem(t), kwNoH1: tem(h1), kwNaDescricao: tem(meta), kwNoPrimeiroParagrafo: tem(primeiroP), kwUsos: nKw,
    densidadeKw: nKw !== null && texto ? Number(((nKw / Math.max(1, texto.split(/\s+/).length)) * 100).toFixed(2)) : null,
    termosFrequentes: termosFrequentes(texto), altExemplos: alts.slice(0, 3), fontesOficiais: externos,
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
