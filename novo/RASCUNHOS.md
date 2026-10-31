# O que falta no site novo (depende do Johen)

1. ~~Vídeo da loja no topo~~ — feito em 2026-10-30: a home agora tem a abertura cinematográfica (cine/frames/).
2. ~~Fotos reais de clientes~~ — feito em 2026-10-30: portfólio da home com 9 fotos e 1 vídeo da loja (img/portfolio/).
3. Link do Mercado Pago na página do pedido (`build.py`: `MERCADO_PAGO`). A chave Pix (CNPJ) já está no ar.
6. ~~Avaliações reais do Google pra home~~ — feito em 2026-10-30 (3 avaliações em `AVALIACOES`).
9. Formulário de orçamento da home (FormSubmit): quando o site estiver no endereço final, o primeiro envio pede uma nova ativação por e-mail (um clique em "Activate").
4. Textos e preços das páginas de Gravação a Laser, Envelopamento e Criação de Arte. O aviso "Rascunho" saiu da página do cliente, mas falta confirmar: materiais que você grava (madeira, acrílico?) e se cobra visita pra medir no envelopamento.
5. Cores do copo térmico no editor 3D: hoje mostra Preto e Branco (as da foto). Confirmar quais cores existem.
7. Cartões 300g: "Impressão: Frente / Frente e Verso" sem opção de escolher. O preço é com verso incluso ou só frente? Se o verso custa a mais, me diga quanto.

Para atualizar produtos e preços: editar `dados/produtos.json` e rodar `python3 build.py` dentro de `novo/`.

8. Há dois produtos chamados "Copo Térmico 473ml" em Canecas (R$ 45/60 gravação 1 lado ou frente e verso, e R$ 70 gravação 360º). O site agora mostra o acabamento pra diferenciar, mas vale dar um nome próprio ao de R$ 70 no produtos.json (ex.: "Copo Térmico 473ml — Gravação 360º").

10. Nome do banner de lona brilho: no produtos.json está "Banner ou faixa - Lona 480g Brilho — Acabamento em Madeira" (hífen e travessão juntos), enquanto o fosco é "Banner Lona 480g Fosco — Acabamento em Madeira". Sugestão: "Banner ou Faixa Lona 480g Brilho — Acabamento em Madeira" e o mesmo padrão no fosco. Não mudei porque é dado do produto.

11. Editor nos produtos novos: usei 9 x 5 cm pro cartão de visita (medida padrão) e a proporção A4 pras cartelas de etiquetas e folha adesiva (Etiquetas Meio-corte, Corte Redondo e Folha Adesiva), que não têm a medida escrita no site. Se o seu cartão ou a sua cartela forem de outra medida, me diga que eu ajusto. Na sublimação total a área cobre a camiseta inteira, só pra prévia.

12. Arquivos do editor no Google Drive: publicar o Apps Script (passo a passo em `drive/COMO-LIGAR.md`) e mandar o endereço que termina em `/exec`. Até lá, o site funciona como antes.

13. ~~Adesivo DTF — Laminação UV (Cartela A3): a descrição no produtos.json está "Adesivo resiste contra temperatura alta e lavagens, Extremamente duradouro." (E maiúsculo depois da vírgula) e o nome tem dois espaços antes do travessão. Sugestão: "Resiste a temperatura alta e a lavagens. Extremamente duradouro." Não mexi porque é dado do produto.~~ — feito em 2026-10-31 a pedido do Johen.
14. ~~Adesivo de Vitrine: o cliente manda a arte normal (vocês espelham) ou já espelhada? Hoje o produto pede espelhada, mas o editor mostra do jeito que ele subiu. Me diga e eu ajusto o aviso.~~ — Johen respondeu em 2026-10-31: o cliente manda já espelhada; o editor ganhou aviso e botão "Espelhar arte".
