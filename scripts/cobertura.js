// Mapa de cobertura: categoria (meta 60 artigos) -> subcategoria (tema) -> artigos publicados, na fila e candidatos.
//   node scripts/cobertura.js            relatório no terminal + data/pesquisa/cobertura.md
import fs from 'fs';

const META_CATEGORIA = 60;
const lerJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

const ing = lerJson('data/pesquisa/ingredientes.json').categorias;
const CLUSTER_PARA_CATEGORIA = {
  colesterol: 'coracao-pressao', circulacao: 'coracao-pressao', pressao: 'coracao-pressao', coracao: 'coracao-pressao',
  menopausa: 'mulher-menopausa', hormonios: 'mulher-menopausa',
  'musculo-e-forca': 'exercicio', exercicio: 'exercicio', emagrecimento: 'emagrecimento', nutricao: 'alimentacao',
  exames: 'diabetes-exames', diabetes: 'diabetes-exames', tireoide: 'diabetes-exames', 'figado-metabolismo': 'diabetes-exames',
  'pele-cabelo': 'pele-cabelo', sono: 'sono-mente', 'saude-mental': 'sono-mente', digestao: 'digestao', digestivo: 'digestao',
  visao: 'visao-audicao-boca', olhos: 'visao-audicao-boca', 'ouvido-equilibrio': 'visao-audicao-boca', memoria: 'cerebro-memoria',
  coluna: 'ossos-articulacoes', prostata: 'homem-prostata', urinario: 'homem-prostata', longevidade: 'longevidade', sintomas: 'cerebro-memoria',
};
const categoria = (cluster) => CLUSTER_PARA_CATEGORIA[cluster] || (ing[cluster] ? cluster : 'outros');

const temas = [];
for (const [cat, ts] of Object.entries(ing)) for (const t of ts) temas.push({ cat, t, n: norm(t) });
temas.sort((a, b) => b.n.length - a.n.length);
const subDe = (kw, cat) => temas.find((x) => x.cat === cat && norm(kw).includes(x.n))?.t || '(sem subcategoria)';

const artigosRaw = lerJson('data/articles.json');
const artigos = (Array.isArray(artigosRaw) ? artigosRaw : artigosRaw.articles || []).filter((a) => a.status === 'published');
const usados = new Set(artigos.map((a) => (a.primaryKeyword || '').toLowerCase()));
const fila = lerJson('data/keywords-validated.json').keywords;
const candidatas = lerJson('data/prateleira-candidatas.json').candidatas.filter((c) => typeof c.volume === 'number' && c.volume >= 1000);

const linhas = {};
const add = (cat, sub, tipo) => { ((linhas[cat] ||= {})[sub] ||= { pub: 0, fila: 0, cand: 0 })[tipo]++; };
for (const a of artigos) { const c = categoria(a.cluster || a.category || ''); add(c, subDe(a.primaryKeyword || a.title || '', c), 'pub'); }
for (const k of fila) { if (usados.has(k.keyword.toLowerCase())) continue; const c = categoria(k.cluster); add(c, subDe(k.keyword, c), 'fila'); }
for (const k of candidatas) { const c = categoria(k.cluster); add(c, subDe(k.keyword, c), 'cand'); }

const out = ['# Cobertura por categoria', '', `Meta: ${META_CATEGORIA} artigos por categoria. "Garantidos" = publicados + fila validada. "Em potencial" soma as candidatas com volume.`, ''];
let totG = 0, totP = 0;
const cats = Object.keys({ ...ing, ...linhas }).sort();
for (const cat of cats) {
  const subs = linhas[cat] || {};
  const soma = (k) => Object.values(subs).reduce((s, x) => s + x[k], 0);
  const g = soma('pub') + soma('fila'), pot = g + soma('cand');
  totG += g; totP += pot;
  out.push(`## ${cat} — garantidos ${g}/${META_CATEGORIA} | em potencial ${pot}/${META_CATEGORIA}`);
  const vazias = (ing[cat] || []).filter((t) => !subs[t]);
  for (const [sub, x] of Object.entries(subs).sort((a, b) => (b[1].pub + b[1].fila + b[1].cand) - (a[1].pub + a[1].fila + a[1].cand)))
    out.push(`- ${sub}: ${x.pub} publicados, ${x.fila} na fila, ${x.cand} candidatos`);
  if (vazias.length) out.push(`- **subcategorias sem nenhuma pauta (${vazias.length}):** ${vazias.join(', ')}`);
  out.push('');
}
out.splice(3, 0, `**Total garantido: ${totG} | em potencial: ${totP} | meta geral: ${META_CATEGORIA * Object.keys(ing).length}**`, '');
fs.writeFileSync('data/pesquisa/cobertura.md', out.join('\n'));
console.log(out.filter((l) => l.startsWith('##') || l.startsWith('**Total')).join('\n'));
