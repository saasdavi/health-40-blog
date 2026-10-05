// Validação palavra por palavra (sem API): cruza o CSV do Planejador (faixas) com o resultado exato do HYPD.
// Uso: node scripts/validar-planilha.js --tema cabelo --csv <planilha.csv> --hypd <resultado-hypd.json>
// Grava data/pesquisa/validadas/<tema>.json e data/pesquisa/validadas/<tema>-melhores.md
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
const tema = arg('tema'), csvF = arg('csv'), hypdF = arg('hypd');
if (!tema || !hypdF) { console.error('uso: --tema <nome> [--csv planilha.csv] --hypd resultado.json'); process.exit(1); }

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ESTETICA = /\b(corte|cortes|penteados?|tintura|coloracao|loiro|loira|morena|ruivo|ruiva|mechas|luzes|franja|tranca|trancas|cacheado|cacheada|cachos?|alisamento|progressiva|escova|balayage|platinado|perucas?|apliques?|megahair|presilhas?|extensao|coques?|rabo de cavalo)\b/;
const SENSIVEL = /\b(minoxidil|isotretinoina|tretinoina|hidroquinona|quimioterapia|anticoncepcional|cancer|melanoma|ozempic|mounjaro|semaglutida|finasterida|dutasterida|medicamento|remedio)\b/;
const COMERCIAL = /\b(comprar|preco|melhor shampoo|melhor mascara|promocao|cupom|kit)\b/;

const faixas = {};
if (csvF) {
  const linhas = fs.readFileSync(csvF, 'utf8').replace(/^﻿/, '').split(/\r?\n/);
  for (const l of linhas.slice(3)) {
    const c = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g); if (!c) continue;
    const p = l.split(','); const k = p[0]; const v = parseInt(String(p[3]).replace(/\..*/, ''), 10);
    if (k && !isNaN(v)) faixas[k] = v;
  }
}
const d = JSON.parse(fs.readFileSync(hypdF, 'utf8')).result;
const linhas = d.rows.map((r) => {
  const m = (r.monthly_searches || []).map((x) => x.search_volume || 0);
  const ini = m.slice(0, 3).reduce((a, b) => a + b, 0), fim = m.slice(-3).reduce((a, b) => a + b, 0);
  const tend = !m.length ? 'sem dado' : fim > ini * 1.3 ? 'subindo' : fim < ini * 0.7 ? 'caindo' : 'estável';
  const exato = r.search_volume, k = r.keyword, n = norm(k), plan = faixas[k] ?? null;
  const inten = ESTETICA.test(n) ? 'estética' : COMERCIAL.test(n) ? 'comercial' : 'informativa';
  const conc = r.competition || null;
  let decisao;
  if (exato == null) decisao = 'satélite (sem dado: demanda oculta, agrupar na pauta-mãe)';
  else if (inten === 'estética') decisao = 'guardar';
  else if (SENSIVEL.test(n)) decisao = exato >= 1000 ? 'revisar (sensível)' : 'satélite';
  else if (exato < 1000) decisao = 'satélite';
  else decisao = conc === 'HIGH' ? 'ângulo (concorrência alta)' : 'pauta';
  return { frase: k, planilha: plan, exato, concorrencia: conc, tendencia: tend, intencao: inten, decisao, inflada: plan && exato != null && plan >= 5 * Math.max(exato, 1) };
}).sort((a, b) => (b.exato || 0) - (a.exato || 0));

const dir = path.join(raiz, 'data/pesquisa/validadas'); fs.mkdirSync(dir, { recursive: true });
const hoje = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(dir, `${tema}.json`), JSON.stringify({ tema, data: hoje, total: linhas.length, linhas }, null, 1));
const num = (n) => (n == null ? '—' : Number(n).toLocaleString('pt-BR'));
const bloco = (t, f) => { const x = linhas.filter(f); return x.length ? `## ${t} (${x.length})\n\n| Frase | Exato | Planilha | Concorrência | Tendência |\n|---|---|---|---|---|\n${x.slice(0, 60).map((l) => `| ${l.frase} | ${num(l.exato)} | ${num(l.planilha)}${l.inflada ? ' ⚠ inflada' : ''} | ${l.concorrencia || '—'} | ${l.tendencia} |`).join('\n')}\n\n` : ''; };
let md = `# ${tema}: ranking pelo volume exato (${hoje})\n\nValidação palavra por palavra: cada frase medida no HYPD (Planejador do Google); a planilha traz só faixas. Gerado por \`scripts/validar-planilha.js\`.\n\n`;
md += bloco('Pautas (≥ 1.000, concorrência baixa/média)', (l) => l.decisao === 'pauta');
md += bloco('Ângulo de cauda longa (concorrência alta)', (l) => l.decisao.startsWith('ângulo'));
md += bloco('Revisão humana (sensível)', (l) => l.decisao.startsWith('revisar'));
md += bloco('Satélites (agrupar na pauta-mãe)', (l) => l.decisao.startsWith('satélite') && l.exato != null && l.exato >= 100);
md += `\nSem dado: ${linhas.filter((l) => l.exato == null).length} | Estética (guardadas): ${linhas.filter((l) => l.intencao === 'estética').length} | Infladas na planilha (≥5x): ${linhas.filter((l) => l.inflada).length}\n`;
fs.writeFileSync(path.join(dir, `${tema}-melhores.md`), md);
console.log(`${tema}: ${linhas.length} frases | pautas ${linhas.filter((l) => l.decisao === 'pauta').length} | ângulo ${linhas.filter((l) => l.decisao.startsWith('ângulo')).length} | revisar ${linhas.filter((l) => l.decisao.startsWith('revisar')).length} | infladas ${linhas.filter((l) => l.inflada).length}`);
