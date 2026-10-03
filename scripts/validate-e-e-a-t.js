#!/usr/bin/env node

/**
 * validate-e-e-a-t.js
 * Valida artigos contra critérios E-E-A-T
 *
 * Uso: node scripts/validate-e-e-a-t.js [article.json]
 * Uso: node scripts/validate-e-e-a-t.js (valida todos em data/articles/)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

/**
 * EXPERIÊNCIA: Autor, disclaimer, fontes
 */
function validateExperience(article) {
  const issues = [];
  let score = 100;

  // Autor
  if (!article.author || article.author.trim() === '') {
    issues.push('❌ EXPERIÊNCIA: Sem autor identificado');
    score -= 20;
  }

  // Bio do autor
  if (!article.authorBio || article.authorBio.trim() === '') {
    issues.push('⚠️  EXPERIÊNCIA: Bio do autor não fornecida');
    score -= 10;
  }

  // Disclaimer
  if (!article.disclaimer || article.disclaimer.trim() === '') {
    issues.push('❌ EXPERIÊNCIA: Sem disclaimer de saúde');
    score -= 20;
  }

  // Fontes
  if (!article.sources || article.sources.length === 0) {
    issues.push('❌ EXPERIÊNCIA: Sem fontes citadas');
    score -= 20;
  } else if (article.sources.length < 3) {
    issues.push(`⚠️  EXPERIÊNCIA: Apenas ${article.sources.length} fontes (recomendado: 3+)`);
    score -= 10;
  }

  // Health warning
  if (!article.healthWarning || !article.healthWarning.enabled) {
    issues.push('❌ EXPERIÊNCIA: Health warning desabilitado');
    score -= 15;
  }

  return { score: Math.max(0, score), issues };
}

/**
 * ESPECIALIDADE: Cobertura completa, estrutura, dados
 */
function validateExpertise(article) {
  const issues = [];
  let score = 100;

  // Word count
  const wordCount = article.wordCount || estimateWordCount(article.content);

  if (wordCount < 1500) {
    issues.push(`❌ ESPECIALIDADE: ${wordCount} palavras (mínimo: 1500)`);
    score -= 25;
  } else if (wordCount > 2500) {
    issues.push(`⚠️  ESPECIALIDADE: ${wordCount} palavras (máximo recomendado: 2500)`);
    score -= 5;
  }

  // Estrutura (seções)
  const sectionCount = article.sections ? article.sections.length : 0;

  if (sectionCount < 4) {
    issues.push(`❌ ESPECIALIDADE: ${sectionCount} seções (mínimo: 4)`);
    score -= 20;
  }

  // Hierarquia H2 > H3
  let validHierarchy = true;
  if (article.sections) {
    article.sections.forEach((section, idx) => {
      if (!section.h2) {
        validHierarchy = false;
      }
      if (!Array.isArray(section.h3s) || section.h3s.length < 2) {
        validHierarchy = false;
      }
    });
  }

  if (!validHierarchy) {
    issues.push('❌ ESPECIALIDADE: Hierarquia H2 > H3 inválida');
    score -= 15;
  }

  // Conteúdo não genérico (verificar presença de números/dados)
  const contentText = article.content || '';
  const hasNumbers = /\d{1,3}%|\d+(-\d+)?\s*(mg|ml|kg|g|min|h|anos)/gi.test(contentText);

  if (!hasNumbers && sectionCount > 0) {
    issues.push('⚠️  ESPECIALIDADE: Falta dados específicos (números, porcentagens)');
    score -= 10;
  }

  return { score: Math.max(0, score), issues };
}

/**
 * AUTORIDADE: Schema, breadcrumbs, links
 */
