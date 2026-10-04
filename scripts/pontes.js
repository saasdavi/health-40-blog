// Pontes internas: para cada pauta da fila, quais outras pautas ela deve linkar e com que texto de âncora.
//   node scripts/pontes.js [--max 4]
// Âncora = palavra-chave do destino + suas palavras de apoio (secundárias, inclusive as de 10 a 99 buscas).
// Pontuação: mesma torre (+3), termos de uma pauta dentro da outra (+3), mesmo cluster (+2), cada termo em comum (+1).
// Saída: data/pontes.json (o robô lê e sugere os links com os artigos já publicados) e data/pontes.md.
import fs from 'fs';

const MAX = Number(process.argv[process.argv.indexOf('--max') + 1]) || 4;
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'e', 'em', 'na', 'no', 'para', 'por', 'um', 'uma', 'que', 'com', 'os', 'as', 'se', 'ao', 'sintomas', 'causas', 'tratamento', 'como', 'qual', 'quais', 'sao', 'serve', 'significa']);
const radical = (w) => (w.length >= 5 ? w.slice(0, -2) : w);
const termos = (t) => new Set(norm(t).split(' ').filter((w) => w && !STOP.has(w)).map(radical));
const kws = JSON.parse(fs.readFileSync('data/keywords-validated.json', 'utf8')).keywords;

const info = kws.map((k) => ({ k, T: termos(k.keyword) }));
const pontes = {};
let total = 0;
for (const a of info) {
  const cand = [];
  for (const b of info) {
    if (a === b) continue;
    const comuns = [...a.T].filter((w) => b.T.has(w)).length;
    const contem = comuns > 0 && ([...a.T].every((w) => b.T.has(w)) || [...b.T].every((w) => a.T.has(w)));
    let score = comuns + (contem ? 3 : 0) + (a.k.cluster && a.k.cluster === b.k.cluster ? 2 : 0);
    if ((a.k.pilar && a.k.pilar === b.k.pilar) || a.k.pilar === b.k.keyword || b.k.pilar === a.k.keyword) score += 3;
    if (score < 3 || (!contem && !comuns && !(a.k.pilar && (a.k.pilar === b.k.keyword || a.k.pilar === b.k.pilar)))) continue;
    const apoio = (b.k.secundarias || []).slice(0, 4).map((s) => s.palavra);
    cand.push({ para: b.k.keyword, score, ancoras: [b.k.keyword, ...apoio], motivo: [contem ? 'assunto contido' : '', comuns ? `${comuns} termo(s) em comum` : '', a.k.cluster === b.k.cluster ? `cluster ${a.k.cluster}` : '', (a.k.pilar === b.k.keyword || b.k.pilar === a.k.keyword || (a.k.pilar && a.k.pilar === b.k.pilar)) ? 'mesma torre' : ''].filter(Boolean).join(', ') });
  }
  cand.sort((x, y) => y.score - x.score || (kws.find((k) => k.keyword === y.para)?.volume || 0) - (kws.find((k) => k.keyword === x.para)?.volume || 0));
  if (cand.length) { pontes[a.k.keyword] = cand.slice(0, MAX); total += Math.min(MAX, cand.length); }
}
const recebe = {};
for (const [de, lista] of Object.entries(pontes)) for (const l of lista) (recebe[l.para] ||= []).push(de);
fs.writeFileSync('data/pontes.json', JSON.stringify({ gerado: new Date().toISOString().slice(0, 10), pautas: kws.length, comPontes: Object.keys(pontes).length, pontes: total, linkaPara: pontes, recebeLinksDe: recebe }, null, 1));
const md = ['# Pontes internas (quem linka quem)', '', `${Object.keys(pontes).length} de ${kws.length} pautas têm pontes; ${total} links sugeridos. O texto de âncora vem da palavra-chave do destino e das palavras de apoio (inclusive as de 10 a 99 buscas).`, '',
  ...Object.entries(pontes).slice(0, 80).flatMap(([de, l]) => [`## ${de}`, ...l.map((x) => `- → **${x.para}** (${x.motivo}) âncoras: ${x.ancoras.join(' | ')}`), ''])].join('\n');
fs.writeFileSync('data/pontes.md', md + '\n');
const semPonte = kws.filter((k) => !pontes[k.keyword]).map((k) => k.keyword);
console.log(`${Object.keys(pontes).length}/${kws.length} pautas com pontes, ${total} links sugeridos; sem ponte: ${semPonte.length}`);
console.log(semPonte.slice(0, 12).join(' | '));
const top = Object.entries(recebe).sort((a, b) => b[1].length - a[1].length).slice(0, 8);
console.log('mais linkadas:', top.map(([k, v]) => `${k} (${v.length})`).join('; '));
