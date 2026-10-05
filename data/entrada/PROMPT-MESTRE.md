# Prompt mestre: concorrente + artigo + autopontuação (Perplexity, Gemini, GPT, DeepSeek, Qwen)

Fluxo em 2 passos, para 1 artigo por vez. Escolha a palavra-chave em `data/conteudo/pautas-mestre.csv` (grupo 2, de preferência `produzir_amanha_sugerido = SIM`).

- **Passo 1 (use uma IA com busca ao vivo: Perplexity ou Gemini; GPT só com navegação ligada):** cola o PROMPT 1. Ele devolve o bloco CONCORRENTES.
- **Passo 2 (qualquer IA: GPT, Gemini, DeepSeek, Qwen):** cola o PROMPT 2 junto com o bloco CONCORRENTES do passo 1. Ele escreve o artigo no formato do sistema.
- Salve a resposta do passo 2 em `data/entrada/<nome>.txt`, mande para mim (ou rode Actions > Importar artigos). O sistema pontua sozinho.

Atenção: IA sem busca ao vivo (DeepSeek, Qwen) não enxerga o Google de verdade. Nunca peça a ela o passo 1. Se o Perplexity não achar o topo, escreva "não verifiquei" e siga: o sistema marca "concorrente não conferido".

---

## PROMPT 1 — Concorrência (copie e troque os campos entre colchetes)

Pesquise no Google Brasil (busca ao vivo) a palavra-chave **[PALAVRA-CHAVE]** e analise os 5 primeiros resultados orgânicos (ignore anúncios, vídeos e redes sociais). Responda SÓ com este bloco, sem comentário:

```
CONCORRENTES
1 | título da página | URL completa | tipo (hospital/laboratório/portal de saúde/blog/loja/fórum) | palavras aproximadas | H2 principais (até 8, separados por ;)
2 | ...
(até 5 linhas; se não conseguir abrir uma página, escreva "não verifiquei" em vez de inventar)
PERGUNTAS DO GOOGLE (As pessoas também perguntam, 4 a 8)
- pergunta
LACUNAS (o que o topo NÃO responde bem ou nem cita, 3 a 6 itens)
- lacuna
DIFICULDADE: fácil | média | difícil (justifique em 1 linha: quantas autoridades como Ministério da Saúde, Einstein, Sírio-Libanês, Drauzio, Tua Saúde aparecem no top 5)
```

Regras: não invente URL; só liste páginas que você realmente abriu; cite a data em que consultou.

---

## PROMPT 2 — Escrever o artigo (cole o bloco CONCORRENTES do passo 1 no lugar indicado)

Você é redator do blog Saúde 40+ (público de 40+ anos, português do Brasil). Escreva UM artigo sobre **[PALAVRA-CHAVE]** (demanda: [VOLUME] buscas/mês; tema: [TEMA]). Frases que o mesmo artigo deve cobrir como subtópicos: [FRASES-SATÉLITE].

Use o resultado da análise de concorrência abaixo para ser MELHOR que o topo: responda as perguntas do Google e preencha as lacunas. Não copie texto de ninguém: reescreva com suas palavras e estrutura própria.

[COLE AQUI O BLOCO "CONCORRENTES" DO PASSO 1]

**Formato de saída (exato; sem Markdown, sem cercas de código):**
```
PALAVRA_CHAVE: [PALAVRA-CHAVE]
TITLE: até 46 caracteres, contém a palavra-chave
DESCRIPTION: entre 125 e 155 caracteres, contém a palavra-chave
CAPA_BUSCA: busca de foto em inglês (cena concreta, sem marca)
CAPA_ALT: alt em português descrevendo a foto (25+ caracteres)
FOTO1_BUSCA: ...
FOTO1_ALT: ...
FOTO1_LEGENDA: até 120 caracteres
FOTO1_SECAO: número do h2
FOTO2_BUSCA: ...
FOTO2_ALT: ...
FOTO2_LEGENDA: ...
FOTO2_SECAO: número do h2 diferente do da foto 1
FONTE: Título | https://link-real-que-abre
FONTE: Título | https://link-real-que-abre
FONTE: Título | https://link-real-que-abre
CONCORRENTE: título | URL | dificuldade (copie 1 linha por concorrente do passo 1)
LACUNA: cada lacuna que o artigo cobre (1 por linha)
---
<corpo em HTML simples>
```

