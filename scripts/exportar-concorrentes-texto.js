// Junta o texto dos concorrentes (guardado pelo coletor em .cache/serp/) numa planilha para subir no Google Sheets e a IA ler.
// Saída: .cache/concorrentes-texto.csv  (1 linha por concorrente; texto cortado em 45.000 caracteres, limite do Sheets = 50.000)
// Uso: node scripts/exportar-concorrentes-texto.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = path.join(raiz, '.cache', 'serp');
const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const lerJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const linhas = [['palavra_chave', 'posicao', 'site', 'url', 'palavras', 'h2', 'imagens_com_alt', 'palavra_chave_no_titulo', 'usos_da_palavra_chave', 'texto_do_artigo'].map(q).join(';')];
let n = 0;
if (fs.existsSync(base)) {
  for (const slug of fs.readdirSync(base).sort()) {
    const dir = path.join(base, slug); if (!fs.statSync(dir).isDirectory()) continue;
    const meta = lerJson(path.join(raiz, 'data/pesquisa/concorrentes', `${slug}.json`));
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.txt')).sort()) {
      const pos = parseInt(f, 10); const p = meta?.paginas?.[pos - 1];
      const texto = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\s*\n\s*/g, ' ¶ ').slice(0, 45000);
      linhas.push([meta?.keyword || slug, pos, p?.host || f.replace(/^\d+-|\.txt$/g, ''), p?.url || '', p?.palavras ?? '', p?.h2 ?? '', p ? `${p.imagensComAlt}/${p.imagens}` : '', p?.kwNoTitulo == null ? '' : p.kwNoTitulo ? 'sim' : 'nao', p?.kwUsos ?? '', texto].map(q).join(';')); n++;
    }
  }
}
fs.writeFileSync(path.join(raiz, '.cache', 'concorrentes-texto.csv'), '﻿' + linhas.join('\r\n'));
console.log(`📄 ${n} página(s) em .cache/concorrentes-texto.csv (suba no Google Sheets; o texto de cada concorrente fica numa célula)`);
