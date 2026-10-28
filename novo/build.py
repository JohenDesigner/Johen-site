# Gera as páginas do site novo a partir de dados/produtos.json
# Rodar: python3 build.py   (dentro da pasta novo/)
import json, os, html, shutil

D = json.load(open("dados/produtos.json"))
WPP = "5511982877142"
FORM = "https://docs.google.com/forms/d/e/1FAIpQLScD3J8Bchik66my8m5rNnE-41UHjbVFUAQBomOY7XPBzrBkwA/viewform"
E = html.escape

CATS = [  # slug, nome, mascote, fundo, resumo, foto vitrine
  ("cartoes",   "Cartões de Visita",   "cartao",   "bg-laranja",  "Papel, acabamento e impressão sob medida pro seu negócio. Do couché brilho ao hot stamping.", "img/produtos/cartoes-p4.webp"),
  ("panfletos", "Panfletos",           "panfleto", "bg-amarelo",  "10x14, meia A4 e A4, em tiragens de 25 a 5.000. O jeito mais barato de espalhar sua marca pelo bairro.", "img/produtos/panfletos-p7.webp"),
  ("banners",   "Banners e Placas",    "banner",   "bg-turquesa", "Lona brilho ou fosca com madeira ou ilhós, e placas em PS pra sinalizar seu espaço.", "img/produtos/banners-p2.webp"),
  ("adesivos",  "Adesivos e Etiquetas","adesivo",  "bg-turquesa", "Etiquetas em cartela, vinil com recorte, adesivo de vitrine e frota. Calcule pelo tamanho.", "img/produtos/adesivos-p21.webp"),
  ("camisetas", "Camisetas",           "camiseta", "bg-amarelo",  "Sublimação, DTF premium e estampa na sua peça. Uniforme, evento ou presente.", "img/produtos/camisetas-p3.webp"),
  ("canecas",   "Canecas e Térmicos",  "caneca",   "bg-azul",     "Canecas com a sua arte, garrafas e copos térmicos gravados a laser.", "img/produtos/canecas-p2.webp"),
]
CATN = {c[0]: c for c in CATS}
SERVS = [  # slug, nome, foto, fundo, resumo
  ("gravacao-laser", "Gravação a Laser", "img/produtos/canecas-p9.webp", "bg-azul", "Nome, logo ou frase gravados pra sempre em garrafa, copo, madeira e acrílico."),
  ("envelopamento",  "Envelopamento e Vitrine", "img/produtos/adesivos-p16.webp", "bg-turquesa", "Adesivo de frota, fachada e vitrine aplicado por nós."),
  ("design",         "Criação de Arte", "img/produtos/panfletos-p2.webp", "bg-laranja", "Não tem a arte? A gente cria seu logo, cartão, panfleto ou post."),
  ("comercio",       "Pra seu Comércio", "img/produtos/adesivos-p12.webp", "bg-amarelo", "Cardápio em 3D na mesa, site com mensalidade e comunicação visual completa."),
]

ICO = {
 "menu": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
 "sacola": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
 "busca": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 "x": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
 "wpp": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>',
}

def brl(v): return ("R$ " + f"{v:,.2f}").replace(",", "X").replace(".", ",").replace("X", ".")
def pmin(p): return p["m2"] if p.get("m2") else min(o["preco"] for o in p["opcoes"])
def wpp(msg): import urllib.parse; return f"https://wa.me/{WPP}?text=" + urllib.parse.quote(msg)

