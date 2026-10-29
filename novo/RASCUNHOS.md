# O que falta no site novo (depende do Johen)

1. Vídeo da loja no topo: salvar como `novo/video/hero.mp4` (horizontal, ~12 s, sem som). Enquanto não existir, o topo mostra fotos dos produtos.
2. Fotos reais de clientes na faixa "Feito aqui" (hoje usa fotos do catálogo).
3. Chave Pix e link do Mercado Pago na página do pedido (`build.py`, procurar SUA-CHAVE-PIX-AQUI).
4. Textos e preços das páginas de Gravação a Laser, Envelopamento e Criação de Arte.
5. Cores do copo térmico no editor 3D: hoje mostra Preto e Branco (as da foto). Confirmar quais cores existem.
6. Rodapé > Sobre: horário de funcionamento e formas de pagamento (`build.py`, procurar "Rascunho: horário"). Conferir também a lista "Também fazemos".

Para atualizar produtos e preços: editar `dados/produtos.json` e rodar `python3 build.py` dentro de `novo/`.
