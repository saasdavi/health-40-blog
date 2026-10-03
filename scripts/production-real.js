/**
 * PRODUCTION REAL - PHASE 10 CORRETO
 *
 * Fluxo REAL com APIs:
 * 1. Pega keyword validada
 * 2. Google Search API → Busca 2-3 concorrentes REAIS
 * 3. Claude → Analisa concorrentes
 * 4. Claude → Escreve artigo ORIGINAL baseado em análise
 * 5. Publica com metadata real
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYWORDS_FILE = path.join(__dirname, '../data/keywords.json');
const ARTICLES_FILE = path.join(__dirname, '../data/articles.json');

const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * Google Search - Get REAL competitors
 */
async function googleSearch(keyword) {
  return new Promise((resolve) => {
    if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
      console.warn('⚠️  Google Search API não configurada');
      resolve([]);
      return;
    }

    const params = new URLSearchParams({
      key: GOOGLE_SEARCH_API_KEY,
      cx: GOOGLE_SEARCH_ENGINE_ID,
      q: keyword,
      num: 10,
      lr: 'lang_pt'
    });

    const url = `https://www.googleapis.com/customsearch/v1?${params}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const items = (result.items || []).filter(item => {
            const url = item.link.toLowerCase();
            return !url.includes('facebook') &&
                   !url.includes('linkedin') &&
                   item.snippet.length > 50;
          });

          resolve(items.slice(0, 3).map((item, idx) => ({
            position: idx + 1,
            title: item.title,
            url: item.link,
            snippet: item.snippet,
            domain: new URL(item.link).hostname
          })));
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

/**
 * Claude análise de concorrentes
 */
async function analyzeCompetitors(keyword, competitors) {
  if (!ANTHROPIC_API_KEY) {
    console.log('   ℹ️  ANTHROPIC_API_KEY não configurada');
    return null;
  }

  const competitorSummary = competitors
    .map((c, i) => `
Concorrente ${i+1}: ${c.title}
URL: ${c.url}
Snippet: "${c.snippet}"`)
    .join('\n---\n');

  const prompt = `Analise estes 3 concorrentes do Google Search para "${keyword}" e responda com JSON:

${competitorSummary}

Responda APENAS com JSON válido (sem markdown, sem explicação):
{
  "keyword": "${keyword}",
  "competitorPatterns": ["padrão 1", "padrão 2"],
  "gaps": ["gap 1", "gap 2"],
  "opportunities": ["oportunidade 1"],
  "recommendedStructure": ["seção 1", "seção 2"],
  "tone": "tom recomendado"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      console.warn('⚠️  Claude API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.content[0].text.trim();
    const analysis = JSON.parse(content);

    return analysis;
  } catch (error) {
    console.warn('⚠️  Analysis error:', error.message);
    return null;
  }
}

/**
 * Claude escreve artigo ORIGINAL
 */
async function writeArticle(keyword, analysis, language = 'pt') {
  if (!ANTHROPIC_API_KEY) {
    console.log('   ℹ️  Usando template (API não configurada)');
    return generateTemplate(keyword, analysis);
  }

  const lang_text = language === 'pt' ? 'português' : 'inglês';
  const audience = language === 'pt'
    ? 'mulheres brasileiras 30+'
    : 'mulheres globais 30+';

  const prompt = `Escreva um artigo ORIGINAL em ${lang_text} para "${keyword}"
dirigido a ${audience}.

Padrões dos concorrentes: ${analysis.competitorPatterns.join(', ')}
Gaps a preencher: ${analysis.gaps.join(', ')}
Oportunidades: ${analysis.opportunities.join(', ')}
Estrutura: ${analysis.recommendedStructure.join(' → ')}
Tom: ${analysis.tone}

Requisitos:
- 2000-2500 palavras
- Completamente ORIGINAL (não copiar concorrentes)
- Responder totalmente a "${keyword}"
- Preencher os gaps identificados
- Tom: ${analysis.tone}
- Incluir 4 CTAs para Mounjaxi Vitta

Escreva APENAS o conteúdo do artigo (sem frontmatter).`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      console.warn('⚠️  Claude write error');
      return generateTemplate(keyword, analysis);
    }

    const data = await response.json();
    const content = data.content[0].text;

    return {
      title: keyword,
      slug: keyword.toLowerCase().replace(/\s+/g, '-'),
      description: `Guia completo sobre ${keyword}`,
      content: content,
      wordCount: content.split(/\s+/).length,
      language: language,
      hasMounjaxi: true,
      analysis: analysis
    };
  } catch (error) {
    console.warn('⚠️  Write error:', error.message);
    return generateTemplate(keyword, analysis);
  }
}

