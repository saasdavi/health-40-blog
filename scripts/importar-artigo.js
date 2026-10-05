// Importa artigos escritos FORA do robô (ex.: ChatGPT) sem gastar API da Anthropic.
// Lê data/entrada/*.txt, roda a auditoria do robô (regras automáticas), baixa fotos (Pexels/Pixabay)
// e guarda como rascunho pronto (status draft + estoque:true). Reprovados ficam com relatório .md ao lado.
// Formato do arquivo: cabeçalho "CHAVE: valor", uma linha "---" e o corpo em HTML (veja data/entrada/LEIA-ME.md).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ArticleRobot from './article-robot.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, '../data/entrada');
import { demandaDe } from './demanda-lib.js';
import { pontuar } from './pontuacao.js';
const MIN_SCORE = 85; // regra do usuário: nota mínima 8,5 de 10 (85/100)
const de10 = (n) => (n / 10).toFixed(1).replace('.', ',');

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const robot = new ArticleRobot();
const arquivos = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.txt') && f !== 'LEIA-ME.txt') : [];
if (!arquivos.length) { console.log('📥 Nada em data/entrada/.'); process.exit(0); }

let guardados = 0;
for (const nome of arquivos) {
  const caminho = path.join(DIR, nome);
  const raw = fs.readFileSync(caminho, 'utf8').replace(/\r\n/g, '\n');
  const relatorio = (linhas) => fs.writeFileSync(caminho.replace(/\.txt$/, '.relatorio.md'), `# ${nome}\n\n${linhas.map((l) => `- ${l}`).join('\n')}\n`);
  console.log(`\n📥 ${nome}`);
  try {
    const d = robot.parse(raw);
    const get = (k) => (raw.slice(0, raw.indexOf('\n---\n')).match(new RegExp(`^${k}:\\s*(.+)$`, 'm')) || [])[1]?.trim();
    const keyword = get('PALAVRA_CHAVE');
    if (!keyword) throw new Error('falta PALAVRA_CHAVE no cabeçalho');
    const fontes = [...raw.slice(0, raw.indexOf('\n---\n')).matchAll(/^FONTE:\s*(.+?)\s*\|\s*(https?:\/\/\S+)\s*$/gm)].map((m) => ({ title: m[1], url: m[2], texto: '' }));
    if (fontes.length < 2) throw new Error(`só ${fontes.length} FONTE(s); mínimo 2 (formato: FONTE: Título | https://...)`);
    const pauta = robot.kw.find((k) => k.keyword.toLowerCase() === keyword.toLowerCase()) || { keyword, volume: null, cluster: get('CLUSTER') || null };
    if (pauta.sensivel && pauta.revisar && get('REVISADO') !== 'sim') throw new Error('pauta sensível: precisa de revisão humana (adicione "REVISADO: sim" no cabeçalho depois de revisar)');
    if (/<Article[A-Za-z]*|<hr\b|<h1\b/i.test(d.body)) throw new Error('o HTML tem componentes de código (<Article...>), <hr> ou <h1>: peça à IA HTML simples (veja data/entrada/MODELO-PARA-A-IA.md)');
    const cab = raw.slice(0, raw.indexOf('\n---\n'));
    const concorrentes = [...cab.matchAll(/^CONCORRENTE:\s*(.+)$/gm)].map((m) => m[1].trim());
    const lacunas = [...cab.matchAll(/^LACUNA:\s*(.+)$/gm)].map((m) => m[1].trim());
    const dem = demandaDe(keyword);
    if (pauta.volume == null && dem) pauta.volume = dem.volume;
    console.log(`  demanda: ${dem ? `${dem.volume} buscas/mês (${dem.classe}${dem.tendencia ? ', ' + dem.tendencia : ''}${dem.porSimilar ? ', por frase parecida: ' + dem.frase : ''})` : 'NÃO MEDIDA (palavra-chave fora de data/pesquisa/demanda-validada.json)'}`);
    const art = robot.montar(pauta, d, fontes);
    const aud = robot.auditar(art, null);
    console.log(`  ${art.wordCount} palavras | auditoria ${aud.nota}/100 (nota ${de10(aud.nota)}/10)${aud.bloqueios.length ? ' | BLOQUEIOS: ' + aud.bloqueios.join('; ') : ''}`);
    if (aud.bloqueios.length || aud.nota < MIN_SCORE) { relatorio([`Nota ${de10(aud.nota)}/10 (mínimo 8,5)`, ...aud.bloqueios.map((b) => `BLOQUEIO: ${b}`), ...aud.alertas]); console.log('  ⛔ reprovado; veja o .relatorio.md'); continue; }
    if (!(await robot.imagem(art))) { relatorio(['Sem imagens: confira PEXEL_API_KEY/PIXABAY_API_KEY e as buscas de foto do cabeçalho.']); continue; }
    const pont = pontuar({ art, aud, outros: robot.db.articles, revisado: get('REVISADO') === 'sim' });
    console.log(`  🎯 pontuação ${pont.total}/100 (nota ${de10(pont.total)}/10) → ${pont.decisao} (qualidade ${pont.partes.qualidade} | demanda ${pont.partes.demanda} | fontes ${pont.partes.fontes} | originalidade ${pont.partes.originalidade} | formato ${pont.partes.formato})`);
    if (pont.motivos.length) console.log(`     pontos de atenção: ${pont.motivos.slice(0, 4).join('; ')}`);
    if (pont.decisao === 'DEVOLVER') { relatorio([`Pontuação ${pont.total}/100: DEVOLVER`, ...pont.motivos]); console.log('  ⛔ devolvido pela pontuação; veja o .relatorio.md'); continue; }
    const agora = new Date().toISOString();
    delete art.bodyOriginal; delete art._substitui;
    Object.assign(art, { status: 'draft', estoque: true, estocadoEm: agora, scores: { auditoria: aud.nota, demanda: dem ? dem.classe : 'não medida', total: pont.total, decisao: pont.decisao, partes: pont.partes, atencao: pont.motivos.slice(0, 8) }, validador: 'Auditoria automática (sem API); texto escrito fora do robô', origem: 'importado',
      validacao: { palavraChave: keyword, demanda: dem ? { volume: dem.volume, classe: dem.classe, tendencia: dem.tendencia, concorrencia: dem.concorrencia, fonte: dem.fonte, fraseMedida: dem.frase, porSimilar: dem.porSimilar } : { classe: 'não medida' }, volume: pauta.volume, cluster: pauta.cluster, apoio: (pauta.secundarias || []).map((x) => x.palavra), perguntasDoGoogle: pauta.absorve || [], concorrentes: concorrentes.length ? concorrentes : 'não informado (concorrente não conferido)', lacunasCobertas: lacunas, serp: pauta.serp || null, fontesDaPauta: fontes.map((f) => f.url), notas: pauta.notas || '', briefing: robot.readJson(`data/briefings/${slugify(keyword)}.json`, null), validadoEm: agora, observacao: 'originalidade contra o concorrente não conferida automaticamente' } });
    const i = robot.db.articles.findIndex((x) => x.slug === art.slug);
    if (i >= 0) { art.createdAt = robot.db.articles[i].createdAt || art.createdAt; robot.db.articles[i] = art; } else robot.db.articles.push(art);
    robot.gravar();
    fs.mkdirSync(path.join(DIR, 'processados'), { recursive: true });
    fs.renameSync(caminho, path.join(DIR, 'processados', nome));
    fs.rmSync(caminho.replace(/\.txt$/, '.relatorio.md'), { force: true });
    guardados++;
    console.log(`  📦 guardado no estoque: /${art.slug}/ (nota ${de10(aud.nota)}/10)`);
  } catch (e) { relatorio([e.message]); console.error(`  ❌ ${e.message}`); }
}
console.log(`\n📊 ${guardados} de ${arquivos.length} guardados.`);
