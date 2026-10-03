# GitHub Actions Automação - Produção Diária

## 🤖 O que é?

**GitHub Actions** executa o fluxo completo (FASE 10→11→12) **automaticamente todos os dias**:

```
9h UTC (6h Brasília)
    ↓
GitHub Actions inicia
    ↓
FASE 10: Produz artigo
    ↓
FASE 11: Revisa qualidade
    ↓
FASE 12: Publica + Imagens
    ↓
Git commit + push
    ↓
Vercel auto-deploy
    ↓
Blog atualizado!
```

## 🔧 Configuração

### 1. Adicionar Secrets no GitHub

Vá para: **Repositório → Settings → Secrets and variables → Actions**

Adicione cada secret:

```
ANTHROPIC_API_KEY
    Value: sk-ant-... (sua chave Claude)

GOOGLE_SEARCH_API_KEY
    Value: ... (Google Custom Search API key)

GOOGLE_SEARCH_ENGINE_ID
    Value: ... (seu engine ID)

PEXEL_API_KEY
    Value: ... (sua chave Pexel)
```

### 2. Adicionar Webhook no GitHub

Vercel automaticamente detecta pushes e deploya.

Se precisar manual:

**Repository → Settings → Webhooks → Add webhook**

```
Payload URL: seu webhook Vercel
Content type: application/json
Events: Just the push event
```

## 📅 Schedule

**Arquivo:** `.github/workflows/daily-production.yml`

**Padrão cron:** `0 9 * * *`
- Segundo: 0
- Minuto: 0
- Hora: 9 UTC (6h Brasília)
- Dia: * (todo dia)
- Mês: * (todo mês)
- Dia semana: * (todo dia semana)

**Mudar horário:**
```yaml
schedule:
  - cron: '0 6 * * *'  # 6h UTC (3h Brasília)
```

## 🔄 Fluxo Automático

### Trigger
- ✅ **Agendado:** Diariamente às 9h UTC
- ✅ **Manual:** Workflow dispatch (clique em "Run workflow")

### Steps
1. **Checkout:** Clonar repositório
2. **Setup:** Node.js 18
3. **FASE 10:** `node scripts/production.js`
4. **FASE 11:** `node scripts/review-article.js`
5. **FASE 12:** `node scripts/publish-article.js`
6. **Git:** Commit + Push
7. **Vercel:** Auto-notificado via webhook
8. **Slack:** Notificação se falhar

## 📊 O que acontece

### Se artigo aprovado (score > 85):
```
✅ Artigo produzido
✅ Revisado e aprovado
✅ Arquivo markdown criado
✅ Imagem Pexel adicionada
✅ Commit no GitHub
✅ Push automático
✅ Vercel deploy ativado
✅ Blog atualizado
🎉 PUBLICADO!
```

### Se artigo rejeitado (score < 85):
```
❌ Score insuficiente
📋 Artigo fica em draft
🔍 Manual review necessário
⏭️ Tenta novamente amanhã
```

## 🚀 Execução Manual

Para testar ou forçar produção:

1. Vá para **Actions**
2. Selecione **Daily Article Production**
3. Clique **Run workflow**
4. Aguarde ~5 minutos

## 📈 Monitoramento

### Ver logs
1. **Actions → Daily Article Production**
2. Clique no workflow run
3. Veja cada step

### Status badge
```markdown
[![Daily Production](https://github.com/saasdavi/health-40-blog/actions/workflows/daily-production.yml/badge.svg)](https://github.com/saasdavi/health-40-blog/actions)
```

## 🔔 Notificações

### Slack (opcional)
Se configurar `SLACK_WEBHOOK`:
- ❌ Falhas são notificadas no Slack
- ✅ Sucessos não enviam (evita spam)

Configurar:
1. Criar app Slack
2. Obter webhook URL
3. Adicionar secret: `SLACK_WEBHOOK`

## 🛑 Pausar automação

### Opção 1: Desabilitar workflow
```bash
# No GitHub:
# Actions → Daily Article Production → 3 pontos → Disable
```

### Opção 2: Remover schedule
```yaml
# Remova ou comente o schedule:
# on:
#   schedule:
#     - cron: '0 9 * * *'
```

### Opção 3: Condicionar por label
```yaml
if: contains(github.event.head_commit.message, '[auto]')
```

## ⚙️ Customização

### Trocar horário
```yaml
schedule:
  - cron: '0 14 * * 1-5'  # Seg-Sex, 14h UTC
```

### Incluir só finais de semana
```yaml
schedule:
  - cron: '0 9 * * 6,0'  # Sab e Dom
```

### Múltiplas execuções por dia
```yaml
schedule:
  - cron: '0 6,12,18 * * *'  # 6h, 12h, 18h UTC
```

## 🔐 Segurança

- Secrets nunca são expostos nos logs
- Bot user criado (`Health 40+ Bot`)
- Commits rastreáveis
- Pode revogar acesso a qualquer momento

## 📞 Troubleshooting

### "Authentication failed"
- Verificar secrets estão configurados
- Regenerar chaves de API se necessário

### "API rate limit exceeded"
- Aumentar intervalo entre execuções
- Ou reduzir keywords processadas

### "Artigos não publicados"
- Verificar logs no Actions
- Confirmar scores (deve ser > 85)
- Testar manualmente: `node scripts/produce-2-articles.js`

## 🎯 Meta

```
✅ Produção automática: 1 artigo/dia
✅ Score mínimo: 85/100
✅ Imagens automáticas: Pexel
✅ Deploy automático: Vercel
✅ Blog sempre atualizado: 24/7

RESULTADO: Sistema autônomo 100%
```

---

**Status:** ✅ Configurado e pronto  
**Próxima execução:** Amanhã às 9h UTC  
**Retenção:** GitHub Actions logs por 90 dias
