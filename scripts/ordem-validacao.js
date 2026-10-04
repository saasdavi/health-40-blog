// Ordem de validação: usa TODAS as palavras do banco, agrupa variações sob a frase-mãe e ordena do melhor ao pior.
//   node scripts/ordem-validacao.js [--top 60]
// Frase-mãe = palavra de maior volume cujos termos estão todos contidos na variação ("ereção matinal" -> "ereção matinal sumiu").
// Grupo = mãe + variações (somadas). Grupos de competição ALTA valem 30% na ordenação (provável loja no topo do Google), mas não são excluídos. Só 'filtrada' (compra/fora do assunto) fica de fora; sensível, amplo e competição HIGH entram marcados na coluna Atenção; 'fila'/'absorvida' já têm destino.
// Saída: data/pesquisa/ordem-de-validacao.json e .md (o que validar primeiro no Google).
import fs from 'fs';
import { tratamento, classificar } from './filtros.js';

const TOP = Number(process.argv[process.argv.indexOf('--top') + 1]) || 60;
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'e', 'em', 'na', 'no', 'para', 'por', 'um', 'uma', 'que', 'com', 'as', 'os']);
const termos = (t) => new Set(norm(t).split(' ').filter((w) => w.length > 1 && !STOP.has(w)));
const { palavras } = JSON.parse(fs.readFileSync('data/pesquisa/banco-de-palavras.json', 'utf8'));
const ambiguas = new Set(JSON.parse(fs.readFileSync('data/pesquisa/filtros.json', 'utf8')).cabecasAmbiguas.map(norm));
const kws = JSON.parse(fs.readFileSync('data/keywords-validated.json', 'utf8')).keywords;
// já têm destino: a pauta em si e as palavras de apoio (secundarias) dela
const fila = new Set(kws.flatMap((k) => [norm(k.keyword), ...(k.secundarias || []).map((s) => norm(s.palavra))]));

const uteis = palavras.filter((p) => ['banco', 'candidata'].includes(p.status) && tratamento(p.palavra) !== 'excluir' && p.volume > 0)
  .sort((a, b) => b.volume - a.volume || a.palavra.length - b.palavra.length);
const maes = [];
const marcas = (m) => [ambiguas.has(norm(m.palavra)) ? 'amplo' : '', classificar(m.palavra) ? 'sensível:' + classificar(m.palavra) : '', m.competicao === 'HIGH' ? 'comp. alta' : ''].filter(Boolean).join(', ');
let semGrupo = 0;
for (const p of uteis) {
  const T = termos(p.palavra);
  const mae = maes.find((m) => [...m.T].every((w) => T.has(w)));
  if (mae) { mae.variacoes.push({ palavra: p.palavra, volume: p.volume }); mae.soma += p.volume; }
  else maes.push({ palavra: p.palavra, T, volume: p.volume, soma: p.volume, categoria: p.categoria, status: p.status, competicao: p.competicao, variacoes: [] });
}
const ordem = maes.filter((m) => !fila.has(norm(m.palavra)))
  .sort((a, b) => (b.soma * (b.competicao === 'HIGH' ? 0.3 : 1)) - (a.soma * (a.competicao === 'HIGH' ? 0.3 : 1)))
  .map((m, i) => ({ ordem: i + 1, frase: m.palavra, volumeFrase: m.volume, volumeGrupo: m.soma, variacoes: m.variacoes.length, categoria: m.categoria, status: m.status, atencao: marcas(m), topVariacoes: m.variacoes.slice(0, 5).map((v) => v.palavra) }));
fs.writeFileSync('data/pesquisa/ordem-de-validacao.json', JSON.stringify({ gerado: new Date().toISOString().slice(0, 10), palavrasUsadas: uteis.length, grupos: ordem.length, ordem }, null, 1));
const md = [`# Ordem de validação (melhores primeiro)`, ``, `Gerado de ${uteis.length} palavras úteis do banco (só ficam de fora intenção de compra e fora do assunto; sensível, amplo e competição alta entram marcados), em ${ordem.length} grupos. Valide no Google de cima para baixo.`, ``,
  `| # | Frase-mãe | Volume do grupo | Variações | Categoria | Atenção |`, `|---|---|---|---|---|---|`, ...ordem.slice(0, 200).map((o) => `| ${o.ordem} | ${o.frase} | ${o.volumeGrupo} | ${o.variacoes} | ${o.categoria} | ${o.atencao} |`)].join('\n');
fs.writeFileSync('data/pesquisa/ordem-de-validacao.md', md + '\n');
console.log(`${uteis.length} palavras úteis -> ${ordem.length} grupos`);
ordem.slice(0, TOP).forEach((o) => console.log(`${String(o.ordem).padStart(3)}. ${o.volumeGrupo}\t(${o.variacoes} var.)\t${o.categoria}\t${o.frase}${o.atencao ? '  [' + o.atencao + ']' : ''}`));
