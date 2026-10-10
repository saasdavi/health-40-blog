# Observação: artigos aprovados, aguardando fotos

**Situação:** 101 artigos reescritos com **nota de auditoria 92 a 100** e sem bloqueio de segurança.
Eles **não foram importados para o estoque** porque a busca de fotos falhou na importação do dia 10/10/2026
(run #16): o Pexels respondeu **429** (limite de pedidos por hora) e o Pixabay respondeu **400**.
O importador exige foto de capa, então esses artigos ficaram de fora. **O texto está pronto e não foi perdido.**

## Para terminar (quando a API de fotos liberar)
1. Configurar/trocar as chaves em *Settings → Secrets and variables → Actions*: `PEXEL_API_KEY` e `PIXABAY_API_KEY`.
2. Mover os arquivos `.txt` desta pasta de volta para `data/entrada/` (os `.relatorio.md` podem ficar, o importador apaga os que sobrarem).
3. Rodar o workflow **Importar artigos (sem API)** na `main`. O limite do Pexels é de 200 pedidos por hora,
   então cada rodada importa uns 50 artigos; repetir a cada hora até esvaziar `data/entrada/`.

## Observações
- Os 49 artigos que já passaram na mesma importação estão no estoque.
- Os artigos com bloqueio de segurança e os que foram retirados de propósito estão em `data/entrada/pendentes-revisao/`.
- Os links externos das fontes não foram verificados; muitas fontes são só a página inicial da instituição.
- Alguns links internos ligam artigos por proximidade de tema (a lista de links válidos é pequena).

## Arquivos (101)
- cabelo-caindo-o-que-fazer-e-causas-reais.txt
- cabelo-quebrado-como-recuperar-testes-e-cronograma.txt
- caindo-o-que-fazer-e-causas-reais.txt
- calculadora-de-imc-entenda-seu-indice-de-massa-corporal.txt
- caloria-dos-alimentos-como-calcular-e-tabela-pratica.txt
- calvicie-masculina-tratamentos-efeitos-e-resultados.txt
- cancer-de-pele-sintomas-tipos-causas-tratamento-e-prevencao.txt
- capilar-beneficios-como-fazer-e-contraindicacoes.txt
- carboidratos-o-que-sao-funcoes-tipos-e-alimentos-ricos.txt
- cardapio-para-emagrecer-guia-semanal-pratico.txt
- cardapio-para-ganhar-massa-muscular-guia-pratico.txt
- cha-que-emagrece-1kg-por-dia-a-verdade-cientifica.txt
- cha-relaxante-muscular-6-ervas-que-realmente-funcionam.txt
- chas-artigo.txt
- cisto-no-couro-cabeludo-tipos-remocao-e-cuidados.txt
- como-engordar-de-forma-saudavel-guia-pratico.txt
- como-lavar-o-cabelo-corretamente-passo-a-passo.txt
- complexo-b-para-que-serve-como-tomar-beneficios-efeitos-colaterais.txt
- compulsao-alimentar-o-que-e-sintomas-e-tratamento.txt
- contar-calorias-como-calcular-e-evitar-erros-comuns.txt
- cotovelos-escuros-causas-como-clarear-e-alerta.txt
- curcuma-artigo.txt
- dieta-de-1000-calorias-riscos-e-quando-e-indicada.txt
- dieta-enteral-1-5-guia-completo-para-cuidadores.txt
- dieta-para-diabetes-tipo-2-guia-pratico-e-cardapio.txt
- dieta-para-perder-barriga-o-que-funciona-de-verdade.txt
- dieta-para-secar-guia-pratico-e-realista.txt
- dieta-sem-carboidrato-como-funciona-e-riscos.txt
- dispneia-paroxistica-noturna-causas-e-quando-procurar-ajuda.txt
- dormir-cedo-beneficios-como-treinar-e-o-que-evitar.txt
- eletrolitos-o-que-sao-funcoes-e-como-repor.txt
- emagrecer-10-kg-o-que-e-possivel-e-como-fazer-com-saude.txt
- emagrecer-rapido-com-saude-guia-completo-e-seguro.txt
- entradas-no-cabelo-masculina-causas-tratamento-e-cortes.txt
- especialista-em-cabelo-quando-procurar-e-o-que-esperar.txt
- exercicios-para-emagrecer-na-academia-guia-pratico.txt
- fogacho-na-menopausa-causas-duracao-e-tratamentos.txt
- fome-emocional-o-que-e-como-identificar-e-tratar.txt
- fome-no-mundo-causas-dados-atuais-e-solucoes.txt
- fruta-do-conde-artigo.txt
- gaba-para-que-serve-efeitos-colaterais-e-riscos.txt
- glicina-o-que-e-para-que-serve-e-efeitos-colaterais.txt
- hidrafacial-o-que-e-preco-beneficios-e-riscos.txt
- hidratante-facial-como-escolher.txt
- hmb-o-que-e-para-que-serve-e-efeitos-colaterais.txt
- inibidor-de-apetite-forte-o-que-e-aprovado-e-os-riscos.txt
- isosource-soya-fiber-para-que-serve-e-como-usar.txt
- maca-peruana-v3-nota-9-4.txt
- magnesio-dimalato-efeitos-colaterais-rins-e-interacoes.txt
- magnesio-efeitos-colaterais-guia-completo-e-seguro.txt
- magnesio-treonato-para-que-serve-efeitos-e-anvisa.txt
- manchas-senis-causas-tratamentos-e-autoexame.txt
- manipulados-para-emagrecer-riscos-e-regras-da-anvisa.txt
- marmita-fitness-cardapio-semanal-guia-completo-e-pratico.txt
- massagem-capilar-beneficios-como-fazer-e-contraindicacoes.txt
- melasma-na-gravidez-causas-tratamento-seguro-e-rotina.txt
- melatonina.txt
- melhor-suplemento-para-queimar-gordura-o-que-funciona.txt
- minoxidil-solucao-capilar-como-usar-e-efeitos.txt
- minoxidil-spray-cabelo-mecanismos-aplicacao-e-cuidados.txt
- minoxidil-tonico-capilar-como-usar-shedding-e-resultados.txt
- minoxidil.txt
- monster-energy-todos-os-sabores-no-brasil-em-2026.txt
- niacinamida-para-que-serve-beneficios-como-usar-concentracao-e-efeitos-colaterais.txt
- obstipacao-intestinal.txt
- oxido-de-magnesio-para-que-serve-riscos-e-comparacao.txt
- pera-artigo.txt
- perder-gordura-e-ganhar-massa-muscular-guia-pratico.txt
- ph-da-pele-o-que-e-ideal-e-como-equilibrar.txt
- picolinato-de-cromo-para-que-serve-beneficios-efeitos-colaterais-e-como-tomar.txt
- produtos-sem-lactose-guia-completo-e-pratico.txt
- proteina-para-emagrecer-como-usar-e-riscos.txt
- proteina-puravida-linhas-como-usar-e-comparativo.txt
- protetor-solar-facial-como-escolher-quanto-usar-fps-uva-e-reaplicacao.txt
- psoriase-no-couro-cabeludo-sintomas-causas-diferenca-da-caspa-e-tratamentos.txt
- queda-de-cabelo-feminino-tratamentos-eficazes.txt
- queda-de-cabelo-intensa-causas-linha-do-tempo-e-tratamento.txt
- queda-de-cabelo-por-estresse-linha-do-tempo-e-tratamento.txt
- queda-de-cabelo-por-estresse.txt
- queda-de-cabelo-pos-parto-causas-duracao-e-cuidados.txt
- reeducacao-alimentar-como-fazer-e-por-que-funciona.txt
- remedio-minoxidil-acao-fisiologica-riscos-e-cuidados.txt
- resistencia-insulinica-artigo.txt
- retinol-para-que-serve-beneficios-como-usar.txt
- sabonete-de-enxofre-para-que-serve-beneficios-como-usar-e-cuidados.txt
- saladas-completas-como-substituir-refeicoes-com-saude.txt
- saw-palmetto-queda-de-cabelo-o-que-funciona.txt
- suplemento-queima-gordura-o-que-funciona-e-riscos.txt
- suplementos-para-emagrecer-feminino-guia-com-evidencia.txt
- taurina-efeitos-colaterais-rins-e-interacao-com-cafeina.txt
- terapia-fotodinamica-o-que-e-como-funciona-e-cuidados.txt
- termogenico-para-emagrecer-o-que-funciona-e-os-riscos.txt
- termogenicos-naturais-o-que-funciona-e-os-riscos.txt
- treino-funcional-emagrece-o-que-a-ciencia-mostra.txt
- valeriana-para-que-serve-efeitos-colaterais-e-riscos.txt
- vasinhos-no-rosto-causas-tipos-e-tratamentos-com-laser.txt
- vitamina-d-artigo-seo-completo.txt
- vitamina-de-cavalo-no-cabelo-riscos-e-o-que-fazer.txt
- vitamina-para-queda-de-cabelo-o-que-funciona-e-o-que-e-perigo.txt
- vitaminas-para-queda-de-cabelo-guia-completo.txt
- vitaminas-para-queda-de-cabelo.txt
