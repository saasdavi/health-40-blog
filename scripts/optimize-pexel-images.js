/**
 * OPTIMIZE PEXEL API - Gera imagens ESTRATÉGICAS por tema
 *
 * Em vez de buscar keyword genérico:
 * - Busca imagens específicas por TEMA
 * - Seleciona melhor qualidade (likes, views)
 * - Distribui strategicamente no artigo
 * - Alt text otimizado para SEO
 */

import https from 'https';

const PEXEL_API_KEY = process.env.PEXEL_API_KEY;

/**
 * Mapeia temas para queries Pexel otimizadas
 */
const PEXEL_QUERIES = {
  'alimentacao': {
    featured: 'healthy food women 40s',
    inline: ['protein nutrition meal', 'vitamins supplements healthy', 'woman eating salad'],
    color: '#90EE90' // Lightgreen - nutrition
  },
  'esporte': {
    featured: 'woman exercising 40s fit',
    inline: ['woman doing yoga stretching', 'strength training gym', 'cardio running fit'],
    color: '#FF6B6B' // Red - energy
  },
  'sono': {
    featured: 'woman sleeping peacefully bed',
    inline: ['bedroom relaxation comfortable', 'woman resting calm', 'sleep rest bedroom'],
    color: '#4A90E2' // Blue - calm
  },
  'saude': {
    featured: 'woman doctor health checkup',
    inline: ['healthcare medical consultation', 'woman health monitor', 'medical checkup'],
    color: '#50E3C2' // Teal - health
  },
  'energia': {
    featured: 'energetic woman morning woman',
    inline: ['woman morning coffee energy', 'woman happy vibrant', 'woman vitality strength'],
    color: '#F5A623' // Orange - energy
  },
  'mental': {
    featured: 'woman meditation calm mindfulness',
    inline: ['meditation relaxation peace', 'woman stress relief yoga', 'mental health wellbeing'],
    color: '#9B59B6' // Purple - mental
  },
  'beleza': {
    featured: 'woman face beauty skincare',
    inline: ['woman skincare routine', 'woman hair beautiful', 'woman cosmetics beauty'],
    color: '#E91E63' // Pink - beauty
  },
  'prevencao': {
    featured: 'woman medical checkup prevention',
    inline: ['healthcare prevention screening', 'woman doctor consultation', 'health monitoring'],
    color: '#2196F3' // Blue - prevention
  },
  'medicamentos': {
    featured: 'vitamins supplements pills healthy',
    inline: ['supplements vitamins health', 'medication pills wellness', 'supplement bottle'],
    color: '#FF9800' // Orange - pills
  },
  'lazer': {
    featured: 'woman enjoying vacation relaxing',
    inline: ['woman travel vacation fun', 'woman friends socializing happy', 'woman leisure time'],
    color: '#4CAF50' // Green - leisure
  }
};

/**
 * Busca imagens na Pexel API
 */
