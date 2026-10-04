// Troca o endereço do site em TODOS os lugares onde ele está escrito (canonical, sitemap, robots, schema, scripts).
//   node scripts/trocar-dominio.js https://seudominio.com.br            só mostra o que mudaria (padrão)
//   node scripts/trocar-dominio.js https://seudominio.com.br --aplicar  aplica e regenera o sitemap
// O endereço antigo é lido de SITE.url em src/config/site.ts. Use o endereço FINAL (https, sem "www" se for o canônico, sem barra no fim).
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const novo = (process.argv[2] || '').replace(/\/+$/, '');
const aplicar = process.argv.includes('--aplicar');
if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(novo)) { console.error('uso: node scripts/trocar-dominio.js https://seudominio.com.br [--aplicar]'); process.exit(1); }

const site = fs.readFileSync('src/config/site.ts', 'utf8');
const antigo = (site.match(/url:\s*'(https:\/\/[^']+)'/) || [])[1];
if (!antigo) { console.error('não achei SITE.url em src/config/site.ts'); process.exit(1); }
if (antigo === novo) { console.log('o site já usa esse endereço.'); process.exit(0); }

const IGNORAR = new Set(['node_modules', 'dist', '.git', '.astro', 'archive']);
const EXT = /\.(astro|ts|js|mjs|json|md|xml|txt|yml|yaml)$/;
const alvos = [];
(function varrer(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORAR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) varrer(p);
    else if (EXT.test(e.name) && e.name !== 'package-lock.json') {
      const t = fs.readFileSync(p, 'utf8');
      const n = t.split(antigo).length - 1;
      if (n) alvos.push({ p, n, t });
    }
  }
})('.');

console.log(`${antigo}  ->  ${novo}`);
for (const a of alvos) console.log(`${String(a.n).padStart(3)}x  ${a.p}`);
console.log(`${alvos.reduce((s, a) => s + a.n, 0)} ocorrência(s) em ${alvos.length} arquivo(s).`);
if (!aplicar) { console.log('\n(simulação: nada foi alterado; rode de novo com --aplicar)'); process.exit(0); }

for (const a of alvos) fs.writeFileSync(a.p, a.t.split(antigo).join(novo));
try { execSync('node scripts/generate-sitemap.js', { stdio: 'inherit' }); } catch { console.log('(não consegui regenerar o sitemap; ele é refeito no próximo build)'); }
console.log(`\nPronto. Próximos passos: commit + push; no Vercel defina ${novo.replace('https://', '')} como domínio principal; no Search Console envie ${novo}/sitemap.xml.`);
