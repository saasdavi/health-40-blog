// Calendário de 12 meses (3 artigos/dia). Sem API. Saída: data/conteudo/calendario-12-meses.csv e .md
// Ordem: 1) estoque já escrito; 2) pautas-mãe do grupo 2 (data/conteudo/pautas-mestre.csv) por demanda, alternando temas; 3) vagas.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { norm } from './demanda-lib.js';
import { SAUDE, LIXO } from './lib/saude.js';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lerCsv = (f) => fs.readFileSync(path.join(raiz, f), 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean).slice(1).map((l) => { const c = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ';' && !q) { c.push(cur); cur = ''; } else cur += ch; } c.push(cur); return c; });
const rows = lerCsv('data/conteudo/pautas-mestre.csv').filter((r) => r[0].startsWith('2'));
const arts = JSON.parse(fs.readFileSync(path.join(raiz, 'data/articles.json'), 'utf8')).articles.filter((a) => a.status === 'draft' && a.estoque);
const SUF = new Set(['para', 'que', 'serve', 'efeitos', 'colaterais', 'como', 'usar', 'causas', 'causa', 'sintomas', 'tratamento', 'funciona', 'beneficios', 'o', 'a', 'os', 'as', 'de', 'do', 'da', 'e', 'em', 'no', 'na', 'o que e', 'quanto', 'tempo', 'qual', 'melhor', 'faz', 'mal', 'tem', 'ter', 'fazer']);
const toks = (f) => norm(f).split(' ').filter((t) => t && !SUF.has(t));
const cl = new Map();
for (const r of rows) {
  const [, tema, frase, vol, conc, tend, , , sens] = r; const v = parseInt(vol, 10) || 0; const t = toks(frase);
  const k = t.length <= 2 ? t.join(' ') : t.slice(0, 2).join(' '); if (!k) continue;
  const c = cl.get(k) || { tema, cabeca: frase, vmax: 0, soma: 0, sats: [], sens: false, sobe: false };
  c.soma += v; c.sens ||= sens === 'sim'; c.sobe ||= tend === 'subindo';
  if (v > c.vmax) { if (c.vmax) c.sats.push(c.cabeca); c.cabeca = frase; c.vmax = v; c.tema = tema; } else c.sats.push(frase);
  cl.set(k, c);
}
const sa2 = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const pautas = [...cl.values()].filter((c) => c.vmax >= 1000 && SAUDE.test(sa2(c.cabeca)) && !LIXO.test(sa2(c.cabeca))).sort((a, b) => (b.soma + (b.sobe ? 5000 : 0)) - (a.soma + (a.sobe ? 5000 : 0)));
// agenda: 365 dias x 3
const inicio = new Date('2026-10-06T12:00:00Z'); const dias = 365;
const fila = [...pautas]; const saida = []; let est = 0;
const estoque = arts.map((a) => ({ tipo: 'estoque (pronto)', tema: a.cluster || '', frase: a.primaryKeyword, vol: a.volume || '', sens: '', sats: '' }));
for (let d = 0; d < dias; d++) {
  const data = new Date(inicio.getTime() + d * 86400000).toISOString().slice(0, 10);
  const doDia = []; const temas = new Set(); let sens = 0;
  while (doDia.length < 3) {
    if (est < estoque.length) { doDia.push(estoque[est++]); continue; }
    let i = fila.findIndex((c) => !temas.has(c.tema) && !(c.sens && sens >= 1));
    if (i < 0) i = fila.findIndex((c) => !(c.sens && sens >= 1));
    if (i < 0 && fila.length) i = 0;
    if (i < 0) { doDia.push({ tipo: 'VAGA (validar tema novo)', tema: '', frase: '', vol: '', sens: '', sats: '' }); continue; }
    const c = fila.splice(i, 1)[0]; temas.add(c.tema); if (c.sens) sens++;
    doDia.push({ tipo: 'nova pauta', tema: c.tema, frase: c.cabeca, vol: c.vmax, soma: c.soma, sens: c.sens ? 'sim' : '', sats: c.sats.slice(0, 5).join(' | ') });
  }
  doDia.forEach((x, j) => saida.push({ data, mes: data.slice(0, 7), n: j + 1, ...x }));
}
const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
const cab = ['data', 'mes', 'n_do_dia', 'tipo', 'tema', 'palavra_chave', 'buscas_mes_cabeca', 'buscas_soma_familia', 'sensivel_revisao', 'satelites_no_mesmo_artigo'];
fs.writeFileSync(path.join(raiz, 'data/conteudo/calendario-12-meses.csv'), '﻿' + [cab.join(';'), ...saida.map((x) => [x.data, x.mes, x.n, x.tipo, x.tema, x.frase, x.vol, x.soma || '', x.sens, x.sats].map(q).join(';'))].join('\r\n') + '\r\n');
const por = {}; for (const x of saida) { const m = (por[x.mes] ||= { estoque: 0, nova: 0, vaga: 0 }); if (x.tipo.startsWith('estoque')) m.estoque++; else if (x.tipo === 'nova pauta') m.nova++; else m.vaga++; }
let md = `# Calendário editorial de 12 meses (3 por dia)\n\nGerado por scripts/calendario-editorial.js. Início 2026-10-06. Ordem: estoque pronto, depois pautas-mãe por demanda (família somada), alternando temas e no máximo 1 tema sensível por dia. "VAGA" = ainda falta tema validado.\n\n| Mês | Estoque | Nova pauta | Vaga |\n|---|---|---|---|\n`;
for (const [m, v] of Object.entries(por)) md += `| ${m} | ${v.estoque} | ${v.nova} | ${v.vaga} |\n`;
const tot = Object.values(por).reduce((a, v) => ({ e: a.e + v.estoque, n: a.n + v.nova, v: a.v + v.vaga }), { e: 0, n: 0, v: 0 });
md += `\n**Total:** ${tot.e} do estoque + ${tot.n} pautas novas + ${tot.v} vagas = ${tot.e + tot.n + tot.v}.\n`;
fs.writeFileSync(path.join(raiz, 'data/conteudo/calendario-12-meses.md'), md);
console.log(`Pautas-mãe: ${pautas.length} | estoque ${tot.e} | novas ${tot.n} | vagas ${tot.v}`); console.log(md.split('\n').slice(5, 20).join('\n'));
