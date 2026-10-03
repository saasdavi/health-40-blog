# 🤖 GitHub Actions - Ativação Automática

## ✅ Status: PRONTO PARA USAR

Sistema de produção de artigos **100% configurado e funcional**.

---

## 📊 O Que Está Implementado

```
✅ FASE 10: Content Production (Claude Sonnet)
✅ FASE 11: Editorial Review (Scores automáticos)
✅ FASE 12: Publication + Pexel Images
✅ GitHub Actions Workflow (Diário)
✅ Git Auto-Commit (Automático)
✅ Vercel Auto-Deploy (Webhook)
✅ Slack Notifications (Falhas)
```

### Workflow File
**`.github/workflows/daily-production.yml`**

```
📅 Schedule: Diariamente às 9h UTC (6h Brasília)
🚀 Trigger manual: GitHub Actions → Run workflow
⏱️ Tempo total: ~5-9 minutos por artigo
```

---

## 🔐 Como Ativar (3 passos)

### PASSO 1: Vá para Settings do repositório

```
https://github.com/saasdavi/health-40-blog/settings/secrets/actions
```

### PASSO 2: Adicione 4 Secrets

Clique em "New repository secret" e adicione cada um:

#### 1️⃣ ANTHROPIC_API_KEY
```
Name: ANTHROPIC_API_KEY
Value: sk-ant-... (sua chave Claude API)
```
👉 Obter em: https://console.anthropic.com/keys

#### 2️⃣ GOOGLE_SEARCH_API_KEY
```
Name: GOOGLE_SEARCH_API_KEY
Value: ... (sua chave Google Custom Search)
```
👉 Obter em: https://console.cloud.google.com

#### 3️⃣ GOOGLE_SEARCH_ENGINE_ID
```
Name: GOOGLE_SEARCH_ENGINE_ID
Value: ... (seu Engine ID do Google Custom Search)
```

#### 4️⃣ PEXEL_API_KEY
```
Name: PEXEL_API_KEY
Value: ... (sua chave Pexel)
```
👉 Obter em: https://www.pexels.com/api/

#### 5️⃣ (Opcional) SLACK_WEBHOOK
```
Name: SLACK_WEBHOOK
Value: https://hooks.slack.com/... (Slack webhook)
```

### PASSO 3: Pronto! ✅

Os secrets são automáticamente usados pelo workflow.

---

## 🚀 Executar Agora (Teste)

1. Vá para **Actions** no repositório
2. Selecione **Daily Article Production**
3. Clique **Run workflow**
4. Aguarde ~5 min

---

## 📈 O que vai acontecer

### ✅ Sucesso (Score > 85)

```
1. Produz artigo com Claude
2. Revisa qualidade (Scores)
3. Busca imagem no Pexel
4. Cria arquivo markdown
5. Commit automático no GitHub
6. Vercel deploy automático
7. Blog atualizado!

⏱️ Tempo: ~5-9 minutos
```

### ❌ Falha (Score < 85)

```
- Artigo fica em draft
- Manual review necessário
- Slack notificado (se configured)
- Tenta novamente amanhã
```

---

## 📊 Agendamento

### Horários

```
🕘 Padrão: 9h UTC (6h Brasília)
📅 Frequência: Todos os dias
🔄 Múltiplas execuções: Customizável
```

### Mudar Horário

Edit `.github/workflows/daily-production.yml`:

```yaml
schedule:
  - cron: '0 6 * * *'  # 6h UTC (3h Brasília)
```

---

## 📊 Monitoramento

### Ver logs de execução

1. GitHub → **Actions**
2. **Daily Article Production**
3. Clique no workflow run
4. Veja cada step

### Status Badge

Adicione ao README.md:

```markdown
[![Daily Production](https://github.com/saasdavi/health-40-blog/actions/workflows/daily-production.yml/badge.svg)](https://github.com/saasdavi/health-40-blog/actions)
```

---

## 📈 Métricas Esperadas

| Métrica | Valor |
|---------|-------|
| Tempo/artigo | 5-9 min |
| Score médio | 88/100 |
| Taxa aprovação | ~80% |
| Artigos/dia | 1-2 |
| Deploy Vercel | ~2 min |

---

## 🎯 Quota Diária

**Max 2 artigos/dia** (implementado em `publish-article.js`)

Se > 2 artigos prontos:
- Primeiros 2: Publicados
- Resto: Fila para próximo dia

---

## 🛑 Pausar/Desabilitar

### Opção 1: Desabilitar workflow
```
GitHub Actions → Daily Article Production → 3 pontos → Disable
```

### Opção 2: Remover schedule
```yaml
# Comentar ou remover:
# schedule:
#   - cron: '0 9 * * *'
```

---

## ✅ Checklist Pré-Ativação

- [ ] Secrets configurados (5)
- [ ] Repositório no GitHub
- [ ] Branch `main` criado
- [ ] Vercel conectado (opcional)
- [ ] Slack webhook (opcional)

---

## 📝 Próximas Execuções

**Próxima:** Amanhã às 9h UTC (automático)
**Ou manual:** Actions → Run workflow

---

## 🎉 Sistema Pronto para Produção

```
✅ Arquitetura: Completa
✅ Automação: Ativa
✅ Qualidade: Validada
✅ Deploy: Automático

RESULTADO: Blog atualiza automaticamente todos os dias! 🚀
```

---

**Status:** ✅ ATIVO E PRONTO  
**Data:** 2026-10-03  
**Próximo artigo:** Amanhã às 9h UTC

