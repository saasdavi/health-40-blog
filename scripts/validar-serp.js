// Valida em lote o Google (SERP) das candidatas e, se pedido, promove à fila de ouro.
// Usa a API Serper (serper.dev; ~2.500 consultas grátis ao criar a conta) via SERPER_API_KEY.
//
//   node scripts/validar-serp.js [--limite 25] [--so "palavra"] [--promover] [--mock arquivo.json]
//
// Para cada candidata com volume: busca o Google Brasil, mede quão difícil é o topo,
// extrai fontes legíveis, perguntas relacionadas (viram H2) e grava o veredito.
// Regras (as mesmas decididas à mão até aqui):
//   fácil   = no máximo 2 autoridades entre os 5 primeiros resultados
//   fontes  = >= 4 páginas de domínios diferentes, sem rede social, vídeo ou loja
//   comercial = 4+ lojas/farmácias entre os 10 primeiros -> descarta
import fs from 'fs';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const LIMITE = Number(opt('--limite')) || 25;
const SO = opt('--so');
const PROMOVER = args.includes('--promover');
const MOCK = opt('--mock');
const KEY = process.env.SERPER_API_KEY;

const ARQ_CAND = 'data/prateleira-candidatas.json';
const ARQ_FILA = 'data/keywords-validated.json';
const ARQ_OUT = 'data/pesquisa/serp-resultados.json';
const MIN_VOLUME = 1000;
const MIN_FONTES = 4;

const AUTORIDADES = /(\.gov\.br|\.gov|\.edu|\.jus\.br|bvsms|einstein\.br|hospitalsiriolibanes|sbc\.org|cardiol\.br|sbd\.org|diabetes\.org\.br|endocrino\.org|sbem\.org|urologiaonline|sbu-sp|inca\.gov|drauziovarella|mayoclinic|msdmanuals|who\.int|nih\.gov|cdc\.gov|clevelandclinic|hopkinsmedicine|webmd|healthline|medlineplus|sanarmed|portal\.fiocruz|fiocruz)/;
const FRACAS = /(instagram|facebook|youtube|tiktok|pinterest|twitter|x\.com|reddit|quora|linkedin|threads|globoplay|spotify|wikipedia|doctoralia\.com\.br\/perguntas|kwai)/;
const LOJAS = /(drogasil|drogaraia|panvel|paguemenos|araujo\.com\.br\/produto|mercadolivre|amazon|magazineluiza|americanas|shopee|aliexpress|natura\.com|boticario|sephora|belezanaweb|netshoes|growth|soldiersnutrition|integralmedica|minhavida\.com\.br\/loja|ultrafarma|drogariasaopaulo|onofre|farmaciaspague)/;
const COMERCIAL = /\b(comprar|preco|preço|onde comprar|melhor marca|promocao|cupom|kit|capsulas?|comprimidos?|suplemento|creatina|whey|termogenico|quelato)\b/i;
const URGENCIA = /\b(crise|pico de pressao|pico de pressão|emergencia|emergência|infarto|avc|derrame|overdose|socorro)\b/i;
const NOTAS_PADRAO = 'Texto informativo, sem diagnóstico, sem indicar medicamento, suplemento ou marca. Incluir sinais de alerta e orientar consulta médica. REVISAR antes de publicar (notas geradas automaticamente).';

const lerJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const semAcento = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const dominio = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'e', 'em', 'na', 'no', 'para', 'por', 'um', 'uma', 'que', 'com']);
const termos = (t) => semAcento(t).split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w));
const jaccard = (a, b) => { const A = new Set(termos(a)), B = new Set(termos(b)); const i = [...A].filter((x) => B.has(x)).length; const u = new Set([...A, ...B]).size; return u ? i / u : 0; };

async function buscar(q) {
  if (MOCK) return lerJson(MOCK)[q] || lerJson(MOCK)['*'];
  const r = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, gl: 'br', hl: 'pt-br', num: 10 }),
  });
  if (!r.ok) throw new Error(`Serper HTTP ${r.status}`);
  return r.json();
}

function anoDe(data) {
  if (!data) return null;
  const t = Date.parse(data);
  if (!Number.isNaN(t)) return new Date(t).getFullYear();
  const m = String(data).match(/(\d{4})/);
  return m ? Number(m[1]) : null;
}

