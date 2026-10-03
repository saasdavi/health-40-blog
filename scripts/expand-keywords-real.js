/**
 * EXPAND KEYWORDS - Gera keywords reais dos temas planejados
 *
 * Pega os 10 subnichos e expande para 100+ keywords
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYWORDS_FILE = path.join(__dirname, '../data/keywords.json');

const TEMAS = {
  'alimentacao': [
    'proteína 40+', 'whey protein 40+', 'proteína vegetal 40+', 'quanto proteína por dia 40+',
    'cálcio mulheres 40+', 'ferro 40+', 'vitamina D 40+', 'ômega 3 40+', 'magnésio 40+',
    'receita saudável 40+', 'receita fácil 40+', 'receita colesterol baixo', 'receita emagrecer',
    'dieta colesterol 40+', 'dieta emagrecer 40+', 'dieta energia 40+', 'dieta menopausa',
    'suplemento 40+', 'vitamina D dosagem 40+', 'colágeno 40+', 'probiótico 40+'
  ],
  'esporte': [
    'musculação 40+', 'treino força 40+', 'hipertrofia 40+', 'rotina musculação 40+',
    'cardio 40+', 'corrida 40+', 'caminhada benefícios 40+', 'flexibilidade 40+',
    'yoga 40+', 'pilates 40+', 'alongamento 40+', 'recuperação pós treino 40+',
    'lesão joelho 40+', 'dor costas exercício', 'articulação 40+'
  ],
  'sono': [
    'insônia 40+', 'não conseguir dormir', 'acordar à noite', 'dormir bem 40+',
    'ciclo sono 40+', 'melatonina 40+', 'melhor posição dormir 40+', 'travesseiro 40+',
    'colchão 40+', 'rotina sono 40+', 'higiene sono', 'ronco 40+', 'apneia do sono'
  ],
  'saude': [
    'colesterol alto 40+', 'como baixar colesterol', 'colesterol bom vs ruim',
    'pré-diabetes 40+', 'glicemia 40+', 'pressão alta 40+', 'controlar pressão',
    'artrose 40+', 'osteoporose mulher 40+', 'dor articulação',
    'menopausa sintomas', 'fogachos menopausa', 'hormônios menopausa'
  ],
  'energia': [
    'cansaço 40+', 'fadiga crônica 40+', 'baixa energia 40+', 'mais energia 40+',
    'aumentar disposição 40+', 'café 40+', 'quanto café por dia', 'vitamina b12 40+',
    'ferro cansaço', 'exercício para energia', 'atividade física cansaço'
  ],
  'mental': [
    'ansiedade 40+', 'controlar ansiedade', 'depressão 40+', 'tristeza 40+',
    'estresse 40+', 'stress trabalho', 'meditação 40+', 'yoga mente',
    'mindfulness 40+', 'relacionamento 40+', 'comunicação casal'
  ],
  'beleza': [
    'pele 40+', 'rugas 40+', 'flacidez 40+', 'cabelo 40+', 'queda cabelo 40+',
    'cabelo branco 40+', 'colágeno 40+', 'benefícios colágeno', 'cosmética 40+',
    'produto natural pele', 'rejuvenescimento 40+', 'antienvelhecimento'
  ],
  'prevencao': [
    'exames 40+', 'colonoscopia 40+', 'mamografia 40+', 'vacina 40+',
    'imunidade 40+', 'monitorar saúde 40+', 'pressão arterial',
    'hábito saudável 40+', 'parar de fumar 40+', 'prevenir colesterol', 'prevenir diabetes'
  ],
  'medicamentos': [
    'suplemento 40+', 'qual suplemento tomar', 'vitamina 40+', 'vitamina c',
    'vitamina d', 'cálcio suplemento', 'ferro suplemento', 'magnésio 40+',
    'polivitamínico 40+', 'multivitamínico', 'medicamento 40+', 'efeitos colaterais'
  ],
  'lazer': [
    'hobby 40+', 'atividade lazer 40+', 'viajar 40+', 'viagem saudável',
    'diversão 40+', 'encontros sociais', 'aprender 40+', 'novo hobby 40+',
    'comunidade 40+', 'amigos 40+', 'grupos 40+'
  ]
};

/**
 * Gera keywords expandidas
 */
function generateExpandedKeywords() {
  const keywords = [];
  let id = 1;

  for (const [tema, palavras] of Object.entries(TEMAS)) {
    palavras.forEach(palavra => {
      keywords.push({
        id: `kw_expand_${id}`,
        keyword: palavra,
        source: ['tema_expansion'],
        status: 'discovered',
        volume: null,
        competition: null,
        trend: null,
        intent: 'informational',
        theme: tema,
        validated: false,
        discoveredAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        notes: `Expandido de tema: ${tema}`
      });
      id++;
    });
  }

  return keywords;
}

/**
 * Main
 */
async function expandKeywords() {
  console.log('🔍 Expandindo Keywords dos Temas\n');

  try {
    const data = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf-8'));
    const newKeywords = generateExpandedKeywords();

    // Mesclar (evitar duplicatas)
    const existingTexts = new Set(data.keywords.map(k => k.keyword));
    const newUnique = newKeywords.filter(k => !existingTexts.has(k.keyword));

    console.log(`📊 Resumo:`);
    console.log(`   Keywords anteriores: ${data.keywords.length}`);
    console.log(`   Novos keywords: ${newUnique.length}`);
    console.log(`   Total: ${data.keywords.length + newUnique.length}`);

    // Temas cobertos
    console.log(`\n🎯 Temas Cobertos:`);
    Object.keys(TEMAS).forEach(tema => {
      const count = newUnique.filter(k => k.theme === tema).length;
      console.log(`   ${tema}: ${count} keywords`);
    });

    // Adicionar ao arquivo
    data.keywords.push(...newUnique);
    data.metadata.totalKeywords = data.keywords.length;

    fs.writeFileSync(KEYWORDS_FILE, JSON.stringify(data, null, 2));

    console.log(`\n✅ Keywords expandidas e salvas!`);
    console.log(`   Próximo: Validar keywords com Google Ads API`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

expandKeywords();
