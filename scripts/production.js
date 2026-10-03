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
 * Write article with Claude (BILINGUAL + Mounjaxi CTAs)
 */
async function writeArticle(outline, strategy, language = 'pt') {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (ANTHROPIC_API_KEY) {
    try {
      const claudeArticle = await callClaudeWriteArticle(outline, strategy, language);
      if (claudeArticle) {
        return claudeArticle;
      }
    } catch (error) {
      console.warn(`⚠️  Claude article generation failed`);
    }
  }

  return {
    title: outline.title,
    slug: language === 'en' ? outline.slug.replace('pt/', 'en/') : outline.slug,
    description: outline.description,
    content: generateTemplateArticle(outline, strategy, language),
    wordCount: 2500,
    keywords: strategy.seoStrategy,
    structure: outline.sections
  };
}

/**
 * Add Mounjaxi Vitta CTAs to article
 */
function addMounjauxiCTAs(content, language = 'pt') {
  if (language === 'pt') {
    const cta1 = `\n\n> 💡 **OFERTA ESPECIAL:** Muitas mulheres aos 40+ veem resultados em 30 dias com **[Mounjaxi Vitta](https://mounjaxivitta.com.br/?utm_source=blog)**. Aproveite FRETE GRÁTIS + 15% desconto com cupom SAUDE40!\n\n`;

    const cta2 = `\n\n## 🚀 OFERTA EXCLUSIVA - FRETE GRÁTIS + DESCONTO!\n\n**Mounjaxi Vitta** é o encapsulado mais vendido para mulheres 30+ que desejam:\n- ⚡ Acelerar metabolismo (comprovado)\n- 🎯 Reduzir apetite natural\n- 💪 Aumentar disposição e energia\n- ✨ Emagrecimento saudável e rápido\n\n### 🎁 PROMOÇÃO AGORA:\n\n| Pacote | Preço | Desconto | Frete | Total |\n|--------|-------|----------|-------|-------|\n| 1 Pote | R$299 | -18% | Grátis | **R$245** |\n| 2 Potes | R$598 | -25% | Grátis | **R$450** |\n| 3 Potes | R$897 | -33% | Grátis | **R$600** |\n\n**[🎯 COMPRAR AGORA - FRETE GRÁTIS](https://mounjaxivitta.com.br/?utm_source=blog&promo=saude40)**\n\n✅ Dinheiro de volta em 30 dias\n✅ Entrega 3-5 dias\n✅ +50.000 clientes satisfeitas\n\n`;

    const ctaFinal = `\n\n---\n\n## ⏰ ÚLTIMA CHANCE - PROMOÇÃO ENCERRA HOJE!\n\n### 🔥 OFERTA RELÂMPAGO:\n\n**[👉 COMPRE COM 15% DESCONTO + FRETE GRÁTIS](https://mounjaxivitta.com.br/?utm_source=blog&cupom=SAUDE40)**\n\n**CUPOM EXCLUSIVO:** \\\`SAUDE40\\\` (15% desconto)\n\n### Pacotes Disponíveis:\n- **1 Pote (R$245)** - Para testar\n- **2 Potes (R$450)** - 1 mês completo ⭐ MAIS VENDIDO\n- **3 Potes (R$600)** - 3 meses com GARANTIA 🏆\n\n### Por que Mounjaxi Vitta?\n✅ Fórmula 100% natural\n✅ Acelera metabolismo em 7 dias\n✅ Suprime apetite até 8 horas\n✅ Aumenta disposição imediatamente\n✅ Resultados garantidos em 30 dias\n✅ Usado por +50.000 mulheres felizes\n\n### Resultado Real:\n> \"Perdi 8kg em 1 mês com Mounjaxi + exercício. Recomendo!\" - Marina, 42 anos\n> \"Meu apetite diminuiu muito. Muito bom!\" - Carla, 45 anos\n\n**[🎯 NÃO PERCA - STOCK LIMITADO - COMPRE AGORA!](https://mounjaxivitta.com.br/?utm_source=blog)**\n\n⏳ **Promoção válida HOJE. Amanhã volta o preço normal!**\n\n*Seu corpo aos 40+ merece esse investimento em saúde e beleza* 💪✨\n\n`;

    // Insert CTAs at strategic positions
    const sections = content.split('\n## ');
    if (sections.length > 2) {
      // CTA after first section
      sections[1] = cta1 + sections[1];
      // CTA after middle section
      const midPoint = Math.floor(sections.length / 2);
      sections[midPoint] = cta2 + sections[midPoint];
    }

    return sections.join('\n## ') + ctaFinal;
  } else {
    const cta1 = `\n\n> 💡 **SPECIAL OFFER:** Many women 40+ see results in 30 days with **[Mounjaxi Vitta](https://mounjaxivitta.com.br/?utm_source=blog-en)**. Get FREE SHIPPING + 15% off with code HEALTH40!\n\n`;

    const cta2 = `\n\n## 🚀 EXCLUSIVE OFFER - FREE SHIPPING + DISCOUNT!\n\n**Mounjaxi Vitta** is the bestselling capsule for women 30+ who want to:\n- ⚡ Boost metabolism (proven)\n- 🎯 Reduce appetite naturally\n- 💪 Increase energy and vitality\n- ✨ Healthy weight loss fast\n\n### 🎁 PROMOTION NOW:\n\n| Package | Price | Discount | Shipping | Total |\n|---------|-------|----------|----------|-------|\n| 1 Bottle | $60 | -18% | Free | **$49** |\n| 2 Bottles | $120 | -25% | Free | $90 |\n| 3 Bottles | $180 | -33% | Free | $120 |\n\n**[🎯 BUY NOW - FREE SHIPPING](https://mounjaxivitta.com.br/?utm_source=blog-en&promo=health40)**\n\n✅ Money back in 30 days\n✅ Delivery 3-5 days\n✅ +50,000 satisfied customers\n\n`;

    const ctaFinal = `\n\n---\n\n## ⏰ LAST CHANCE - PROMOTION ENDS TODAY!\n\n### 🔥 FLASH SALE:\n\n**[👉 BUY WITH 15% OFF + FREE SHIPPING](https://mounjaxivitta.com.br/?utm_source=blog-en&coupon=HEALTH40)**\n\n**EXCLUSIVE CODE:** \\\`HEALTH40\\\` (15% off)\n\n### Available Packages:\n- **1 Bottle ($49)** - Try it out\n- **2 Bottles ($90)** - 1 month supply ⭐ BESTSELLER\n- **3 Bottles ($120)** - 3 months with GUARANTEE 🏆\n\n### Why Mounjaxi Vitta?\n✅ 100% natural formula\n✅ Boosts metabolism in 7 days\n✅ Suppresses appetite up to 8 hours\n✅ Increases energy immediately\n✅ Results guaranteed in 30 days\n✅ Used by +50,000 happy women\n\n### Real Results:\n> \"Lost 18lbs in 1 month with Mounjaxi + exercise. Highly recommend!\" - Marina, 42\n> \"My appetite decreased so much. Very good!\" - Carla, 45\n\n**[🎯 DON'T MISS - LIMITED STOCK - BUY NOW!](https://mounjaxivitta.com.br/?utm_source=blog-en)**\n\n⏳ **Promotion valid TODAY. Tomorrow prices go back to normal!**\n\n*Your 40+ body deserves this investment in health and beauty* 💪✨\n\n`;

    const sections = content.split('\n## ');
    if (sections.length > 2) {
      sections[1] = cta1 + sections[1];
      const midPoint = Math.floor(sections.length / 2);
      sections[midPoint] = cta2 + sections[midPoint];
    }

    return sections.join('\n## ') + ctaFinal;
  }
}

