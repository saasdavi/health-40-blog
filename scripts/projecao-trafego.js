// Projeção de tráfego (hipótese, não promessa) a partir do calendário de 12 meses e da estratégia de termos menores.
// Saída: data/conteudo/PROJECAO-TRAFEGO.md
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const csv = (f) => fs.readFileSync(path.join(raiz, f), 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean).slice(1).map((l) => { const c = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ';' && !q) { c.push(cur); cur = ''; } else cur += ch; } c.push(cur); return c; });
const cal = csv('data/conteudo/calendario-12-meses.csv').filter((r) => r[3] !== 'VAGA (validar tema novo)');
const mestre = csv('data/conteudo/pautas-mestre.csv').filter((r) => r[0].startsWith('2b'));
const meses = [...new Set(csv('data/conteudo/calendario-12-meses.csv').map((r) => r[1]))];
const potencial = (cab, soma) => { const c = parseInt(cab, 10) || 0, s = parseInt(soma, 10) || c; return c + 0.5 * Math.max(0, s - c); }; // satélites contam metade (buscas se sobrepõem)
const RAMPA = [0, 0.1, 0.3, 0.6, 1]; // meses após publicar: Google leva ~3-4 meses para estabilizar
// chance de o artigo chegar à 1ª página de um blog NOVO: cai com o volume (frases grandes têm autoridades no topo)
const pChegar = (v) => (v <= 2000 ? 0.45 : v <= 10000 ? 0.3 : v <= 50000 ? 0.15 : 0.05);
const CEN = { conservador: { mult: 0.5, ctr: 0.03 }, moderado: { mult: 1, ctr: 0.05 }, otimista: { mult: 1.6, ctr: 0.08 } };
function simular(artigos) { // artigos: [{mes:índice, pot}]
  const out = {};
  for (const [nome, c] of Object.entries(CEN)) out[nome] = meses.map((_, t) => Math.round(artigos.reduce((s, a) => s + (t >= a.mes ? a.pot * c.ctr * Math.min(0.9, pChegar(a.pot) * c.mult) * RAMPA[Math.min(4, t - a.mes)] : 0), 0)));
  return out;
}
const base = cal.map((r) => ({ mes: meses.indexOf(r[1]), pot: potencial(r[6], r[7]) }));
// ganha-pão: 98 termos pequenos, publicados em ritmo igual a partir do mês 0 (1 a cada ~3 dias)
const gp = mestre.map((r, i) => ({ mes: Math.min(meses.length - 1, Math.floor((i / Math.max(1, mestre.length)) * meses.length)), pot: parseInt(r[3], 10) || 0 }));
const A = simular(base), B = simular([...base, ...gp]);
const num = (n) => n.toLocaleString('pt-BR');
let md = `# Projeção de tráfego (hipótese, não promessa)\n\nGerado por scripts/projecao-trafego.js a partir do calendário de 12 meses (${base.length} artigos com tema; as vagas não entram) e dos ${gp.length} termos ganha-pão (100–999 buscas, soma ${num(gp.reduce((s, a) => s + a.pot, 0))}/mês).\n\n**Premissas:** (1) artigo só rende depois de 3–4 meses (rampa 0%, 10%, 30%, 60%, 100%); (2) satélites da família contam metade, porque as buscas se sobrepõem; (3) **chance de chegar à 1ª página de um blog novo**: 45% para frases até 2.000 buscas, 30% até 10.000, 15% até 50.000 e 5% acima disso (as grandes têm autoridades no topo); o cenário conservador usa metade dessa chance e o otimista 1,6 vezes; (4) CTR médio na 1ª página: 3% (conservador), 5% (moderado), 8% (otimista). Nada disso é garantido: depende do concorrente, da autoridade do site e da qualidade.\n\n## Visitas por mês vindas do Google (cenário A: só o calendário atual)\n\n| Mês | Conservador | Moderado | Otimista |\n|---|---|---|---|\n${meses.map((m, i) => `| ${m} | ${num(A.conservador[i])} | ${num(A.moderado[i])} | ${num(A.otimista[i])} |`).join('\n')}\n\n## Com a estratégia ganha-pão somada (cenário B)\n\n| Mês | Conservador | Moderado | Otimista |\n|---|---|---|---|\n${meses.map((m, i) => `| ${m} | ${num(B.conservador[i])} | ${num(B.moderado[i])} | ${num(B.otimista[i])} |`).join('\n')}\n\n**No último mês:** A = ${num(A.conservador.at(-1))} / ${num(A.moderado.at(-1))} / ${num(A.otimista.at(-1))} visitas; B = ${num(B.conservador.at(-1))} / ${num(B.moderado.at(-1))} / ${num(B.otimista.at(-1))}.\n\n## Comparação com a conta do GPT\nO GPT usou 200 buscas por termo e CTR de 20% em todos (ex.: 50 artigos = 2.000 visitas/mês). Isso supõe top 3 em TODOS os termos e ignora o tempo de maturação. Nossa conta usa os volumes reais, a chance de ranquear e três cenários.\n`;
fs.writeFileSync(path.join(raiz, 'data/conteudo/PROJECAO-TRAFEGO.md'), md);
console.log(md.split('\n').slice(8, 40).join('\n'));