function validateAuthority(article) {
  const issues = [];
  let score = 100;

  // SEO Title
  if (!article.seoTitle || article.seoTitle.trim() === '') {
    issues.push('❌ AUTORIDADE: Sem SEO title');
    score -= 15;
  } else if (article.seoTitle.length > 60) {
    issues.push(`⚠️  AUTORIDADE: SEO title muito longo (${article.seoTitle.length} caracteres)`);
    score -= 5;
  }

  // Breadcrumbs
  if (!article.schema || !article.schema.breadcrumbs || article.schema.breadcrumbs.length === 0) {
    issues.push('❌ AUTORIDADE: Sem breadcrumbs/schema');
    score -= 15;
  }

  // Links internos
  const internalLinks = (article.content || '').match(/\[.*?\]\(\/blog\/.*?\)/g) || [];
  if (internalLinks.length < 3) {
    issues.push(
      `⚠️  AUTORIDADE: ${internalLinks.length} links internos (recomendado: 3-5)`
    );
    score -= 10;
  }

  // Links externos
  const externalLinks = (article.content || '').match(/https?:\/\/(mayo|harvard|nih|cdc|webmd)/gi) || [];
  if (externalLinks.length < 3) {
    issues.push(
      `⚠️  AUTORIDADE: ${externalLinks.length} links para autoridades (recomendado: 3-5)`
    );
    score -= 10;
  }

  // Data de publicação
  if (!article.createdAt && !article.publishedAt) {
    issues.push('❌ AUTORIDADE: Sem data de publicação');
    score -= 10;
  }

  return { score: Math.max(0, score), issues };
}

/**
 * CONFIANÇA: Alt text, créditos, transparência
 */
function validateTrust(article) {
  const issues = [];
  let score = 100;

  // Featured image alt
  if (!article.featuredImageAlt || article.featuredImageAlt.trim() === '') {
    issues.push('❌ CONFIANÇA: Featured image sem alt text');
    score -= 15;
  } else if (article.featuredImageAlt.length < 50) {
    issues.push('⚠️  CONFIANÇA: Alt text do featured image muito curto');
    score -= 5;
  }

  // Image credit
  if (!article.imageCredit || !article.imageCredit.author) {
    issues.push('❌ CONFIANÇA: Sem crédito de imagem');
    score -= 15;
  }

  // Seção de Fontes no final
  if (!article.sources || article.sources.length === 0) {
    issues.push('❌ CONFIANÇA: Sem seção de fontes');
    score -= 15;
  }

  // Alt text em imagens dentro de seções
  let imagesWithoutAlt = 0;
  if (article.sections) {
    article.sections.forEach((section) => {
      if (section.images && Array.isArray(section.images)) {
        section.images.forEach((img) => {
          if (!img.alt || img.alt.trim() === '') {
            imagesWithoutAlt++;
          }
        });
      }
    });
  }

  if (imagesWithoutAlt > 0) {
    issues.push(`❌ CONFIANÇA: ${imagesWithoutAlt} imagens sem alt text`);
    score -= 10;
  }

  // Linguagem não absoluta
  const absoluteLanguage = [
    'vai curar',
    'garantido',
    '100% eficaz',
    'nunca falha',
    'sempre funciona',
  ];
  const contentText = (article.content || '').toLowerCase();
  const hasAbsolute = absoluteLanguage.some((phrase) => contentText.includes(phrase));

  if (hasAbsolute) {
    issues.push('⚠️  CONFIANÇA: Linguagem absoluta detectada (use "pode", "pode ajudar")');
    score -= 10;
  }

  // Transparency notice
  if (!article.content || !article.content.toLowerCase().includes('afiliação')) {
    issues.push('⚠️  CONFIANÇA: Sem transparência sobre afiliação/monetização');
    score -= 10;
  }

  return { score: Math.max(0, score), issues };
}

/**
 * Calcula score final E-E-A-T
 */
function calculateEEATScore(article) {
  const experience = validateExperience(article);
  const expertise = validateExpertise(article);
  const authority = validateAuthority(article);
  const trust = validateTrust(article);

  const weights = { experience: 0.25, expertise: 0.25, authority: 0.25, trust: 0.25 };
  const totalScore = Math.round(
    experience.score * weights.experience +
    expertise.score * weights.expertise +
    authority.score * weights.authority +
    trust.score * weights.trust
  );

  return {
    totalScore,
    breakdown: { experience, expertise, authority, trust },
    passesThreshold: totalScore >= 85,
  };
}

/**
 * Estima contagem de palavras (fallback se não houver)
 */
function estimateWordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Formata resultado para exibição
 */