function avaliar(cand, serp) {
  const organico = (serp.organic || []).slice(0, 10);
  const top5 = organico.slice(0, 5);
  const ano = new Date().getFullYear();
  const autoridades = top5.filter((o) => AUTORIDADES.test(dominio(o.link)));
  const fracos = organico.filter((o) => FRACAS.test(dominio(o.link)) || (anoDe(o.date) && anoDe(o.date) <= ano - 3));
  const lojas = organico.filter((o) => LOJAS.test(dominio(o.link)));
  const fontes = [];
  const vistos = new Set();
  for (const o of organico) {
    const d = dominio(o.link);
    if (!d || vistos.has(d) || FRACAS.test(d) || LOJAS.test(d) || /\.pdf($|\?)/i.test(o.link) || !o.link.startsWith('https://')) continue;
    vistos.add(d);
    fontes.push(o.link);
  }
  const absorve = [
    ...(serp.peopleAlsoAsk || []).map((p) => p.question),
    ...(serp.relatedSearches || []).map((r) => r.query),
  ].filter((x, i, a) => x && a.indexOf(x) === i).slice(0, 8);

  const motivos = [];
  let veredito = 'facil';
  if (COMERCIAL.test(semAcento(cand.keyword))) { veredito = 'fora'; motivos.push('termo comercial'); }
  if (URGENCIA.test(semAcento(cand.keyword))) { veredito = 'fora'; motivos.push('tema de urgência'); }
  if (lojas.length >= 4) { veredito = 'fora'; motivos.push(`${lojas.length} lojas no topo (intenção de compra)`); }
  if (veredito === 'facil' && autoridades.length >= 3) { veredito = 'dificil'; motivos.push(`${autoridades.length} autoridades no top 5`); }
  if (veredito === 'facil' && fontes.length < MIN_FONTES) { veredito = 'sem-fontes'; motivos.push(`só ${fontes.length} fontes utilizáveis`); }
  const nivel = veredito !== 'facil' ? null : autoridades.length === 0 && fracos.length >= 3 ? 'FÁCIL' : 'MÉDIA-FÁCIL';
  return {
    keyword: cand.keyword,
    volume: cand.volume,
    veredito,
    nivel,
    motivos,
    autoridadesTop5: autoridades.map((o) => dominio(o.link)),
    fracosTop10: fracos.length,
    topoDoGoogle: top5.map((o) => dominio(o.link)).join(', '),
    aiOverview: Boolean(serp.answerBox || serp.knowledgeGraph),
    fontes: fontes.slice(0, 8),
    absorve,
  };
}

async function main() {
  if (!MOCK && !KEY) { console.error('Defina SERPER_API_KEY (crie a chave em serper.dev e salve como secret do repositório).'); process.exit(1); }
  const cand = lerJson(ARQ_CAND);
  const fila = lerJson(ARQ_FILA);
  const existentes = new Set(fila.keywords.map((k) => semAcento(k.keyword)));
  const feitos = fs.existsSync(ARQ_OUT) ? lerJson(ARQ_OUT) : {};
  const alvo = cand.candidatas
    .filter((c) => typeof c.volume === 'number' && c.volume >= MIN_VOLUME)
    .filter((c) => !existentes.has(semAcento(c.keyword)))
    .filter((c) => !feitos[c.keyword])
    .filter((c) => !SO || semAcento(c.keyword).includes(semAcento(SO)))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, LIMITE);

  console.log(`${alvo.length} candidatas para validar no Google (limite ${LIMITE}).`);
  const promovidas = [];
  for (const c of alvo) {
    try {
      const res = avaliar(c, await buscar(c.keyword));
      const canib = fila.keywords.find((k) => jaccard(c.keyword, k.keyword) >= 0.75);
      if (canib) { res.veredito = 'canibaliza'; res.motivos.push(`parecida com "${canib.keyword}" (já na fila)`); }
      feitos[c.keyword] = res;
      console.log(`${res.veredito === 'facil' ? '✅' : '❌'} ${c.keyword} (${c.volume}): ${res.veredito}${res.motivos.length ? ' — ' + res.motivos.join('; ') : ''}`);
      if (PROMOVER && res.veredito === 'facil') {
        fila.keywords.push({
          keyword: c.keyword, volume: c.volume, competition: 'LOW', cluster: c.cluster || 'geral',
          absorve: res.absorve,
          serp: { facil: true, nivel: res.nivel, topoDoGoogle: res.topoDoGoogle, aiOverview: res.aiOverview },
          fontes: res.fontes, notas: NOTAS_PADRAO, revisar: true,
        });
        promovidas.push(c.keyword);
      }
    } catch (e) {
      console.log(`⚠️  ${c.keyword}: ${e.message}`);
    }
  }
  fs.mkdirSync('data/pesquisa', { recursive: true });
  fs.writeFileSync(ARQ_OUT, JSON.stringify(feitos, null, 1));
  if (PROMOVER && promovidas.length) {
    fs.writeFileSync(ARQ_FILA, JSON.stringify(fila, null, 2));
    cand.candidatas = cand.candidatas.filter((c) => !promovidas.includes(c.keyword));
    fs.writeFileSync(ARQ_CAND, JSON.stringify(cand, null, 1));
  }
  const resumo = [`## Validação no Google`, `- Validadas: **${alvo.length}**`, `- Promovidas à fila: **${promovidas.length}**${promovidas.length ? ' (revisar notas): ' + promovidas.join(', ') : ''}`];
  console.log(resumo.join('\n'));
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, resumo.join('\n') + '\n');
}
main().catch((e) => { console.error(e); process.exit(1); });
