// Mapa de temas do blog (sem API): classifica pautas e artigos pelos temas de data/temas-regras.json,
// grava o campo "tema" em data/pesquisa/ordem-de-validacao.json e gera:
//   data/pesquisa/mapa-de-temas.md          (cobertura por tema: no ar, estoque, pautas, demanda a validar)
//   data/pesquisa/por-tema/<tema>.md        (as melhores pautas de cada tema para escrever)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ler = (f) => JSON.parse(fs.readFileSync(path.join(raiz, f), 'utf8'));
const { temas, regras } = ler('data/temas-regras.json');
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const regs = regras.map((r) => ({ tema: r.tema, re: new RegExp(norm(r.padrao)) }));
export const classificar = (texto) => (regs.find((r) => r.re.test(norm(texto))) || { tema: 'saude-geral' }).tema;

const ordemArq = path.join(raiz, 'data/pesquisa/ordem-de-validacao.json');
const ordemDados = JSON.parse(fs.readFileSync(ordemArq, 'utf8'));
for (const g of ordemDados.ordem) g.tema = classificar(g.frase);
fs.writeFileSync(ordemArq, JSON.stringify(ordemDados, null, 2));

const artigos = ler('data/articles.json').articles;
const validadas = (() => { const k = ler('data/keywords-validated.json'); return k.keywords || k; })();
const noAr = (a) => a.status === 'published';
const estoque = (a) => a.status === 'draft' && a.estoque;
const porTema = Object.fromEntries(temas.map((t) => [t.slug, { ...t, ar: 0, est: 0, pautas: [], grupos: [], vol: 0 }]));
for (const a of artigos) { const t = porTema[classificar(`${a.primaryKeyword} ${a.title}`)]; if (noAr(a)) t.ar++; else if (estoque(a)) t.est++; }
const jaTem = new Set(artigos.map((a) => norm(a.primaryKeyword)));
for (const k of validadas) if (!jaTem.has(norm(k.keyword))) porTema[classificar(k.keyword)].pautas.push(k);
let comAtencao = 0, volAtencao = 0;
for (const g of ordemDados.ordem) { if (g.atencao) { comAtencao++; volAtencao += g.volumeGrupo || 0; continue; } const t = porTema[g.tema]; t.grupos.push(g); t.vol += g.volumeGrupo || 0; }

const num = (n) => Number(n).toLocaleString('pt-BR');
const linhas = Object.values(porTema).sort((a, b) => b.vol - a.vol);
let md = `# Mapa de temas do blog\n\nGerado por \`node scripts/mapear-categorias.js\`. Regras em \`data/temas-regras.json\`.\n\n| Tema | No ar | Estoque | Pautas validadas sem texto | Grupos limpos a validar | Buscas/mês a validar |\n|---|---|---|---|---|---|\n`;
for (const t of linhas) md += `| ${t.nome} | ${t.ar} | ${t.est} | ${t.pautas.length} | ${t.grupos.length} | ${num(t.vol)} |\n`;
md += `\n## Lacunas (muita demanda, pouco conteúdo)\n\n`;
for (const t of linhas.filter((x) => x.vol > 50000 && x.ar + x.est < 6)) md += `- **${t.nome}**: ${num(t.vol)} buscas/mês a validar e só ${t.ar + t.est} artigos.\n`;
fs.writeFileSync(path.join(raiz, 'data/pesquisa/mapa-de-temas.md'), md);

fs.mkdirSync(path.join(raiz, 'data/pesquisa/por-tema'), { recursive: true });
for (const t of linhas) {
  let m = `# ${t.nome}\n\n${t.descricao}\n\nNo ar: ${t.ar} | Estoque: ${t.est} | Pautas validadas sem texto: ${t.pautas.length}\n\n`;
  if (t.pautas.length) m += `## Pautas já validadas (prontas para escrever)\n\n${t.pautas.map((k) => `- ${k.keyword} (${num(k.volume)}/mês)${k.sensivel ? ' [sensível]' : ''}`).join('\n')}\n\n`;
  const top = t.grupos.filter((g) => !jaTem.has(norm(g.frase))).slice(0, 15);
  if (top.length) m += `## Melhores grupos ainda a validar no Google\n\n${top.map((g) => `- ${g.frase} (${num(g.volumeGrupo)}/mês)${g.atencao ? ` [atenção: ${g.atencao}]` : ''}`).join('\n')}\n`;
  fs.writeFileSync(path.join(raiz, `data/pesquisa/por-tema/${t.slug}.md`), m);
}
const semTema = porTema['saude-geral'].grupos.length;
md += `\n## Fora da conta\n\n${comAtencao} grupos (${num(volAtencao)} buscas/mês) têm marca de atenção (suplemento, remédio, marca, tema amplo, sensível ou concorrência alta) e não entram nas tabelas acima nem nas listas por tema.\n`;
fs.writeFileSync(path.join(raiz, 'data/pesquisa/mapa-de-temas.md'), md);
console.log(`Temas: ${temas.length} | grupos limpos: ${ordemDados.ordem.length - comAtencao} | com atenção (fora): ${comAtencao} | em "Saúde geral": ${semTema}`);
