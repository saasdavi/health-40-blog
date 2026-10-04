// Valida as pautas de data/keywords-validated.json por REGRA, não por confiança.
// Uso: node scripts/validar-pautas.js [--online] [--todas] [--limite N] [--so "palavra"]
//   (sem flags)  checagem estrutural/política, instantânea e sem rede
//   --online     busca cada URL de fonte e confere: responde 200, é HTML, tem texto
//                suficiente e fala do assunto da palavra-chave
//   --todas      inclui pautas já usadas (padrão: só as livres)
// Sai com código 1 se houver ERRO (pauta não deve entrar na fila). Avisos não falham.
import fs from 'fs';

const args = process.argv.slice(2);
const ONLINE = args.includes('--online');
const TODAS = args.includes('--todas');
const opt = (nome) => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : null; };
const LIMITE = Number(opt('--limite')) || Infinity;
const SO = opt('--so');

const MIN_VOLUME = 1000;      // abaixo disso a pauta não vale um artigo
const MIN_FONTES = 4;         // o robô exige 2 legíveis; guardamos folga
const MIN_DOMINIOS = 3;       // fontes não podem ser todas do mesmo site
const MIN_TEXTO = 1500;       // caracteres de texto legível numa fonte
const MIN_ACERTO = 0.6;       // fração dos termos da palavra que a fonte precisa citar
const SIMILARIDADE = 0.75;    // acima disso a pauta canibaliza outra
const TIMEOUT_MS = 15000;

const lerJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const semAcento = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const slugify = (t) => semAcento(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'e', 'em', 'na', 'no', 'para', 'por', 'um', 'uma', 'que', 'com', 'os', 'as', 'se']);
const termos = (t) => semAcento(t).split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w));

// Termos que o blog não cobre: marca, produto, compra, suplemento.
const COMERCIAL = /\b(comprar|preco|preço|onde comprar|melhor marca|promocao|cupom|kit|capsulas?|comprimidos?|suplemento|creatina|whey|termogenico|quelato|dimalato|verisol|renova|coenzima|colageno hidrolisado|vitamina k2)\b/i;
// Temas de urgência: não viram artigo próprio.
const URGENCIA = /\b(crise|pico de pressao|emergencia|infarto|avc|derrame|overdose|socorro|morte por)\b/i;
// Temas de risco: obrigam nota de cuidado para o robô.
const RISCO = /(pressao|hipertens|prostata|testosterona|diabetes|glicemia|glicada|tireoid|tsh|cancer|trombose|varizes|colesterol|triglicer|creatinina|ureia|ferritina|glaucoma|labirintite|tontura|insonia|ansiedade|depress|esquecimento|demencia|alzheimer|inchaco|moscas volantes)/;
const CLUSTERS_RISCO = new Set(['coracao', 'prostata', 'exames', 'hormonios', 'sintomas', 'circulacao', 'visao', 'urinario', 'ouvido-equilibrio']);

const erros = [];
const avisos = [];
const erro = (p, msg) => erros.push(`❌ ${p.keyword}: ${msg}`);
const aviso = (p, msg) => avisos.push(`⚠️  ${p.keyword}: ${msg}`);

const palavras = lerJson('data/keywords-validated.json').keywords;
const artigos = lerJson('data/articles.json');
const artigosLista = Array.isArray(artigos) ? artigos : artigos.articles || [];
const usados = new Set();
for (const a of artigosLista) {
  if (a.status === 'draft') continue;
  usados.add((a.primaryKeyword || '').toLowerCase());
  usados.add(a.slug);
}
const jaUsada = (p) => usados.has(p.keyword.toLowerCase()) || usados.has(slugify(p.keyword));

const alvo = palavras
  .filter((p) => p.serp?.facil === true)
  .filter((p) => TODAS || (!jaUsada(p) && !p.substitui))
  .filter((p) => !SO || semAcento(p.keyword).includes(semAcento(SO)))
  .slice(0, LIMITE);

// ---------- 1. Regras estruturais e de política ----------
function jaccard(a, b) {
  const A = new Set(termos(a)), B = new Set(termos(b));
  const inter = [...A].filter((x) => B.has(x)).length;
  const uniao = new Set([...A, ...B]).size;
  return uniao ? inter / uniao : 0;
}

