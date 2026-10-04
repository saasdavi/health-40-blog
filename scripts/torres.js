// Monta as "torres" de conteúdo: 1 pauta PILAR (termo amplo da subcategoria) + vários SATÉLITES (sub-temas)
// que apoiam e fortalecem a palavra principal com links internos.
//   node scripts/torres.js [--aplicar]
// Subcategoria = cada tema de data/pesquisa/ingredientes.json. Pilar = a pauta mais ampla (menos termos, maior volume).
// Grava `pilar` e `papel` ('pilar' | 'satelite') nas pautas e o mapa em data/torres.json.
import fs from 'fs';

const aplicar = process.argv.includes('--aplicar');
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'e', 'em', 'na', 'no', 'para', 'por', 'um', 'uma', 'que', 'com', 'os', 'as', 'se', 'ao']);
const FILL = new Set(['o', 'que', 'e', 'sintomas', 'causas', 'tratamento', 'serve', 'tipos', 'como', 'quais', 'sao', 'significa']);
const nucleo = (t) => norm(t).split(' ').filter((w) => w && !STOP.has(w) && !FILL.has(w)).sort().join(' ');
const nTermos = (t) => norm(t).split(' ').filter((w) => w && !STOP.has(w)).length;

const ing = JSON.parse(fs.readFileSync('data/pesquisa/ingredientes.json', 'utf8')).categorias;
const temas = Object.entries(ing).flatMap(([cat, ts]) => ts.map((t) => ({ t, cat, n: norm(t) }))).sort((a, b) => b.n.length - a.n.length);
const filaDoc = JSON.parse(fs.readFileSync('data/keywords-validated.json', 'utf8'));
const candDoc = JSON.parse(fs.readFileSync('data/prateleira-candidatas.json', 'utf8'));
const banco = new Map(JSON.parse(fs.readFileSync('data/pesquisa/banco-de-palavras.json', 'utf8')).palavras.map((p) => [norm(p.palavra), p.volume]));
const itens = [...filaDoc.keywords.map((k) => ({ ref: k, tipo: 'fila' })), ...candDoc.candidatas.filter((c) => c.volume >= 1000).map((k) => ({ ref: k, tipo: 'candidata' }))];

const torres = new Map();
for (const it of itens) {
  const m = temas.find((x) => norm(it.ref.keyword).includes(x.n));
  if (!m) continue;
  if (!torres.has(m.t)) torres.set(m.t, { tema: m.t, categoria: m.cat, itens: [] });
  torres.get(m.t).itens.push(it);
}

const mapa = {};
let comSatelites = 0, semPilar = 0;
for (const tw of torres.values()) {
  tw.itens.sort((a, b) => nTermos(a.ref.keyword) - nTermos(b.ref.keyword) || (b.ref.volume || 0) - (a.ref.volume || 0));
  // pilar = a pauta cujo núcleo é o próprio tema ("o que é colesterol", "hemoglobina glicada"); senão a torre ainda não tem pilar
  const pilar = tw.itens.find((x) => nucleo(x.ref.keyword) === nucleo(tw.tema));
  const satelites = tw.itens.filter((x) => x !== pilar);
  if (pilar && satelites.length) comSatelites++;
  if (!pilar) semPilar++;
  const volumeTema = banco.get(norm(tw.tema));
  mapa[tw.tema] = {
    categoria: tw.categoria,
    pilar: pilar ? pilar.ref.keyword : null,
    pilarAusente: !pilar,
    sugestaoPilar: !pilar ? { palavra: tw.tema, volume: volumeTema || null } : null,
    satelites: satelites.map((s) => s.ref.keyword),
  };
  if (pilar) { pilar.ref.papel = 'pilar'; delete pilar.ref.pilar; delete pilar.ref.pilarPlanejado; }
  for (const s of satelites) { s.ref.papel = 'satelite'; if (pilar) { s.ref.pilar = pilar.ref.keyword; delete s.ref.pilarPlanejado; } else { delete s.ref.pilar; s.ref.pilarPlanejado = tw.tema; } }
}

console.log(`${torres.size} subcategorias com pauta | ${comSatelites} torres completas (pilar + satélites) | ${semPilar} sem pauta-pilar | ${itens.length - [...torres.values()].reduce((s, t) => s + t.itens.length, 0)} pautas sem subcategoria`);
const grandes = Object.entries(mapa).sort((a, b) => b[1].satelites.length - a[1].satelites.length).slice(0, 12);
for (const [t, x] of grandes) console.log(`- ${t} [${x.categoria}]: ${x.pilar ? `pilar "${x.pilar}"` : `SEM PILAR (criar "${t}"${x.sugestaoPilar.volume ? `, ${x.sugestaoPilar.volume} buscas` : ''})`} + ${x.satelites.length} satélites`);
const sozinhas = Object.entries(mapa).filter(([, x]) => x.pilar && !x.satelites.length).length;
console.log(`${sozinhas} pilares ainda sem satélites.`);
if (aplicar) {
  fs.writeFileSync('data/keywords-validated.json', JSON.stringify(filaDoc, null, 2));
  fs.writeFileSync('data/prateleira-candidatas.json', JSON.stringify(candDoc, null, 1));
  fs.writeFileSync('data/torres.json', JSON.stringify(mapa, null, 1));
  console.log('aplicado: pilar/papel nas pautas e mapa em data/torres.json');
} else console.log('(simulação; use --aplicar)');

// --satelites: gera frases de cauda longa (sub-temas) para cada pilar que ainda tem poucos satélites,
// com as intenções da categoria (data/pesquisa/ingredientes.json). Saída: data/pesquisa/satelites-para-medir.txt
if (process.argv.includes('--satelites')) {
  const cfg = JSON.parse(fs.readFileSync('data/pesquisa/ingredientes.json', 'utf8'));
  const minimo = 4; // satélites desejados por torre
  const frases = new Set();
  let torresAlvo = 0;
  for (const [tema, x] of Object.entries(mapa)) {
    if (x.satelites.length >= minimo) continue;
    torresAlvo++;
    for (const m of cfg.intencoesPorCategoria?.[x.categoria] || []) frases.add(m.replace('{t}', tema));
  }
  fs.writeFileSync('data/pesquisa/satelites-para-medir.txt', [...frases].join('\n') + '\n');
  console.log(`${torresAlvo} torres com menos de ${minimo} satélites -> ${frases.size} frases em data/pesquisa/satelites-para-medir.txt (medir volume e rodar importar + torres --aplicar)`);
}
