# Design log do /novo/

Uma melhoria pequena por rodada. Não repetir o que já está aqui.

## Feito
- 2026-10-28 — Página inicial: nomes dos mascotes (Cartões, Panfletos, Banners…) agora ficam todos na mesma linha; os mascotes "pisam" no mesmo chão em vez de cada nome ficar numa altura diferente. (site.css: `.mascote` com `justify-content:flex-end`)
- 2026-10-28 — Meu pedido: o título "Meu pedido" estava colado no cartão de pedido vazio; agora tem 20px de respiro, igual às outras páginas. (site.css: `#pedido-vazio,#pedido-cheio{margin-top:20px}`)

## Sugestões para o Johen (não feitas)
- O botão flutuante do WhatsApp cobre metade do mascote do Banner em 390px quando a página está no topo. Dá para escondê-lo até a pessoa rolar um pouco, ou subir o botão. Mexe no comportamento, então fica para aprovação.
- No editor (/novo/editor/), o título do produto ("Caneca de Alça Branca") é menor que os títulos das outras páginas. Vale decidir se fica assim (para sobrar espaço para a caneca) ou se iguala.
