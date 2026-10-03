/**
 * Generate Multiple Articles - Quality Demo
 * Mostra qualidade de vários artigos
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

const articles = [
  {
    title: 'Colesterol Depois dos 40: Guia de Controle',
    keyword: 'colesterol depois dos 40',
    words: 920,
    quality: 84,
    seo: 91,
    health: 96
  },
  {
    title: 'Musculação para Mulheres Acima de 40',
    keyword: 'musculação mulheres 40',
    words: 1050,
    quality: 88,
    seo: 89,
    health: 93
  },
  {
    title: 'Proteína para Mulheres Acima de 40',
    keyword: 'proteína mulheres 40',
    words: 850,
    quality: 85,
    seo: 94,
    health: 94
  },
  {
    title: 'Meditação para Ansiedade Depois dos 40',
    keyword: 'meditação ansiedade 40',
    words: 680,
    quality: 87,
    seo: 86,
    health: 94
  },
  {
    title: 'Sono de Qualidade: Técnicas Comprovadas',
    keyword: 'sono 40 insônia',
    words: 780,
    quality: 86,
    seo: 88,
    health: 95
  },
  {
    title: 'Pressão Alta Depois dos 40: Controle Natural',
    keyword: 'pressão alta 40',
    words: 920,
    quality: 89,
    seo: 90,
    health: 97
  },
  {
    title: 'Pele aos 40: Rejuvenescimento Natural',
    keyword: 'pele 40 rejuvenescimento',
    words: 750,
    quality: 83,
    seo: 85,
    health: 92
  },
  {
    title: 'Energia e Disposição Depois dos 40',
    keyword: 'energia 40 disposição',
    words: 690,
    quality: 82,
    seo: 84,
    health: 91
  }
];

console.log('\n╔═════════════════════════════════════════════════════╗');
console.log('║   📊 QUALITY ANALYSIS - MULTIPLE ARTICLES           ║');
console.log('║                                                       ║');
console.log('║   Score > 85: Ready for Publication ✅              ║');
console.log('║   Score < 85: Needs Revision ⚠️                     ║');
console.log('╚═════════════════════════════════════════════════════╝\n');

let approved = 0;
let needsRevision = 0;
let totalScore = 0;

articles.forEach((article, idx) => {
  const overall = Math.round((article.quality + article.seo + article.health) / 3);
  const status = overall >= 85 ? '✅ APPROVED' : '⚠️  REVISION';
  const readTime = Math.ceil(article.words / 200);
  
  totalScore += overall;
  if (overall >= 85) approved++;
  else needsRevision++;

  console.log(`${idx + 1}. ${article.title}`);
  console.log(`   Keyword: "${article.keyword}"`);
  console.log(`   📊 Quality: ${article.quality} | SEO: ${article.seo} | Health: ${article.health}`);
  console.log(`   📈 OVERALL: ${overall}/100 ${status}`);
  console.log(`   📝 ${article.words} words | ⏱️  ${readTime} min read`);
  console.log('');
});

const avgScore = Math.round(totalScore / articles.length);

console.log('═'.repeat(51));
console.log('📊 SUMMARY');
console.log('═'.repeat(51));
console.log(`\n✅ Approved (≥85): ${approved}/${articles.length}`);
console.log(`⚠️  Needs Revision (<85): ${needsRevision}/${articles.length}`);
console.log(`📈 Average Score: ${avgScore}/100\n`);

const qualityScores = articles.map(a => a.quality);
const seoScores = articles.map(a => a.seo);
const healthScores = articles.map(a => a.health);

console.log('📋 Category Averages:');
console.log(`   Quality: ${Math.round(qualityScores.reduce((a,b)=>a+b)/qualityScores.length)}/100`);
console.log(`   SEO: ${Math.round(seoScores.reduce((a,b)=>a+b)/seoScores.length)}/100`);
console.log(`   Health & Safety: ${Math.round(healthScores.reduce((a,b)=>a+b)/healthScores.length)}/100\n`);

console.log('🎯 VERDICT:');
if (approved === articles.length) {
  console.log(`   ✅ ALL ARTICLES APPROVED - Ready to publish!\n`);
} else if (approved / articles.length >= 0.75) {
  console.log(`   ✅ 75%+ approval rate - Good quality!\n`);
} else {
  console.log(`   ⚠️  Need to improve - ${needsRevision} articles need revision\n`);
}

console.log('═'.repeat(51));
console.log(`🚀 Ready to publish: ${approved} articles`);
console.log(`📋 Needs review: ${needsRevision} articles`);
console.log('═'.repeat(51) + '\n');

