// Gera combinações de palavras (tema × público × intenção) para pesquisar volume,
// e depois agrupa os volumes medidos em clusters (uma pauta = palavra principal + caudas).
//
//   node scripts/combinar-palavras.js gerar [--max 1000]
//        lê data/pesquisa/ingredientes.json e escreve data/pesquisa/combinacoes.json
//        + data/pesquisa/combinacoes.txt (uma frase por linha: cole no Planejador do Google / HYPD)
//   node scripts/combinar-palavras.js analisar arquivo.csv [--min 1000]
//        lê o CSV/TSV exportado (colunas: Keyword + Avg. monthly searches / volume),
//        agrupa por tema e grava data/pesquisa/clusters.json com o ranking de pautas
import fs from 'fs';
import path from 'path';

const DIR = 'data/pesquisa';
const [, , cmd, arg] = process.argv;
const flag = (n, def) => { const i = process.argv.indexOf(n); return i >= 0 ? Number(process.argv[i + 1]) : def; };

const semAcento = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// Mesmos limites do validador: nada de marca, produto, suplemento ou promessa.
const COMERCIAL = /\b(comprar|preco|onde comprar|melhor marca|promocao|cupom|kit|capsulas?|comprimidos?|suplemento|creatina|whey|termogenico|quelato|colageno hidrolisado|remedio para emagrecer|chas? para emagrecer|detox|milagr)/;
const norm = (f) => semAcento(f).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
// o Google junta singular/plural e flexões: "emagrecem" = "emagrecer"
const radical = (w) => (w.length >= 5 ? w.slice(0, w.length - 2) : w);
const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'e', 'em', 'na', 'no', 'para', 'por', 'um', 'uma', 'que', 'com', 'os', 'as', 'se', 'ao', 'aos']);
const assinatura = (f) => norm(f).split(' ').filter((w) => !STOP.has(w)).map(radical).sort().join(' ');

function gerar() {
  const ing = JSON.parse(fs.readFileSync(path.join(DIR, 'ingredientes.json'), 'utf8'));
  const max = flag('--max', 1000);
  const soCat = process.argv.includes('--categoria') ? process.argv[process.argv.indexOf('--categoria') + 1] : null;
  const frases = new Map();
  const add = (frase, categoria, tema) => {
    const k = norm(frase);
    if (COMERCIAL.test(k) || k.length > 80 || frases.has(k)) return;
    frases.set(k, { frase: frase.replace(/\s+/g, ' ').trim(), categoria, tema });
  };
  for (const [categoria, temas] of Object.entries(ing.categorias)) {
    if (soCat && categoria !== soCat) continue;
    const modelos = ing.intencoesPorCategoria?.[categoria] || [];
    for (const tema of temas) {
      add(tema, categoria, tema);
      for (const p of ing.publicos) add(`${tema} ${p}`, categoria, tema);
      for (const m of modelos) add(m.replace('{t}', tema), categoria, tema);
    }
  }
  const lista = [...frases.values()];
  fs.writeFileSync(path.join(DIR, 'combinacoes.json'), JSON.stringify(lista, null, 1));
  // lotes de até `max` frases: o Planejador e o HYPD aceitam ~1000 por consulta
  for (let i = 0, n = 1; i < lista.length; i += max, n++) {
    fs.writeFileSync(path.join(DIR, `combinacoes-${n}.txt`), lista.slice(i, i + max).map((x) => x.frase).join('\n') + '\n');
  }
  // um arquivo por categoria: cola-se uma categoria por vez no Planejador
  fs.mkdirSync(path.join(DIR, 'por-categoria'), { recursive: true });
  for (const cat of new Set(lista.map((x) => x.categoria))) {
    fs.writeFileSync(path.join(DIR, 'por-categoria', `${cat}.txt`), lista.filter((x) => x.categoria === cat).map((x) => x.frase).join('\n') + '\n');
  }
  const porCat = {};
  for (const x of lista) porCat[x.categoria] = (porCat[x.categoria] || 0) + 1;
  console.log(porCat);
  console.log(`${lista.length} frases geradas em ${Math.ceil(lista.length / max)} lote(s): ${DIR}/combinacoes-N.txt`);
}

