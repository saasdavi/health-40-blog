// Distribui as palavras validadas do banco como termos SECUNDÁRIOS das pautas (fila e candidatas),
// para nenhuma demanda medida ficar sem artigo:
//   - palavra que contém todos os termos da palavra principal de uma pauta -> vira secundária dela
//     (o robô usa nos H2 e no texto, só quando as fontes sustentam)
//   - palavra com volume >= 1.000 -> não vira secundária: fica marcada como "pauta própria em potencial"
//   - palavra de compra/marca/competição HIGH -> ignorada
//   node scripts/distribuir-secundarias.js [--aplicar] [--min 30]
import fs from 'fs';
import { tratamento } from './filtros.js';

const aplicar = process.argv.includes('--aplicar');
const i = process.argv.indexOf('--min');
const MIN = i >= 0 ? Number(process.argv[i + 1]) : 10; // frases de 10 a 99 buscas são ótimas como apoio e âncora de link
const PROPRIA = 1000;
// política de 04/10/2026 (sem preconceito de conteúdo): só intenção de compra e fora do assunto ficam de fora (filtros.json)
const COMERCIAL = /\b(comprar|preco|onde comprar|melhor marca|promocao|cupom|kit)\b/;
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'e', 'em', 'na', 'no', 'para', 'por', 'um', 'uma', 'que', 'com', 'os', 'as', 'se', 'ao']);
const radical = (w) => (w.length >= 5 ? w.slice(0, -2) : w);
const termos = (t) => norm(t).split(' ').filter((w) => w && !STOP.has(w)).map(radical);

const banco = JSON.parse(fs.readFileSync('data/pesquisa/banco-de-palavras.json', 'utf8')).palavras;
const filaDoc = JSON.parse(fs.readFileSync('data/keywords-validated.json', 'utf8'));
const candDoc = JSON.parse(fs.readFileSync('data/prateleira-candidatas.json', 'utf8'));
const itens = [
  ...filaDoc.keywords.map((k) => ({ tipo: 'fila', ref: k, t: termos(k.keyword) })),
  ...candDoc.candidatas.map((k) => ({ tipo: 'candidata', ref: k, t: termos(k.keyword) })),
].filter((x) => x.t.length);

const atribuicoes = new Map();
const proprias = [];
let semDono = 0, ignoradas = 0;
for (const p of banco) {
  if (!(p.volume >= MIN) || tratamento(p.palavra) === 'excluir' || COMERCIAL.test(norm(p.palavra))) { ignoradas++; continue; }
  if (p.status === 'fila' || p.status === 'candidata') continue;
  const tp = new Set(termos(p.palavra));
  // dono = pauta cujos termos estão TODOS na palavra; vence a mais específica (mais termos)
  const donos = itens.filter((x) => x.t.every((w) => tp.has(w)) && norm(p.palavra) !== norm(x.ref.keyword));
  if (!donos.length) { semDono++; continue; }
  donos.sort((a, b) => b.t.length - a.t.length || (b.ref.volume || 0) - (a.ref.volume || 0));
  const d = donos[0];
  if (p.volume >= PROPRIA) { proprias.push({ palavra: p.palavra, volume: p.volume, perto: d.ref.keyword }); continue; }
  const lista = atribuicoes.get(d) || [];
  lista.push({ palavra: p.palavra, volume: p.volume });
  atribuicoes.set(d, lista);
}

let total = 0;
for (const [d, lista] of atribuicoes) {
  lista.sort((a, b) => b.volume - a.volume);
  d.ref.secundarias = lista.slice(0, 15);
  total += d.ref.secundarias.length;
}
console.log(`pautas com secundárias: ${atribuicoes.size} | palavras distribuídas: ${total} | sem pauta correspondente: ${semDono} | ignoradas (compra/fora do assunto/pouco volume): ${ignoradas}`);
console.log(`\npautas próprias em potencial (volume >= ${PROPRIA}, variação de uma pauta existente): ${proprias.length}`);
for (const x of proprias.slice(0, 15)) console.log(`${String(x.volume).padStart(7)}  ${x.palavra}  (perto de "${x.perto}")`);
const top = [...atribuicoes.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 5);
console.log('\nexemplos:'); for (const [d, l] of top) console.log(`- ${d.ref.keyword}: ${l.slice(0, 4).map((x) => `${x.palavra} (${x.volume})`).join('; ')}`);
if (aplicar) {
  fs.writeFileSync('data/keywords-validated.json', JSON.stringify(filaDoc, null, 2));
  fs.writeFileSync('data/prateleira-candidatas.json', JSON.stringify(candDoc, null, 1));
  fs.writeFileSync('data/pesquisa/pautas-proprias-em-potencial.json', JSON.stringify(proprias, null, 1));
  console.log('\naplicado em keywords-validated.json, prateleira-candidatas.json e pautas-proprias-em-potencial.json');
} else console.log('\n(simulação; use --aplicar para gravar)');