def pagina(caminho, titulo, desc, corpo, atual="", extra_head=""):
    prof = caminho.count("/")
    R = "../" * prof
    nav = "".join(f'<a href="{R}{s}/"{" aria-current=page" if atual==s else ""}>{E(n.split(" e ")[0] if s!="canecas" else "Canecas")}</a>' for s,n,*_ in CATS)
    nav += "".join(f'<a href="{R}{s}/"{" aria-current=page" if atual==s else ""}>{E(n.split(" e ")[0])}</a>' for s,n,*_ in SERVS)
    menu = "".join(f'<a href="{R}{s}/"><img src="{R}img/mascotes/{m}.webp" alt="">{E(n)}</a>' for s,n,m,*_ in CATS)
    menu += "".join(f'<a href="{R}{s}/">{E(n)}</a>' for s,n,*_ in SERVS)
    menu += f'<a href="{R}../cardapio-ar/">Cardápio em 3D (demo)</a><a href="{R}pedido/">Meu pedido</a>'
    doc = f"""<!doctype html>
<html lang="pt-BR" data-root="{R}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{E(titulo)}</title>
<meta name="description" content="{E(desc)}">
<meta property="og:title" content="{E(titulo)}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="{R}img/marca/logo-icone.webp">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&family=Outfit:wght@500;600&display=swap">
<link rel="stylesheet" href="{R}assets/site.css">
</head>
<body>
<div class="promo">5% OFF na primeira compra · <a href="{wpp('Olá! Quero meu desconto de 5% na primeira compra.')}">peça pelo WhatsApp</a></div>
<header class="topo">
  <div class="wrap">
    <div class="topo-linha">
      <a class="logo" href="{R}" aria-label="Johen Arte Gráfica, início"><img src="{R}img/marca/logo-wordmark.webp" alt="Johen Artes Gráficas" width="94" height="30"></a>
      <a class="icone-btn" href="{R}pedido/" aria-label="Meu pedido">{ICO['sacola']}<span class="contador" hidden>0</span></a>
      <button class="icone-btn" data-abrir-menu aria-label="Abrir menu">{ICO['menu']}</button>
    </div>
    <div class="busca">{ICO['busca']}<label class="sr" for="busca">Buscar produto</label><input id="busca" type="search" placeholder="O que você quer imprimir?" autocomplete="off"><div class="resultados" id="resultados" hidden></div></div>
    <nav class="nav-cat" aria-label="Categorias">{nav}</nav>
  </div>
</header>
<div class="menu" id="menu" hidden><nav aria-label="Menu"><button class="icone-btn fechar" data-fechar-menu aria-label="Fechar menu">{ICO['x']}</button>{menu}</nav></div>
<main>
{corpo}
</main>
<footer class="rodape">
  <div class="wrap">
    <div>
      <img class="marca" src="{R}img/marca/logo-wordmark.webp" alt="Johen Artes Gráficas">
      <p>R. Pedro Fernandes Aragão, 269 · Jardim Selma · São Paulo, SP</p>
      <p>WhatsApp (11) 98287-7142 · @johen_artgrafica</p>
      <p class="cnpj">CNPJ 65.480.613/0001-19</p>
    </div>
    <div><h3>Produtos</h3><ul>{"".join(f'<li><a href="{R}{s}/">{E(n)}</a></li>' for s,n,*_ in CATS)}</ul></div>
    <div><h3>Serviços</h3><ul>{"".join(f'<li><a href="{R}{s}/">{E(n)}</a></li>' for s,n,*_ in SERVS)}<li><a href="https://instagram.com/johen_artgrafica">Instagram</a></li><li><a href="https://g.page/r/CWKTHinBP02gEAI/review">Avaliar no Google</a></li></ul></div>
  </div>
</footer>
<a class="wpp-flut" href="{wpp('Olá! Vim pelo site e quero um orçamento.')}" aria-label="Falar no WhatsApp">{ICO['wpp']}</a>
<script src="{R}assets/site.js" defer></script>
{extra_head}
</body>
</html>"""
    os.makedirs(os.path.dirname(caminho) or ".", exist_ok=True)
    open(caminho, "w").write(doc)

def pcard(c, p, fundo):
    un = " o m²" if p.get("m2") else ""
    return f'''<a class="pcard" href="{p['id']}/" data-sub="{p['sub']}"><div class="pcard-img {fundo}"><img src="../{p['img']}" alt="{E(p['nome'])}" loading="lazy"></div>
<div class="pcard-rod"><b>{E(p['nome'])}</b><small>{E(p['subNome'])}</small><div class="preco-de">a partir de <strong>{brl(pmin(p))}</strong>{E(un)}</div></div></a>'''