/**
 * Call Claude Haiku to write article (BILINGUAL)
 */
async function callClaudeWriteArticle(outline, strategy, language = 'pt') {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  const sections = outline.sections
    .map(s => `## ${s.h2}`)
    .join('\n\n');

  const languageInstruction = language === 'pt'
    ? 'Escreva em PORTUGUÊS (brasileiro) um artigo ORIGINAL'
    : 'Write in ENGLISH an ORIGINAL article';

  const targetAudience = language === 'pt'
    ? 'mulheres brasileiras acima de 40 anos'
    : 'women over 40 years old';

  const mounjaxyNote = language === 'pt'
    ? 'IMPORTANTE: Este artigo será complementado com 4 CTAs para Mounjaxi Vitta (https://mounjaxivitta.com.br/), então estruture o conteúdo de forma que os CTAs se encaixem naturalmente.'
    : 'IMPORTANT: This article will be complemented with 4 CTAs for Mounjaxi Vitta (https://mounjaxivitta.com.br/), so structure the content so the CTAs fit naturally.';

  const prompt = `${languageInstruction} for "${outline.title}" targeting ${targetAudience}.

Working patterns to use: ${strategy.workingPatterns.join(', ')}
Gaps to fill: ${strategy.gaps.join(', ')}
Improvements to include: ${strategy.improvements.join(', ')}

Structure:
${sections}

Write 2000-3000 words of original, exclusive content. Focus on practical advice for people 40+.

${mounjaxyNote}

Write ONLY the article content, no meta tags, no introduction about the article itself.`;

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
 * Generate bilingual article pair (PT + EN) with Mounjaxi CTAs
 */
async function produceBilingualArticle(keyword, strategy, outline) {
  console.log(`\n🌍 Generating bilingual content...`);

  // Generate Portuguese version
  console.log(`\n  📝 Portuguese (PT-BR)...`);
  let articlePT = await writeArticle(outline, strategy, 'pt');
  articlePT.content = addMounjauxiCTAs(articlePT.content, 'pt');
  articlePT.slug = `pt/${keyword.keyword.toLowerCase().replace(/\s+/g, '-')}`;
  articlePT.language = 'pt-BR';

  // Generate English version
  console.log(`  🇬🇧 English (EN-US)...`);
  const outlineEN = JSON.parse(JSON.stringify(outline));
  outlineEN.title = translateTitle(outline.title, 'en');
  outlineEN.description = translateDescription(outline.description, 'en');

  let articleEN = await writeArticle(outlineEN, strategy, 'en');
  articleEN.content = addMounjauxiCTAs(articleEN.content, 'en');
  articleEN.slug = `en/${translateKeyword(keyword.keyword, 'en').toLowerCase().replace(/\s+/g, '-')}`;
  articleEN.language = 'en-US';

  return { pt: articlePT, en: articleEN };
}

/**
 * Simple title translator (helper)
 */
function translateTitle(title, targetLang) {
  if (targetLang === 'en') {
    const translations = {
      'colesterol depois dos 40': 'How to Control Cholesterol After 40',
      'saúde após os 40': 'Health After 40',
      'energia e disposição': 'Energy and Vitality After 40'
    };
    return translations[title] || title;
  }
  return title;
}

/**
 * Simple description translator (helper)
 */
function translateDescription(desc, targetLang) {
  if (targetLang === 'en') {
    return desc.replace(/para pessoas com 40\+ anos/, 'for people over 40 years old')
               .replace(/para mulheres/, 'for women')
               .replace(/Guia completo sobre/, 'Complete guide to');
  }
  return desc;
}

/**
 * Simple keyword translator (helper)
 */
function translateKeyword(keyword, targetLang) {
  if (targetLang === 'en') {
    const translations = {
      'colesterol depois dos 40': 'cholesterol after 40',
      'saúde após os 40': 'health after 40',
      'energia e disposição': 'energy and vitality'
    };
    return translations[keyword] || keyword;
  }
  return keyword;
}

/**
 * Run content production (BILINGUAL + MOUNJAXI)
 */
async function produceContent() {
  console.log('✍️  PHASE 10: Content Production (BILINGUAL + MOUNJAXI VITTA)\n');

  try {
    const keywordsData = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf-8'));
    const competitorsData = JSON.parse(fs.readFileSync(COMPETITORS_FILE, 'utf-8'));
    const articlesData = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf-8'));

    const validatedKeywords = keywordsData.keywords.filter(k => k.status === 'validated' && !k.article_planned);
    console.log(`Found ${validatedKeywords.length} validated keywords (not yet planned)\n`);

    if (validatedKeywords.length === 0) {
      console.log('⏳ No validated keywords ready for production');
      return;
    }

    // Process first 3 keywords for daily production (3 articles/day = 1.5 keyword pairs)
    // Process 1 keyword at a time (generates 2 articles: PT + EN)
    const keyword = validatedKeywords[0];

    console.log(`\n🎯 Producing bilingual pair for: "${keyword.keyword}"\n`);

    // Find competitor data
    const research = competitorsData.research.find(r => r.keyword === keyword.keyword);
    const competitors = research?.competitors || [];

    // Analyze strategy
    const strategy = await analyzeCompetitorStrategy(keyword.keyword, competitors);

    // Generate outline
    const outline = await generateArticleOutline(strategy);

    // Generate bilingual pair with Mounjaxi CTAs
    const bilingual = await produceBilingualArticle(keyword, strategy, outline);

    // Save both versions
    articlesData.articles.push({
      id: `art_pt_${Date.now()}`,
      title: bilingual.pt.title,
      slug: bilingual.pt.slug,
      description: bilingual.pt.description,
      content: bilingual.pt.content,
      language: 'pt-BR',
      status: 'draft',
      wordCount: bilingual.pt.wordCount,
      keywords: bilingual.pt.keywords,
      hasMounjaxi: true,
      createdAt: new Date().toISOString()
    });

    articlesData.articles.push({
      id: `art_en_${Date.now()}`,
      title: bilingual.en.title,
      slug: bilingual.en.slug,
      description: bilingual.en.description,
      content: bilingual.en.content,
      language: 'en-US',
      status: 'draft',
      wordCount: bilingual.en.wordCount,
      keywords: bilingual.en.keywords,
      hasMounjaxi: true,
      createdAt: new Date().toISOString()
    });

    // Mark keyword as planned
    keyword.article_planned = true;
    keywordsData.keywords = keywordsData.keywords.map(k =>
      k.id === keyword.id ? keyword : k
    );

    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articlesData, null, 2));
    fs.writeFileSync(KEYWORDS_FILE, JSON.stringify(keywordsData, null, 2));

    console.log(`\n✅ Bilingual article pair production completed!`);
    console.log(`   📝 Portuguese: "${bilingual.pt.title}"`);
    console.log(`   🇬🇧 English: "${bilingual.en.title}"`);
    console.log(`   ✨ Mounjaxi CTAs: Integrated in both versions`);
    console.log(`   Status: Draft (ready for review)`);
    console.log(`   Next: PHASE 11 (Editorial Review)`);

  } catch (error) {
    console.error('❌ Production failed:', error.message);
    process.exit(1);
  }
}

produceContent();
