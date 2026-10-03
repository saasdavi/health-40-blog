# Pexel API Integration - Automatic Images for Articles

## Overview

Integração com **Pexel API** para adicionar imagens automáticas a cada artigo:

```
Article Ready for Publication
    ↓
Search Pexel para imagens relevantes
    ├── Busca por keyword principal
    ├── Seleciona melhor imagem (landscape preferred)
    └── 5 resultados por busca
    ↓
Add Featured Image
    ├── Markdown: ![alt text](image-url)
    ├── Crédito ao fotógrafo (Pexel)
    └── Link para fotógrafo
    ↓
Ensure Accessibility
    ├── Alt text descritivo
    ├── Nunca vazio ou null
    └── Relacionado ao conteúdo
    ↓
Article with Image Ready for Publication
```

## Setup

### 1. Get Pexel API Key

```bash
# Visit: https://www.pexels.com/api/
# Sign up (free)
# Create new API key
# Copy key
```

### 2. Configure .env

```bash
# Add to .env:
PEXEL_API_KEY=your_api_key_here
```

### 3. Ready to Use!

Images automatically added during publication.

## How It Works

### PHASE 12: Publication Pipeline

Quando artigo é publicado:

1. **Search Pexel** para o keyword principal
   ```javascript
   query: article.keywords.primaryKeyword
   per_page: 5
   ```

2. **Select Best Image**
   ```javascript
   // Prefer landscape (width > height)
   const landscape = photos.filter(p => p.width > p.height);
   const bestPhoto = landscape.length > 0 ? landscape[0] : photos[0];
   ```

3. **Add to Article** com markdown
   ```markdown
   ![keyword-description](image-url)
   
   _Foto por [Photographer Name](photographer-url) via Pexel_
   ```

4. **Ensure Accessibility**
   - Alt text sempre descritivo
   - Nunca vazio
   - Relacionado ao conteúdo

### Code Integration

**File:** `scripts/publish-article.js`

```javascript
async function addImagesToArticle(article) {
  // 1. Check PEXEL_API_KEY
  // 2. Search Pexel
  // 3. Select best image
  // 4. Add to content with alt text
  // 5. Return enriched article
}
```

**Called before:**
```javascript
const articleWithImages = await addImagesToArticle(article);
const fileInfo = createArticleFile(articleWithImages);
```

## Image Credit

Cada imagem inclui:

```markdown
![Keyword Description](https://images.pexels.com/...)

_Foto por [Photographer Name](https://www.pexels.com/@photographer/) via Pexel_
```

**Razões:**
- ✅ Respeita direitos autorais
- ✅ Crédito ao fotógrafo
- ✅ Link para mais trabalhos
- ✅ Promove Pexel

## Accessibility Standards

### Alt Text

Sempre presente e descritivo:

```markdown
❌ Bad:   ![](image-url)
❌ Bad:   ![img](image-url)
✅ Good:  ![receita bolo saudável mulher 40+](image-url)
```

### HTML Images

Se usar HTML:
```html
❌ Bad:   <img src="...">
✅ Good:  <img src="..." alt="receita bolo saudável mulher 40+">
```

### Validation

FASE 11 (Editorial Review) valida:
- [ ] Todas imagens têm alt text?
- [ ] Alt text é descritivo?
- [ ] Alt text relacionado ao conteúdo?

## Fallback

Se **PEXEL_API_KEY não configurada**:
- ✅ Artigo publica normalmente
- ⚠️ Sem imagens automáticas
- 📝 Pode adicionar imagens manualmente depois

## Examples

### Exemplo 1: Nutrição

```
Keyword: "receita bolo saudável mulher 40+"

Pexel Search: "healthy cake"
Result: Imagem de bolo saudável

Markdown:
![Receita de bolo saudável para mulheres 40+](pexel-image-url)
_Foto por Jane Smith via Pexel_
```

### Exemplo 2: Exercício

```
Keyword: "musculação mulher 40+"

Pexel Search: "woman strength training"
Result: Imagem de mulher fazendo exercício

Markdown:
![Mulher fazendo musculação após os 40](pexel-image-url)
_Foto por John Doe via Pexel_
```

## Features

✅ **Automatic Search**
- Based on article keyword
- Smart selection (landscape preferred)

✅ **Accessibility**
- Alt text always present
- Descriptive and relevant

✅ **Attribution**
- Photographer credit
- Link to photographer
- Pexel attribution

✅ **Rate Limiting**
- 500ms delay between requests
- Respect API limits
- Graceful fallback

✅ **Flexible**
- Works with or without API key
- Falls back to no images
- Manual image addition still possible

## Pexel API Limits

**Free tier:**
- Unlimited requests
- 200 requests/hour per API key
- High quality images

**Perfect for:**
- Blog articles (1-5 per day max)
- Plenty of room for future growth

## Commands

```bash
# Images added automatically during publication
# No separate command needed

# But you can add images manually if needed:
node scripts/add-images.js

# Or during publication:
node scripts/publish-article.js
# (automatically calls addImagesToArticle)
```

## Future Enhancements

- [ ] Multiple images per article (hero + sections)
- [ ] Image optimization (resize, compress)
- [ ] Caption generation with Claude
- [ ] Image SEO (structured data)
- [ ] A/B testing images for CTR

## Support

- **Pexel Docs:** https://www.pexels.com/api/documentation/
- **Getting API Key:** https://www.pexels.com/api/
- **License:** Pexel images are free to use

---

**Last Updated:** 2024-10-03
**Status:** Implemented and integrated with PHASE 12
**Accessibility:** WCAG 2.1 AA compliant
