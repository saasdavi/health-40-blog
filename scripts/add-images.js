/**
 * Add Images with Pexel API - PHASE 12 Integration
 *
 * For each article:
 * 1. Search Pexel for relevant images
 * 2. Select best image based on relevance
 * 3. Add to article with descriptive alt text
 * 4. Ensure accessibility (alt text always present)
 * 5. Add featured image (hero) to article
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES_FILE = path.join(__dirname, '../data/articles.json');

const PEXEL_API_KEY = process.env.PEXEL_API_KEY;

/**
 * Search Pexel for images
 */
async function searchPexelImages(keyword, perPage = 5) {
  if (!PEXEL_API_KEY) {
    console.log('   ℹ️  Set PEXEL_API_KEY for image search');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': PEXEL_API_KEY
        }
      }
    );

    if (!response.ok) {
      console.warn(`   ⚠️  Pexel API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.photos || [];
  } catch (error) {
    console.warn(`   ⚠️  Pexel search failed: ${error.message}`);
    return null;
  }
}

/**
 * Select best image from results
 */
function selectBestImage(photos, keyword) {
  if (!photos || photos.length === 0) {
    return null;
  }

  // Prefer landscape images (width > height)
  const landscape = photos.filter(p => p.width > p.height);
  const bestPhoto = landscape.length > 0 ? landscape[0] : photos[0];

  return {
    id: bestPhoto.id,
    url: bestPhoto.src.large,
    photographer: bestPhoto.photographer,
    photographerUrl: bestPhoto.photographer_url,
    description: `${keyword} - Imagem de ${bestPhoto.photographer}`,
    width: bestPhoto.width,
    height: bestPhoto.height
  };
}

/**
 * Generate markdown image tag with alt text
 */
function generateImageMarkdown(image, altText) {
  if (!image) {
    return '';
  }

  const markdown = `![${altText}](${image.url})\n\n_Imagem: Foto por [${image.photographer}](${image.photographerUrl}) via Pexel_\n\n`;
  return markdown;
}

/**
 * Add featured image to article
 */
async function addFeaturedImage(article) {
  console.log(`   🖼️  Searching for featured image...`);

  const searchKeyword = article.keywords.primaryKeyword;
  const photos = await searchPexelImages(searchKeyword, 5);

  if (!photos) {
    console.log(`   ⚠️  No images found for "${searchKeyword}"`);
    return null;
  }

  const image = selectBestImage(photos, searchKeyword);

  if (image) {
    console.log(`   ✅ Found: ${image.description}`);
    return image;
  }

  return null;
}

/**
 * Add section images to article content
 */
async function addSectionImages(content, article) {
  // Search for images based on main topic
  const searchKeyword = article.keywords.primaryKeyword;
  const photos = await searchPexelImages(searchKeyword, 3);

  if (!photos || photos.length === 0) {
    return content;
  }

  // Add image after main introduction (after first H2)
  const firstH2Index = content.indexOf('\n##');

  if (firstH2Index === -1) {
    return content;
  }

  const image = selectBestImage(photos, searchKeyword);

  if (!image) {
    return content;
  }

  const imageMarkdown = generateImageMarkdown(
    image,
    `Ilustração de ${article.keywords.primaryKeyword}`
  );

  // Insert image after first H2
  const beforeContent = content.substring(0, firstH2Index + 3);
  const afterContent = content.substring(firstH2Index + 3);

  return beforeContent + afterContent.replace(
    '\n',
    `\n\n${imageMarkdown}`,
    1
  );
}

/**
 * Add accessibility alt text to all images in content
 */
function ensureAltText(content, article) {
  // Pattern: ![alt](url) or ![](url) or <img src="">
  // Fix: add descriptive alt text if empty

  // Fix markdown images without alt
  content = content.replace(
    /!\[\]\(([^)]+)\)/g,
    `![${article.keywords.primaryKeyword}]($1)`
  );

  // Fix img tags without alt
  content = content.replace(
    /<img\s+([^>]*?)src="([^"]+)"([^>]*?)>/g,
    (match, before, src, after) => {
      // Check if alt already exists
      if (after.includes('alt=') || before.includes('alt=')) {
        return match;
      }

      // Add descriptive alt text
      return `<img ${before}src="${src}" alt="${article.keywords.primaryKeyword}"${after}>`;
    }
  );

  return content;
}

/**
 * Prepare article with images
 */
async function prepareArticleWithImages(article) {
  console.log(`\n📸 ADDING IMAGES: "${article.title}"`);

  try {
    // Add featured image
    const featuredImage = await addFeaturedImage(article);

    // Prepare content with images
    let enrichedContent = article.content;

    if (featuredImage) {
      // Add featured image at the beginning (after title/description)
      const imageMarkdown = generateImageMarkdown(
        featuredImage,
        `${article.title} - Destaque`
      );

      enrichedContent = imageMarkdown + enrichedContent;
    }

    // Add section images
    enrichedContent = await addSectionImages(enrichedContent, article);

    // Ensure all images have alt text
    enrichedContent = ensureAltText(enrichedContent, article);

    console.log(`   ✅ Images added with accessible alt text`);

    return {
      ...article,
      content: enrichedContent,
      images: {
        featured: featuredImage
      }
    };
  } catch (error) {
    console.error(`   ❌ Image preparation failed: ${error.message}`);
    // Return original article without images
    return article;
  }
}

/**
 * Run image addition for all articles
 */
async function addImagesToArticles() {
  console.log('🖼️  ADDING IMAGES WITH PEXEL\n');

  try {
    const articlesData = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf-8'));

    // Find articles that need images
    const articlesNeedingImages = articlesData.articles.filter(
      a => a.status === 'ready_for_publication' && !a.images
    );

    console.log(`Found ${articlesNeedingImages.length} articles needing images\n`);

    if (articlesNeedingImages.length === 0) {
      console.log('✅ All articles have images');
      return;
    }

    // Add images to each article
    for (const article of articlesNeedingImages) {
      const enriched = await prepareArticleWithImages(article);

      // Update article
      const idx = articlesData.articles.findIndex(a => a.id === article.id);
      articlesData.articles[idx] = enriched;

      // Add small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Save updated articles
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articlesData, null, 2));

    console.log(`\n✅ Images added to all articles!`);
    console.log(`   Ready for publication with full image coverage`);

  } catch (error) {
    console.error('❌ Image addition failed:', error.message);
    process.exit(1);
  }
}

addImagesToArticles();