# ---------- categorias e produtos ----------
for slug, nome, masc, fundo, resumo, foto in CATS:
    ps = D[slug]
    subs = []
    for p in ps:
        if p["sub"] not in [s[0] for s in subs]: subs.append((p["sub"], p["subNome"]))
    filtros = '<button data-f="todos" aria-pressed="true">Todos</button>' + "".join(f'<button data-f="{s}" aria-pressed="false">{E(n)}</button>' for s,n in subs)
    prazo = ps[0]["prazo"]
    corpo = f'''<div class="wrap">
<section class="cabeca-cat"><div class="migalha"><a href="../">Início</a> › {E(nome)}</div><h1>{E(nome)}</h1><p>{E(resumo)} Produção em {E(prazo)}.</p></section>
<div class="filtros" role="group" aria-label="Filtrar por tipo">{filtros}</div>
<div class="grade">{"".join(pcard(slug,p,fundo) for p in ps)}</div>
<p class="envio-arte" style="margin-top:22px">Não achou o que precisa? <a href="{wpp(f'Olá! Procuro algo em {nome} que não achei no site.')}">Fale com a gente no WhatsApp</a> que a gente faz sob medida.</p>
</div>'''
    pagina(f"{slug}/index.html", f"{nome} | Johen Arte Gráfica", f"{nome} personalizados em São Paulo. {resumo}", corpo, slug)

    for p in ps:
        dados = {"c": slug, "id": p["id"], "nome": p["nome"], "img": p["img"], "opcoes": p["opcoes"], "m2": p.get("m2"), "minimo": p.get("minimo"), "caixinha": p.get("caixinha")}
        if p.get("m2"):
            opc = f'''<div class="campo"><span class="rot">Tamanho do adesivo</span><div class="dupla"><div><label for="largura">Largura (cm)</label><input id="largura" type="number" inputmode="decimal" min="1" value="50"></div><div><label for="altura">Altura (cm)</label><input id="altura" type="number" inputmode="decimal" min="1" value="50"></div></div><small>{brl(p['m2'])} o m². Pedido mínimo {brl(p['minimo'])}.</small><p class="aviso-min" id="aviso-min" hidden>Esse tamanho ficou abaixo do pedido mínimo, então o valor sobe pra {brl(p['minimo'])}.</p></div>'''
        elif len(p["opcoes"]) > 1:
            rot = "Quantidade" if " un." in p["opcoes"][0]["label"] else "Escolha a opção"
            opc = f'<div class="campo"><label for="opcao">{rot}</label><select id="opcao">' + "".join(f'<option>{E(o["label"])} — {brl(o["preco"])}</option>' for o in p["opcoes"]) + '</select></div>'
        else:
            opc = f'<div class="campo"><span class="rot">Preço</span><span>{brl(p["opcoes"][0]["preco"])} {E(p["opcoes"][0]["label"])}</span></div>'
        if p.get("caixinha"):
            opc += f'<div class="campo"><label class="check"><input type="checkbox" id="caixinha"> Caixinha personalizada (+ {brl(p["caixinha"])})</label></div>'
        opc += '<div class="campo campo-qtd"><span class="rot">Quantas peças?</span><div class="qtd"><button id="menos" aria-label="Menos">−</button><output id="qtd">1</output><button id="mais" aria-label="Mais">+</button></div></div>'
        editavel = slug == "canecas" and p["sub"] == "canecas"
        botoes = (f'<a class="btn btn-pri btn-bloco" href="../../editor/?c={slug}&p={p["id"]}">Personalizar com sua arte</a><button class="btn btn-sec btn-bloco" id="add">Adicionar ao pedido</button>'
                  if editavel else '<button class="btn btn-pri btn-bloco" id="add">Adicionar ao pedido</button>')
        botoes += f'<a class="btn btn-wpp btn-bloco" id="pedir-agora" href="https://wa.me/{WPP}">{ICO["wpp"]} Pedir agora no WhatsApp</a>'
        specs = "".join(f"<dt>{k}</dt><dd>{E(v)}</dd>" for k,v in [("Material",p["material"]),("Acabamento",p["acab"]),("Impressão",p["impressao"]),("Prazo",p["prazo"])] if v)
        relac = [q for q in ps if q["sub"]==p["sub"] and q["id"]!=p["id"]][:4]; relac = (relac + [q for q in ps if q["id"]!=p["id"] and q not in relac])[:4]
        rel = "".join(pcard(slug,q,fundo).replace(f'href="{q["id"]}/"',f'href="../{q["id"]}/"').replace('src="../img','src="../../img') for q in relac)
        corpo = f'''<div class="wrap">
<div class="migalha" style="padding-top:18px"><a href="../../">Início</a> › <a href="../">{E(nome)}</a> › {E(p["subNome"])}</div>
<div class="produto">
  <div class="foto {fundo}"><img src="../../{p['img']}" alt="{E(p['nome'])}"></div>
  <div class="conf">
    <div><h1>{E(p["nome"])}</h1><p class="sub">{E(p["obs"])}</p></div>
    <dl class="specs">{specs}</dl>
    {opc}
    <div class="total"><small>Valor total</small><strong id="total">{brl(pmin(p))}</strong><span id="total-un"></span></div>
    <div class="acoes">{botoes}</div>
    <p class="envio-arte">Já tem a arte? Mande na conversa do WhatsApp ou <a href="{FORM}">envie pelo formulário</a>. Não tem? <a href="../../design/">A gente cria pra você.</a></p>
    {f'<div class="alerta">{E(p["alerta"])}</div>' if p.get("alerta") else ""}
    {f'<div class="caixa-info"><h3>Você sabia?</h3><p>{E(p["curiosidade"])}</p></div>' if p.get("curiosidade") else ""}
  </div>
</div>
{f'<section class="secao" style="padding-top:0"><div class="secao-tit"><h2>Veja também</h2></div><div class="grade grade-4">{rel}</div></section>' if rel else ""}
</div>
<script type="application/json" id="dados-produto">{json.dumps(dados, ensure_ascii=False)}</script>'''
        pagina(f"{slug}/{p['id']}/index.html", f"{p['nome']} | Johen Arte Gráfica", f"{p['nome']}: {p['obs'][:140]}", corpo, slug)

