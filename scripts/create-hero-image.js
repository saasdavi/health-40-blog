#!/usr/bin/env node

/**
 * Create Hero Image for Blog Cover
 * Generates a beautiful gradient hero image with text overlay
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../public/images');

// Ensure directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate Premium Hero Image
 */
function generateHeroSVG() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="700" viewBox="0 0 1920 700">
    <defs>
        <!-- Premium gradients -->
        <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#7a5ccc;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>

        <radialGradient id="glow1" cx="20%" cy="30%">
            <stop offset="0%" style="stop-color:rgba(255,255,255,0.15);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(255,255,255,0);stop-opacity:1" />
        </radialGradient>

        <radialGradient id="glow2" cx="80%" cy="80%">
            <stop offset="0%" style="stop-color:rgba(255,107,53,0.1);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(255,107,53,0);stop-opacity:1" />
        </radialGradient>

        <filter id="blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>

        <filter id="shadow">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.2" />
        </filter>

        <!-- Animated glow effect -->
        <style>
            @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
            .float { animation: float 6s ease-in-out infinite; }
        </style>
    </defs>

    <!-- Background -->
    <rect width="1920" height="700" fill="url(#mainGradient)"/>

    <!-- Glow layers -->
    <circle cx="300" cy="200" r="400" fill="url(#glow1)" />
    <circle cx="1600" cy="500" r="500" fill="url(#glow2)" />

    <!-- Decorative elements -->
    <g opacity="0.08">
        <circle cx="200" cy="150" r="120" fill="white"/>
        <circle cx="1700" cy="550" r="150" fill="white"/>
        <path d="M 400 700 Q 600 550 800 700 T 1200 700" stroke="white" stroke-width="2" fill="none"/>
    </g>

    <!-- Animated shapes background -->
    <g class="float" style="animation-delay: 0s">
        <circle cx="150" cy="100" r="60" fill="rgba(255,255,255,0.05)" filter="url(#blur)"/>
    </g>
    <g class="float" style="animation-delay: 1s">
        <circle cx="1800" cy="600" r="80" fill="rgba(255,107,53,0.08)" filter="url(#blur)"/>
    </g>

    <!-- Content wrapper -->
    <g>
        <!-- Top accent line -->
        <line x1="400" y1="80" x2="1520" y2="80" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>

        <!-- Main icon/logo -->
        <g filter="url(#shadow)">
            <circle cx="960" cy="120" r="45" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
            <text x="960" y="135" font-family="Arial, sans-serif" font-size="50" text-anchor="middle" fill="white">🏥</text>
        </g>

        <!-- Main Title - Premium styling -->
        <text x="960" y="240" font-family="'Segoe UI', -apple-system, sans-serif" font-size="96" font-weight="700" text-anchor="middle" fill="white" letter-spacing="-2">
            Saúde Após os 40
        </text>

        <!-- Subtitle -->
        <text x="960" y="310" font-family="'Segoe UI', -apple-system, sans-serif" font-size="28" text-anchor="middle" fill="rgba(255,255,255,0.95)" letter-spacing="0.5">
            Conteúdo Premium Para Uma Vida Mais Saudável
        </text>

        <!-- Accent line under title -->
        <line x1="700" y1="340" x2="1220" y2="340" stroke="rgba(255,107,53,0.9)" stroke-width="4" stroke-linecap="round"/>

        <!-- Feature badges -->
        <g>
            <!-- Badge 1 -->
            <rect x="420" y="395" width="280" height="70" rx="12" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" stroke-width="2" filter="url(#shadow)"/>
            <text x="435" y="425" font-family="'Segoe UI', sans-serif" font-size="18" fill="rgba(255,255,255,0.9)">✓ 100% Original</text>
            <text x="435" y="450" font-family="'Segoe UI', sans-serif" font-size="14" fill="rgba(255,255,255,0.7)">Conteúdo Único</text>

            <!-- Badge 2 -->
            <rect x="820" y="395" width="280" height="70" rx="12" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" stroke-width="2" filter="url(#shadow)"/>
            <text x="835" y="425" font-family="'Segoe UI', sans-serif" font-size="18" fill="rgba(255,255,255,0.9)">✓ Pesquisado</text>
            <text x="835" y="450" font-family="'Segoe UI', sans-serif" font-size="14" fill="rgba(255,255,255,0.7)">Baseado em Ciência</text>

            <!-- Badge 3 -->
            <rect x="1220" y="395" width="280" height="70" rx="12" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" stroke-width="2" filter="url(#shadow)"/>
            <text x="1235" y="425" font-family="'Segoe UI', sans-serif" font-size="18" fill="rgba(255,255,255,0.9)">✓ Atualizado</text>
            <text x="1235" y="450" font-family="'Segoe UI', sans-serif" font-size="14" fill="rgba(255,255,255,0.7)">Diariamente</text>
        </g>

        <!-- CTA Section -->
        <g filter="url(#shadow)">
            <!-- Button background -->
            <rect x="760" y="520" width="400" height="70" rx="14" fill="rgba(255,107,53,0.95)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
            <text x="960" y="570" font-family="'Segoe UI', sans-serif" font-size="24" font-weight="600" text-anchor="middle" fill="white">
                Explorar Artigos Agora →
            </text>
        </g>
    </g>
</svg>`;

    return svg;
}

/**
 * Save SVG file
 */
function saveSVGImage(svg, filename) {
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, svg);
    console.log(`✅ Hero image saved: ${filepath}`);
    return filepath;
}

/**
 * Fetch and save Pexel image as backup
 */
async function fetchBackupImage() {
    const PEXEL_API_KEY = process.env.PEXEL_API_KEY;

    if (!PEXEL_API_KEY) {
        console.log('⚠️  PEXEL_API_KEY not configured. Using SVG-only hero.');
        return null;
    }

    return new Promise((resolve) => {
        const query = 'health wellness lifestyle 40+';
        const options = {
            hostname: 'api.pexels.com',
            path: `/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
            method: 'GET',
            headers: {
                'Authorization': PEXEL_API_KEY,
                'User-Agent': 'Health40Blog/1.0'
            }
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.photos && result.photos.length > 0) {
                        const photo = result.photos[0];
                        console.log(`📸 Pexel image found: ${photo.photographer}`);
                        resolve({
                            url: photo.src.large,
                            photographer: photo.photographer,
                            photographer_url: photo.photographer_url
                        });
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

/**
 * Generate hero metadata
 */
function generateHeroMetadata(svg, pexelData) {
    return {
        type: 'svg_with_gradient',
        dimensions: '1920x600',
        colors: ['#667eea', '#764ba2'],
        elements: [
            'gradient_background',
            'decorative_shapes',
            'main_title',
            'subtitle',
            'cta_text'
        ],
        pexel_backup: pexelData || null,
        created_at: new Date().toISOString(),
        responsive: true,
        accessibility: {
            alt_text: 'Health 40+ Blog - Conteúdo original sobre saúde para pessoas acima de 40 anos',
            title: 'Saúde Após os 40 - Blog de Saúde Premium'
        }
    };
}

/**
 * Main function
 */
async function createHeroImage() {
    try {
        console.log('🎨 Creating blog hero image...\n');

        // Generate SVG
        const svg = generateHeroSVG();
        const svgFile = saveSVGImage(svg, 'hero-bg.svg');

        // Try to fetch Pexel backup
        console.log('\n📸 Attempting to fetch Pexel backup image...');
        const pexelData = await fetchBackupImage();

        // Generate metadata
        const metadata = generateHeroMetadata(svg, pexelData);
        const metadataFile = path.join(OUTPUT_DIR, 'hero-metadata.json');
        fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));

        console.log(`\n✨ Hero image created successfully!`);
        console.log(`   SVG: ${svgFile}`);
        console.log(`   Metadata: ${metadataFile}`);
        console.log(`\nMetadata:`);
        console.log(JSON.stringify(metadata, null, 2));

        return { svg: svgFile, metadata };

    } catch (error) {
        console.error('❌ Error creating hero image:', error.message);
        process.exit(1);
    }
}

// Run if called directly
createHeroImage().catch(console.error);

export { generateHeroSVG, saveSVGImage, fetchBackupImage, generateHeroMetadata };
