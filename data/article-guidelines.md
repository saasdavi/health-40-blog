# E-E-A-T: Guia Completo para Geração de Artigos

Versão: 1.0  
Última atualização: 2026-10-03  
Público: Claude + Redatores de Conteúdo

---

## Introdução: O que é E-E-A-T?

**E-E-A-T** é um framework do Google para avaliar qualidade de conteúdo, especialmente em páginas "Your Money, Your Life" (YMYL) como saúde. Significa:

- **E**xperiência (Experience)
- **E**specialidade (Expertise)
- **A**utoridade (Authority)
- **T**rança/Confiança (Trust)

Nossos artigos devem demonstrar **todos os quatro pilares** em cada peça de conteúdo.

---

## 1. EXPERIÊNCIA (Experience)

### O que é?
Demonstrar que você realmente entende o problema do ponto de vista do leitor. Você não só conhece fatos, mas sabe como é viver com esse desafio.

### Como Implementar:

#### ✅ Autor Identificado
```
Cada artigo DEVE ter:
- Nome do autor (ex: "por Saúde 40+")
- Bio breve (ex: "Especialista em saúde preventiva")
- Data de publicação
- Data de atualização (se revisado)
```

#### ✅ Reconhecer a Realidade do Leitor 40+
Ao iniciar o artigo, valide a experiência do leitor:

```
❌ GENÉRICO: "Muitas pessoas têm problemas com colesterol"
✅ E-E-A-T:   "Depois dos 40, o colesterol sobe naturalmente. Você pode 
               estar seguindo a mesma dieta de sempre e, de repente, 
               seus números disparam. Isso é comum. Vamos entender por quê."
```

#### ✅ Contar com Humildade
Mostre que você aprendeu com experiências passadas:

```
"Após trabalhar com centenas de leitores 40+, vemos um padrão: 
dietas extremas criam rejeição. Estratégias moderadas e sustentáveis 
ganham todas as vezes."
```

#### ✅ Incluir Disclaimer de Saúde
Transparência aumenta confiança. Todo artigo de saúde deve ter:

```
Componente: <ArticleDisclaimer />

Mensagem padrão:
"Este artigo é informativo e não substitui orientação médica profissional. 
Sempre consulte um profissional de saúde antes de fazer mudanças 
significativas em sua rotina."
```

---

## 2. ESPECIALIDADE (Expertise)

### O que é?
Demonstrar profundo conhecimento do tópico. Não superficial. Não copiado. Não genérico.

### Como Implementar:

#### ✅ Cobertura Completa (1500-2500 palavras)
Cada artigo DEVE abordar:

1. **O que é**: Definição clara
2. **Por quê**: Causa e contexto (especialmente para 40+)
3. **Sintomas**: Como reconhecer
4. **Soluções**: Práticas, científicas, realistas
5. **Quando procurar ajuda**: Clareza sobre escopo
6. **Próximos passos**: Ação concreta

#### ✅ Estrutura Hierárquica Apropriada

```
H1: Título completo do artigo
  H2: Seção 1 (definição, contexto)
    H3: Sub-aspecto
    H3: Sub-aspecto
  H2: Seção 2 (causas)
    H3: Sub-aspecto
    H3: Sub-aspecto
```

**Regra**: Nunca pule níveis (ex: H1 > H3 é ruim).

#### ✅ Exemplo Não-Genérico

```
❌ GENÉRICO: "O exercício é bom para a saúde"
✅ ESPECIALIDADE: "Para mulheres 40+, 150 minutos de exercício moderado 
                  por semana reduz pressão arterial em ~5-8 mmHg (pesquisa 
                  de 2023). A chave é consistência, não intensidade. 
                  Começar aos 40+ é ainda mais benéfico que aos 30."
```

#### ✅ Usar Dados e Número
Citações numéricas aumentam credibilidade:

```
"Em média, mulheres ganham 1-2kg por ano após os 40..."
"Um estudo de 2024 mostrou que 73% dos adultos 40+ sofrem com insônia..."
"Reduzir sódio em 2g/dia diminui pressão em ~5 mmHg..."
```

#### ✅ Diferenciar Opções com Honestidade

