// Calendário editorial de 12 meses (3 artigos/dia): data/plano-editorial.json e .md
//   node scripts/plano-editorial.js [--inicio 2026-10-05] [--dias 365]
// Preenche os 1.095 espaços com 3 camadas, nesta ordem, sempre sem repetir o mesmo cluster em dois espaços seguidos:
//   1) VALIDADA   = pauta livre da fila (já passou no Google; o robô publica)
//   2) A CHECAR   = candidata com volume, falta checar o Google
//   3) A VALIDAR  = grupo de palavras da ordem de validação (data/pesquisa/ordem-de-validacao.json), falta checar o Google
//   4) VAGA       = ainda sem tema levantado (levantar mais palavras)
// O plano é um MAPA: só 'validada' publica sozinha. Rode de novo a cada rodada de validação; a ordem dos dias muda, os números sobem.
import fs from 'fs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const INICIO = opt('--inicio', '2026-10-05'), DIAS = Number(opt('--dias', 365)), POR_DIA = 3;
const lerJson = (p, fb) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fb; } };
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const slugify = (t) => norm(t).replace(/ /g, '-');

const artigos = lerJson('data/articles.json', []);
const lista = Array.isArray(artigos) ? artigos : artigos.articles || [];
const usados = new Set(); for (const a of lista) { if (a.status === 'draft') continue; usados.add((a.primaryKeyword || '').toLowerCase()); usados.add(a.slug); }
const fila = lerJson('data/keywords-validated.json', { keywords: [] }).keywords;
const cand = lerJson('data/prateleira-candidatas.json', { candidatas: [] }).candidatas;
const ordem = lerJson('data/pesquisa/ordem-de-validacao.json', { ordem: [] }).ordem;
const visto = new Set(fila.flatMap((k) => [norm(k.keyword), ...(k.secundarias || []).map((s) => norm(s.palavra))]));

const livres = fila.filter((p) => p.serp?.facil === true && (p.fontes || []).length >= 2 && !p.substitui && !usados.has(p.keyword.toLowerCase()) && !usados.has(slugify(p.keyword)));
const saiu = (kw) => lista.some((a) => a.status === 'published' && (a.primaryKeyword || '').toLowerCase() === String(kw || '').toLowerCase());
livres.sort((a, b) => ((a.papel === 'satelite' && a.pilar && !saiu(a.pilar)) ? 1 : 0) - ((b.papel === 'satelite' && b.pilar && !saiu(b.pilar)) ? 1 : 0) || b.volume - a.volume);

const camadas = [
  livres.map((p) => ({ tema: p.keyword, status: 'validada', cluster: p.cluster || 'geral', volume: p.volume, sensivel: !!p.sensivel })),
  [], [],
];
for (const c of cand.filter((c) => !visto.has(norm(c.keyword))).sort((a, b) => b.volume - a.volume)) { camadas[1].push({ tema: c.keyword, status: 'a-checar', cluster: c.cluster || 'geral', volume: c.volume }); visto.add(norm(c.keyword)); }
// grupos sem marca de atenção primeiro (mais chance de passar no Google); amplo/sensível/competição alta vão para o fim da camada
const grupos = ordem.filter((o) => !visto.has(norm(o.frase))).map((o) => ({ tema: o.frase, status: 'a-validar', cluster: o.categoria || 'geral', volume: o.volumeFrase, grupo: o.volumeGrupo, atencao: o.atencao || '' }));
grupos.sort((a, b) => (a.atencao ? 1 : 0) - (b.atencao ? 1 : 0) || b.grupo - a.grupo);
for (const g of grupos) { if (visto.has(norm(g.tema))) continue; visto.add(norm(g.tema)); camadas[2].push(g); }

const todos = camadas.flat();
const slots = DIAS * POR_DIA;
const plano = [];
let ultimo = null;
const fil = todos.slice();
for (let i = 0; i < slots; i++) {
  if (!fil.length) { plano.push({ tema: null, status: 'vaga', cluster: null }); continue; }
  // mesma camada de status; prefere cluster diferente do anterior (olha até 12 à frente)
  const topoStatus = fil[0].status;
  let idx = 0;
  for (let j = 0; j < Math.min(12, fil.length) && fil[j].status === topoStatus; j++) if (fil[j].cluster !== ultimo) { idx = j; break; }
  const [p] = fil.splice(idx, 1);
  plano.push(p); ultimo = p.cluster;
}
const d0 = new Date(INICIO + 'T00:00:00Z');
const dias = [];
for (let d = 0; d < DIAS; d++) { const dt = new Date(d0.getTime() + d * 864e5).toISOString().slice(0, 10); dias.push({ data: dt, pautas: plano.slice(d * POR_DIA, d * POR_DIA + POR_DIA) }); }
const meses = {};
for (const d of dias) { const m = d.data.slice(0, 7); const r = (meses[m] ||= { mes: m, espacos: 0, validada: 0, 'a-checar': 0, 'a-validar': 0, vaga: 0 }); for (const p of d.pautas) { r.espacos++; r[p.status]++; } }
const tot = { validada: 0, 'a-checar': 0, 'a-validar': 0, vaga: 0 }; for (const p of plano) tot[p.status]++;
fs.writeFileSync('data/plano-editorial.json', JSON.stringify({ gerado: new Date().toISOString().slice(0, 10), inicio: INICIO, dias: DIAS, porDia: POR_DIA, espacos: slots, totais: tot, meses: Object.values(meses), calendario: dias }, null, 1));
const pc = (n) => `${n} (${Math.round(n / slots * 100)}%)`;
const md = ['# Plano editorial de 12 meses', '', `Início ${INICIO}, ${DIAS} dias, ${POR_DIA} artigos por dia = **${slots} espaços**. Gerado em ${new Date().toISOString().slice(0, 10)} por \`node scripts/plano-editorial.js\`.`, '',
  '**Leia como um mapa, não como promessa.** Só a camada *validada* publica sozinha. As outras ainda precisam passar no Google.', '',
  `| Camada | Espaços | Significado |`, `|---|---|---|`,
  `| validada | ${pc(tot.validada)} | já passou no Google; o robô publica |`, `| a checar | ${pc(tot['a-checar'])} | candidata com volume; falta checar o Google |`,
  `| a validar | ${pc(tot['a-validar'])} | grupo de palavras da ordem de validação; falta checar o Google |`, `| vaga | ${pc(tot.vaga)} | sem tema levantado: levantar mais palavras |`, '',
  '## Por mês', '', '| Mês | Espaços | Validada | A checar | A validar | Vaga |', '|---|---|---|---|---|---|', ...Object.values(meses).map((m) => `| ${m.mes} | ${m.espacos} | ${m.validada} | ${m['a-checar']} | ${m['a-validar']} | ${m.vaga} |`), '',
  '## Primeiros 21 dias', '', ...dias.slice(0, 21).map((d) => `- **${d.data}**: ${d.pautas.map((p) => p.tema ? `${p.tema}${p.sensivel ? ' [sensível]' : ''}` : '—').join(' · ')}`), ''].join('\n');
fs.writeFileSync('data/plano-editorial.md', md);
console.log(`${slots} espaços: validada ${tot.validada}, a checar ${tot['a-checar']}, a validar ${tot['a-validar']}, vaga ${tot.vaga}`);
console.log('por mês:', Object.values(meses).map((m) => `${m.mes}: ${m.validada}/${m['a-checar']}/${m['a-validar']}/${m.vaga}`).join(' | '));
