# O que falta no site novo (depende do Johen)

1. Vídeo da loja no topo: salvar como `novo/video/hero.mp4` (horizontal, ~12 s, sem som). Enquanto não existir, o topo mostra fotos dos produtos.
2. Fotos reais de clientes na faixa "Feito aqui" (hoje usa fotos do catálogo).
3. Chave Pix e link do Mercado Pago na página do pedido (`build.py`: `PIX` e `MERCADO_PAGO`). Enquanto vazios, o pedido mostra "Como pagar" sem rascunho.
6. Avaliações reais do Google pra home (`build.py`: `AVALIACOES`, 2 ou 3).
4. Textos e preços das páginas de Gravação a Laser, Envelopamento e Criação de Arte. O aviso "Rascunho" saiu da página do cliente, mas falta confirmar: materiais que você grava (madeira, acrílico?) e se cobra visita pra medir no envelopamento.
5. Cores do copo térmico no editor 3D: hoje mostra Preto e Branco (as da foto). Confirmar quais cores existem.

Para atualizar produtos e preços: editar `dados/produtos.json` e rodar `python3 build.py` dentro de `novo/`.