# ---------- serviços (rascunhos) ----------
SERV_TXT = {
 "gravacao-laser": [("Garrafas e copos", "Térmicos com nome, logo da empresa ou frase. Ótimo pra brinde corporativo."), ("Sua peça", "Traga seu copo, garrafa ou objeto e a gente grava."), ("Madeira e acrílico", "Placas, chaveiros, tábuas e troféus. Rascunho: confirme os materiais que você grava.")],
 "envelopamento": [("Frota e carros", "Adesivo com sua marca em carro, moto, van e caminhão."), ("Vitrine e fachada", "Adesivo de vitrine, jateado e recorte em vinil aplicado no local."), ("Medida no local", "A gente mede, cria a arte e aplica. Rascunho: confirme se cobra visita.")],
 "design": [("Logo", "Criação ou redesenho da sua marca."), ("Arte pra impressão", "Cartão, panfleto, banner e adesivo prontos pra imprimir."), ("Posts", "Artes pro Instagram e WhatsApp do seu negócio.")],
}
for slug, nome, foto, fundo, resumo in SERVS:
    if slug == "comercio":
        corpo = f'''<div class="wrap"><section class="cabeca-cat"><div class="migalha"><a href="../">Início</a> › {E(nome)}</div><h1>{E(nome)}</h1><p>{E(resumo)}</p></section>
<div class="serv-lista" style="margin-top:18px">
<div><span class="novo rascunho" style="margin-bottom:8px">Novidade</span><b>Cardápio em 3D na mesa</b><span>O cliente aponta a câmera pro QR code e vê o prato em tamanho real em cima da mesa. Inclui escaneamento dos pratos e displays de mesa.</span><p><a class="link-seta" href="../../cardapio-ar/">Ver a demonstração</a></p></div>
<div><b>Site com mensalidade</b><span>Site rápido pro seu negócio aparecer no Google, com WhatsApp e atualização inclusa todo mês.</span><p><a class="link-seta" href="{wpp('Olá! Quero saber do site com mensalidade.')}">Quero saber o valor</a></p></div>
<div><b>Comunicação visual completa</b><span>Fachada, adesivo de vitrine, banner, cardápio impresso e uniforme num pacote só.</span><p><a class="link-seta" href="{wpp('Olá! Quero um pacote de comunicação visual pro meu comércio.')}">Montar meu pacote</a></p></div>
</div></div>'''
    else:
        itens = "".join(f"<div><b>{E(a)}</b><span>{E(b)}</span></div>" for a,b in SERV_TXT[slug])
        corpo = f'''<div class="wrap"><section class="cabeca-cat"><div class="migalha"><a href="../">Início</a> › {E(nome)}</div><h1>{E(nome)}</h1><p>{E(resumo)}</p></section>
<div class="produto"><div class="foto {fundo}"><img src="../{foto}" alt=""></div>
<div class="conf"><span class="rascunho">Rascunho: textos e preços pra você revisar</span><div class="serv-lista" style="grid-template-columns:1fr">{itens}</div>
<a class="btn btn-wpp btn-bloco" href="{wpp(f'Olá! Quero um orçamento de {nome}.')}">{ICO['wpp']} Pedir orçamento</a></div></div></div>'''
    pagina(f"{slug}/index.html", f"{nome} | Johen Arte Gráfica", f"{nome} em São Paulo. {resumo}", corpo, slug)

