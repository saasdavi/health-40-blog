// Coletor local de SERP (rodar no COMPUTADOR do usuário, com navegador de verdade). Sem API, sem custo.
//   npm i --no-save playwright          (uma vez; usa o Chrome já instalado, não baixa navegador)
//   node scripts/coletor-serp.js --so-sim --limite 10 --topo 3 [--tema Cabelo] [--push]
//   node scripts/coletor-serp.js --urls data/entrada/urls-topo.txt   (sem Google: você cola as URLs do topo; blocos separados por linha em branco, 1ª linha = palavra)
//   node scripts/coletor-serp.js --so-links --limite 5   (só a busca no Google: grava as 5 URLs do topo (ou --topo N) + perguntas e gera data/entrada/urls-topo.txt; não abre os concorrentes)
//   node scripts/coletor-serp.js --mock   (teste offline com HTML de exemplo em scripts/fixtures/serp/)
// Lê data/conteudo/pautas-mestre.csv (grupo 2), abre o Google, pega o topo orgânico, abre as primeiras páginas, guarda SÓ métricas
// (nunca o texto do concorrente) em data/pesquisa/serp-resultados.json e data/pesquisa/concorrentes/<slug>.json, e regenera a planilha mestre.
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { metricasHtml } from './lib/seo-pagina.js';
import { norm } from './demanda-lib.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const flag = (n) => args.includes(n);
const URLS = opt('--urls'), MOCK = flag('--mock'), LIMITE = Number(opt('--limite', 5)), TOPO = Number(opt('--topo', 3)), TEMA = opt('--tema'), SO_SIM = flag('--so-sim'), SO_LINKS = flag('--so-links'), NLINKS = args.includes('--topo') ? Number(opt('--topo', 5)) : 5, PUSH = flag('--push');
const lerJson = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(raiz, f), 'utf8')); } catch { return d; } };
const chave = (s) => norm(s).split(' ').sort().join(' ');
const slugify = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const limpa = (t) => String(t || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);

