// Ingere resultados de volume no banco de palavras (data/pesquisa/banco-de-palavras.json).
//   node scripts/ingerir-hypd.js arquivo1 [arquivo2 ...] [--fonte nome] [--saida caminho.json]
// Aceita:
//   - arquivos JSON do HYPD research_get_search_volume (os que a ferramenta salva em tool-results quando a resposta é grande)
//   - TSV/CSV com colunas Keyword, Avg. monthly searches (ou volume) e, opcionalmente, Competition
// Deduplica pela palavra normalizada (fica o maior volume), recalcula categoria e status de TODO o banco
// (fila | candidata | absorvida | banco) e imprime um resumo. Rode logo depois de cada pesquisa:
// os resultados do HYPD expiram em 24 horas.
import fs from 'fs';

const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const FONTE = opt('--fonte');
const SAIDA = opt('--saida', 'data/pesquisa/banco-de-palavras.json');
const arquivos = args.filter((a, i) => !a.startsWith('--') && !['--fonte', '--saida'].includes(args[i - 1]));
if (!arquivos.length) { console.error('uso: node scripts/ingerir-hypd.js arquivo [arquivo ...] [--fonte nome] [--saida caminho]'); process.exit(1); }

const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const ler = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const existente = fs.existsSync(SAIDA) ? ler(SAIDA) : { palavras: [] };
const banco = new Map(existente.palavras.map((p) => [norm(p.palavra), p]));
const antes = banco.size;

function linhasDe(arq) {
  const raw = fs.readFileSync(arq, 'utf8');
  const i = raw.indexOf('{"result"');
  if (i >= 0) { // JSON do HYPD
    const r = JSON.parse(raw.slice(i, raw.lastIndexOf('}') + 1)).result;
    return { fonte: FONTE || r.resultId.slice(0, 8), linhas: (r.rows || []).map((x) => ({ palavra: x.keyword, volume: x.search_volume, competicao: x.competition })) };
  }
  const linhas = raw.replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  const sep = ['\t', ';', ','].map((s) => [s, (linhas[0].match(new RegExp(s, 'g')) || []).length]).sort((a, b) => b[1] - a[1])[0][0];
  const cab = linhas[0].split(sep).map((c) => c.trim());
  const ik = cab.findIndex((c) => /keyword|palavra/i.test(c));
  const iv = cab.findIndex((c) => /avg|volume|search|buscas/i.test(c));
  const ic = cab.findIndex((c) => /competition|concorr/i.test(c));
  return { fonte: FONTE || arq.split('/').pop().slice(0, 24), linhas: linhas.slice(1).map((l) => { const c = l.split(sep); return { palavra: c[ik], volume: Number(String(c[iv]).replace(/[^\d]/g, '')) || 0, competicao: ic >= 0 ? c[ic] : '' }; }) };
}

let lidas = 0;
for (const arq of arquivos) {
  const { fonte, linhas } = linhasDe(arq);
  for (const l of linhas) {
    if (!l.palavra || !(l.volume > 0)) continue;
    lidas++;
    const k = norm(l.palavra);
    const e = banco.get(k);
    if (!e || l.volume > e.volume) banco.set(k, { palavra: l.palavra.trim(), volume: Math.round(l.volume), competicao: (l.competicao || e?.competicao || '').toUpperCase(), fonte });
  }
}

// categoria (pelo tema mais específico) e status
const ing = ler('data/pesquisa/ingredientes.json').categorias;
const temas = Object.entries(ing).flatMap(([c, ts]) => ts.map((t) => [norm(t), c])).sort((a, b) => b[0].length - a[0].length);
const fila = new Map(ler('data/keywords-validated.json').keywords.map((k) => [norm(k.keyword), k]));
const cands = new Set(ler('data/prateleira-candidatas.json').candidatas.map((c) => norm(c.keyword)));
const absorvidas = new Set([...fila.values()].flatMap((k) => (k.absorve || []).map((a) => norm(a.replace(/\s*\(\d+\)$/, '')))));

const palavras = [...banco.entries()].map(([k, e]) => ({
  palavra: e.palavra, volume: e.volume, competicao: e.competicao || '', fonte: e.fonte,
  categoria: temas.find(([t]) => k.includes(t))?.[1] || 'sem-categoria',
  status: fila.has(k) ? 'fila' : cands.has(k) ? 'candidata' : absorvidas.has(k) ? 'absorvida' : 'banco',
})).sort((a, b) => b.volume - a.volume);

fs.writeFileSync(SAIDA, JSON.stringify({
  atualizado: new Date().toISOString().slice(0, 10),
  origem: existente.origem || 'HYPD research_get_search_volume (Google Ads, Brasil, 12 meses); volume = média mensal',
  campos: existente.campos || 'palavra, volume, competicao (HIGH costuma indicar compra), fonte (lote), categoria (por tema), status (fila|candidata|absorvida|banco)',
  palavras,
}));
const util = palavras.filter((p) => p.status === 'banco' && p.volume >= 1000 && p.competicao !== 'HIGH').length;
console.log(`${arquivos.length} arquivo(s), ${lidas} linhas com volume | banco: ${antes} -> ${palavras.length} palavras (+${palavras.length - antes}) | úteis ainda não usadas (>=1000, não HIGH): ${util}`);