**Corpo (HTML simples: p, h2, h3, ul, li, strong, a; sem h1, sem hr, sem componentes, sem data):**
1. Primeiro parágrafo (até 45 palavras): responde a pergunta e contém a palavra-chave exata.
2. De 6 a 9 `<h2>` (a maioria em forma de pergunta), parágrafos de até 45 palavras, frases curtas (média até 20 palavras), listas onde ajudar.
3. Uma seção com as perguntas do Google, resposta direta em 1 a 3 frases cada.
4. `<h2>Quando procurar um médico</h2>`
5. `<h2>Resumindo</h2>` com 2 parágrafos curtos.
6. Pelo menos 2 links internos no formato `<a href="/slug/">texto natural</a>`, só desta lista: [LINKS-INTERNOS-PERMITIDOS]. Se a lista não for dada, não coloque links internos.
7. No mínimo 1.300 palavras. Palavra-chave exata no máximo 3% do texto: varie com sinônimos e pronomes.

**Regras de segurança (obrigatórias):**
- Número, porcentagem, valor ou dose só se estiver numa das FONTES. Sem fonte, não escreva o número.
- No mínimo 3 FONTES reais, com link que abre; pelo menos 2 oficiais ou institucionais (Ministério da Saúde, sociedade médica, SciELO, NIH/MedlinePlus, OMS, universidade, hospital de referência). Não invente link. Se não tiver certeza de um link, não use.
- Proibido: "cura", "garantido", "milagre", "sem efeitos colaterais"; diagnóstico ("você tem"); dose de remédio ou suplemento; indicar marca; link de compra; preço como recomendação.
- Proibido: "neste artigo", "vamos explorar", "mergulhar", "jornada", "vale ressaltar", "é importante destacar", "em suma", "concluindo", "no cenário atual".
- Remédio, suplemento, exame e doença sensível: informativo, "o médico decide", sem prescrever.
- Não escreva a seção de Fontes nem o aviso de saúde no corpo (o sistema acrescenta).

**Autoconferência antes de responder (corrija o que falhar, não mostre a conferência):**
- Título ≤ 46 caracteres e com a palavra-chave. Descrição de 125 a 155 caracteres com a palavra-chave.
- Palavra-chave no 1º parágrafo. 1º parágrafo ≤ 45 palavras.
- ≥ 1.300 palavras, ≥ 6 `<h2>`, "Quando procurar um médico" e "Resumindo" presentes.
- Nenhum parágrafo com mais de 45 palavras. Nenhuma frase proibida.
- ≥ 3 FONTE, ≥ 2 institucionais, todas com link real.
- Respondeu as perguntas do Google e cobriu as lacunas do passo 1.
- Nenhum número sem fonte. Nenhuma dose, marca ou promessa.

---

## Como o sistema pontua (para você saber o que pesa)
Nota final = qualidade técnica 35% + demanda 20% + fontes 15% + originalidade 15% + formato 10% + segurança 5%.
- PUBLICAR: 85 ou mais, sem bloqueio. SEGURAR: 70 a 84 (volta com a lista do que corrigir). DEVOLVER: abaixo de 70, bloqueio ou parecido demais com outro artigo (80%+).
- Demanda: pesa mais quando a palavra-chave está em `data/pesquisa/DEMANDA-VALIDADA.md` com 10 mil ou mais buscas.
- Fontes: pesa mais com 3+ fontes e 2+ institucionais. Fonte só de clínica ou laboratório comercial pesa pouco.
- Formato: 1.500+ palavras, 3 imagens (eu coloco pelos seus links do Pexels) e 2+ links internos.
