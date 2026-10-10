// Junta TODA a demanda já validada (HYPD/Planejador) num só arquivo consultável.
// Fontes: validadas/*.json, *-volumes.json (pele, sono, suplementos, cabelo), keywords-validated.json.
// Saídas: data/pesquisa/demanda-validada.json e data/pesquisa/DEMANDA-VALIDADA.md
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { norm } from './demanda-lib.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ler = (f, def = null) => { try { return JSON.parse(fs.readFileSync(path.join(raiz, f), 'utf8')); } catch { return def; } };
const chave = (s) => norm(s).split(' ').sort().join(' ');
const sa = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const { regras } = ler('data/temas-regras.json', { regras: [] });
const regs = regras.map((r) => ({ tema: r.tema, re: new RegExp(sa(r.padrao)) }));
const classificar = (t) => (regs.find((r) => r.re.test(sa(t))) || { tema: 'saude-geral' }).tema;
const RUIDO = /\b(cafeteira|expresso|starbucks|restaurante|delivery|comprar|preco|loja|marca|mercado|bolo|torta|panela|fritadeira|liquidificador|balanca|garrafa|copo|aquario|perto de mim|proximo|distribuidora|dolce gusto|capsulas?|churrasco|picanha|acougue|bife|alcatra|costela|download|baixar|aplicativo|curso|clinica|farmacia|morena|loiro|loira|ruivo|trancas?|corte|cortes|penteados?|tintura|coloracao|cabelo (preto|azul|roxo|rosa|verde|vermelho|marsala|acaju|prata|borgonha)|ombre|sombre|coque|rabo de cavalo|nutricionista em|dia mundial|aniversario|dia das maes|educacao infantil|melissa|whey)\b/;
const itens = {};
const add = (frase, volume, comp, tend, fonte) => {
  if (!frase || volume == null) return;
  const k = chave(frase); if (!k) return;
  if (!itens[k] || volume > itens[k].volume) itens[k] = { frase, volume, concorrencia: comp || null, tendencia: tend || null, tema: classificar(frase), fonte };
};
for (const f of fs.readdirSync(path.join(raiz, 'data/pesquisa/validadas')).filter((x) => x.endsWith('.json'))) {
  const j = ler(`data/pesquisa/validadas/${f}`); for (const l of j?.linhas || []) add(l.frase, l.exato, l.concorrencia, l.tendencia, `validadas/${f}`);
}
for (const f of ['pele', 'sono', 'suplementos']) for (const r of ler(`data/pesquisa/${f}-volumes.json`, [])) add(r.k, r.v, r.c, null, `${f}-volumes.json`);
for (const r of ler('data/pesquisa/queda-de-cabelo-ideias-hypd.json', [])) add(r.k, r.v, r.c, null, 'queda-de-cabelo-ideias-hypd.json');
// Planilhas do Planejador de Palavras-chave já no repositório (data/conteudo): palavra-chave + long tails com volume.
const csv = (f) => { try { const [h, ...ls] = fs.readFileSync(path.join(raiz, f), 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean); const cols = h.split(';').map((c) => c.replace(/"/g, '')); return ls.map((l) => { const v = l.split(';').map((c) => c.replace(/^"|"$/g, '')); return Object.fromEntries(cols.map((c, i) => [c, v[i]])); }); } catch { return []; } };
for (const r of csv('data/conteudo/pautas-mestre.csv')) {
  const v = parseInt(r.buscas_mes_exato, 10); if (!isNaN(v)) add(r.palavra_chave, v, r.concorrencia_ads, r.tendencia, 'conteudo/pautas-mestre.csv');
  for (const m of String(r.long_tails_com_volume || '').split(' | ')) { const x = m.match(/^(.*) \((\d+)\)$/); if (x) add(x[1], parseInt(x[2], 10), null, null, 'conteudo/pautas-mestre.csv (long tail)'); }
}
for (const r of csv('data/conteudo/calendario-12-meses.csv')) { const v = parseInt(r.buscas_mes_cabeca, 10); if (!isNaN(v) && r.palavra_chave) add(r.palavra_chave, v, null, null, 'conteudo/calendario-12-meses.csv'); }
const kv = ler('data/keywords-validated.json', []); for (const k of kv.keywords || kv) add(k.keyword, k.volume, k.competition, null, 'keywords-validated.json');
fs.writeFileSync(path.join(raiz, 'data/pesquisa/demanda-validada.json'), JSON.stringify({ gerado: new Date().toISOString().slice(0, 10), total: Object.keys(itens).length, itens }, null, 0));

// relatório: pautas com demanda ≥ 1.000 e sem artigo, por tema
const artigos = ler('data/articles.json', { articles: [] }).articles;
const tem = (frase) => artigos.some((a) => { const k = chave(frase), p = chave(a.primaryKeyword || ''); return k === p || norm(a.primaryKeyword || '').includes(norm(frase)) || norm(frase).includes(norm(a.primaryKeyword || 'zzzz')); });
const temas = Object.fromEntries((ler('data/temas-regras.json', { temas: [] }).temas).map((t) => [t.slug, t.nome]));
const num = (n) => Number(n).toLocaleString('pt-BR');
const SENS = /\b(minoxidil|isotretino|tretino|hidroquinona|ozempic|mounjaro|wegovy|semaglut|tirzepat|finasterid|dutasterid|melatonin|antidepress|cancer|melanoma|quimio)\b/;
const por = {};
for (const e of Object.values(itens)) if (e.volume >= 1000 && !RUIDO.test(sa(e.frase)) && !tem(e.frase)) (por[e.tema] ||= []).push(e);
let md = `# Demanda validada (gerado por scripts/consolidar-demanda.js em ${new Date().toISOString().slice(0, 10)})\n\n${Object.keys(itens).length} frases com volume exato (HYPD/Planejador). Use para escolher pautas e para pontuar artigos novos (o importador consulta este arquivo).\nLegenda: ↑ subindo, ↓ caindo, H concorrência alta, ⚠ sensível (revisão humana).\n\n`;
for (const [t, l] of Object.entries(por).sort((a, b) => b[1].length - a[1].length)) {
  l.sort((a, b) => b.volume - a.volume);
  md += `## ${temas[t] || t} (${l.length} frases ≥ 1.000, sem artigo)\n\n${l.slice(0, 40).map((e) => `- ${e.frase} — ${num(e.volume)}${e.tendencia === 'subindo' ? ' ↑' : e.tendencia === 'caindo' ? ' ↓' : ''}${e.concorrencia === 'HIGH' ? ' H' : ''}${SENS.test(norm(e.frase)) ? ' ⚠' : ''}`).join('\n')}\n\n`;
}
fs.writeFileSync(path.join(raiz, 'data/pesquisa/DEMANDA-VALIDADA.md'), md);
console.log(`Demanda: ${Object.keys(itens).length} frases | temas com pautas: ${Object.keys(por).length}`);

// Candidatas "mais fáceis de ranquear" (proxy; a prova é o Google): concorrência de anúncios baixa, 1.000–25.000/mês,
// 3+ palavras (long tail), sem marca/produto/ruído, sem artigo, não caindo. Marca sensível com ⚠.
const RUIDO2 = /\b(sanduiche|carne de|carnes|hamburguer|espetinho|cerveja|gin|vodka|skol|boutique|pao de|comida|deposito|estacao|mcdonald|ingles|fruta do dragao|nutricionista pela|unimed|verduras e legumes|altas horas|lanche 24|mais 1|bebidas com|casa da|lanche do|lanche da tarde|laser de co2|peeling de fenol)\b/;
const facil = Object.values(itens).filter((e) => !RUIDO2.test(sa(e.frase)) && e.volume >= 1000 && e.volume <= 25000 && e.concorrencia === 'LOW' && sa(e.frase).split(/\s+/).length >= 3 && !RUIDO.test(sa(e.frase)) && e.tendencia !== 'caindo' && !tem(e.frase));
const vistos = new Set(); const f2 = [];
for (const e of facil.sort((a, b) => b.volume - a.volume)) { const k = chave(e.frase).split(' ').slice(0, 3).join(' '); if (vistos.has(k + e.volume)) continue; vistos.add(k + e.volume); f2.push(e); }
let mf = `# Candidatas mais fáceis de ranquear (${new Date().toISOString().slice(0, 10)})\n\nCritério (proxy): volume exato 1.000–25.000/mês, concorrência de anúncios BAIXA, frase de 3+ palavras, sem marca/produto/local, sem artigo no blog, tendência não caindo. **Isto é uma pista, não prova**: a facilidade real só se confirma olhando o topo do Google (autoridades, lojas, tamanho dos concorrentes). Confirmar as escolhidas antes de escrever.\n\n`;
const pt = {}; for (const e of f2) (pt[e.tema] ||= []).push(e);
for (const [t, l] of Object.entries(pt).sort((a, b) => b[1].length - a[1].length)) mf += `## ${temas[t] || t} (${l.length})\n\n${l.slice(0, 50).map((e) => `- ${e.frase} — ${num(e.volume)}${e.tendencia === 'subindo' ? ' ↑' : ''}${SENS.test(norm(e.frase)) ? ' ⚠' : ''}`).join('\n')}\n\n`;
fs.writeFileSync(path.join(raiz, 'data/pesquisa/DEMANDA-FACIL.md'), mf);
console.log(`Fáceis (proxy): ${f2.length}`);