```
✅ BOM: "Existem 3 abordagens: A (funciona rápido mas caro), 
         B (lento mas natural), C (equilibrado). Para você 40+ 
         que trabalha, recomendo C porque..."

❌ RUIM: "Existe apenas uma forma correta: A"
```

#### ✅ Reconhecer Limitações
Especialistas sabem o que NÃO sabem:

```
"Infelizmente, não há consenso científico sobre [TÓPICO]. 
A pesquisa atual sugere [OPÇÃO A] mas [OPÇÃO B] também tem defensores. 
Consulte seu médico baseado na sua situação."
```

---

## 3. AUTORIDADE (Authority)

### O que é?
Ser visto como referência confiável no tópico. Ter credenciais, estrutura e rigor.

### Como Implementar:

#### ✅ Breadcrumbs (Navegação)
Ajuda usuário e Google entender contexto:

```
Home > Blog > Saúde Cardiovascular > Colesterol Depois dos 40
```

Gerado automaticamente via `schema.breadcrumbs`

#### ✅ Schema.org Markup
Google lê dados estruturados. Cada artigo deve ter:

```json
{
  "@context": "https://schema.org",
  "@type": "HealthAndBeautyBusiness",
  "name": "Saúde 40+",
  "description": "Blog especializado em saúde para adultos 40+",
  "author": {
    "@type": "Person",
    "name": "Saúde 40+"
  }
}
```

#### ✅ Links Internos
Mostre que você tem cobertura completa do tópico:

```
Neste artigo, mencionamos:
- [Dieta para 40+ (link interno)]
- [Exercício em casa (link interno)]
- [Sono de qualidade (link interno)]

Regra: 3-5 links internos por artigo
```

#### ✅ Links Externos para Autoridades
Cite fontes confiáveis:

```
✅ Mayo Clinic, Harvard Health, NIH, CDC
✅ Estudos publicados em periódicos revisados por pares
❌ Blogs de concorrentes
❌ Sites sem autoria clara
```

#### ✅ Data de Publicação e Atualização
Google adora conteúdo recente:

```
Publicado: 3 de outubro de 2026
Última atualização: [data]

Se o artigo for revisado, SEMPRE atualize a data
```

---

## 4. CONFIANÇA (Trust)

### O que é?
O leitor sente que está seguro com você. Você é transparente, cuidadoso e responsável.

### Como Implementar:

#### ✅ Alt Text Descritivo em Toda Imagem

```
❌ Ruim: alt="imagem de exercício"
✅ Bom: alt="Mulher de 45 anos fazendo alongamento matinal em casa"

Regra: 100-150 caracteres, descritivo, sem exagero
```

#### ✅ Crédito de Imagem em Lugar Visível

```
Componente: <ArticleSources imageCredits={[...]} />

Formato: "Foto por [Autor] via [Fonte] - Licença [Tipo]"
Exemplo: "Foto por Maria Silva via Pexels - Licença Livre"
```

#### ✅ Fontes Citadas no Final

```
Componente: <ArticleSources sources={[...]} />

Deve incluir:
- Título da fonte
- URL clicável
- Autor (se disponível)
- Data de publicação
- Tipo: scientific | medical | news | health | blog
```

#### ✅ Health Warning Ativo
Todo artigo deve avisar sobre limites de saúde:

```
<ArticleDisclaimer 
  variant="warning"
  doctorConsultation={true}
/>
```

#### ✅ Transparência sobre Monetização
Seja honesto sobre links de afiliação:

```
"Este blog é monetizado através de links de afiliação. 
Alguns links podem levar a produtos que recomendamos. 
Nossas opiniões são sempre nossas."
```

#### ✅ Evitar Exageros e Afirmações Absolutas

```
❌ "Isto vai curar sua [CONDIÇÃO]"
✅ "Isto pode ajudar a gerenciar [CONDIÇÃO]"

❌ "Garantido 100% de resultado"
✅ "Estudos mostram uma melhora média de X em Y"
```

#### ✅ Cobertura de Perspectivas Múltiplas

