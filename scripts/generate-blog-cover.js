#!/usr/bin/env node

/**
 * Generate Blog Cover Image using Pexel API
 * Fetches health/wellness images and creates a blog cover
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PEXEL_API_KEY = process.env.PEXEL_API_KEY || 'YOUR_PEXEL_API_KEY';
const OUTPUT_DIR = path.join(__dirname, '../public/images');
const QUERIES = [
    'health wellness 40+',
    'healthy lifestyle mature adults',
    'wellness fitness over 40',
    'healthy aging',
    'senior health lifestyle'
];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Fetch random health/wellness image from Pexel
 */
async function fetchPexelImage(query) {
    return new Promise((resolve, reject) => {
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&page=${Math.floor(Math.random() * 5) + 1}`;

        const options = {
            hostname: 'api.pexels.com',
            path: `/v1/search?query=${encodeURIComponent(query)}&per_page=1&page=${Math.floor(Math.random() * 5) + 1}`,
            method: 'GET',
            headers: {
                'Authorization': PEXEL_API_KEY,
                'User-Agent': 'Health40Blog/1.0'
            }
        };

        https.get(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.photos && result.photos.length > 0) {
                        resolve(result.photos[0]);
                    } else {
                        reject(new Error('No images found for query: ' + query));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

/**
 * Download image from URL
 */
async function downloadImage(imageUrl, filename) {
    return new Promise((resolve, reject) => {
        const filepath = path.join(OUTPUT_DIR, filename);
        const file = fs.createWriteStream(filepath);

        https.get(imageUrl, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(filepath);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {}); // Delete on error
            reject(err);
        });
    });
}

/**
 * Generate blog cover metadata
 */
function generateCoverMetadata(photo, filename) {
    return {
        filename: filename,
        url: photo.src.large,
        photographer: photo.photographer,
        photographer_url: photo.photographer_url,
        source: 'pexels',
        alt_text: `Health and wellness image for 40+ blog - ${photo.alt || 'healthy lifestyle'}`,
        title: 'Health 40+ Blog Cover',
        caption: `Photo by ${photo.photographer} on Pexels`,
        timestamp: new Date().toISOString()
    };
}

/**
 * Main function
 */
async function generateBlogCover() {
    try {
        console.log('🖼️  Generating blog cover image from Pexel API...\n');

        // Select random query
        const query = QUERIES[Math.floor(Math.random() * QUERIES.length)];
        console.log(`📸 Searching for: "${query}"`);

        // Fetch image
        const photo = await fetchPexelImage(query);
        console.log(`✅ Found: ${photo.alt || 'Health & Wellness Image'}`);
        console.log(`📷 Photographer: ${photo.photographer}`);

        // Download image
        const filename = `blog-cover-${Date.now()}.jpg`;
        const filepath = await downloadImage(photo.src.large, filename);
        console.log(`💾 Saved to: ${filepath}`);

        // Generate metadata
        const metadata = generateCoverMetadata(photo, filename);
        const metadataFile = path.join(OUTPUT_DIR, 'cover-metadata.json');
        fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
        console.log(`📝 Metadata saved to: ${metadataFile}\n`);

        // Output results
        console.log('✨ Blog cover generated successfully!');
        console.log(JSON.stringify(metadata, null, 2));

        return metadata;

    } catch (error) {
        console.error('❌ Error generating blog cover:', error.message);

        if (error.message.includes('YOUR_PEXEL_API_KEY')) {
            console.log('\n⚠️  Please configure PEXEL_API_KEY environment variable:');
            console.log('   export PEXEL_API_KEY="your_api_key_here"');
        }

        process.exit(1);
    }
}

// Run if called directly
generateBlogCover().catch(console.error);

export { fetchPexelImage, downloadImage, generateCoverMetadata };
