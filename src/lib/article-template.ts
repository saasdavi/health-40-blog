// article-template.ts - Template generator para artigos E-E-A-T

export interface ArticleKeywords {
  primary: string;
  secondary: string[];
}

export interface ImageCredit {
  author: string;
  source: 'pexels' | 'pixabay' | 'unsplash' | 'internal';
  url: string;
  license: string;
}

export interface ArticleSection {
  h2: string;
  h3s: string[];
  content: string;
  images?: {
    url: string;
    alt: string;
    credit: ImageCredit;
  }[];
}

export interface ArticleSource {
  title: string;
  url: string;
  author?: string;
  publicationDate?: string;
  type: 'scientific' | 'medical' | 'news' | 'health' | 'blog';
}

export interface CTAConfig {
  mounjaxi: {
    enabled: boolean;
    position: 'inline' | 'full' | 'end';
    headline: string;
    description: string;
  };
}

export interface ArticleTemplate {
  // SEO & Meta
  title: string;
  seoTitle: string;
  description: string;
  slug: string;
  keywords: ArticleKeywords;

  // Authorship & Trust (E-E-A-T)
  author: string;
  authorBio?: string;
  createdAt: string;
  updatedAt?: string;

  // Featured Image (Experiência)
  featuredImage: string;
  featuredImageAlt: string;
  imageCredit: ImageCredit;

  // Main Content (Especialidade)
  sections: ArticleSection[];

  // Authority & Expertise
  schema: {
    articleType: string;
    breadcrumbs: Array<{
      name: string;
      url: string;
    }>;
  };

  // Sources & Trust (Confiança)
  sources: ArticleSource[];
  disclaimer: string;

  // Health Safety (Confiança)
  healthWarning: {
    enabled: boolean;
    message: string;
    doctorConsultation: boolean;
  };

  // Monetization (CTA Mounjaxi)
  cta: CTAConfig;