/**
 * Template fallback
 */
function generateTemplate(keyword, analysis) {
  const content = `# ${keyword}

## Introdução

Este artigo cobre os pontos que os concorrentes deixam de lado:
${analysis.gaps.map(g => `- ${g}`).join('\n')}

## Pontos principais

${analysis.recommendedStructure.map(s => `### ${s}\nConteúdo sobre ${s}...`).join('\n\n')}

## Conclusão

${analysis.opportunities[0] || 'Resumo do artigo'}
`;

  return {
    title: keyword,
    slug: keyword.toLowerCase().replace(/\s+/g, '-'),
    description: `Guia sobre ${keyword}`,
    content: content,
    wordCount: content.split(/\s+/).length,
    language: 'pt',
    hasMounjaxi: true,
    analysis: analysis
  };
}

/**
 * Main production flow
 */
async function produceContent() {
  console.log('✍️  PRODUCTION REAL - Fluxo com Google Search API\n');

  try {
    const keywordsData = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf-8'));
    const articlesData = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf-8'));

    // Pega próxima keyword não planejada
    const validatedKeywords = keywordsData.keywords.filter(
      k => k.status === 'validated' && !k.article_planned
    );

    if (validatedKeywords.length === 0) {
      console.log('⏳ Nenhuma keyword validada disponível');
      return;
    }

    const keyword = validatedKeywords[0];
    console.log(`🎯 Keyword: "${keyword.keyword}"\n`);

    // STEP 1: Google Search API - Buscar concorrentes REAIS
    console.log('🔍 Buscando concorrentes reais com Google Search API...');
    const competitors = await googleSearch(keyword.keyword);

    if (competitors.length === 0) {
      console.log('⚠️  Nenhum concorrente encontrado');
      return;
    }

    console.log(`✅ Encontrados ${competitors.length} concorrentes:`);
    competitors.forEach(c => console.log(`   ${c.position}. ${c.title.substring(0, 50)}...`));

    // STEP 2: Claude análise de concorrentes
    console.log('\n📊 Analisando concorrentes com Claude...');
    const analysis = await analyzeCompetitors(keyword.keyword, competitors);

    if (!analysis) {
      console.log('⚠️  Análise falhou');
      return;
    }

    console.log(`✅ Análise concluída:`);
    console.log(`   Padrões: ${analysis.competitorPatterns.length}`);
    console.log(`   Gaps: ${analysis.gaps.length}`);
    console.log(`   Oportunidades: ${analysis.opportunities.length}`);

    // STEP 3: Claude escreve artigo original
    console.log('\n✍️  Escrevendo artigo original com Claude...');
    const article = await writeArticle(keyword.keyword, analysis, 'pt');

    console.log(`✅ Artigo escrito:`);
    console.log(`   Título: ${article.title}`);
    console.log(`   Palavras: ${article.wordCount}`);
    console.log(`   Com Mounjaxi: ${article.hasMounjaxi}`);

    // STEP 4: Salvar artigo
    articlesData.articles.push({
      id: `art_${Date.now()}`,
      ...article,
      status: 'draft',
      createdAt: new Date().toISOString(),
      competitors: competitors.map(c => ({ title: c.title, url: c.url }))
    });

    // Marcar keyword como planejada
    keyword.article_planned = true;
    keywordsData.keywords = keywordsData.keywords.map(k =>
      k.id === keyword.id ? keyword : k
    );

    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articlesData, null, 2));
    fs.writeFileSync(KEYWORDS_FILE, JSON.stringify(keywordsData, null, 2));

    console.log('\n✅ PRODUCTION REAL concluída!');
    console.log(`   Próximo: PHASE 11 (Review)`);

  } catch (error) {
    console.error('❌ Production error:', error.message);
    process.exit(1);
  }
}

produceContent();
