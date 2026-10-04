// Promove uma pauta aprovada na checagem do Google (HYPD/Serper) para a fila do robô e registra a checagem.
//   node scripts/promover-pauta.js arquivo.json     (ou JSON pelo stdin: echo '{...}' | node scripts/promover-pauta.js -)
// Campos: topoUrls[] (URLs do top 5, para scripts/comparar-topo.js), keyword, volume, cluster, topoDoGoogle, autoridades[], fracos, nivel, fontes[], absorve[], perguntas[], relacionadas[],
//         notas, sensivel (bool), aiOverview (bool), competition, secundarias[{palavra,volume}], papel, veredito ('facil'|'dificil'|'fora'|'canibaliza'|'sem-fontes'), motivos[]
// Regra do top 3 orgânico (anúncio não conta): no máximo 1 autoridade nos 3 primeiros orgânicos e 2 nos 5 primeiros; use autoridadesTop3[] e autoridades[].
// Só promove se veredito = 'facil', >= 4 fontes, notas escritas e sem canibalização (>= 75% de termos iguais a uma pauta da fila).
// Sempre grava a checagem em data/pesquisa/serp-resultados.json e as perguntas/relacionadas em data/pesquisa/ideias-do-google.json.
import fs from 'fs';

const entrada = process.argv[2];
const dado = JSON.parse(entrada === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(entrada, 'utf8'));
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'e', 'em', 'na', 'no', 'para', 'por', 'um', 'uma', 'que', 'com', 'os', 'as']);
const termos = (t) => new Set(norm(t).split(' ').filter((w) => w.length > 1 && !STOP.has(w)));
const jaccard = (a, b) => { const A = termos(a), B = termos(b); const i = [...A].filter((x) => B.has(x)).length; const u = new Set([...A, ...B]).size; return u ? i / u : 0; };
const hoje = new Date().toISOString().slice(0, 10);

const FILA = 'data/keywords-validated.json', CAND = 'data/prateleira-candidatas.json', SERP = 'data/pesquisa/serp-resultados.json', IDEIAS = 'data/pesquisa/ideias-do-google.json';
const fila = JSON.parse(fs.readFileSync(FILA, 'utf8'));
let veredito = dado.veredito || 'facil';
const motivos = [...(dado.motivos || [])];
const canib = fila.keywords.find((k) => norm(k.keyword) !== norm(dado.keyword) && jaccard(dado.keyword, k.keyword) >= 0.75);
if (fila.keywords.some((k) => norm(k.keyword) === norm(dado.keyword))) { veredito = 'ja-na-fila'; motivos.push('já está na fila'); }
else if (canib) { veredito = 'canibaliza'; motivos.push(`parecida com "${canib.keyword}"`); }
if (veredito === 'facil' && (dado.autoridadesTop3 || []).length >= 2) { veredito = 'dificil'; motivos.push(`${dado.autoridadesTop3.length} autoridades nos 3 primeiros orgânicos`); }
if (veredito === 'facil' && (dado.autoridades || []).length >= 3) { veredito = 'dificil'; motivos.push(`${dado.autoridades.length} autoridades no top 5`); }
if (veredito === 'facil' && (dado.fontes || []).length < 4) { veredito = 'sem-fontes'; motivos.push(`só ${(dado.fontes || []).length} fontes`); }
if (veredito === 'facil' && !(dado.notas || '').trim()) { veredito = 'sem-notas'; motivos.push('faltam notas de segurança'); }

// registro da checagem (sempre)
const serp = fs.existsSync(SERP) ? JSON.parse(fs.readFileSync(SERP, 'utf8')) : {};
serp[dado.keyword] = { data: hoje, fonte: dado.fonteDados || 'HYPD serp_results', veredito, nivel: dado.nivel || null, motivos, autoridadesTop3: dado.autoridadesTop3 || [], autoridadesTop5: dado.autoridades || [], fracosTop10: dado.fracos ?? null, topoDoGoogle: dado.topoDoGoogle || '', aiOverview: !!dado.aiOverview, perguntas: dado.perguntas || [], relacionadas: dado.relacionadas || [], fontes: dado.fontes || [], topoUrls: dado.topoUrls || [] };
fs.writeFileSync(SERP, JSON.stringify(serp, null, 1));
const ideias = JSON.parse(fs.readFileSync(IDEIAS, 'utf8'));
const tem = new Set(ideias.ideias.map((i) => norm(i.ideia)));
for (const [tipo, lista] of [['pergunta', dado.perguntas || []], ['relacionada', dado.relacionadas || []]]) for (const q of lista) if (!tem.has(norm(q))) { ideias.ideias.push({ ideia: q, tipo, origem: dado.keyword, data: hoje, volume: null }); tem.add(norm(q)); }
fs.writeFileSync(IDEIAS, JSON.stringify(ideias, null, 1));

if (veredito !== 'facil') { console.log(`❌ ${dado.keyword}: ${veredito}${motivos.length ? ' — ' + motivos.join('; ') : ''} (checagem registrada)`); process.exit(0); }

const pauta = {
  keyword: dado.keyword, volume: dado.volume, competition: dado.competition || 'LOW', cluster: dado.cluster || 'geral',
  absorve: dado.absorve?.length ? dado.absorve : (dado.perguntas || []).slice(0, 6),
  serp: { facil: true, nivel: dado.nivel || 'MÉDIA-FÁCIL', topoDoGoogle: dado.topoDoGoogle || '', aiOverview: !!dado.aiOverview },
  fontes: dado.fontes, notas: dado.notas,
  ...(dado.secundarias?.length ? { secundarias: dado.secundarias } : {}),
  papel: dado.papel || 'pilar', revisar: true, ...(dado.sensivel ? { sensivel: true } : {}),
};
fila.keywords.push(pauta);
fs.writeFileSync(FILA, JSON.stringify(fila, null, 2));
const cand = JSON.parse(fs.readFileSync(CAND, 'utf8'));
cand.candidatas = cand.candidatas.filter((c) => norm(c.keyword) !== norm(dado.keyword));
fs.writeFileSync(CAND, JSON.stringify(cand, null, 1));
console.log(`✅ ${dado.keyword} (${dado.volume}) promovida à fila${dado.sensivel ? ' [sensível: não publica até revisão]' : ''}`);