async function searchPexelImages(query, per_page = 10) {
  return new Promise((resolve) => {
    if (!PEXEL_API_KEY) {
      console.warn('⚠️  PEXEL_API_KEY não configurada');
      resolve([]);
      return;
    }

    const params = new URLSearchParams({
      query: query,
      per_page: per_page,
      orientation: 'landscape'
    });

    const url = `https://api.pexels.com/v1/search?${params}`;

    const options = {
      hostname: 'api.pexels.com',
      path: `/v1/search?${params}`,
      method: 'GET',
      headers: {
        'Authorization': PEXEL_API_KEY
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const photos = (result.photos || []).map(p => ({
            id: p.id,
            url: p.src.large,
            photographer: p.photographer,
            photographer_url: p.photographer_url,
            alt: p.alt || query,
            likes: p.liked || 0
          }));
          resolve(photos.sort((a, b) => b.likes - a.likes)); // Sort by popularity
        } catch (e) {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.end();
  });
}

/**
 * Gera imagens otimizadas para artigo
 */
async function generateOptimizedImages(keyword, theme) {
  console.log(`\n📸 Otimizando imagens Pexel para tema: ${theme}`);

  const config = PEXEL_QUERIES[theme] || PEXEL_QUERIES['alimentacao'];

  try {
    // Featured image (hero)
    console.log(`   🔍 Buscando featured: "${config.featured}"`);
    const featured = await searchPexelImages(config.featured, 5);

    if (featured.length === 0) {
      console.log('   ⚠️  Nenhuma featured image encontrada');
      return null;
    }

    // Inline images
    console.log(`   🔍 Buscando inline images...`);
    const inlinePromises = config.inline.map(q => searchPexelImages(q, 8));
    const inlineResults = await Promise.all(inlinePromises);

    // Flatten e deduplicate
    const inlineImages = [];
    const seen = new Set([featured[0].id]);

    for (const results of inlineResults) {
      for (const img of results) {
        if (!seen.has(img.id) && inlineImages.length < 3) {
          inlineImages.push(img);
          seen.add(img.id);
        }
      }
    }

    console.log(`   ✅ Featured: 1 imagem`);
    console.log(`   ✅ Inline: ${inlineImages.length} imagens`);

    return {
      featured: featured[0],
      inline: inlineImages,
      color: config.color,
      theme: theme
    };

  } catch (error) {
    console.warn(`⚠️  Pexel error: ${error.message}`);
    return null;
  }
}

/**
 * Gera alt text otimizado para SEO
 */
function generateAltText(keyword, position, theme) {
  const positions = {
    featured: `${keyword} - Guia completo para mulheres 40+`,
    inline1: `Exemplo prático de ${keyword}`,
    inline2: `Benefícios de ${keyword} para saúde`,
    inline3: `Como aplicar ${keyword} no dia a dia`
  };

  return positions[position] || keyword;
}

/**
 * Insere imagens otimizadas no conteúdo
 */
function insertOptimizedImages(content, images, keyword) {
  if (!images || !images.featured) {
    return content;
  }

  // Featured image no topo
  const featuredHtml = `
![${generateAltText(keyword, 'featured', images.theme)}](${images.featured.url})
_Foto por [${images.featured.photographer}](${images.featured.photographer_url}) via Pexels_
`;

  let enrichedContent = featuredHtml + content;

  // Distribuir inline images nos parágrafos
  const paragraphs = enrichedContent.split('\n\n');

  images.inline.forEach((img, idx) => {
    const position = Math.floor((paragraphs.length / (images.inline.length + 1)) * (idx + 1));
    if (position < paragraphs.length) {
      const inlineHtml = `
![${generateAltText(keyword, `inline${idx+1}`, images.theme)}](${img.url})
_Foto por [${img.photographer}](${img.photographer_url}) via Pexels_`;
      paragraphs.splice(position, 0, inlineHtml);
    }
  });

  return paragraphs.join('\n\n');
}

/**
 * Main - Test
 */
async function main() {
  console.log('🎨 OPTIMIZE PEXEL - Gerando imagens estratégicas\n');

  // Temas para testar
  const temas = ['alimentacao', 'esporte', 'mental', 'beleza'];

  for (const tema of temas) {
    console.log(`\n━━━ ${tema.toUpperCase()} ━━━`);
    const images = await generateOptimizedImages('exemplo keyword', tema);

    if (images) {
      console.log(`✅ Featured: ${images.featured.url}`);
      console.log(`✅ Inline 1: ${images.inline[0]?.url || 'N/A'}`);
      console.log(`✅ Inline 2: ${images.inline[1]?.url || 'N/A'}`);
      console.log(`✅ Inline 3: ${images.inline[2]?.url || 'N/A'}`);
      console.log(`✅ Cor tema: ${images.color}`);
    }
  }

  console.log(`\n✅ Otimização Pexel pronta para production-real.js!`);
}

export { generateOptimizedImages, insertOptimizedImages, generateAltText };

// Rodar teste
main().catch(console.error);
