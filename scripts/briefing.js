// Briefing por pauta: junta tudo o que foi pesquisado, para o robô só escrever (sem pesquisar na hora).
//   node scripts/briefing.js [--so "palavra"]
// Para cada pauta da fila grava data/briefings/<slug>.json com: demanda (volume e palavras de apoio), Google (top 3 orgânicos sem anúncio,
// autoridades, perguntas, buscas relacionadas), meta de escrita (da comparação com o topo, quando existe), pontes de link interno e cuidados.
// O robô (scripts/article-robot.js, método briefing) lê o arquivo e acrescenta ao prompt do redator.
// Regra: lemos só a PÁGINA do concorrente que trata do tema da pauta (nunca o site inteiro); fatos só das nossas fontes.
import fs from 'fs';

const so = process.argv.includes('--so') ? process.argv[process.argv.indexOf('--so') + 1] : null;
const lerJson = (p, fb) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fb; } };
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const fila = lerJson('data/keywords-validated.json', { keywords: [] }).keywords;
const serp = lerJson('data/pesquisa/serp-resultados.json', {});
const comp = lerJson('data/pesquisa/comparacao-topo.json', { resultado: [] }).resultado;
const pontes = lerJson('data/pontes.json', { linkaPara: {} }).linkaPara;
fs.mkdirSync('data/briefings', { recursive: true });
let n = 0, comGoogle = 0, comMeta = 0;
for (const k of fila) {
  if (so && !norm(k.keyword).includes(norm(so))) continue;
  const s = serp[k.keyword] || {};
  const c = comp.find((x) => x.keyword === k.keyword);
  const topo = (s.top3Urls || s.topoUrls || []).slice(0, 3);
  const b = {
    keyword: k.keyword, slug: slugify(k.keyword), volume: k.volume, cluster: k.cluster, papel: k.papel || null, pilar: k.pilar || null,
    sensivel: !!k.sensivel, notas: k.notas || '',
    apoio: (k.secundarias || []).map((x) => ({ palavra: x.palavra, volume: x.volume })),
    perguntasDoGoogle: [...new Set([...(s.perguntas || []), ...(k.absorve || [])])].slice(0, 10),
    buscasRelacionadas: (s.relacionadas || []).slice(0, 8),
    concorrentePrincipal: topo[0] || null, // 1º orgânico do Google (sem anúncio): o único concorrente que estudamos e melhoramos
    google: { checadoEm: s.data || null, top3Organicos: topo, autoridadesTop3: s.autoridadesTop3 || [], autoridadesTop5: s.autoridadesTop5 || [], respostaDaIA: !!(s.aiOverview ?? k.serp?.aiOverview) },
    metaEscrita: c && c.concorrentesLidos ? { medianaPalavras: c.medianaTopo.palavras, medianaH2: c.medianaTopo.h2, medianaImagens: c.medianaTopo.imagens, faqNoTopo: c.faqNoTopo, secoesQueOTopoCobre: c.secoesComuns || [] } : null,
    pontes: (pontes[k.keyword] || []).map((p) => ({ para: p.para, ancoras: p.ancoras })),
    fontes: k.fontes || [],
  };
  fs.writeFileSync(`data/briefings/${b.slug}.json`, JSON.stringify(b, null, 1));
  n++; if (topo.length) comGoogle++; if (b.metaEscrita) comMeta++;
}
console.log(`${n} briefings em data/briefings/ | com top 3 do Google guardado: ${comGoogle} | com meta de escrita (comparação com o topo): ${comMeta}`);