// "1K – 10K" -> 1000 (limite inferior); "1.200" -> 1200; "12,1 mil" -> 12100; "1M" -> 1000000
function numero(v) {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase().split(/[–—]| - /)[0].trim();
  const m = s.match(/^([\d.,]+)\s*(mil|k|mi|m)?$/);
  if (!m) return null;
  let n = m[2] ? parseFloat(m[1].replace(',', '.')) : parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
  if (m[2] === 'mil' || m[2] === 'k') n *= 1e3;
  if (m[2] === 'mi' || m[2] === 'm') n *= 1e6;
  return Number.isFinite(n) ? Math.round(n) : null;
}

function lerTabela(arq) {
  let txt = fs.readFileSync(arq);
  txt = (txt[0] === 0xff && txt[1] === 0xfe ? txt.toString('utf16le') : txt.toString('utf8')).replace(/^﻿/, '');
  const linhas = txt.split(/\r?\n/).filter((l) => l.trim());
  const sep = ['\t', ';', ','].map((s) => [s, (linhas.slice(0, 5).join('\n').match(new RegExp(s, 'g')) || []).length]).sort((a, b) => b[1] - a[1])[0][0];
  const cel = (l) => l.split(sep).map((c) => c.replace(/^"|"$/g, '').trim());
  const iHead = linhas.findIndex((l) => /keyword|palavra|termo/i.test(l) && /volume|search|busca|pesquisa/i.test(l));
  if (iHead < 0) throw new Error('cabeçalho não encontrado (precisa de coluna Keyword e coluna de volume)');
  const head = cel(linhas[iHead]);
  const ik = head.findIndex((h) => /^(keyword|palavra|termo)/i.test(h));
  const iv = head.findIndex((h) => /avg|volume|search|buscas|pesquisas/i.test(h) && !/trend|tend/i.test(h));
  const ic = head.findIndex((h) => /^competition$|^concorr/i.test(h));
  return linhas.slice(iHead + 1).map((l) => { const c = cel(l); return { keyword: c[ik], volume: numero(c[iv]), competicao: ic >= 0 ? (c[ic] || '').toUpperCase() : '' }; }).filter((r) => r.keyword);
}

function analisar() {
  if (!arg) throw new Error('uso: analisar arquivo.csv');
  const min = flag('--min', 1000);
  const mapa = JSON.parse(fs.readFileSync(path.join(DIR, 'combinacoes.json'), 'utf8'));
  const porFrase = new Map(mapa.map((m) => [norm(m.frase), m]));
  const medidas = lerTabela(arg);
  const clusters = new Map();
  for (const r of medidas) {
    const m = porFrase.get(norm(r.keyword));
    if (!m || !(r.volume > 0)) continue;
    if (!clusters.has(m.tema)) clusters.set(m.tema, { tema: m.tema, categoria: m.categoria, itens: [] });
    clusters.get(m.tema).itens.push({ frase: m.frase, volume: r.volume, assinatura: assinatura(m.frase) });
  }
  const out = [];
  for (const c of clusters.values()) {
    // duas frases com a mesma assinatura são a mesma busca para o Google: conta uma vez
    const unicas = new Map();
    for (const it of c.itens) if (!unicas.has(it.assinatura) || unicas.get(it.assinatura).volume < it.volume) unicas.set(it.assinatura, it);
    const itens = [...unicas.values()].sort((a, b) => b.volume - a.volume);
    const [principal, ...caudas] = itens;
    const soma = itens.reduce((s, x) => s + x.volume, 0);
    // as buscas se sobrepõem (o mesmo leitor digita variações): estimativa conservadora
    const estimado = Math.round(principal.volume + 0.65 * (soma - principal.volume));
    out.push({ categoria: c.categoria, tema: c.tema, principal: principal.frase, volumePrincipal: principal.volume, volumeSoma: soma, volumeEstimado: estimado, absorve: caudas.map((x) => `${x.frase} (${x.volume})`), passa: estimado >= min });
  }
  out.sort((a, b) => b.volumeEstimado - a.volumeEstimado);
  fs.writeFileSync(path.join(DIR, 'clusters.json'), JSON.stringify(out, null, 1));
  console.log(`Clusters (mínimo estimado ${min}):`);
  for (const o of out) console.log(`${o.passa ? '✅' : '·'} ${String(o.volumeEstimado).padStart(7)}  ${o.categoria} · ${o.principal}  [principal ${o.volumePrincipal}, soma ${o.volumeSoma}, ${o.absorve.length} caudas]`);
  console.log(`\nGravado em ${DIR}/clusters.json. Próximo passo: checar o Google (SERP) dos que passaram.`);
}