for (const p of alvo) {
  if (typeof p.volume !== 'number' || !(p.volume > 0)) erro(p, 'sem volume numérico (volume real do Keyword Planner/HYPD)');
  else if (p.volume < MIN_VOLUME) erro(p, `volume ${p.volume} < ${MIN_VOLUME}`);
  if (!p.cluster) erro(p, 'sem cluster');
  if (!p.serp || typeof p.serp.facil !== 'boolean' || !p.serp.topoDoGoogle) erro(p, 'SERP sem registro do topo do Google');
  if (!Array.isArray(p.absorve) || p.absorve.length < 2) aviso(p, 'poucas perguntas em "absorve" (viram H2)');

  const fontes = p.fontes || [];
  if (fontes.length < MIN_FONTES) erro(p, `só ${fontes.length} fontes (mínimo ${MIN_FONTES})`);
  const dominios = new Set();
  for (const u of fontes) {
    let url;
    try { url = new URL(u); } catch { erro(p, `URL inválida: ${u}`); continue; }
    if (url.protocol !== 'https:') erro(p, `fonte sem https: ${u}`);
    if (/(instagram|facebook|youtube|tiktok|wikipedia|doctoralia)\./.test(url.hostname)) aviso(p, `fonte fraca (rede social/wiki/Q&A): ${u}`);
    if (/\.(htlm|htm1|hmtl)$/i.test(url.pathname)) aviso(p, `extensão suspeita (erro de digitação?): ${u}`);
    dominios.add(url.hostname.replace(/^www\./, ''));
  }
  if (fontes.length && dominios.size < MIN_DOMINIOS) erro(p, `fontes de só ${dominios.size} site(s) (mínimo ${MIN_DOMINIOS})`);
  if (new Set(fontes).size !== fontes.length) erro(p, 'URL de fonte repetida');

  if (COMERCIAL.test(semAcento(p.keyword))) erro(p, 'termo comercial/marca/suplemento (fora do escopo)');
  if (URGENCIA.test(semAcento(p.keyword))) erro(p, 'tema de urgência não vira artigo próprio (use como H2 de alerta)');
  const precisaNota = RISCO.test(semAcento(p.keyword)) || CLUSTERS_RISCO.has(p.cluster);
  if (precisaNota && !(p.notas && p.notas.length > 20)) erro(p, 'tema de saúde sem "notas" de cuidado para o robô');
}

// Canibalização: mesma intenção em duas pautas, ou pauta igual a pergunta já absorvida.
const todas = palavras.filter((p) => p.serp?.facil === true);
for (const p of alvo) {
  for (const q of todas) {
    if (q === p) continue;
    const s = jaccard(p.keyword, q.keyword);
    if (s >= SIMILARIDADE) aviso(p, `canibaliza "${q.keyword}" (similaridade ${s.toFixed(2)})`);
    for (const ab of q.absorve || []) {
      if (jaccard(p.keyword, ab) >= 0.9) aviso(p, `já absorvida como H2 de "${q.keyword}" ("${ab}")`);
    }
  }
}

// ---------- 2. Fontes de verdade na internet ----------
function textoLegivel(html) {
  return html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function checarFonte(p, url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Saude40Bot/1.0)', 'Accept': 'text/html' } });
    if (r.status !== 200) return { ok: false, motivo: `HTTP ${r.status}` };
    const tipo = r.headers.get('content-type') || '';
    if (!/html/i.test(tipo)) return { ok: false, motivo: `tipo ${tipo || 'desconhecido'}` };
    const texto = textoLegivel(await r.text());
    if (texto.length < MIN_TEXTO) return { ok: false, motivo: `pouco texto (${texto.length} caracteres)` };
    const alvoTermos = termos(p.keyword);
    const base = semAcento(texto);
    // radical: "lombares" deve casar com "lombar"
    const achou = alvoTermos.filter((w) => base.includes(w.length >= 5 ? w.slice(0, w.length - 2) : w)).length;
    const taxa = alvoTermos.length ? achou / alvoTermos.length : 1;
    if (taxa < MIN_ACERTO) return { ok: false, motivo: `não fala do assunto (${achou}/${alvoTermos.length} termos)` };
    return { ok: true, caracteres: texto.length };
  } catch (e) {
    return { ok: false, motivo: e.name === 'AbortError' ? 'timeout' : e.cause?.code || e.message };
  } finally {
    clearTimeout(t);
  }
}

if (ONLINE) {
  // Em paralelo (8 pautas por vez, fontes de uma pauta juntas) para não passar de poucos minutos.
  const porPauta = new Array(alvo.length);
  let prox = 0;
  const worker = async () => {
    while (prox < alvo.length) {
      const i = prox++;
      const p = alvo[i];
      const resultados = await Promise.all((p.fontes || []).map(async (u) => ({ u, ...(await checarFonte(p, u)) })));
      porPauta[i] = { p, resultados };
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  // Se TODAS as fontes de TODAS as pautas deram 403, o bloqueio é do ambiente (proxy/firewall),
  // não das fontes: o resultado é inconclusivo e não pode reprovar pauta.
  const todos = porPauta.flatMap((x) => x.resultados);
  const bloqueado = todos.length >= 5 && todos.every((r) => !r.ok && r.motivo === 'HTTP 403');
  if (bloqueado) {
    avisos.push('⚠️  Checagem online INCONCLUSIVA: todas as fontes deram 403 (rede bloqueada neste ambiente). Rode no GitHub Actions ou localmente.');
  } else {
    for (const { p, resultados } of porPauta) {
      const boas = resultados.filter((r) => r.ok).length;
      for (const r of resultados.filter((x) => !x.ok)) aviso(p, `fonte não validou (${r.motivo}): ${r.u}`);
      if (boas < 2) erro(p, `só ${boas} fonte(s) legível(is) de ${resultados.length}: o robô exige 2`);
      console.log(`${boas >= 2 ? '✅' : '❌'} ${p.keyword}: ${boas}/${resultados.length} fontes legíveis`);
    }
  }
}

// ---------- 3. Relatório ----------
const linhas = [
  `## Validação das pautas${ONLINE ? ' (com fontes online)' : ''}`,
  `- Pautas conferidas: **${alvo.length}**`,
  `- Erros: **${erros.length}** | Avisos: ${avisos.length}`,
  ...erros, ...avisos,
];
console.log(linhas.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, linhas.join('\n') + '\n');
if (erros.length) {
  console.log(`::warning::${erros.length} pauta(s) com erro de validação (veja o resumo)`);
  process.exitCode = 1;
}