// ---------- extração do HTML do Google (função pura, testável offline) ----------
const GOOGLE = /(^|\.)(google\.[a-z.]+|gstatic\.com|googleusercontent\.com|youtube\.com|webcache\.googleusercontent\.com)$/i;
const AUTORIDADE = /(gov\.br|\.gov$|nih\.gov|medlineplus|who\.int|scielo|einstein\.br|hospitalsiriolibanes|hospitaloswaldocruz|drauziovarella|tuasaude|msdmanuals|mayoclinic|clevelandclinic|hopkinsmedicine|nhs\.uk|cdc\.gov|sbn\.org|cardiol\.br|diabetes\.org\.br|endocrino\.org|inca\.gov|minhavida|saude\.abril|dasa\.com|fleury|hcor\.com|unimed|bvsms)/i;
const FRACO = /(instagram|facebook|tiktok|pinterest|reddit|quora|wikipedia|twitter|x\.com|linkedin|doctoralia\.com\.br\/perguntas|answers\.|forum|mercadolivre|amazon|shopee|americanas|magazineluiza|drogasil|drogaraia|paguemenos)/i;
const LOJA = /(mercadolivre|amazon|shopee|americanas|magazineluiza|drogasil|drogaraia|paguemenos|loja|shop)/i;
export function extrairSerp(html) {
  const captcha = /unusual traffic|tráfego incomum|g-recaptcha|\/sorry\/index|Our systems have detected/i.test(html);
  const organicos = []; const vistos = new Set();
  for (const m of html.matchAll(/<a\b[^>]*href="(https?:\/\/[^"]+)"[^>]*>((?:(?!<\/a>)[\s\S])*?)<h3[^>]*>([\s\S]*?)<\/h3>/gi)) {
    let u; try { u = new URL(m[1].replace(/&amp;/g, '&')); } catch { continue; }
    const host = u.hostname.replace(/^www\./, ''); if (GOOGLE.test(host) || vistos.has(host + u.pathname)) continue;
    vistos.add(host + u.pathname); organicos.push({ titulo: limpa(m[3]), url: u.href, host });
  }
  const perguntas = [...new Set([...html.matchAll(/data-q="([^"]+)"/gi)].map((m) => limpa(m[1])))].slice(0, 10);
  const relacionadas = [...new Set([...html.matchAll(/<a\b[^>]*href="\/search\?[^"]*q=([^"&]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => limpa(m[2])).filter((t) => t.length > 5 && t.length < 90))].slice(0, 10);
  return { captcha, organicos: organicos.slice(0, 10), perguntas, relacionadas, aiOverview: /Visão geral criada por IA|AI Overview|Visão geral de IA/i.test(html) };
}
export function classificar(organicos) {
  const top5 = organicos.slice(0, 5), top3 = organicos.slice(0, 3);
  const aut5 = top5.filter((o) => AUTORIDADE.test(o.host)).map((o) => o.host), aut3 = top3.filter((o) => AUTORIDADE.test(o.host));
  const lojas = organicos.slice(0, 5).filter((o) => LOJA.test(o.host)).length, fracos = organicos.filter((o) => FRACO.test(o.host + o.url)).length;
  let veredito = 'dificil', nivel = 'DIFÍCIL';
  if (aut3.length <= 1 && lojas === 0) { veredito = 'facil'; nivel = aut5.length === 0 ? 'FÁCIL' : 'MÉDIA-FÁCIL'; }
  else if (aut5.length <= 2) { veredito = 'media'; nivel = 'MÉDIA'; }
  return { veredito, nivel, autoridadesTop5: aut5, fracosTop10: fracos, lojasTop5: lojas };
}
const mediana = (v) => { const a = v.filter((x) => typeof x === 'number').sort((x, y) => x - y); if (!a.length) return null; const m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2); };
const chaveH2 = (h) => norm(h).split(' ').filter((t) => t.length > 3).sort().slice(0, 3).join(' ');
export function analisar(paginas, perguntas) {
  const contagem = new Map(); paginas.forEach((p) => new Set((p.secoes || []).map(chaveH2).filter(Boolean)).forEach((k) => contagem.set(k, (contagem.get(k) || 0) + 1)));
  const exemplo = new Map(); paginas.forEach((p) => (p.secoes || []).forEach((h) => { const k = chaveH2(h); if (k && !exemplo.has(k)) exemplo.set(k, h); }));
  const comuns = [...contagem].filter(([, n]) => n >= 2).map(([k]) => exemplo.get(k)).slice(0, 10);
  const textoH2 = norm(paginas.flatMap((p) => p.secoes || []).join(' '));
  const lacunas = (perguntas || []).filter((q) => { const t = norm(q).split(' ').filter((x) => x.length > 3); return t.length && t.filter((x) => textoH2.includes(x)).length / t.length < 0.6; }).slice(0, 6);
  const tc = new Map(); paginas.forEach((p) => (p.termosFrequentes || []).forEach((t) => { const k = t.replace(/ \(\d+\)$/, ''); tc.set(k, (tc.get(k) || 0) + 1); }));
  const termosComuns = [...tc].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k]) => k);
  return { medianaPalavras: mediana(paginas.map((p) => p.palavras)), h2Comuns: comuns, lacunas, termosComuns };
}

// ---------- entrada: pautas da planilha mestre ----------
function lerCsv(f) {
  return fs.readFileSync(path.join(raiz, f), 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean).slice(1).map((l) => { const c = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ';' && !q) { c.push(cur); cur = ''; } else cur += ch; } c.push(cur); return c; });
}
function lerBlocosUrls(f) {
  return fs.readFileSync(path.join(raiz, f), 'utf8').replace(/^﻿/, '').split(/\r?\n\s*\r?\n/).map((b) => b.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)).filter((b) => b.length > 1)
    .map((b) => ({ kw: b[0], urls: b.slice(1).filter((u) => /^https?:\/\//.test(u)) }));
}
// Cópia LOCAL (fora do Git: .cache/ está no .gitignore) do HTML e do texto de cada concorrente, para você conferir (equivale ao Ctrl+U) e usar de referência.
function guardarLocal(kw, n, host, html) {
  try {
    const dir = path.join(raiz, '.cache', 'serp', slugify(kw)); fs.mkdirSync(dir, { recursive: true });
    const base = `${String(n).padStart(2, '0')}-${slugify(host)}`;
    fs.writeFileSync(path.join(dir, `${base}.html`), html);
    const corpo = html.replace(/<(script|style|noscript|nav|header|footer|aside)[\s\S]*?<\/\1>/gi, ' ').replace(/<\/(p|h[1-6]|li|div|tr)>/gi, '\n');
    fs.writeFileSync(path.join(dir, `${base}.txt`), corpo.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim());
  } catch {}
}
const perguntar = (t) => new Promise((r) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question(t, (a) => { rl.close(); r(a); }); });

async function main() {
  const serp = lerJson('data/pesquisa/serp-resultados.json', {});
  const feitos = new Set(Object.keys(serp).map(chave));
  const blocos = URLS ? lerBlocosUrls(URLS) : null;
  let fila = blocos ? blocos.map((b) => ['2', '', b.kw, '', '', '', '', '', '', '', 'SIM']) : lerCsv('data/conteudo/pautas-mestre.csv').filter((r) => r[0].startsWith('2') && !feitos.has(chave(r[2])));
  if (TEMA && !blocos) fila = fila.filter((r) => norm(r[1]).includes(norm(TEMA)));
  if (SO_SIM && !blocos) fila = fila.filter((r) => r[10] === 'SIM');
  fila = fila.slice(0, LIMITE);
  if (!fila.length) { console.log('Nada a coletar (todas já têm Google checado, ou o filtro não achou palavras).'); return; }
  console.log(`🔎 ${fila.length} palavra(s)${MOCK ? ' [MOCK: HTML de exemplo]' : ''}`);

  let ctx = null, page = null;
  const fix = (n) => fs.readFileSync(path.join(raiz, 'scripts/fixtures/serp', n), 'utf8');
  if (!MOCK) {
    let chromium; try { ({ chromium } = await import('playwright')); } catch { console.error('❌ Falta o Playwright. Rode uma vez:  npm i --no-save playwright'); process.exit(1); }
    ctx = await chromium.launchPersistentContext(path.join(raiz, '.coletor-perfil'), { channel: 'chrome', headless: false, locale: 'pt-BR', viewport: { width: 1280, height: 900 } });
    page = ctx.pages()[0] || await ctx.newPage();
  }
  const pegarHtml = async (url) => {
    if (MOCK) return url.includes('google') ? fix('serp.html') : fix('pagina.html');
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (resp && resp.status() >= 400 && !/google\./.test(url)) throw new Error(`página não existe ou bloqueou (HTTP ${resp.status()})`);
    if (/consent\.google/.test(page.url())) { try { await page.getByRole('button', { name: /Aceitar tudo|Rejeitar tudo|Accept all|Reject all/i }).first().click({ timeout: 8000 }); } catch {} }
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    return page.content();
  };

  const novos = {}; let captchas = 0, parar = false;
  for (const r of fila) {
    const kw = r[2]; console.log(`\n🔍 ${kw}`);
    try {
      let s;
      if (blocos) {
        const b = blocos.find((x) => x.kw === kw);
        s = { captcha: false, organicos: b.urls.map((u) => { const host = new URL(u).hostname.replace(/^www\./, ''); return { titulo: '', url: u, host }; }), perguntas: [], relacionadas: [], aiOverview: false };
      } else {
        let html = await pegarHtml(`https://www.google.com.br/search?q=${encodeURIComponent(kw)}&hl=pt-BR&gl=br&num=10`);
        s = extrairSerp(html);
        while (s.captcha && !MOCK) {
          captchas++;
          if (captchas >= 3) { console.log('\n⛔ 3 verificações do Google nesta sessão. Parando para não piorar o bloqueio. Espere algumas horas ou use --urls.'); parar = true; break; }
          await perguntar('⚠️  O Google pediu verificação. Resolva no navegador aberto e aperte Enter aqui... '); html = await page.content(); s = extrairSerp(html);
        }
        if (parar) break;
      }
      if (!s.organicos.length) { console.log('  ⚠️ nenhum resultado orgânico lido (o Google mudou a página?). Pulando.'); continue; }
      const cls = classificar(s.organicos);
      const paginas = [];
      for (const o of (SO_LINKS ? [] : s.organicos.slice(0, TOPO))) {
        try { const h = await pegarHtml(o.url); const m = metricasHtml(h, { keyword: kw }); guardarLocal(kw, paginas.length + 1, o.host, h); paginas.push({ url: o.url, host: o.host, tituloGoogle: o.titulo, ...m }); console.log(`  📄 #${paginas.length} ${o.host}: ${m.palavras} palavras, ${m.h2} H2, imagens ${m.imagensComAlt}/${m.imagens} com alt, palavra-chave no título: ${m.kwNoTitulo ? 'sim' : 'não'}, ${m.kwUsos ?? '?'} usos${AUTORIDADE.test(o.host) ? ' [AUTORIDADE]' : ''}`); }
        catch (e) { paginas.push({ url: o.url, host: o.host, erro: String(e.message).slice(0, 80) }); console.log(`  ⚠️ ${o.host}: ${String(e.message).slice(0, 60)}`); }
        if (!MOCK) await esperar(rand(3000, 7000));
      }
      const ana = analisar(paginas.filter((p) => !p.erro), s.perguntas);
      const hoje = new Date().toISOString().slice(0, 10);
      serp[kw] = { data: hoje, fonte: 'navegador local (Playwright)', veredito: cls.veredito, nivel: cls.nivel, autoridadesTop5: cls.autoridadesTop5, fracosTop10: cls.fracosTop10, topoDoGoogle: s.organicos.map((o) => o.host).join(', '), topoUrls: s.organicos.slice(0, SO_LINKS ? NLINKS : 5).map((o) => o.url), aiOverview: s.aiOverview, perguntas: s.perguntas, relacionadas: s.relacionadas };
      if (SO_LINKS) {
        if (!MOCK) { fs.mkdirSync(path.join(raiz, 'data/entrada'), { recursive: true });
        fs.appendFileSync(path.join(raiz, 'data/entrada/urls-topo.txt'), `${kw}\n${s.organicos.slice(0, NLINKS).map((o) => o.url).join('\n')}\n\n`); }
        novos[kw] = cls.veredito; console.log(`  🔗 ${Math.min(NLINKS, s.organicos.length)} link(s) do topo salvos (${cls.nivel}); ${s.perguntas.length} pergunta(s) do Google`); continue;
      }
      fs.mkdirSync(path.join(raiz, 'data/pesquisa/concorrentes'), { recursive: true });
      fs.writeFileSync(path.join(raiz, `data/pesquisa/concorrentes/${slugify(kw)}.json`), JSON.stringify({ keyword: kw, data: hoje, veredito: cls.veredito, paginas, ...ana }, null, 1));
      novos[kw] = cls.veredito; console.log(`  ✅ ${cls.nivel} | mediana ${ana.medianaPalavras ?? '?'} palavras | ${ana.lacunas.length} lacuna(s)`);
    } catch (e) { console.log(`  ❌ ${String(e.message).slice(0, 100)}`); }
    if (!MOCK && !blocos) await esperar(rand(30000, 60000));
  }
  if (ctx) await ctx.close();
  if (MOCK) { console.log('\n(MOCK: nada foi gravado em serp-resultados.json)'); fs.mkdirSync('/tmp/coletor-mock', { recursive: true }); fs.writeFileSync('/tmp/coletor-mock/serp.json', JSON.stringify(serp, null, 1)); return; }
  fs.writeFileSync(path.join(raiz, 'data/pesquisa/serp-resultados.json'), JSON.stringify(serp, null, 2));
  execSync('node scripts/exportar-pautas-csv.js', { cwd: raiz, stdio: 'inherit' });
  try { execSync('node scripts/exportar-concorrentes-texto.js', { cwd: raiz, stdio: 'inherit' }); } catch {}
  console.log(`\n📊 ${Object.keys(novos).length} palavra(s) coletada(s). Planilha mestre atualizada.`);
  if (PUSH) { try { execSync('git add -A && git commit -m "Coletor SERP: concorrentes e dificuldade atualizados" && git pull --rebase origin main && git push', { cwd: raiz, stdio: 'inherit' }); } catch { console.log('⚠️ push não concluído; rode git push depois.'); } }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
