# Teste para saber se a IA realmente navega e cita fonte de verdade (5 minutos)

## Teste 1: ela abre o Google e as páginas?
Cole (troque a palavra-chave por uma do `data/conteudo/pautas-mestre.csv`):

> Pesquise agora no Google Brasil **[PALAVRA-CHAVE]**. Liste os 5 primeiros resultados orgânicos com a URL completa e abra cada página. Para cada uma me diga: o título exato da página, os 5 primeiros H2 que você leu e quantas palavras tem, aproximadamente. Se não conseguir abrir uma página, escreva "não abri". Diga também a data e a hora da consulta.

Como ler:
- **Passou:** URLs reais; você abre 2 delas no navegador e os títulos e H2 batem.
- **Reprovou:** diz que não abre, dá URL genérica (home de site, página que não existe) ou os H2 não batem. Use Perplexity para o passo 1 e a IA só para escrever.

## Teste 2: ela inventa fonte?
> Para cada número do artigo, cole o trecho exato da fonte e o link.

Abra 2 links. Se não abrir ou não tiver o número, a IA inventa fonte: todo artigo dela precisa de conferência extra.

## Teste 3: ela copia o concorrente?
Pegue 1 frase do meio do artigo e cole no Google entre aspas. Se aparecer em outro site, copiou.
