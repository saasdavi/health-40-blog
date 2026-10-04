// Compara cada artigo nosso (ou meta da pauta ainda não publicada) com as páginas do topo do Google.
//   node scripts/comparar-topo.js [--so "palavra"] [--max 6] [--pendentes 8] [--mock arquivo.json]
//   --pendentes N: só pautas ainda SEM comparação (ou com mais de 30 dias), no máximo N por execução; junta ao resultado já salvo.
// Concorrentes = URLs `topoUrls` da checagem do Google (data/pesquisa/serp-resultados.json) + `fontes` da pauta.
// Mede: palavras, H2, imagens e alt, FAQ, título e descrição, links internos, data. Calcula a MEDIANA do topo, as LACUNAS
// (onde estamos abaixo do topo) e as VANTAGENS (onde estamos acima). Saída: data/pesquisa/comparacao-topo.json e .md
// Rode no GitHub Actions (workflow comparar-topo.yml): o contêiner da sessão de IA bloqueia vários sites de saúde.
import fs from 'fs';
import { lerPagina, metricasHtml } from './lib/seo-pagina.js';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const SO = opt('--so'), MAX = Number(opt('--max')) || 1, // padrão: só o concorrente principal (1º orgânico); --max 3 para ver os 3 primeiros
   MOCK = opt('--mock'), PEND = Number(opt('--pendentes')) || 0;
const lerJson = (p, fb) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fb; } };
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const mediana = (v) => { const a = v.filter((x) => typeof x === 'number').sort((x, y) => x - y); if (!a.length) return null; const m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2); };
const FRACOS = /(instagram|facebook|youtube|tiktok|pinterest|reddit|quora|wikipedia|doctoralia\.com\.br\/perguntas|ident\.com\.br\/ia)/;

const artigos = lerJson('data/articles.json', []);
const lista = Array.isArray(artigos) ? artigos : artigos.articles || [];
const fila = lerJson('data/keywords-validated.json', { keywords: [] }).keywords;
const serp = lerJson('data/pesquisa/serp-resultados.json', {});
const mock = MOCK ? lerJson(MOCK, {}) : null;

async function paginas(urls) {
  const out = [];
  for (const u of urls) {
    try { out.push(mock ? (mock[u] ? { url: u, host: new URL(u).hostname, ...mock[u] } : (() => { throw new Error('sem mock'); })()) : await lerPagina(u)); }
    catch (e) { out.push({ url: u, erro: e.message }); }
  }
  return out;
}

const SAIDA = MOCK ? '/tmp/comparacao-topo-mock' : 'data/pesquisa/comparacao-topo'; // a saída de teste (mock) nunca vai para o repositório
const anterior = lerJson(`${SAIDA}.json`, { resultado: [] }).resultado || [];
const jaFeito = new Map(anterior.map((r) => [r.keyword, r]));
const velho = (r) => !r.geradoEm || (Date.now() - Date.parse(r.geradoEm)) > 30 * 864e5;
const alvos = [];
for (const k of fila) {
  if (SO && !norm(k.keyword).includes(norm(SO))) continue;
  const antes = jaFeito.get(k.keyword);
  if (PEND && antes && !velho(antes)) continue; // já comparada há menos de 30 dias
  if (PEND && antes && !antes.concorrentesLidos && (Date.now() - Date.parse(antes.geradoEm || 0)) < 7 * 864e5) continue; // tentou há menos de 7 dias e nada abriu
  if (PEND && alvos.length >= PEND) break;
  const pub = lista.find((a) => a.status === 'published' && (a.primaryKeyword || '').toLowerCase() === k.keyword.toLowerCase());
  const urls = [...new Set([...(serp[k.keyword]?.topoUrls || []), ...(k.fontes || [])])].filter((u) => !FRACOS.test(u) && u.startsWith('http')).slice(0, MAX);
  if (!urls.length) continue;
  if (pub || serp[k.keyword]?.topoUrls?.length) alvos.push({ k, pub, urls });
}