  // Metrics
  wordCount?: number;
  readingTime?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Gera template de artigo E-E-A-T completo
 * @param keyword - Palavra-chave principal (ex: "colesterol depois dos 40")
 * @param searchVolume - Volume de busca (opcional)
 * @param competitionData - Dados de concorrência (opcional)
 */
export function generateArticleTemplate(
  keyword: string,
  searchVolume?: number,
  competitionData?: Record<string, any>
): ArticleTemplate {
  const slug = keyword
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .slice(0, 75);

  const today = new Date().toISOString();

  return {
    // SEO & Meta
    title: generateTitle(keyword),
    seoTitle: generateSeoTitle(keyword),
    description: generateMetaDescription(keyword),
    slug,
    keywords: {
      primary: keyword,
      secondary: generateSecondaryKeywords(keyword),
    },

    // Authorship & Trust
    author: 'Saúde 40+',
    authorBio: 'Especialista em saúde preventiva para adultos 40+',
    createdAt: today,

    // Featured Image
    featuredImage: 'https://images.pexels.com/photos/8436696/pexels-photo-8436696.jpeg',
    featuredImageAlt: `Imagem representativa: ${keyword}`,
    imageCredit: {
      author: 'Pexel Contributors',
      source: 'pexels',
      url: 'https://www.pexels.com',
      license: 'Pexel License - Libre para usar',
    },

    // Content Structure (Especialidade)
    sections: generateSections(keyword),

    // Authority & Expertise
    schema: {
      articleType: 'HealthArticle',
      breadcrumbs: [
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
        { name: keyword, url: `/blog/${slug}` },
      ],
    },

    // Sources & Trust
    sources: generateDefaultSources(),
    disclaimer: generateDisclaimer(),

    // Health Safety
    healthWarning: {
      enabled: true,
      message:
        'Este artigo é informativo e não substitui orientação médica profissional. Sempre consulte um profissional de saúde antes de fazer mudanças significativas em sua rotina.',
      doctorConsultation: true,
    },

    // CTA Mounjaxi
    cta: {
      mounjaxi: {
        enabled: true,
        position: 'end',
        headline: 'Pronto para transformar seu corpo aos 40+?',
        description:
          'Mounjaxi Vitta foi formulado especificamente para mulheres 40+ que querem resultados reais. Acelera metabolismo, suprime apetite e aumenta energia.',
      },
    },

    // Metrics
    difficulty: 'intermediate',
  };
}

/**
 * Gera título otimizado para SEO
 */
function generateTitle(keyword: string): string {
  return `${keyword}: Guia Completo para Saúde aos 40+`;
}

/**
 * Gera título SEO (até 60 caracteres)
 */
function generateSeoTitle(keyword: string): string {
  const title = `${keyword} - Guia Especializado 40+`;
  return title.slice(0, 60);
}

/**
 * Gera meta description (até 160 caracteres)
 */
function generateMetaDescription(keyword: string): string {
  const desc = `Tudo que você precisa saber sobre ${keyword}. Estratégias comprovadas, dicas práticas e informações de confiança para sua saúde aos 40+.`;
  return desc.slice(0, 160);
}

/**
 * Gera palavras-chave secundárias baseadas na principal
 */
function generateSecondaryKeywords(keyword: string): string[] {
  return [
    `${keyword} aos 40`,
    `como ${keyword}`,
    `${keyword} saúde`,
    `melhor forma ${keyword}`,
    `${keyword} idade avançada`,
    `${keyword} mulheres 40+`,
    `${keyword} prevenção`,
    `${keyword} natural`,
  ];
}

/**
 * Gera estrutura de seções padrão (H2 > H3)
 */
function generateSections(keyword: string): ArticleSection[] {
  return [
    {
      h2: `O que é ${keyword}?`,
      h3s: [
        'Definição',
        'Por que é importante aos 40+',
        'Impacto na saúde',
      ],
      content: 'Conteúdo será preenchido pelo Claude durante geração de artigo',
      images: [
        {
          url: 'https://images.pexels.com/photos/4427809/pexels-photo-4427809.jpeg',
          alt: `Ilustração explicativa: ${keyword}`,
          credit: {
            author: 'Pexel Contributors',
            source: 'pexels',
            url: 'https://www.pexels.com',
            license: 'Pexel License',
          },
        },
      ],
    },
    {
      h2: `Causas e Fatores de Risco`,
      h3s: [
        'Fatores biológicos',
        'Hábitos de vida',
        'Genética e hereditariedade',
        'Impacto da idade',
      ],
      content: 'Conteúdo será preenchido pelo Claude durante geração de artigo',
    },
    {
      h2: `Sinais e Sintomas`,
      h3s: [
        'Principais sintomas',
        'Quando procurar um médico',
        'Diagnóstico',
      ],
      content: 'Conteúdo será preenchido pelo Claude durante geração de artigo',
    },
    {
      h2: `Estratégias Práticas para Controlar ${keyword}`,
      h3s: [
        'Mudanças na alimentação',
        'Exercício físico',
        'Gerenciamento do estresse',
        'Sono e descanso',
      ],
      content: 'Conteúdo será preenchido pelo Claude durante geração de artigo',
      images: [
        {
          url: 'https://images.pexels.com/photos/3625260/pexels-photo-3625260.jpeg',
          alt: 'Mulher fazendo exercício físico',
          credit: {
            author: 'Pexel Contributors',
            source: 'pexels',
            url: 'https://www.pexels.com',
            license: 'Pexel License',
          },
        },
      ],
    },
    {
      h2: `Tratamentos Profissionais`,
      h3s: [
        'Opções médicas',
        'Medicamentos',
        'Terapias alternativas',
        'Quando procurar ajuda profissional',
      ],
      content: 'Conteúdo será preenchido pelo Claude durante geração de artigo',
    },
    {
      h2: 'Conclusão e Próximos Passos',
      h3s: [
        'Resumo das principais estratégias',
        'Seu plano de ação',
        'Recursos adicionais',
      ],
      content: 'Conteúdo será preenchido pelo Claude durante geração de artigo',
    },
  ];
}

/**
 * Fontes padrão de saúde confiáveis
 */
function generateDefaultSources(): ArticleSource[] {
  return [
    {
      title: 'Mayo Clinic - Saúde Preventiva',
      url: 'https://www.mayoclinic.org/healthy-lifestyle',
      type: 'medical',
    },
    {
      title: 'NIH National Institute on Aging',
      url: 'https://www.nia.nih.gov',
      type: 'scientific',
    },
    {
      title: 'WebMD Health Center',
      url: 'https://www.webmd.com',
      type: 'health',
    },
    {
      title: 'Harvard Health Publishing',
      url: 'https://www.health.harvard.edu',
      type: 'medical',
    },
  ];
}

/**
 * Disclaimer padrão de saúde
 */
function generateDisclaimer(): string {
  return `Aviso Importante: Este artigo é fornecido apenas para fins informativos e educacionais.
Não deve ser considerado como aconselhamento médico profissional, diagnóstico ou tratamento.
Sempre consulte um profissional de saúde qualificado antes de iniciar qualquer novo regime de saúde,
dieta ou exercício. O autor e a plataforma não são responsáveis por qualquer dano ou lesão resultante
do uso das informações contidas neste artigo.`;
}

/**
 * Calcula tempo de leitura baseado em palavra
 */
export function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 200;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Valida estrutura de artigo E-E-A-T
 */
export function validateEEATStructure(article: ArticleTemplate): {
  valid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  // Experiência: autor + disclaimer + sources
  if (!article.author) {
    issues.push('EXPERIÊNCIA: Autor não definido');
    score -= 15;
  }
  if (!article.disclaimer) {
    issues.push('EXPERIÊNCIA: Disclaimer não fornecido');
    score -= 15;
  }
  if (article.sources.length === 0) {
    issues.push('EXPERIÊNCIA: Sem fontes citadas');
    score -= 10;
  }

  // Especialidade: conteúdo > 1500 palavras
  if (!article.wordCount || article.wordCount < 1500) {
    issues.push(
      'ESPECIALIDADE: Artigo com menos de 1500 palavras (recomendado: 1500-2500)'
    );
    score -= 20;
  }
  if (article.sections.length < 4) {
    issues.push('ESPECIALIDADE: Menos de 4 seções principais');
    score -= 10;
  }

  // Autoridade: schema + breadcrumbs + título SEO
  if (!article.schema.breadcrumbs || article.schema.breadcrumbs.length === 0) {
    issues.push('AUTORIDADE: Breadcrumbs não definidos');
    score -= 10;
  }
  if (!article.seoTitle) {
    issues.push('AUTORIDADE: Título SEO não definido');
    score -= 10;
  }

  // Confiança: alt text + imagem crédito + health warning
  if (!article.featuredImageAlt) {
    issues.push('CONFIANÇA: Alt text da imagem destaque não fornecido');
    score -= 10;
  }
  if (!article.imageCredit) {
    issues.push('CONFIANÇA: Crédito de imagem não fornecido');
    score -= 10;
  }
  if (!article.healthWarning.enabled) {
    issues.push('CONFIANÇA: Health warning desabilitado');
    score -= 15;
  }

  return {
    valid: score >= 85,
    score: Math.max(0, score),
    issues,
  };
}