# ---------- pedido ----------
corpo = f'''<div class="wrap" style="max-width:720px">
<section class="cabeca-cat"><div class="migalha"><a href="../">Início</a> › Meu pedido</div><h1>Meu pedido</h1></section>
<div id="pedido-vazio" class="vazio" hidden><b>Seu pedido está vazio.</b><span>Escolha um produto e toque em "Adicionar ao pedido".</span><a class="btn btn-pri" href="../">Ver produtos</a></div>
<div id="pedido-cheio" hidden>
  <div class="itens" id="itens"></div>
  <div class="total" style="margin-top:18px"><small>Total do pedido</small><strong id="pedido-total">R$ 0,00</strong></div>
  <div class="pix" style="margin-top:18px">
    <span class="rascunho">Rascunho: falta sua chave Pix e o link do Mercado Pago</span>
    <b>Pague com Pix</b>
    <code id="chave-pix">SUA-CHAVE-PIX-AQUI</code>
    <button class="btn btn-turq" id="copiar-pix">Copiar chave Pix</button>
    <a class="btn btn-sec" href="#" aria-disabled="true">Pagar com cartão (Mercado Pago)</a>
  </div>
  <div class="acoes" style="margin-top:18px">
    <a class="btn btn-wpp btn-bloco" id="enviar-pedido" href="https://wa.me/{WPP}">{ICO['wpp']} Enviar pedido no WhatsApp</a>
    <p class="envio-arte">Depois de enviar, mande as artes e o comprovante na mesma conversa. Arquivo grande? <a href="{FORM}">Envie pelo formulário</a>.</p>
  </div>
</div></div>'''
pagina("pedido/index.html", "Meu pedido | Johen Arte Gráfica", "Revise seu pedido e envie pelo WhatsApp.", corpo)


