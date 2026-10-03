/**
 * GENERATE LONG-TAILS - Expande 30 keywords validados em 300+ caudas longas
 *
 * Cada keyword validado → 8-10 variações long-tail
 * Exemplo: "proteína 40+" → "proteína 40+ benefícios", "proteína 40+ como tomar", etc
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYWORDS_FILE = path.join(__dirname, '../data/keywords.json');

// Templates de long-tail para diferentes intents
const LONG_TAIL_TEMPLATES = {
  'benefícios': ['{keyword} benefícios', '{keyword} vantagens', '{keyword} resultados'],
  'como': ['como {keyword}', 'como fazer {keyword}', '{keyword} como tomar'],
  'dicas': ['{keyword} dicas', '{keyword} dicas e truques', '{keyword} segredos'],
  'preço': ['{keyword} preço', '{keyword} quanto custa', '{keyword} valor'],
  'marca': ['{keyword} marca', '{keyword} melhor marca', '{keyword} qual marca'],
  'naturalmente': ['{keyword} naturalmente', '{keyword} de forma natural', '{keyword} sem remédios'],
  'rápido': ['{keyword} rápido', '{keyword} em pouco tempo', '{keyword} resultado rápido'],
  'efeitos': ['{keyword} efeitos colaterais', '{keyword} contraindicações', '{keyword} seguro'],
  'melhor': ['melhor {keyword}', '{keyword} melhor', 'qual melhor {keyword}'],
  'onde': ['onde comprar {keyword}', 'onde encontrar {keyword}', '{keyword} onde comprar']
};

/**
 * Gera long-tails a partir de um keyword base
 */
function generateLongTails(baseKeyword) {
  const longTails = [];

  // Aplicar cada template
  Object.entries(LONG_TAIL_TEMPLATES).forEach(([category, templates]) => {
    templates.forEach(template => {
      const longTail = template.replace('{keyword}', baseKeyword);
      longTails.push({
        keyword: longTail,
        category: category,
        parentKeyword: baseKeyword
      });
    });
  });

  return longTails;
}

/**
 * Main
 */
async function main() {
  console.log('🔗 GERANDO CAUDAS LONGAS\n');

  try {
    const data = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf-8'));

    // Pega os 30 keywords validados
    const validatedKeywords = data.keywords
      .filter(k => k.validated && k.volume > 500)
      .slice(0, 30);

    console.log(`📊 Gerando long-tails para ${validatedKeywords.length} keywords validados...\n`);

    let longTailsGenerated = [];
    const categoryCount = {};

    validatedKeywords.forEach(kw => {
      const longTails = generateLongTails(kw.keyword);
      longTailsGenerated.push(...longTails);

      // Contar por categoria
      longTails.forEach(lt => {
        categoryCount[lt.category] = (categoryCount[lt.category] || 0) + 1;
      });

      console.log(`✅ "${kw.keyword}": ${longTails.length} caudas longas`);
    });

    console.log(`\n📈 Resumo por Categoria:`);
    Object.entries(categoryCount).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} long-tails`);
    });

    // Converter para formato de keywords
    const longTailKeywords = longTailsGenerated.map((lt, idx) => ({
      id: `kw_longtail_${idx}`,
      keyword: lt.keyword,
      source: ['long_tail_from_validated'],
      status: 'discovered',
      volume: null, // Será validado depois
      competition: null,
      trend: null,
      intent: 'informational',
      theme: `${lt.category}`,
      validated: false,
      parentKeyword: lt.parentKeyword,
      discoveredAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      notes: `Long-tail de: ${lt.parentKeyword}`
    }));

    // Adicionar ao arquivo
    data.keywords.push(...longTailKeywords);
    data.metadata.totalKeywords = data.keywords.length;

    fs.writeFileSync(KEYWORDS_FILE, JSON.stringify(data, null, 2));

    console.log(`\n✅ Long-tails Criadas:`);
    console.log(`   Total anterior: ${validatedKeywords.length}`);
    console.log(`   Long-tails: ${longTailKeywords.length}`);
    console.log(`   Total agora: ${data.keywords.length}`);

    console.log(`\n🎯 Exemplos de Long-Tails Criados:`);
    longTailKeywords.slice(0, 15).forEach((kw, i) => {
      console.log(`   ${i+1}. "${kw.keyword}" (${kw.theme})`);
    });

    console.log(`\n✅ Próximo: Validar long-tails com Google Ads API`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
