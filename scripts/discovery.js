/**
 * Discovery Module - PHASE 6-9
 *
 * Expands seed keywords using:
 * - Google Autocomplete (simulated with mock data for now)
 * - Google Keyword Planner (will integrate in PHASE 7)
 * - Long-tail generation
 *
 * Stores all discovered keywords in data/keywords.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYWORDS_FILE = path.join(__dirname, '../data/keywords.json');
const SEEDS_FILE = path.join(__dirname, '../data/seeds.json');

/**
 * Mock autocomplete suggestions
 * TODO: Replace with real Google Autocomplete API
 */
const mockAutocomplete = {
  'saúde depois dos 40': [
    'saúde depois dos 40 anos',
    'saúde cardiovascular 40+',
    'saúde óssea depois dos 40',
    'saúde mental 40+'
  ],
  'colesterol': [
    'colesterol alto',
    'colesterol depois dos 40',
    'como baixar colesterol',
    'colesterol naturalmente'
  ],
  'sono': [
    'sono depois dos 40',
    'qualidade do sono',
    'insônia 40+',
    'dormir bem 40 anos'
  ],
  'exercício': [
    'exercício depois dos 40',
    'musculação 40+',
    'cardio para 40+',
    'força depois dos 40'
  ],
  'alimentação': [
    'alimentação depois dos 40',
    'dieta para 40+',
    'proteína 40+',
    'alimentação saudável 40'
  ]
};

/**
 * Generate long-tail variations
 */
function generateLongTails(keyword) {
  const tails = [
    `${keyword} para saúde`,
    `${keyword} dicas`,
    `${keyword} guia completo`,
    `${keyword} benefícios`,
    `como fazer ${keyword}`
  ];
  return tails.filter(t => t.length < 80);
}

/**
 * Discover keywords from seeds
 */
async function discoverKeywords() {
  console.log('🔍 PHASE 6: Keyword Discovery');

  try {
    // Read seeds
    const seedsData = JSON.parse(fs.readFileSync(SEEDS_FILE, 'utf-8'));
    const keywordsData = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf-8'));

    let discoveredCount = 0;
    const discovered = [];

    // Process each active seed
    for (const seed of seedsData.seeds) {
      if (seed.status !== 'active') continue;

      console.log(`\n📌 Processing seed: "${seed.value}"`);

      // Get mock autocomplete suggestions
      const baseKeyword = seed.value.toLowerCase();
      const suggestions = mockAutocomplete[baseKeyword] || [];

      console.log(`  → Found ${suggestions.length} autocomplete suggestions`);

      // Add suggestions as keywords
      for (const suggestion of suggestions) {
        if (!keywordsData.keywords.find(k => k.keyword === suggestion)) {
          const kw = {
            id: `kw_${Date.now()}_${discoveredCount}`,
            keyword: suggestion,
            source: ['autocomplete'],
            status: 'discovered',
            volume: null,
            competition: null,
            intent: 'informational',
            theme: seed.value,
            validated: false,
            discoveredAt: new Date().toISOString()
          };

          keywordsData.keywords.push(kw);
          discovered.push(suggestion);
          discoveredCount++;
        }
      }

      // Generate long-tails
      console.log(`  → Generating long-tail variations`);
      const longTails = generateLongTails(seed.value);

      for (const longTail of longTails) {
        if (!keywordsData.keywords.find(k => k.keyword === longTail)) {
          const kw = {
            id: `kw_${Date.now()}_${discoveredCount}`,
            keyword: longTail,
            source: ['long_tail_generation'],
            status: 'discovered',
            volume: null,
            competition: null,
            intent: 'informational',
            theme: seed.value,
            validated: false,
            discoveredAt: new Date().toISOString()
          };

          keywordsData.keywords.push(kw);
          discovered.push(longTail);
          discoveredCount++;
        }
      }

      console.log(`  ✓ Discovered ${suggestions.length + longTails.length} keywords`);
    }

    // Update metadata
    keywordsData.metadata.totalKeywords = keywordsData.keywords.length;
    keywordsData.metadata.statusBreakdown.discovered = keywordsData.keywords.filter(
      k => k.status === 'discovered'
    ).length;
    keywordsData.lastUpdated = new Date().toISOString();

    // Save
    fs.writeFileSync(KEYWORDS_FILE, JSON.stringify(keywordsData, null, 2));

    console.log(`\n✅ Discovery completed`);
    console.log(`   Total discovered: ${discoveredCount} new keywords`);
    console.log(`   Total in database: ${keywordsData.keywords.length} keywords`);

  } catch (error) {
    console.error('❌ Discovery failed:', error.message);
    process.exit(1);
  }
}

// Run
discoverKeywords();