const resultado = [];
for (const { k, pub, urls } of alvos) {
  const pg = (await paginas(urls)).filter((p) => !p.erro);
  const erros = urls.length - pg.length;
  if (!pg.length) { resultado.push({ geradoEm: new Date().toISOString(), keyword: k.keyword, publicado: !!pub, concorrentesLidos: 0, tentados: urls.length, observacao: 'nenhuma página do topo acessível (rode no Actions)' }); continue; }
  const med = { palavras: mediana(pg.map((p) => p.palavras)), h2: mediana(pg.map((p) => p.h2)), imagens: mediana(pg.map((p) => p.imagens)), imagensComAlt: mediana(pg.map((p) => p.imagensComAlt)), tituloChars: mediana(pg.map((p) => p.tituloChars)), descricaoChars: mediana(pg.map((p) => p.descricaoChars)), linksInternos: mediana(pg.map((p) => p.linksInternos)) };
  const comFaq = pg.filter((p) => p.faq || p.schemaFaq).length;
  // secoes que a maioria cobre (aparecem em >= 2 concorrentes) para guiar subtítulos
  const cont = {};
  for (const p of pg) for (const s of new Set((p.secoes || []).map(norm))) cont[s] = (cont[s] || 0) + 1;
  const secoesComuns = Object.entries(cont).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([s, n]) => `${s} (${n}/${pg.length})`);
  const item = { geradoEm: new Date().toISOString(), keyword: k.keyword, volume: k.volume, publicado: !!pub, concorrentesLidos: pg.length, tentados: urls.length, medianaTopo: med, faqNoTopo: `${comFaq}/${pg.length}`, secoesComuns, concorrentes: pg.map((p) => ({ host: p.host, palavras: p.palavras, h2: p.h2, imagens: p.imagens, data: p.data })) };
  if (pub) {
    const nosso = metricasHtml(pub.content || '', { titulo: pub.title, descricao: pub.description });
    nosso.palavras = pub.wordCount || nosso.palavras;
    nosso.imagens = (pub.content.match(/<img/gi) || []).length + (pub.featuredImage ? 1 : 0);
    item.nosso = { palavras: nosso.palavras, h2: nosso.h2, imagens: nosso.imagens, imagensComAlt: nosso.imagensComAlt, tituloChars: pub.title.length, descricaoChars: (pub.description || '').length, linksInternos: nosso.linksInternos, faq: nosso.faq };
    const lac = [], vant = [];
    const cmp = (rot, a, b, un = '', min = 0.85) => { if (b == null || a == null) return; if (a < b * min) lac.push(`${rot}: ${a}${un} vs topo ${b}${un} (faltam ~${Math.round(b - a)}${un})`); else if (a > b * 1.15) vant.push(`${rot}: ${a}${un} vs topo ${b}${un}`); };
    cmp('palavras', nosso.palavras, med.palavras); cmp('subtítulos H2', nosso.h2, med.h2); cmp('imagens', nosso.imagens, med.imagens); cmp('imagens com alt', nosso.imagensComAlt, med.imagensComAlt);
    if (comFaq >= Math.ceil(pg.length / 2) && !nosso.faq) lac.push(`sem FAQ (presente em ${comFaq}/${pg.length} do topo)`);
    if ((pub.description || '').length < 120 || (pub.description || '').length > 160) lac.push(`descrição com ${(pub.description || '').length} caracteres (ideal 120–160)`);
    if (pub.title.length > 60) lac.push(`título com ${pub.title.length} caracteres (ideal até 60)`);
    item.lacunas = lac; item.vantagens = vant;
  } else item.meta = `publicar com ≥ ${med.palavras ?? '?'} palavras, ≥ ${med.h2 ?? '?'} H2, ≥ ${med.imagens ?? '?'} imagens${comFaq >= Math.ceil(pg.length / 2) ? ' e FAQ' : ''}; cobrir: ${secoesComuns.slice(0, 5).join('; ') || '—'}`;
  if (erros) item.observacao = `${erros} página(s) do topo não acessíveis`;
  resultado.push(item);
}
const novos = new Map(resultado.map((r) => [r.keyword, r]));
const todos = [...anterior.filter((r) => !novos.has(r.keyword)), ...resultado].sort((a, b) => a.keyword.localeCompare(b.keyword));
fs.writeFileSync(`${SAIDA}.json`, JSON.stringify({ gerado: new Date().toISOString().slice(0, 10), avaliados: todos.length, resultado: todos }, null, 1));
const md = ['# Comparação com o topo do Google', '', `Gerado em ${new Date().toISOString().slice(0, 10)}. Mediana das páginas do topo (concorrentes lidos) contra o nosso artigo. Lacuna = abaixo de 85% do topo; vantagem = acima de 115%.`, ''];
for (const r of todos) {
  md.push(`## ${r.keyword}${r.publicado ? ' (publicado)' : ' (meta para publicar)'}`);
  if (!r.concorrentesLidos) { md.push(`- ${r.observacao}`, ''); continue; }
  md.push(`- Topo (mediana de ${r.concorrentesLidos}): ${r.medianaTopo.palavras ?? '?'} palavras, ${r.medianaTopo.h2 ?? '?'} H2, ${r.medianaTopo.imagens ?? '?'} imagens; FAQ em ${r.faqNoTopo}`);
  if (r.nosso) md.push(`- Nosso: ${r.nosso.palavras} palavras, ${r.nosso.h2} H2, ${r.nosso.imagens} imagens`, `- **Lacunas:** ${r.lacunas.length ? r.lacunas.join(' | ') : 'nenhuma'}`, `- Vantagens: ${r.vantagens.length ? r.vantagens.join(' | ') : '—'}`);
  else md.push(`- **Meta:** ${r.meta}`);
  if (r.secoesComuns?.length) md.push(`- Seções que o topo cobre: ${r.secoesComuns.join('; ')}`);
  md.push('');
}
fs.writeFileSync(`${SAIDA}.md`, md.join('\n'));
console.log(`${resultado.length} pautas comparadas agora (${todos.length} no arquivo); com concorrentes lidos: ${resultado.filter((r) => r.concorrentesLidos).length}`);
