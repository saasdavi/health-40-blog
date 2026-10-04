// Gera MUITAS frases de cauda longa a partir dos temas (subcategorias) para medir volume em lote.
//   node scripts/gerar-massa.js [--etapa 1|2] [--alvo 100000] [--categoria nome] [--saida data/pesquisa/entrada.txt]
// ETAPA 1 (padrão): formas simples de cada tema (≈60 por tema). Medir volume, ingerir no banco.
// ETAPA 2: só para os temas que a etapa 1 provou ter demanda (volume >= 1.000 no banco): combina situação × intenção.
// Peneira em duas etapas = não gasta crédito com combinações de temas sem demanda.
// Forma de cada frase:  tema | tema + situação | tema + intenção | tema + situação + intenção | intenções da categoria
// A grande maioria terá volume zero (é esperado: o teste de volume separa as que existem).
import fs from 'fs';

const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const ALVO = Number(opt('--alvo', 100000));
const CAT = opt('--categoria');
const SAIDA = opt('--saida', 'data/pesquisa/entrada.txt');
const ETAPA = Number(opt('--etapa', 1));
const TODOS = args.includes('--todos'); // etapa 2 sem o filtro de demanda (para medir de graça no Planejador)

const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const COMERCIAL = /\b(comprar|preco|onde comprar|melhor marca|promocao|cupom|kit|capsulas?|comprimidos?|suplemento|creatina|whey|termogenico|quelato|remedio|medicamento|shampoo|creme|serum)\b/;

const cfg = JSON.parse(fs.readFileSync('data/pesquisa/ingredientes.json', 'utf8'));
const INTENCOES = ['causas', 'sintomas', 'tratamento', 'o que fazer', 'é normal', 'é grave', 'tem cura', 'exames', 'o que comer', 'exercícios', 'quando procurar médico', 'como aliviar', 'como prevenir', 'diferença entre', 'mito ou verdade', 'em casa'];
const SITUACOES = ['em mulheres', 'em homens', 'em idosos', 'depois dos 40', 'depois dos 50', 'depois dos 60', 'na menopausa', 'à noite', 'pela manhã', 'ao acordar', 'no inverno', 'no calor', 'após comer', 'ao fazer exercício', 'ao deitar', 'ao levantar', 'com estresse', 'com ansiedade', 'com diabetes', 'com pressão alta', 'em jejum', 'de repente', 'todo dia', 'sem causa aparente', 'hereditário', 'em jovens'];
const PREFIXOS = ['o que é', 'por que', 'como saber se é', 'qual médico para', 'quanto tempo dura', 'pode ser'];

const porTema = [];
for (const [cat, temas] of Object.entries(cfg.categorias)) {
  if (CAT && cat !== CAT) continue;
  for (const t of temas) porTema.push({ cat, t });
}
let temasValidos = null;
if (ETAPA === 2 && !TODOS) {
  const banco = new Map(JSON.parse(fs.readFileSync('data/pesquisa/banco-de-palavras.json', 'utf8')).palavras.map((p) => [norm(p.palavra), p.volume]));
  temasValidos = new Set(porTema.filter(({ t }) => (banco.get(norm(t)) || 0) >= 1000).map(({ t }) => t));
}
const alvoPorTema = Math.max(20, Math.floor(ALVO / Math.max(1, porTema.length)));

const todas = new Map(); // forma normalizada (sem acento) -> frase original COM acentos
for (const { cat, t } of porTema) {
  if (ETAPA === 2 && !TODOS && !temasValidos.has(t)) continue;
  const f = [];
  if (ETAPA === 1) {
    f.push(t);
    for (const m of cfg.intencoesPorCategoria?.[cat] || []) f.push(m.replace('{t}', t));
    for (const p of PREFIXOS) f.push(`${p} ${t}`);
    for (const s of SITUACOES) f.push(`${t} ${s}`);
    for (const i of INTENCOES) f.push(`${t} ${i}`);
  } else {
    for (const s of SITUACOES) for (const i of INTENCOES) f.push(`${t} ${s} ${i}`);
  }
  // se passar do orçamento do tema, mantém as formas mais simples primeiro (ordem acima) e corta o resto
  let n = 0;
  for (const frase of f) {
    const k = norm(frase);
    if (k.length > 80 || COMERCIAL.test(k) || todas.has(k)) continue;
    todas.set(k, frase.replace(/\s+/g, ' ').trim());
    if (++n >= alvoPorTema) break;
  }
}
const lista = [...todas.values()];
fs.mkdirSync('data/pesquisa', { recursive: true });
fs.writeFileSync(SAIDA, lista.join('\n') + '\n');
console.log(`etapa ${ETAPA}: ${ETAPA === 2 && !TODOS ? temasValidos.size + ' temas com demanda' : porTema.length + ' temas'} -> ${lista.length} frases únicas em ${SAIDA} (≈${alvoPorTema} por tema). Créditos estimados para medir: ${lista.length}.`);