// Importa o CSV do "Descobrir novas palavras-chave" (milhares de ideias que o Google gera a partir de sementes):
// agrupa por tema, descarta intenção de compra e grava as melhores como candidatas.
//   node scripts/combinar-palavras.js importar arquivo.csv [--categoria nome] [--semente "palavra" ...] [--min 1000]
function importar() {
  if (!arg) throw new Error('uso: importar arquivo.csv');
  const min = flag('--min', 1000);
  const catArg = process.argv.includes('--categoria') ? process.argv[process.argv.indexOf('--categoria') + 1] : null;
  const ing = JSON.parse(fs.readFileSync(path.join(DIR, 'ingredientes.json'), 'utf8'));
  const temas = [];
  for (const [cat, ts] of Object.entries(ing.categorias)) if (!catArg || cat === catArg) for (const t of ts) temas.push({ t, cat, n: norm(t) });
  // sementes novas: --semente "melasma" --semente "caspa" (as mesmas que você digitou no Planejador)
  process.argv.forEach((a, i) => { if (a === '--semente' && process.argv[i + 1]) temas.push({ t: process.argv[i + 1], cat: catArg || 'geral', n: norm(process.argv[i + 1]) }); });
  temas.sort((a, b) => b.n.length - a.n.length); // o tema mais específico vence
  const fila = JSON.parse(fs.readFileSync('data/keywords-validated.json', 'utf8')).keywords.map((k) => norm(k.keyword));
  const grupos = new Map();
  let lidas = 0, comerciais = 0, semTema = 0;
  for (const r of lerTabela(arg)) {
    if (!(r.volume > 0)) continue;
    lidas++;
    const k = norm(r.keyword);
    if (COMERCIAL.test(k) || r.competicao === 'HIGH') { comerciais++; continue; }
    const m = temas.find((x) => k.includes(x.n));
    if (!m) { semTema++; continue; }
    if (!grupos.has(m.t)) grupos.set(m.t, { tema: m.t, categoria: m.cat, itens: new Map() });
    const sig = assinatura(r.keyword), g = grupos.get(m.t).itens;
    if (!g.has(sig) || g.get(sig).volume < r.volume) g.set(sig, { frase: r.keyword, volume: r.volume });
  }
  const cand = JSON.parse(fs.readFileSync('data/prateleira-candidatas.json', 'utf8'));
  const jaTem = new Set([...cand.candidatas.map((c) => norm(c.keyword)), ...fila]);
  let novas = 0;
  const saida = [];
  for (const g of grupos.values()) {
    const itens = [...g.itens.values()].sort((a, b) => b.volume - a.volume);
    const [principal, ...caudas] = itens;
    const soma = itens.reduce((x, y) => x + y.volume, 0);
    const estimado = Math.round(principal.volume + 0.65 * (soma - principal.volume));
    const ok = estimado >= min && !jaTem.has(norm(principal.frase));
    saida.push({ categoria: g.categoria, principal: principal.frase, volumePrincipal: principal.volume, volumeEstimado: estimado, caudas: caudas.length, novo: ok });
    if (ok) {
      cand.candidatas.push({ keyword: principal.frase, volume: principal.volume, cluster: g.categoria, status: `sem-serp; importada do Planejador; cluster estimado ${estimado}; absorve: ${caudas.slice(0, 6).map((x) => `${x.frase} (${x.volume})`).join(', ')}` });
      novas++;
    }
  }
  saida.sort((a, b) => b.volumeEstimado - a.volumeEstimado);
  fs.writeFileSync(path.join(DIR, 'importacao.json'), JSON.stringify(saida, null, 1));
  fs.writeFileSync('data/prateleira-candidatas.json', JSON.stringify(cand, null, 1));
  console.log(`${lidas} ideias com volume | descartadas por compra/marca: ${comerciais} | sem tema conhecido: ${semTema} | clusters: ${grupos.size} | candidatas novas: ${novas}`);
  for (const o of saida.slice(0, 25)) console.log(`${o.novo ? '✅' : '·'} ${String(o.volumeEstimado).padStart(7)}  ${o.categoria} · ${o.principal}  [${o.caudas} caudas]`);
}

try {
  if (cmd === 'gerar') gerar();
  else if (cmd === 'analisar') analisar();
  else if (cmd === 'importar') importar();
  else console.log('uso: node scripts/combinar-palavras.js gerar | analisar arquivo.csv | importar arquivo.csv');
} catch (e) {
  console.error('Erro:', e.message);
  process.exit(1);
}