function formatResults(articlePath, results) {
  const { totalScore, breakdown, passesThreshold } = results;

  console.log('\n' + '='.repeat(70));
  console.log(`📄 VALIDAÇÃO E-E-A-T: ${path.basename(articlePath)}`);
  console.log('='.repeat(70));

  console.log(`\n🎯 SCORE TOTAL: ${totalScore}/100 ${passesThreshold ? '✅' : '❌'}\n`);

  // Breakdown
  console.log('📊 BREAKDOWN:');
  console.log(
    `  • Experiência (E): ${breakdown.experience.score}/100 ${
      breakdown.experience.score >= 85 ? '✅' : '⚠️ '
    }`
  );
  console.log(
    `  • Especialidade (E): ${breakdown.expertise.score}/100 ${
      breakdown.expertise.score >= 85 ? '✅' : '⚠️ '
    }`
  );
  console.log(
    `  • Autoridade (A): ${breakdown.authority.score}/100 ${
      breakdown.authority.score >= 85 ? '✅' : '⚠️ '
    }`
  );
  console.log(
    `  • Confiança (T): ${breakdown.trust.score}/100 ${breakdown.trust.score >= 85 ? '✅' : '⚠️ '
    }`
  );

  // Issues
  const allIssues = [
    ...breakdown.experience.issues,
    ...breakdown.expertise.issues,
    ...breakdown.authority.issues,
    ...breakdown.trust.issues,
  ];

  if (allIssues.length > 0) {
    console.log('\n🔍 PROBLEMAS ENCONTRADOS:');
    allIssues.forEach((issue) => console.log(`  ${issue}`));
  } else {
    console.log('\n✨ Nenhum problema encontrado!');
  }

  console.log('\n' + '='.repeat(70));
  return passesThreshold;
}

/**
 * Valida arquivo individual
 */
async function validateArticle(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const article = JSON.parse(content);

    if (!article.sections) {
      article.sections = [];
    }

    const results = calculateEEATScore(article);
    return { success: true, results, filePath };
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return { success: false, error: error.message, filePath };
  }
}

/**
 * Valida todos os artigos
 */
async function validateAllArticles() {
  const articlesDir = path.join(ROOT, 'data', 'articles');

  if (!fs.existsSync(articlesDir)) {
    console.log('📁 Diretório data/articles/ não encontrado. Criando...');
    fs.mkdirSync(articlesDir, { recursive: true });
    console.log('✅ Diretório criado.');
    return [];
  }

  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('ℹ️  Nenhum artigo encontrado em data/articles/');
    return [];
  }

  const results = [];
  for (const file of files) {
    const filePath = path.join(articlesDir, file);
    const result = await validateArticle(filePath);
    results.push(result);
  }

  return results;
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);

  console.log('\n🔐 VALIDADOR E-E-A-T - Saúde 40+ Blog\n');

  let results = [];

  if (args.length > 0) {
    // Valida arquivo específico
    const filePath = path.resolve(args[0]);
    const result = await validateArticle(filePath);

    if (result.success) {
      formatResults(result.filePath, result.results);
      results = [result];
    } else {
      console.error(`❌ Erro: ${result.error}`);
      process.exit(1);
    }
  } else {
    // Valida todos
    results = await validateAllArticles();

    if (results.length === 0) {
      console.log(
        'ℹ️  Nenhum artigo para validar. Use: node scripts/validate-e-e-a-t.js [artigo.json]'
      );
      process.exit(0);
    }

    // Resumo geral
    console.log('\n📊 RESUMO GERAL\n');
    const passed = results.filter((r) => r.success && r.results.passesThreshold).length;
    const total = results.filter((r) => r.success).length;

    console.log(`Total validado: ${total} artigos`);
    console.log(`Passou (≥85): ${passed}/${total}`);
    console.log(`Taxa de aprovação: ${Math.round((passed / total) * 100)}%\n`);

    // Detalhes
    results.forEach((result) => {
      if (result.success) {
        formatResults(result.filePath, result.results);
      } else {
        console.log(`❌ ERRO em ${result.filePath}: ${result.error}`);
      }
    });
  }

  // Status exit
  const hasFailures = results.some((r) => !r.success || !r.results.passesThreshold);
  process.exit(hasFailures ? 1 : 0);
}

main().catch(console.error);
