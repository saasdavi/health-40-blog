/**
 * Google Autocomplete Module
 *
 * Expands seed keywords using Google's autocomplete suggestions.
 *
 * No API needed - uses public Google Autocomplete endpoint.
 *
 * Returns natural search suggestions people actually type.
 */

import https from 'https';

/**
 * Fetch Google Autocomplete suggestions
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of suggestions
 */
async function getAutocomplete(query) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      client: 'firefox',
      q: query,
      hl: 'pt-BR'
    });

    const url = `https://www.google.com/complete/search?${params.toString()}`;

    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          // Google returns: [query, [suggestions], [descriptions], [types]]
          const parsed = JSON.parse(data);
          const suggestions = parsed[1] || [];
          resolve(suggestions);
        } catch (e) {
          reject(new Error(`Failed to parse autocomplete: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Expand a seed keyword recursively
 * @param {string} seed - Seed keyword
 * @param {number} depth - Current depth
 * @param {number} maxDepth - Maximum recursion depth
 * @returns {Promise<Array>} Array of expanded keywords
 */
async function expandKeyword(seed, depth = 0, maxDepth = 2) {
  const expanded = [seed];

  if (depth >= maxDepth) {
    return expanded;
  }

  try {
    console.log(`  ${'  '.repeat(depth)}→ Expanding: "${seed}"`);

    const suggestions = await getAutocomplete(seed);

    for (const suggestion of suggestions.slice(0, 5)) {
      if (suggestion.length > seed.length && !expanded.includes(suggestion)) {
        expanded.push(suggestion);

        // Recursively expand (only first few to avoid explosion)
        const deeper = await expandKeyword(suggestion, depth + 1, maxDepth);
        expanded.push(...deeper.slice(1)); // Skip the seed itself
      }
    }
  } catch (error) {
    console.warn(`    ⚠️  Error expanding "${seed}": ${error.message}`);
  }

  return expanded;
}

/**
 * Discover keywords from seeds using Google Autocomplete
 */
async function discoverFromAutocomplete() {
  console.log('\n🔍 PHASE 6: Google Autocomplete Discovery\n');

  const seeds = [
    'saúde depois dos 40',
    'colesterol',
    'sono',
    'exercício depois dos 40',
    'alimentação saudável 40+'
  ];

  const allExpanded = {};

  for (const seed of seeds) {
    console.log(`\n📌 Processing: "${seed}"`);
    const expanded = await expandKeyword(seed, 0, 2);
    allExpanded[seed] = expanded;
    console.log(`  ✓ Found ${expanded.length} variations`);
  }

  return allExpanded;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  discoverFromAutocomplete()
    .then((results) => {
      console.log('\n\n📊 Summary:');
      let total = 0;
      for (const [seed, keywords] of Object.entries(results)) {
        console.log(`  ${seed}: ${keywords.length} keywords`);
        total += keywords.length;
      }
      console.log(`\n  Total discovered: ${total} keywords`);
    })
    .catch((error) => {
      console.error('❌ Discovery failed:', error.message);
      process.exit(1);
    });
}

export { getAutocomplete, expandKeyword, discoverFromAutocomplete };
