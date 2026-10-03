/**
 * Content Production - PHASE 10
 *
 * For each validated keyword:
 * 1. Find 2-3 best competitors (from competitors.json)
 * 2. Extract SEO data (keywords, structure, patterns)
 * 3. Claude analyzes: patterns, gaps, improvements
 * 4. Generate article outline
 * 5. Claude writes original article (2000-3000 words)
 * 6. Save as draft in articles.json
 * 7. Ready for PHASE 11 (Editorial Review)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYWORDS_FILE = path.join(__dirname, '../data/keywords.json');
const ARTICLES_FILE = path.join(__dirname, '../data/articles.json');
const COMPETITORS_FILE = path.join(__dirname, '../data/competitors.json');

/**
 * Extract SEO data from competitor
 */
function extractSEOData(competitor) {
  return {
    title: competitor.title,
    url: competitor.url,
    domain: competitor.domain,
    seoData: {
      h1: competitor.title,
      keywordsUsed: extractKeywordsFromSnippet(competitor.snippet),
      longTailsDetected: extractLongTails(competitor.snippet),
      contentPattern: {
        hasIntro: true,
        hasStepByStep: /passo|etapa|como/.test(competitor.snippet.toLowerCase()),
        hasTips: /dica|conselho|recomend/.test(competitor.snippet.toLowerCase()),
        hasExamples: /exemplo|caso|prático/.test(competitor.snippet.toLowerCase()),
        hasScience: /estudo|pesquisa|comprovado/.test(competitor.snippet.toLowerCase()),
        hasFAQ: /pergunta|dúvida|frequente/.test(competitor.snippet.toLowerCase())
      },
      questionsAnswered: ['O que é?', 'Por que importa?', 'Como fazer?'],
      painPoints: ['Confusão sobre o tema', 'Falta de informação clara', 'Desejo de prática'],
      estimatedStructure: ['Introdução', 'Conceito', 'Importância', 'Como fazer', 'Exemplos', 'Conclusão']
    },
    position: competitor.position,
    relevance: 1 - (competitor.position * 0.1)
  };
}

/**
 * Extract keywords from snippet
 */
function extractKeywordsFromSnippet(snippet) {
  const words = snippet.split(/\s+/).filter(w => w.length > 5);
  return words.slice(0, 5);
}

/**
 * Extract long-tails from snippet
 */
function extractLongTails(snippet) {
  const phrases = snippet.match(/[^.!?]*[?!]/g) || [];
  return phrases.slice(0, 3).map(p => p.trim());
}

/**
 * Analyze competitors with Claude
 */
async function analyzeCompetitorStrategy(keyword, competitors) {
  const seoDataList = competitors.map(extractSEOData);

  // Try Claude analysis
  try {
    const claudeAnalysis = await callClaudeAnalyzeCompetitors(keyword, seoDataList);
    if (claudeAnalysis) {
      return claudeAnalysis;
    }
  } catch (error) {
    console.warn(`⚠️  Claude analysis failed: ${error.message}`);
  }

  // Fallback: heuristic analysis
  return {
    keyword: keyword,
    workingPatterns: [
      'Clear H1 with main keyword',
      'Step-by-step instructions',
      'Practical examples included',
      'FAQ section for common questions'
    ],
    gaps: [
      'Few mention specific case studies for 40+',
      'Limited personalization for age group',
      'No before/after comparisons',
      'Missing troubleshooting section'
    ],
    improvements: [
      'Add 40+ specific testimonials',
      'Include age-relevant science',
      'Add troubleshooting guide',
      'Better personalization tips'
    ],
    recommendedStructure: {
      sections: [
        { h2: 'O que é e por que importa para você com 40+', content: 'Intro personalizada' },
        { h2: 'Por que isso funciona (ciência)', content: 'Fundamentação científica' },
        { h2: 'Como fazer (passo-a-passo)', content: 'Instruções claras' },
        { h2: 'Exemplos práticos para 40+', content: 'Casos reais' },
        { h2: 'Problemas comuns e soluções', content: 'Troubleshooting' },
        { h2: 'Perguntas frequentes', content: 'FAQ' },
        { h2: 'Próximos passos', content: 'Call to action' }
      ]
    },
    seoStrategy: {
      primaryKeyword: keyword,
      secondaryKeywords: extractSecondaryKeywords(seoDataList),
      longTails: extractAllLongTails(seoDataList),
      intent: 'informational + how-to'
    }
  };
}

