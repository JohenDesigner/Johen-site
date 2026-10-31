# Receber no Google Drive os arquivos que o cliente monta no site

Quando o cliente toca em **Comprar** no "Personalize sem sair do site", o site manda pra uma pasta sua no Drive:

- a foto original que ele subiu (qualidade cheia, sem compressão do WhatsApp);
- a arte posicionada: PNG transparente, só a área de impressão, em ~300 dpi na medida real;
- a prévia 3D de cada lado;
- `pedido.txt` com produto, detalhes, quantidade, valor e textos.

Cada pedido vira uma pasta `J261031-AB12 · Nome do produto` dentro de **Pedidos do site**.
O mesmo código aparece na mensagem do WhatsApp ("Arte enviada pelo site: J261031-AB12").

## Ligar (uma vez, ~5 minutos, no computador)

1. Entre em **script.google.com** com a conta Google onde quer receber os arquivos e clique em **Novo projeto**.
2. Apague o que estiver escrito e cole todo o conteúdo do arquivo `drive/Code.gs`. Dê o nome "Arquivos do site Johen" e salve (ícone de disquete).
3. Clique em **Implantar › Nova implantação**. Na engrenagem, escolha **App da Web**.
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
4. Clique em **Implantar** e depois em **Autorizar acesso**. Escolha sua conta. Se aparecer "O Google não verificou este app", clique em **Avançado › Acessar Arquivos do site Johen (não seguro)** e em **Permitir** (o app é seu, só ele mexe na pasta).
5. Copie o **URL do app da Web** (termina em `/exec`) e mande pro Claude, ou cole em `build.py` em `ARQUIVOS_DRIVE = "..."` e rode `python3 build.py`.

Pra conferir: abra esse endereço no navegador; deve aparecer "Recebendo arquivos do site da Johen."

Se um dia mudar o código do Code.gs: **Implantar › Gerenciar implantações › editar (lápis) › Versão: Nova versão**. Assim o endereço continua o mesmo.

Sem o endereço preenchido, o site funciona como antes (o cliente manda a arte no WhatsApp). Se o envio falhar (internet ruim), o pedido segue normal e a mensagem do WhatsApp pede as artes.
