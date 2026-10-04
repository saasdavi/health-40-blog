# Artigos escritos fora do robô (ChatGPT etc.), sem gastar API

1. Salve o artigo em `data/entrada/<qualquer-nome>.txt` neste formato (cabeçalho, linha `---`, corpo em HTML):

```
PALAVRA_CHAVE: magnésio para que serve
TITLE: até 46 caracteres, com a palavra-chave
DESCRIPTION: 125 a 155 caracteres, com a palavra-chave
CAPA_BUSCA: busca em inglês para a foto de capa (Pexels)
CAPA_ALT: descrição da foto de capa
FOTO1_BUSCA: busca da foto 1
FOTO1_ALT: descrição da foto 1
FOTO1_LEGENDA: legenda curta
FOTO1_SECAO: 2
FOTO2_BUSCA: ...
FONTE: Título da fonte 1 | https://...
FONTE: Título da fonte 2 | https://...
REVISADO: sim   (só para tema sensível já revisado por pessoa)
---
<p>1º parágrafo com a palavra-chave (até 50 palavras)...</p>
<h2>...</h2> (mín. 4 H2, "Resumindo" no fim e "Quando procurar um médico")
```

2. Rode **Actions > Importar artigos (sem API) > Run workflow**. Aprovados vão para o estoque; reprovados ganham `<nome>.relatorio.md` com o motivo.
3. Regras automáticas: ≥1000 palavras, ≥2 fontes, aviso de saúde no fim, sem frases de cura/garantia, densidade da palavra-chave ≤5%, ≥2 links internos válidos, nota mínima 80.