# ---------- editor de caneca ----------
corpo = f'''<div class="wrap editor">
<div class="migalha" style="padding-top:14px"><a href="../">Início</a> › <a href="../canecas/">Canecas</a> › Personalizar</div>
<h1 class="ed-tit" id="nome-produto">Carregando caneca…</h1>
<div class="ed-grid">
  <div class="ed-palco"><canvas id="tela" aria-label="Prévia da caneca com a sua arte"></canvas></div>
  <div class="ed-lado">
    <div id="painel" class="ed-painel">
      <div id="ajustes" class="campo" hidden><label for="zoom">Tamanho da imagem</label><input id="zoom" type="range" min="40" max="300" value="100"><small>Arraste a imagem na caneca pra posicionar. No celular dá pra usar dois dedos.</small><button class="btn btn-sec" id="centralizar" style="min-height:42px;font-size:15px">Encaixar na área</button>
        <p id="qualidade" class="aviso-min" hidden>Essa imagem tem resolução baixa e pode sair borrada. Se tiver uma maior, prefira ela.</p></div>
      <div id="bloco-texto" class="campo" hidden><label for="texto">Texto na caneca</label><input id="texto" type="text" maxlength="40" placeholder="Ex.: Melhor pai do mundo" style="height:50px;border:1.5px solid #c9d0d2;border-radius:10px;padding:0 14px"><label for="cor-texto" style="font-weight:600;font-size:14px">Cor do texto</label><input id="cor-texto" type="color" value="#1d2427" style="width:64px;height:40px;border:0;background:none"></div>
      <div id="cores" class="campo" hidden><span class="rot">Cor da alça e de dentro</span><div class="cores"></div></div>
      <label class="check campo"><input type="checkbox" id="caixinha"> Caixinha personalizada (+ R$ 5,00)</label>
      <div class="total"><small>Valor</small><strong id="total">R$ 0,00</strong></div>
    </div>
  </div>
</div>
<div class="ed-barra" id="barra-editar">
  <div class="ed-mais" id="mais-opcoes" hidden>
    <label class="btn btn-sec" for="arquivo">Enviar imagem</label>
    <button class="btn btn-sec" id="add-txt">Escrever texto</button>
  </div>
  <input type="file" id="arquivo" accept="image/*" class="sr">
  <button class="ed-plus" id="btn-mais" aria-label="Adicionar imagem ou texto">+</button>
  <button class="btn btn-sec" id="revisar">Revisar</button>
</div>
<div class="ed-barra" id="barra-revisar" hidden>
  <button class="btn btn-sec" id="voltar">Editar</button>
  <button class="btn btn-pri" id="add-pedido">Adicionar ao pedido</button>
  <button class="btn btn-wpp" id="enviar-arte">{ICO['wpp']} Enviar</button>
</div>
</div>'''
pagina("editor/index.html", "Personalizar caneca | Johen Arte Gráfica", "Monte sua caneca com a sua arte e veja como fica antes de pedir.", corpo, "canecas", '<script src="../assets/editor.js" defer></script>')

# ---------- home ----------
hero_fotos = ["cartoes-p1","canecas-p2","cartoes-p3","canecas-p9","camisetas-p5","cartoes-p7"]
CARDS = [("cartoes/","Cartões de Visita","cartoes-p3"),("canecas/","Canecas e Térmicos","canecas-p2"),("adesivos/","Adesivos e Etiquetas","adesivos-p20"),
         ("camisetas/","Camisetas","camisetas-p5"),("panfletos/","Panfletos","panfletos-p5"),("banners/","Banners e Placas","banners-p2"),
         ("gravacao-laser/","Gravação a Laser","canecas-p9"),("envelopamento/","Envelopamento e Vitrine","adesivos-p16"),("comercio/","Pra seu Comércio","adesivos-p12")]
cards = "".join(f'<a class="mcard" href="{h}"><div class="mcard-img"><img src="img/produtos/{f}.webp" alt="" loading="lazy"></div><span>Ver {E(n)}</span></a>' for h,n,f in CARDS)
corpo = f'''
<section class="inicio"><div class="wrap">
  <a class="mcard mcard-hero" href="#produtos">
    <div class="mcard-img hero-midia" aria-hidden="true">
      <video autoplay muted loop playsinline preload="metadata"><source src="video/hero.mp4" type="video/mp4"></video>
      {"".join(f'<img src="img/produtos/{h}.webp" alt="">' for h in hero_fotos)}
      <span class="rascunho">Rascunho: vídeo da loja</span>
    </div>
  </a>
  <h1 class="inicio-tit">Sua ideia, impressa com capricho.</h1>
  <div class="mcards" id="produtos">{cards}</div>
</div></section>'''
pagina("index.html", "Johen Arte Gráfica | Gráfica e personalizados no Jardim Selma, SP", "Cartões de visita, panfletos, banners, adesivos, camisetas e canecas personalizadas em São Paulo. Peça pelo site e acompanhe pelo WhatsApp.", corpo)
print("ok")