```
"Existem vários pontos de vista sobre este tópico:

- Médicos convencionais recomendam: [OPÇÃO A]
- Praticantes naturais sugerem: [OPÇÃO B]
- Pesquisa recente aponta para: [OPÇÃO C]

Minha recomendação para você 40+: [OPINIÃO COM RAZÃO]"
```

---

## Checklist de E-E-A-T Antes de Publicar

### EXPERIÊNCIA ✓
- [ ] Autor identificado no artigo
- [ ] Bio breve do autor
- [ ] Disclaimer de saúde presente
- [ ] Validação da experiência do leitor (reconhecer desafios 40+)
- [ ] Humildade nas recomendações

### ESPECIALIDADE ✓
- [ ] Artigo tem 1500+ palavras
- [ ] Cobertura completa: definição > causas > sintomas > soluções > quando procurar ajuda
- [ ] 4-6 seções H2 com 3-4 H3 cada
- [ ] Dados e números (não genéricos)
- [ ] Sem cópia de outras fontes
- [ ] Linguagem clara, não médica excessiva

### AUTORIDADE ✓
- [ ] Breadcrumbs presentes
- [ ] Schema.org markup correto
- [ ] 3-5 links internos para outros artigos
- [ ] 3-5 links externos para fontes confiáveis (Mayo, Harvard, NIH)
- [ ] Data de publicação clara
- [ ] Data de atualização (se revisado)

### CONFIANÇA ✓
- [ ] Alt text em TODA imagem (100-150 caracteres)
- [ ] Crédito de imagem (Pexels, Pixabay, etc)
- [ ] Seção de Fontes no final
- [ ] Health Warning ativo
- [ ] Transparência sobre afiliação
- [ ] Linguagem não-absoluta ("pode" vs "vai")
- [ ] Múltiplas perspectivas onde apropriado

---

## Exemplo Completo de E-E-A-T

### ❌ Versão Genérica (Baixo E-E-A-T)

```
# Colesterol Depois dos 40

Colesterol é uma substância gordurosa no sangue. Pode aumentar com a idade.
A dieta afeta o colesterol. Exercício também ajuda. Medicamentos existem.
Consulte seu médico.

Palavras: ~400
Estrutura: 1 H1, 2 H2s, nenhum H3
Imagens: Nenhuma
Fontes: Nenhuma
Autor: Não identificado
```

**Score E-E-A-T: ~30/100** ❌

---

### ✅ Versão E-E-A-T (Alto E-E-A-T)

