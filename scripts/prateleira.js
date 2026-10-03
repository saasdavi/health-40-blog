// Prateleira de ouro: mostra quantas pautas validadas estão livres e por quantos dias duram.
import fs from 'fs';

const POR_DIA = 3;
const MINIMO_DIAS = 5;
const lerJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const palavras = lerJson('data/keywords-validated.json').keywords;
const artigos = lerJson('data/articles.json');
const artigosLista = Array.isArray(artigos) ? artigos : artigos.articles || [];
const usados = new Set();
for (const a of artigosLista) {
  if (a.status === 'draft') continue;
  usados.add((a.primaryKeyword || '').toLowerCase());
  usados.add(a.slug);
}
const slugify = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const livres = palavras.filter((p) => p.serp?.facil === true && (p.fontes || []).length >= 2 && !p.substitui && !usados.has(p.keyword.toLowerCase()) && !usados.has(slugify(p.keyword)));
const candidatas = fs.existsSync('data/prateleira-candidatas.json') ? lerJson('data/prateleira-candidatas.json').candidatas.length : 0;
const dias = Math.floor(livres.length / POR_DIA);

const linhas = [
  `## Prateleira de ouro`,
  `- Pautas validadas livres: **${livres.length}** (≈ ${dias} dias a ${POR_DIA}/dia)`,
  `- Candidatas com volume, aguardando SERP/fontes: ${candidatas}`,
  ...livres.slice(0, 12).map((p) => `  - ${p.keyword} (${p.volume})`),
];
if (dias < MINIMO_DIAS) linhas.push(`\n⚠️ Fila abaixo de ${MINIMO_DIAS} dias: validar mais palavras (SERP + fontes) para repor.`);

console.log(linhas.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, linhas.join('\n') + '\n');
if (dias < MINIMO_DIAS) console.log('::warning::Prateleira de ouro baixa: restam ' + livres.length + ' pautas');
