// Gera a tabela do calendário de artigos: publicados, prontos para publicação futura e que precisam de revisão.
// Datas = ordem real da fila do robô (3/dia, a partir do próximo dia sem publicação). Saída: data/conteudo/CALENDARIO-ARTIGOS.md e .csv
//   node scripts/calendario-artigos.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ArticleRobot from './article-robot.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const robot = new ArticleRobot();
const arts = robot.db.articles;
const POR_DIA = 3;
const sens = (a) => (a.scores?.atencao || []).some((m) => m.includes('sensível'));
const precisaRevisar = (a) => (a.scores?.total ?? 0) < 90 || sens(a);
const motivo = (a) => {
  const m = a.scores?.atencao || [], c = [];
  if (sens(a)) c.push('tema sensível sem REVISADO');
  if ((a.scores?.total ?? 0) < 90) {
    if (m.some((t) => t.includes('demanda NÃO medida'))) c.push('demanda não medida');
    else if (m.some((t) => t.includes('demanda baixa'))) c.push('demanda baixa');
    if (m.some((t) => t.includes('canibalização'))) c.push('parecido com outro artigo');
    if (m.some((t) => t.includes('imagem(ns)'))) c.push('faltam imagens');
    if (!c.length) c.push(`nota ${a.scores?.total} abaixo de 90`);
  }
  return c.join('; ');
};
const brt = (d) => new Date(d.getTime() - 3 * 3600 * 1000);
const dia = (d) => brt(d).toISOString().slice(0, 10);
const br = (iso) => iso.split('-').reverse().join('/');
const esc = (s) => String(s ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();

const publicados = arts.filter((a) => a.status === 'published').sort((x, y) => x.publishedAt.localeCompare(y.publishedAt));
const fila = robot.prontosNoEstoque(); // ordem real em que o robô publica
const foraFila = arts.filter((a) => a.estoque && a.status === 'draft' && !fila.includes(a));
const hojeIso = dia(new Date());
const hoje = publicados.filter((a) => dia(new Date(a.publishedAt)) === hojeIso).length;
// primeiro dia com vaga: hoje se ainda cabe, senão amanhã
const d0 = new Date(hojeIso + 'T12:00:00Z'); if (hoje >= POR_DIA) d0.setUTCDate(d0.getUTCDate() + 1);
const data = (i) => { const d = new Date(d0); d.setUTCDate(d.getUTCDate() + Math.floor((i + (hoje >= POR_DIA ? 0 : hoje)) / POR_DIA)); return d.toISOString().slice(0, 10); };
const plano = fila.map((a, i) => ({ a, dia: data(i), n: i + 1 }));
const prontos = plano.filter((x) => !precisaRevisar(x.a));
const revisar = plano.filter((x) => precisaRevisar(x.a));

const L = [];
L.push('# Calendário de artigos', '', `Gerado por \`scripts/calendario-artigos.js\` em ${br(hojeIso)}. O robô publica ${POR_DIA}/dia, na ordem da fila abaixo (coluna **Nº**).`, '',
  `| Situação | Artigos |`, '|---|---|', `| Publicados | ${publicados.length} |`, `| Prontos para publicação futura (nota 90+, sem revisão pendente) | ${prontos.length} |`,
  `| Precisam de revisão (nota abaixo de 90 ou tema sensível sem REVISADO) | ${revisar.length + foraFila.length} |`, '',
  `**Atenção:** a regra atual do robô publica também os artigos da tabela 3 quando chegar a vez deles (coluna "Data prevista"). Para evitar, revisar antes dessa data ou pedir para o robô pular esses artigos.`, '',
  `## 1. Artigos publicados (${publicados.length})`, '', '| Data | Artigo | Nota |', '|---|---|---|',
  ...publicados.map((a) => `| ${br(dia(new Date(a.publishedAt)))} | ${esc(a.title)} (\`/${a.slug}/\`) | ${a.scores?.total ?? a.scores?.auditoria ?? '—'} |`), '',
  `## 2. Prontos para publicação futura (${prontos.length})`, '', '| Nº | Data prevista | Artigo | Palavra-chave | Nota |', '|---|---|---|---|---|',
  ...prontos.map((x) => `| ${x.n} | ${br(x.dia)} | ${esc(x.a.title)} (\`/${x.a.slug}/\`) | ${esc(x.a.primaryKeyword)} | ${x.a.scores.total} |`), '',
  `## 3. Precisam de revisão (${revisar.length + foraFila.length})`, '', '| Nº | Data prevista se ninguém revisar | Artigo | Palavra-chave | Nota | Motivo |', '|---|---|---|---|---|---|',
  ...revisar.map((x) => `| ${x.n} | ${br(x.dia)} | ${esc(x.a.title)} (\`/${x.a.slug}/\`) | ${esc(x.a.primaryKeyword)} | ${x.a.scores.total} | ${motivo(x.a)} |`),
  ...foraFila.map((a) => `| — | fora da fila | ${esc(a.title)} (\`/${a.slug}/\`) | ${esc(a.primaryKeyword)} | ${a.scores?.total ?? a.scores?.auditoria ?? '—'} | auditoria ${a.scores?.auditoria} (precisa de mais de 85 para entrar na fila) |`), '');
fs.writeFileSync(path.join(raiz, 'data/conteudo/CALENDARIO-ARTIGOS.md'), L.join('\n'));

const csv = [['situacao', 'n_fila', 'data', 'titulo', 'slug', 'palavra_chave', 'nota', 'motivo']];
for (const a of publicados) csv.push(['publicado', '', dia(new Date(a.publishedAt)), a.title, a.slug, a.primaryKeyword, a.scores?.total ?? '', '']);
for (const x of prontos) csv.push(['pronto', x.n, x.dia, x.a.title, x.a.slug, x.a.primaryKeyword, x.a.scores.total, '']);
for (const x of revisar) csv.push(['revisar', x.n, x.dia, x.a.title, x.a.slug, x.a.primaryKeyword, x.a.scores.total, motivo(x.a)]);
for (const a of foraFila) csv.push(['revisar', '', '', a.title, a.slug, a.primaryKeyword, a.scores?.total ?? '', `auditoria ${a.scores?.auditoria}`]);
fs.writeFileSync(path.join(raiz, 'data/conteudo/calendario-artigos.csv'), '﻿' + csv.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n') + '\n');
console.log(`publicados ${publicados.length} | prontos ${prontos.length} | revisar ${revisar.length + foraFila.length} (fora da fila ${foraFila.length}) | último dia da fila ${plano.at(-1)?.dia}`);