```
# Colesterol Depois dos 40: Guia Especializado para Mulheres

_Por Dra. Saúde 40+ | Publicado: 3 de outubro de 2026 | Leitura: 10 min_

## Introdução: Seu Colesterol aos 40

Depois dos 40, o colesterol sobe naturalmente em mulheres (especialmente na 
menopausa). Se você está seguindo a mesma dieta de sempre e viu seus níveis 
disparem, você não está sozinha. Uma em cada três mulheres 40+ tem colesterol 
elevado (CDC, 2024). A boa notícia? Você tem controle.

## O Que É Colesterol? (E Por Que Importa aos 40)

### Definição Técnica
Colesterol é uma molécula de lipídio (gordura) que seu corpo produz. 
Ele é essencial para: [DETALHE]. Mas em excesso, provoca [RISCO].

### Por Que Sobe Aos 40

Aos 40, múltiplos fatores convergem:
1. Declínio de estrogênio (especialmente em mulheres)
2. Metabolismo mais lento (redução de ~5-8% por década)
3. Redução natural de atividade física
4. Acúmulo de anos de hábitos

### Seus Números: Entender o Teste

- HDL ("colesterol bom"): > 50 mg/dL é ideal
- LDL ("colesterol ruim"): < 100 mg/dL é ideal
- Triglicérides: < 150 mg/dL

[Incluir tabela com faixas de risco]

## Causas e Fatores de Risco

### Biologia
- Genética (se seus pais têm alto colesterol, risco aumenta)
- Hormônios (menopausa é grande gatilho)
- Tireóide (baixa função aumenta colesterol)

### Hábitos
- Dieta alta em gordura saturada e trans
- Sedentarismo
- Excesso de álcool
- Tabagismo

### Dados Preocupantes (2024)
- 95 milhões de adultos americanos têm colesterol elevado
- Apenas 1 em 3 recebem tratamento
- Mulheres 40-59 têm risco 3x maior que mulheres 20-39

## Sinais e Sintomas

### A Verdade Incômoda
Colesterol alto NÃO causa sintomas. Você não sente nada.
Por isso é chamado de "killer silencioso".

### Quando Procurar Ajuda Urgente
- Se você tem história familiar
- Se seu colesterol sobe sem razão clara
- Se combinado com pressão alta ou diabetes
- Após primeira medição elevada (confirme após 6 semanas)

### Diagnóstico
Teste de sangue chamado "painel lipídico". Simples. Rápido. Essencial.

## Estratégias Práticas (Baseadas em Pesquisa)

### 1. Mudança Alimentar (Impacto: 10-15% redução)
Não é "eliminar gordura". É ser estratégico:

- Aumente: Fibra solúvel (aveia, maçã, feijão)
- Reduza: Gordura trans (biscoitos, frituras)
- Equilibre: Gordura saturada (limite a 10% calorias)
- Troque: Carne vermelha → Peixe (2x/semana)

Dieta DASH mostrou redução de colesterol em 11% em 8 semanas.

### 2. Exercício (Impacto: 3-5% redução)
150 min/semana exercício moderado. Não precisa ser intenso.

Exemplo 40+: Caminhada 30min, 5x/semana = suficiente

### 3. Perda de Peso (Impacto: 5-8% redução por 10% peso perdido)
Cada kg perdido = ~0.05 mmHg redução no colesterol

### 4. Gerenciamento de Estresse (Impacto: 2-4% redução)
Cortisol elevado aumenta colesterol. Pratique: ioga, meditação, natureza

### 5. Sono de Qualidade (Impacto: 5-7% redução)
Dormir 7-9h reduz colesterol significativamente

## Tratamentos Profissionais

### Medicamentos (Se Mudanças Não Bastam)
- Estatinas (reduzem 30-50%)
- Ezetimiba (reduz 15-20%)
- PCSK9 inibidores (casos graves)

Discussão com médico baseada em seu risco cardiovascular individual.

### Quando Começar Medicamento?
- Se LDL > 190 mg/dL
- Se risco cardiovascular 10-ano > 7.5%
- Se história familiar de infarto precoce
- Após 3 meses de mudanças sem resultado

## Conclusão e Seu Plano

### Resumo
1. Teste seu colesterol agora (se não fez recentemente)
2. Se elevado, comece com mudanças naturais
3. Dê 3 meses para mudanças funcionarem
4. Se não melhorou, converse com médico sobre medicamento

### Próximo Passo (Hoje)
1. Agende exame de sangue
2. Escolha UM hábito para mudar (ex: adicionar fibra)
3. Volte aqui em 30 dias para progresso

---

## Fontes e Referências

[Componente ArticleSources com 5+ fontes científicas]

## Créditos de Imagem

[Componente ArticleSourcesImageCredits]

## Aviso de Saúde

[Componente ArticleDisclaimer]

---

_Última atualização: 3 de outubro de 2026. Este artigo é revisado anualmente 
para refletir pesquisa mais recente._
```

**Score E-E-A-T: 92/100** ✅

---

## Notas Importantes

### 1. Não Seja Genérico
Google rankeia artigos que:
- Resolvem problemas ESPECÍFICOS
- Para PERSONAS específicas (nós: 40+)
- Com recomendações ESPECÍFICAS baseadas em dados

### 2. Não Copie Concorrentes
Cada artigo deve ter:
- Perspectiva única
- Exemplos únicos
- Dados ou insights que você encontrou

### 3. E-E-A-T é Contínuo
- Revise artigos a cada 6-12 meses
- Atualize dados
- Corrija informações desatualizada
- Melhore estrutura conforme aprende

### 4. CTA Mounjaxi Discreto
- Nunca comprometa confiança por venda
- CTA é complemento, não substituição
- Sempre opcionalno leitor prosseguir sem clicar

---

## Recursos Úteis

- [Ferramenta de Validação E-E-A-T](../scripts/validate-e-e-a-t.js)
- [Templates de Estrutura](./article-structure.json)
- [Componentes Astro](../src/components/)