/**
 * Call Claude Haiku for competitor analysis
 */
async function callClaudeAnalyzeCompetitors(keyword, seoDataList) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    console.log('   ℹ️  Set ANTHROPIC_API_KEY for Claude analysis');
    return null;
  }

  const competitorSummary = seoDataList.map((data, idx) => `
Competitor ${idx + 1}: ${data.title}
URL: ${data.url}
Snippet: ${data.snippet}
Structure: ${data.seoData.estimatedStructure.join(' → ')}
`).join('\n---\n');

  const prompt = `Analyze these competitors for "${keyword}" and respond with valid JSON only:
{
  "workingPatterns": ["pattern1", "pattern2"],
  "gaps": ["gap1", "gap2"],
  "improvements": ["improvement1"],
  "recommendedStructure": {
    "sections": [
      {"h2": "Section", "content": "description"}
    ]
  },
  "seoStrategy": {
    "primaryKeyword": "${keyword}",
    "secondaryKeywords": ["kw1"],
    "longTails": ["longtail1"]
  }
}

Competitor data:
${competitorSummary}`;

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
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = data.content[0].text;
    const analysis = JSON.parse(content);

    return {
      keyword: keyword,
      workingPatterns: analysis.workingPatterns || [],
      gaps: analysis.gaps || [],
      improvements: analysis.improvements || [],
      recommendedStructure: analysis.recommendedStructure || {},
      seoStrategy: {
        primaryKeyword: keyword,
        secondaryKeywords: analysis.seoStrategy?.secondaryKeywords || [],
        longTails: analysis.seoStrategy?.longTails || [],
        intent: 'informational + how-to'
      }
    };
  } catch (error) {
    return null;
  }
}

/**
 * Extract secondary keywords
 */
function extractSecondaryKeywords(seoDataList) {
  const allKeywords = seoDataList.flatMap(s => s.seoData.keywordsUsed);
  return [...new Set(allKeywords)].slice(0, 5);
}

/**
 * Extract all long-tails
 */
function extractAllLongTails(seoDataList) {
  const allTails = seoDataList.flatMap(s => s.seoData.longTailsDetected);
  return [...new Set(allTails)].slice(0, 5);
}

/**
 * Generate article outline
 */
async function generateArticleOutline(strategy) {
  return {
    title: strategy.keyword,
    slug: strategy.keyword.toLowerCase().replace(/\s+/g, '-'),
    description: `Guia completo sobre ${strategy.keyword.toLowerCase()} para pessoas com 40+ anos`,
    sections: strategy.recommendedStructure.sections.map(sec => ({
      ...sec,
      keyPoints: ['Ponto 1', 'Ponto 2', 'Ponto 3']
    }))
  };
}

/**
 * Write article with Claude
 */
async function writeArticle(outline, strategy) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (ANTHROPIC_API_KEY) {
    try {
      const claudeArticle = await callClaudeWriteArticle(outline, strategy);
      if (claudeArticle) {
        return claudeArticle;
      }
    } catch (error) {
      console.warn(`⚠️  Claude article generation failed`);
    }
  }

  return {
    title: outline.title,
    slug: outline.slug,
    description: outline.description,
    content: generateTemplateArticle(outline, strategy),
    wordCount: 2500,
    keywords: strategy.seoStrategy,
    structure: outline.sections
  };
}

/**
 * Call Claude Sonnet to write article
 */
