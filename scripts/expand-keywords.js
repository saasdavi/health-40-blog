/**
 * Keyword Expansion - FASE 6-7
 *
 * Expands keywords by subncho and category
 * Structure: Subncho → Category → Base Keywords → Long-tails
 *
 * Later: Google Keyword Planner will validate volume/competition
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYWORDS_FILE = path.join(__dirname, '../data/keywords.json');
const SEEDS_FILE = path.join(__dirname, '../data/seeds.json');

/**
 * Base keywords per category (will be expanded with Keyword Planner)
 */
const categoryKeywords = {
  // SUBNCHO 1: ALIMENTAÇÃO
  'Proteína': [
    'proteína 40+',
    'whey protein depois dos 40',
    'proteína vegetal 40+',
    'quanto proteína por dia 40+',
    'alimentos ricos em proteína 40+'
  ],
  'Nutrientes Específicos': [
    'cálcio para mulheres 40+',
    'ferro após os 40',
    'vitamina D 40+',
    'ômega 3 40+',
    'magnésio 40+'
  ],
  'Receitas': [
    'receita saudável mulher 40+',
    'receita fácil homem 40+',
    'receita para colesterol baixo',
    'receita antienvelhecimento',
    'receita energia 40+'
  ],
  'Dietas': [
    'dieta para colesterol 40+',
    'dieta para emagrecer 40+',
    'dieta para energia 40+',
    'dieta para menopausa'
  ],
  'Suplementos': [
    'suplemento 40+',
    'vitamina D dosagem 40+',
    'colágeno 40+',
    'probiótico 40+'
  ],

  // SUBNCHO 2: ESPORTE/EXERCÍCIO
  'Musculação': [
    'musculação 40+',
    'treino força 40+',
    'hipertrofia depois dos 40',
    'rotina musculação 40+'
  ],
  'Cardio': [
    'cardio 40+',
    'corrida aos 40',
    'caminhada benefícios 40+',
    'corrida depois dos 40'
  ],
  'Flexibilidade': [
    'alongamento 40+',
    'yoga 40+',
    'pilates 40+',
    'mobilidade 40+'
  ],
  'Recuperação': [
    'recuperação pós treino 40+',
    'alongamento após exercício',
    'descanso 40+'
  ],
  'Lesões/Prevenção': [
    'lesão joelho 40+',
    'dor nas costas exercício',
    'articulação 40+',
    'prevenir lesão 40+'
  ],

  // SUBNCHO 3: SONO/DESCANSO
  'Insônia': [
    'insônia 40+',
    'não conseguir dormir',
    'acordar à noite'
  ],
  'Qualidade do Sono': [
    'dormir bem 40+',
    'ciclo sono 40+',
    'melatonina 40+'
  ],
  'Posição de Dormir': [
    'melhor posição dormir 40+',
    'travesseiro 40+',
    'colchão 40+'
  ],
  'Rotina Sono': [
    'rotina sono 40+',
    'horário dormir',
    'higiene sono 40+'
  ],
  'Ronco/Apneia': [
    'ronco 40+',
    'apneia do sono'
  ],

  // SUBNCHO 4: PROBLEMAS DE SAÚDE
  'Colesterol': [
    'colesterol alto 40+',
    'como baixar colesterol',
    'colesterol bom vs ruim',
    'alimentos colesterol 40+'
  ],
  'Diabetes': [
    'pré-diabetes 40+',
    'glicemia 40+',
    'diabetes tipo 2'
  ],
  'Hipertensão': [
    'pressão alta 40+',
    'controlar pressão',
    'hipertensão 40+'
  ],
  'Articulações': [
    'artrose 40+',
    'osteoporose mulher 40+',
    'dor articulação 40+'
  ],
  'Menopausa': [
    'menopausa sintomas',
    'fogachos menopausa',
    'hormônios menopausa',
    'menopausa 40+'
  ],

  // SUBNCHO 5: ENERGIA/DISPOSIÇÃO
  'Cansaço': [
    'cansaço 40+',
    'fadiga crônica',
    'cansaço constante'
  ],
  'Disposição': [
    'mais energia 40+',
    'aumentar disposição',
    'energia para treinar 40+'
  ],
  'Café/Cafeína': [
    'café 40+',
    'quanto café por dia',
    'cafeína 40+'
  ],
  'Vitaminas': [
    'vitamina b12 40+',
    'ferro cansaço',
    'vitamina 40+'
  ],
  'Exercício/Atividade': [
    'exercício para energia',
    'atividade física cansaço',
    'movimento 40+'
  ]
};

