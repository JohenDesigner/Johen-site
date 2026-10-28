# Design log do /novo/

Uma melhoria pequena por rodada. Não repetir o que já está aqui.

## Feito
- 2026-10-28 — Página inicial: nomes dos mascotes (Cartões, Panfletos, Banners…) agora ficam todos na mesma linha; os mascotes "pisam" no mesmo chão em vez de cada nome ficar numa altura diferente. (site.css: `.mascote` com `justify-content:flex-end`)
- 2026-10-28 — Meu pedido: o título "Meu pedido" estava colado no cartão de pedido vazio; agora tem 20px de respiro, igual às outras páginas. (site.css: `#pedido-vazio,#pedido-cheio{margin-top:20px}`)
- 2026-10-28 — A pedido do Johen, um pouco mais de laranja e azul em detalhes: faixa do topo em azul (igual ao rodapé), sublinhado laranja na categoria ativa do menu, filtro ativo em azul, setinha "›" laranja nos cards da página inicial e botão "+" do editor em azul. (site.css)
- 2026-10-28 — Menu de categorias (todas as páginas): a última categoria que não cabe na tela era cortada seca ("Adesiv"), parecendo erro. Agora a borda direita do menu some num degradê suave, indicando que dá para arrastar, e ao chegar no fim "Pra seu Comércio" aparece inteira. (site.css: `mask-image` em `.nav-cat` + respiro no último link)
- 2026-10-28 — Páginas de categoria: os filtros (Todos, Couché Brilho, Fosco + Verniz…) que não cabiam em 390px eram cortados secos na borda. Agora somem num degradê suave, igual ao menu de categorias, e o último filtro aparece inteiro ao arrastar. (site.css: `mask-image` em `.filtros` + respiro no último botão)
- 2026-10-28 — Acessibilidade (todas as páginas): o contorno de foco (quem navega pelo teclado) era turquesa claro e quase sumia no fundo claro (contraste 2,1:1). Agora usa o turquesa escuro da marca (4,2:1) e, na faixa azul do topo e no rodapé azul, fica branco. Visual normal no toque não muda. (site.css: `:focus-visible`)
- 2026-10-28 — A pedido do Johen: botão redondo flutuante do Instagram (@johen_artgrafica), no mesmo modelo do botão do WhatsApp, logo acima dele, com o degradê do Instagram. Some no editor, igual ao do WhatsApp. (build.py: `.insta-flut` + ícone; site.css)

## Sugestões para o Johen (não feitas)
- O botão flutuante do WhatsApp cobre metade do mascote do Banner em 390px quando a página está no topo. Dá para escondê-lo até a pessoa rolar um pouco, ou subir o botão. Mexe no comportamento, então fica para aprovação.
- No editor (/novo/editor/), o título do produto ("Caneca de Alça Branca") é menor que os títulos das outras páginas. Vale decidir se fica assim (para sobrar espaço para a caneca) ou se iguala.
- No editor (/novo/editor/), em 390x844 a barra fixa de baixo (+ / Revisar) corta o valor "R$ 35,00" pela metade antes de rolar. Dá para deixar o fundo da caneca menos alto no celular, mas isso mexe no canvas do editor (toque e posição da arte), então fica para aprovação.
