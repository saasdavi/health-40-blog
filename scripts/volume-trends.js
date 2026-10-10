// Estima o volume mensal de frases pelo Google Trends (via SerpApi), comparando cada frase com 2 âncoras de volume JÁ MEDIDO.
//   SERPAPI_API_KEY=... node scripts/volume-trends.js [entrada.txt] [--mock arquivo.json] [--seco]
// entrada: uma frase por linha (padrão data/pesquisa/trends-entrada.txt). Cada consulta usa 1 busca da SerpApi:
// 2 âncoras + 3 frases (o Trends aceita no máximo 5 termos por consulta), ou seja ~1 busca a cada 3 frases.
// ATENÇÃO: o Trends mostra interesse RELATIVO, não volume. O número aqui é uma ESTIMATIVA (volume da âncora × razão do Trends)
// e é gravado em data/pesquisa/demanda-validada.json com "estimado": true. Nunca sobrescreve volume medido de verdade.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { norm } from './demanda-lib.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const pos = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--mock');
const ENTRADA = path.resolve(raiz, pos[0] || 'data/pesquisa/trends-entrada.txt');
const MOCK = args.includes('--mock') ? args[args.indexOf('--mock') + 1] : null;
const SECO = args.includes('--seco'); // não grava, só mostra
const KEY = process.env.SERPAPI_API_KEY;
const ARQ = path.join(raiz, 'data/pesquisa/demanda-validada.json');
const ANCORAS = [['sobrepeso', 5400], ['saciedade', 4400]]; // volumes medidos (Keyword Planner), em demanda-validada.json
const chave = (s) => norm(s).split(' ').sort().join(' ');

const demanda = JSON.parse(fs.readFileSync(ARQ, 'utf8'));
for (const [f, v] of ANCORAS) { const it = demanda.itens[chave(f)]; if (!it || it.volume !== v) throw new Error(`âncora "${f}" não confere com demanda-validada.json (${it?.volume})`); }
if (!MOCK && !KEY) throw new Error('falta SERPAPI_API_KEY');

const frases = fs.readFileSync(ENTRADA, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)
  .filter((f) => { const it = demanda.itens[chave(f)]; return !it || it.estimado; }); // pula o que já tem volume medido de verdade
console.log(`${frases.length} frases a estimar (${Math.ceil(frases.length / 3)} buscas na SerpApi)`);

async function trends(termos) {
  if (MOCK) return JSON.parse(fs.readFileSync(path.resolve(raiz, MOCK), 'utf8'))[termos.join(',')] || { erro: 'mock sem este lote' };
  const url = `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(termos.join(','))}&geo=BR&hl=pt-BR&data_type=TIMESERIES&date=${encodeURIComponent('today 12-m')}&api_key=${KEY}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`SerpApi ${r.status}: ${(await r.text()).slice(0, 120)}`);
  return r.json();
}
// média do interesse por termo (usa "averages" quando a SerpApi manda; senão calcula da série)
function medias(j, termos) {
  const iot = j.interest_over_time || {};
  const out = {};
  for (const a of iot.averages || []) out[a.query] = Number(a.value);
  if (Object.keys(out).length < termos.length) {
    const soma = {}, n = {};
    for (const p of iot.timeline_data || []) for (const v of p.values || []) { soma[v.query] = (soma[v.query] || 0) + (Number(v.extracted_value) || 0); n[v.query] = (n[v.query] || 0) + 1; }
    for (const t of termos) if (n[t]) out[t] = soma[t] / n[t];
  }
  return out;
}

const resultado = [];
for (let i = 0; i < frases.length; i += 3) {
  const lote = frases.slice(i, i + 3);
  const termos = [...ANCORAS.map((a) => a[0]), ...lote];
  let j; try { j = await trends(termos); } catch (e) { console.log(`  ⚠️  ${e.message}`); continue; }
  const m = medias(j, termos);
  const a1 = m[ANCORAS[0][0]], a2 = m[ANCORAS[1][0]];
  if (!a1 || !a2) { console.log(`  ⚠️  âncoras sem dados no lote ${lote.join(' | ')}`); continue; }
  const divergeAncoras = Math.max(a1 / ANCORAS[0][1], a2 / ANCORAS[1][1]) / Math.min(a1 / ANCORAS[0][1], a2 / ANCORAS[1][1]);
  for (const f of lote) {
    const v = m[f] ?? 0;
    const e1 = (v / a1) * ANCORAS[0][1], e2 = (v / a2) * ANCORAS[1][1];
    const est = Math.round(((e1 + e2) / 2) / 10) * 10;
    resultado.push({ frase: f, indice: Number(v.toFixed(2)), ancoras: [Number(a1.toFixed(2)), Number(a2.toFixed(2))], estimado: est, ancorasConsistentes: divergeAncoras < 2 });
    console.log(`  ${f}: índice ${v.toFixed(1)} → ~${est}/mês${divergeAncoras < 2 ? '' : ' (âncoras divergem: pouco confiável)'}`);
  }
}
if (!SECO) {
  let gravados = 0;
  for (const r of resultado) {
    if (!r.ancorasConsistentes || r.indice <= 0) continue; // sem sinal no Trends (abaixo do que ele detecta): continua 'não medida'
    demanda.itens[chave(r.frase)] = { frase: r.frase, volume: r.estimado, concorrencia: null, tendencia: 'estável', tema: 'saude-geral', fonte: `ESTIMADO (Google Trends via SerpApi, relativo a "${ANCORAS[0][0]}"=${ANCORAS[0][1]} e "${ANCORAS[1][0]}"=${ANCORAS[1][1]}/mês; índice ${r.indice})`, estimado: true };
    gravados++;
  }
  if (gravados) { demanda.gerado = new Date().toISOString().slice(0, 10); demanda.total = Object.keys(demanda.itens).length; fs.writeFileSync(ARQ, JSON.stringify(demanda)); }
  console.log(`📊 ${gravados} de ${frases.length} estimativas gravadas em data/pesquisa/demanda-validada.json (marcadas "estimado": true)`);
}
fs.writeFileSync(path.join(raiz, 'data/pesquisa/trends-resultado.json'), JSON.stringify(resultado, null, 1));
