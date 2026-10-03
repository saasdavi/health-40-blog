// Schema.org JSON-LD generators
// Funções para criar structured data completo com E-E-A-T

import { SITE } from '../config/site';

export interface ArticleSchemaProps {
  headline: string;
  description: string;
  image: string;
  imageAlt: string;
  author?: string;
  publishedTime: Date;
  modifiedTime: Date;
  wordCount?: number;
  slug: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Gera Schema.org Article JSON-LD
 * Inclui: headline, description, image, author, publisher, datePublished, dateModified
 * Suporta E-E-A-T: Experience, Expertise, Authoritativeness, Trustworthiness
 */
export function articleJsonLd({
  headline,
  description,
  image,
  imageAlt,
  author = SITE.defaultAuthor,
  publishedTime,
  modifiedTime,
  wordCount = 0,
  slug,
}: ArticleSchemaProps): Record<string, unknown> {
  const url = new URL(slug, SITE.url).href;
  const imageUrl = new URL(image, SITE.url).href;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image: {
      '@type': 'ImageObject',
      url: imageUrl,
      alt: imageAlt,
      width: SITE.image.width,
      height: SITE.image.height,
    },
    datePublished: publishedTime.toISOString(),
    dateModified: modifiedTime.toISOString(),
    author: {
      '@type': 'Organization',
      name: author,
      url: SITE.url,
      logo: {
        '@type': 'ImageObject',
        url: new URL('/logo.svg', SITE.url).href,
      },
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: {
        '@type': 'ImageObject',
        url: new URL('/logo.svg', SITE.url).href,
      },
      // E-E-A-T: Informações de contato para credibilidade
      sameAs: Object.values(SITE.social).filter((url) => url),
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '',
        contactType: 'Customer Support',
        url: SITE.url,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    wordCount,
    inLanguage: SITE.lang,
    // E-E-A-T: Indicar que é conteúdo original
    isAccessibleForFree: true,
  };
}

/**
 * Gera Schema.org BreadcrumbList JSON-LD
 * Para navegação estruturada: Home > Artigos > Título
 */
export function breadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  const itemListElement = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: new URL(item.url, SITE.url).href,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

/**
 * Gera Schema.org Organization JSON-LD
 * Para página inicial e dados gerais do site
 */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: new URL('/logo.svg', SITE.url).href,
    description: SITE.description,
    sameAs: Object.values(SITE.social).filter((url) => url),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '',
      contactType: 'Customer Support',
      url: SITE.url,
    },
  };
}

/**
 * Gera Schema.org WebSite JSON-LD
 * Define SearchAction para busca integrada no Google
 */
export function websiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: SITE.lang,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE.url}/?s={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