/**
 * Generate long-tail variations
 */
function generateLongTails(keyword) {
  const tails = [
    `${keyword} benefícios`,
    `${keyword} dicas`,
    `${keyword} guia`,
    `${keyword} o que é`,
    `como fazer ${keyword}`,
    `${keyword} naturalmente`,
    `${keyword} rápido`
  ];
  return tails.filter(t => t.length < 100);
}

/**
 * Expand keywords by subncho and category
 */
async function expandKeywordsByNiche() {
  console.log('📚 PHASE 6-7: Structured Keyword Expansion\n');

  try {
    const seedsData = JSON.parse(fs.readFileSync(SEEDS_FILE, 'utf-8'));
    const keywordsData = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf-8'));

    let totalExpanded = 0;

    // Process each subncho
    for (const subncho of seedsData.subnichos) {
      console.log(`\n🏷️  SUBNCHO: ${subncho.name}`);
      console.log(`  Categories: ${subncho.categories.join(', ')}`);

      // Process each category
      for (const category of subncho.categories) {
        const baseKeywords = categoryKeywords[category] || [];

        console.log(`\n  📂 ${category}: ${baseKeywords.length} base keywords`);

        // Add base keywords
        for (const baseKeyword of baseKeywords) {
          if (!keywordsData.keywords.find(k => k.keyword === baseKeyword)) {
            const kw = {
              id: `kw_${Date.now()}_${totalExpanded}`,
              keyword: baseKeyword,
              source: ['structured_expansion'],
              status: 'discovered',
              volume: null,
              competition: null,
              trend: null,
              intent: 'informational',
              theme: subncho.name,
              subncho: subncho.id,
              category: category,
              cluster: null,
              variants: [],
              longTails: [],
              validated: false,
              serp_researched: false,
              article_planned: false,
              article_published: false,
              discoveredAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              notes: `From ${subncho.name} > ${category}`
            };

            keywordsData.keywords.push(kw);
            totalExpanded++;
          }
        }

        // Generate long-tails for first few keywords
        for (const baseKeyword of baseKeywords.slice(0, 2)) {
          const longTails = generateLongTails(baseKeyword);
          for (const longTail of longTails) {
            if (!keywordsData.keywords.find(k => k.keyword === longTail)) {
              const kw = {
                id: `kw_${Date.now()}_${totalExpanded}`,
                keyword: longTail,
                source: ['long_tail_generation'],
                status: 'discovered',
                volume: null,
                competition: null,
                trend: null,
                intent: 'informational',
                theme: subncho.name,
                subncho: subncho.id,
                category: category,
                cluster: null,
                validated: false,
                discoveredAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                notes: `Long-tail from ${baseKeyword}`
              };

              keywordsData.keywords.push(kw);
              totalExpanded++;
            }
          }
        }
      }
    }

    // Update metadata
    keywordsData.metadata.totalKeywords = keywordsData.keywords.length;
    keywordsData.metadata.statusBreakdown.discovered = keywordsData.keywords.filter(
      k => k.status === 'discovered'
    ).length;
    keywordsData.lastUpdated = new Date().toISOString();

    // Save
    fs.writeFileSync(KEYWORDS_FILE, JSON.stringify(keywordsData, null, 2));

    console.log(`\n\n✅ Expansion completed!`);
    console.log(`   New keywords: ${totalExpanded}`);
    console.log(`   Total in database: ${keywordsData.keywords.length} keywords`);
    console.log(`   Ready for PHASE 7: Google Keyword Planner validation`);

  } catch (error) {
    console.error('❌ Expansion failed:', error.message);
    process.exit(1);
  }
}

// Run
expandKeywordsByNiche();