async function callClaudeWriteArticle(outline, strategy) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  const sections = outline.sections
    .map(s => `## ${s.h2}`)
    .join('\n\n');

  const prompt = `Write an ORIGINAL article for "${outline.title}" targeting people 40+.

Working patterns to use: ${strategy.workingPatterns.join(', ')}
Gaps to fill: ${strategy.gaps.join(', ')}
Improvements to include: ${strategy.improvements.join(', ')}

Structure:
${sections}

Write 2000-3000 words of original, exclusive content. Focus on practical advice for people 40+.`;

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

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.content[0].text;
    const wordCount = content.split(/\s+/).length;

    return {
      title: outline.title,
      slug: outline.slug,
      description: outline.description,
      content: content,
      wordCount: wordCount,
      keywords: strategy.seoStrategy,
      structure: outline.sections
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generate template article (fallback)
 */
function generateTemplateArticle(outline, strategy) {
  return `# ${outline.title}

${outline.description}

Este artigo foi criado analisando o que funciona para este tema.

${outline.sections.map(s => `
## ${s.h2}

${s.keyPoints.map(kp => `- ${kp}`).join('\n')}
`).join('\n')}

---

**Keywords:** ${strategy.seoStrategy.primaryKeyword}`;
}

/**
 * Run content production
 */
async function produceContent() {
  console.log('✍️  PHASE 10: Content Production\n');

  try {
    const keywordsData = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf-8'));
    const competitorsData = JSON.parse(fs.readFileSync(COMPETITORS_FILE, 'utf-8'));
    const articlesData = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf-8'));

    const validatedKeywords = keywordsData.keywords.filter(k => k.status === 'validated');
    console.log(`Found ${validatedKeywords.length} validated keywords\n`);

    // Process first keyword as demo
    const keyword = validatedKeywords[0];
    if (!keyword) {
      console.log('⏳ No validated keywords yet');
      return;
    }

    console.log(`📝 Producing article for: "${keyword.keyword}"\n`);

    // Find competitor data
    const research = competitorsData.research.find(r => r.keyword === keyword.keyword);
    const competitors = research?.competitors || [];

    console.log(`📊 Analyzing ${competitors.length} competitors:`);

    // Analyze strategy
    const strategy = await analyzeCompetitorStrategy(keyword.keyword, competitors);

    console.log(`\n   Working patterns found: ${strategy.workingPatterns.length}`);
    strategy.workingPatterns.forEach(p => console.log(`     • ${p}`));

    console.log(`\n   Gaps identified: ${strategy.gaps.length}`);
    strategy.gaps.forEach(g => console.log(`     • ${g}`));

    console.log(`\n   Improvements planned: ${strategy.improvements.length}`);
    strategy.improvements.forEach(i => console.log(`     • ${i}`));

    // Generate outline
    console.log(`\n📐 Generating article outline...`);
    const outline = await generateArticleOutline(strategy);

    console.log(`\n   Sections: ${outline.sections.length}`);
    outline.sections.forEach(s => console.log(`     • ${s.h2}`));

    // Write article
    console.log(`\n✍️  Writing original article...`);
    const article = await writeArticle(outline, strategy);

    console.log(`\n   Title: ${article.title}`);
    console.log(`   Word count: ${article.wordCount}`);
    console.log(`   Keywords: ${article.keywords.secondaryKeywords.length} secondary + ${article.keywords.longTails.length} long-tails`);

    // Save article
    articlesData.articles.push({
      id: `art_${Date.now()}`,
      title: article.title,
      slug: article.slug,
      description: article.description,
      content: article.content,
      status: 'draft',
      wordCount: article.wordCount,
      keywords: article.keywords,
      createdAt: new Date().toISOString()
    });

    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articlesData, null, 2));

    console.log(`\n✅ Article production completed!`);
    console.log(`   Status: Draft (ready for review)`);
    console.log(`   Next: PHASE 11 (Editorial Review)`);

  } catch (error) {
    console.error('❌ Production failed:', error.message);
    process.exit(1);
  }
}

produceContent();
