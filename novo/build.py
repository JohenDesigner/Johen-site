# Gera as páginas do site novo a partir de dados/produtos.json
# Rodar: python3 build.py   (dentro da pasta novo/)
import json, os, re, html, shutil, hashlib
VER = hashlib.md5((open("assets/site.css","rb").read()+open("assets/site.js","rb").read()+open("assets/editor.js","rb").read()+open("assets/mockup3d.js","rb").read()+open("assets/tour.js","rb").read()+open("assets/cine.css","rb").read()+open("assets/cine.js","rb").read())).hexdigest()[:8]

D = json.load(open("dados/produtos.json", encoding="utf-8"))
WPP = "5511982877142"
FORM = "https://docs.google.com/forms/d/e/1FAIpQLScD3J8Bchik66my8m5rNnE-41UHjbVFUAQBomOY7XPBzrBkwA/viewform"
E = html.escape
def TX(t):  # texto corrido: aspas retas "x" viram tipográficas “x”
  return E(re.sub(r'"([^"\n]+)"', "\u201c\\1\u201d", t))

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
  ("comercio",       "Para seu Comércio", "img/produtos/adesivos-p12.webp", "bg-amarelo", "Cardápio em 3D na mesa, site com mensalidade e comunicação visual completa."),
]

# Pagamento online: preencha quando tiver. Vazio = a página do pedido explica que a chave/link vão pelo WhatsApp.
PIX = "65.480.613/0001-19"  # chave Pix = CNPJ (informada pelo Johen em 2026-10-30)
MERCADO_PAGO = "" # link de pagamento do Mercado Pago
# Arquivos do editor ("Personalize sem sair do site") → pasta "Pedidos do site" no Google Drive do Johen.
# É o endereço do App da Web do Apps Script (drive/Code.gs, termina em /exec). Vazio = não envia (o cliente manda no WhatsApp).
ARQUIVOS_DRIVE = ""
# Avaliações reais do Google (copie do perfil da loja). Vazio = a home só mostra o convite pra avaliar.
AVALIACOES = [   # copiadas do Google em 2026-10-30 (nota 5,0 · 118 avaliações)
  ("Andressa Correia", "Recomendo muito a Johen, superou minha expectativa eu amei demais que perfeição. Personalizem a garrafa de vocês tbm com a Johen 🤗😍😍", 5),
  ("Samira Samy", "Atendimento muito bom !!Os trabalhos são ótimos !!! Amei meu Chaveirinho , ficou do jeitinho que eu queria 💖", 5),
  ("Jorge Silva", "excelente profissional atencioso caprichoso no trabalho que faz muito obrigado", 5),
]
NOTA_GOOGLE, TOTAL_AVALIACOES = "5,0", 118
# Formulário de orçamento da home → FormSubmit (código que entrega em hjose5860@gmail.com sem expor o e-mail)
FORMSUBMIT = "da882839a1c43226b913ede674340781"
# Assinatura do Site Cinematográfico (Labrego IA): código do projeto da página inicial cinematográfica
LBG = "LBG-SC-20261030-2F906668B2"
MAPA = "https://www.google.com/maps/search/?api=1&query=" + "R.+Pedro+Fernandes+Arag%C3%A3o,+269+-+Jardim+Selma,+S%C3%A3o+Paulo+-+SP"
REVIEW = "https://g.page/r/CWKTHinBP02gEAI/review"

TAMBEM = ["Convites", "Crachás", "Blocos e talões", "Envelopes", "Pastas", "Calendários", "Ímãs de geladeira", "Tags", "Cardápios", "Carimbos"]  # rodapé "Também fazemos" (só texto)

ICO = {
 "menu": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
 "sacola": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
 "busca": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 "x": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
 "insta": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>',
 "pix": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l9 9-9 9-9-9z"/><path d="M8.5 12l3.5-3.5 3.5 3.5-3.5 3.5z"/></svg>',
 "cartao": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/></svg>',
 "dinheiro": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/></svg>',
 "wpp": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>',
}


MASC = json.load(open("dados/mascotes.json", encoding="utf-8"))
def masc_anim(nome, R="", i=0):
    m = MASC[nome]; W, H = m["w"], m["h"]
    camadas = f'<img class="camada" style="position:absolute;inset:0;width:100%;height:100%" src="{R}img/mascotes/{nome}.webp" alt="">'
    olhos = "".join(f'<ellipse cx="{x}" cy="{y}" rx="{rx+6}" ry="{ry+6}" fill="{cor}"/><path d="M{x-rx} {y+4} q{rx} {ry*0.55:.0f} {2*rx} 0" fill="none" stroke="#1b1b1f" stroke-width="7" stroke-linecap="round"/>' for x,y,rx,ry,cor in m["olhos"])
    return f'<span class="masc-anim" style="position:relative;display:block;width:100%;max-width:100px;margin:0 auto;aspect-ratio:{W}/{H};--d:{i*0.55:.2f}s;--d2:{(i*1.3)%4.6:.2f}s">{camadas}<svg class="palp" style="position:absolute;inset:0;width:100%;height:100%;opacity:0" viewBox="0 0 {W} {H}" aria-hidden="true">{olhos}</svg></span>'

def brl(v): return ("R$ " + f"{v:,.2f}").replace(",", "X").replace(".", ",").replace("X", ".")
def pmin(p): return p["m2"] if p.get("m2") else min(o["preco"] for o in p["opcoes"])
def wpp(msg): import urllib.parse; return f"https://wa.me/{WPP}?text=" + urllib.parse.quote(msg)

def pagina(caminho, titulo, desc, corpo, atual="", extra_head="", head="", classe=""):
    prof = caminho.count("/")
    R = "../" * prof
    nav = "".join(f'<a href="{R}{s}/"{" aria-current=page" if atual==s else ""}>{E(n.split(" e ")[0] if s!="canecas" else "Canecas")}</a>' for s,n,*_ in CATS)
    nav += "".join(f'<a href="{R}{s}/"{" aria-current=page" if atual==s else ""}>{E(n.split(" e ")[0])}</a>' for s,n,*_ in SERVS)
    menu = "".join(f'<a href="{R}{s}/"><img src="{R}img/mascotes/{m}.webp" alt="">{E(n)}</a>' for s,n,m,*_ in CATS)
    menu += "".join(f'<a href="{R}{s}/">{E(n)}</a>' for s,n,*_ in SERVS)
    menu += f'<a href="{R}../cardapio-ar/">Cardápio em 3D (demo)</a><a href="{R}pedido/">Meu pedido</a>'
    doc = f"""<!doctype html>
<!--
  Johen Arte Gráfica · Site Cinematográfico por Labrego IA (labregoia.com.br)
  Projeto: {LBG} · Assinatura LBG-SC-2026-v1
  © 2026 Labrego IA. Estrutura, código e método licenciados.
-->
<html lang="pt-BR" data-root="{R}"{(' data-arquivos="' + E(ARQUIVOS_DRIVE) + '"') if ARQUIVOS_DRIVE else ""}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{E(titulo)}</title>
<meta name="description" content="{E(desc)}">
<meta property="og:title" content="{E(titulo)}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#ffffff">
<meta name="generator" content="Site Cinematográfico · Labrego IA">
<meta name="author" content="Labrego IA · labregoia.com.br">
<script>/* recarregou ou entrou direto (sem vir de outra página do site)? vai para a página inicial */(function(){{try{{var h=new URL(document.documentElement.dataset.root||"./",location.href).pathname;if(location.pathname===h||location.pathname===h+"index.html"||/[/](editor|pedido)[/]/.test(location.pathname))return;var n=performance.getEntriesByType("navigation")[0],t=n?n.type:"",r=document.referrer,doSite=false;try{{var u=new URL(r);doSite=u.origin===location.origin&&u.pathname.indexOf(h)===0}}catch(e){{}}if(t==="reload"||(t==="navigate"&&!doSite))location.replace(h)}}catch(e){{}}}})()</script>
<link rel="icon" href="{R}img/marca/logo-icone.webp">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&family=Outfit:wght@500;600&display=swap">
<link rel="stylesheet" href="{R}assets/site.css?v={VER}">
{head}</head>
<body{f' class="{classe}"' if classe else ""}>
<div class="promo">5% OFF na primeira compra</div>
<header class="topo">
  <div class="wrap">
    <div class="topo-linha">
      <a class="logo" href="{R}" aria-label="Johen Arte Gráfica, início"><img src="{R}img/marca/logo-wordmark.webp" alt="Johen Arte Gráfica" width="94" height="30"></a>
      <button class="icone-btn lupa-btn" type="button" aria-label="Buscar produto" aria-controls="busca" aria-expanded="false" hidden>{ICO['busca']}</button>
      <a class="icone-btn" href="{R}pedido/" aria-label="Meu pedido">{ICO['sacola']}<span class="contador" hidden>0</span></a>
      <button class="icone-btn" data-abrir-menu aria-label="Abrir menu">{ICO['menu']}</button>
    </div>
    <div class="busca">{ICO['busca']}<label class="sr" for="busca">Buscar produto</label><input id="busca" type="search" placeholder="O que você quer imprimir?" autocomplete="off"><div class="resultados" id="resultados" data-tambem='{E(json.dumps(TAMBEM, ensure_ascii=False))}' hidden></div></div>
    <nav class="nav-cat" aria-label="Categorias">{nav}</nav>
  </div>
</header>
<div class="menu" id="menu" hidden><nav aria-label="Menu"><button class="icone-btn fechar" data-fechar-menu aria-label="Fechar menu">{ICO['x']}</button>{menu}</nav></div>
<main>
{corpo}
</main>
<footer class="rodape">
  <div class="wrap">
    <div class="rod-marca"><img class="marca" src="{R}img/marca/logo-wordmark.webp" alt="Johen Arte Gráfica"><p>Gráfica e personalizados no Jardim Selma, São Paulo.</p></div>
    <div><h3>Produtos</h3>
      <ul>{"".join(f'<li><a href="{R}{sl}/">{E(n)}</a></li>' for sl,n,*_ in CATS)}</ul>
      <p class="rod-sub">Também fazemos</p>
      <ul class="lista-texto">{"".join(f"<li>{x}</li>" for x in TAMBEM)}</ul>
    </div>
    <div><h3>Ajuda</h3>
      <ul class="rod-ajuda">
        <li><b>Prazos:</b> o prazo de produção aparece em cada produto e começa depois da arte aprovada.</li>
        <li><b>Como enviar a arte:</b> mande na conversa do WhatsApp ou <a href="{FORM}">pelo formulário</a>. Não tem arte? <a href="{R}design/">A gente cria</a>.</li>
        <li><b>Retirada:</b> na loja, no Jardim Selma. Combine o horário pelo WhatsApp.</li>
        <li><b>Pedidos grandes:</b> têm desconto. <a href="{wpp('Olá! Quero um orçamento para grande quantidade.')}">Peça seu orçamento</a></li>
      </ul>
    </div>
    <div class="sobre-rod"><h3>Sobre</h3>
      <p class="destaque">Mais de 5 mil projetos aprovados.</p>
      <p><a href="{REVIEW}" target="_blank" rel="noopener">Veja e deixe sua avaliação no Google</a></p>
    </div>
    <div><h3>Contato</h3>
      <ul class="rod-contato">
        <li><a href="{wpp('Olá! Vim pelo site.')}">WhatsApp (11) 98287-7142</a></li>
        <li><a href="{MAPA}" target="_blank" rel="noopener">R. Pedro Fernandes Aragão, 269 · Jardim Selma · São Paulo, SP (ver no mapa)</a></li>
        <li>Segunda a sábado, das 11h às 20h. Antes de vir, confirme pelo WhatsApp.</li>
      </ul>
    </div>
  </div>
  <div class="rod-faixa"><div class="wrap">
    <div class="rod-pag" aria-label="Formas de pagamento"><span>{ICO['pix']}Pix</span><span>{ICO['cartao']}Débito</span><span>{ICO['cartao']}Crédito</span><span>{ICO['dinheiro']}Dinheiro</span></div>
    <a class="rod-insta" href="https://instagram.com/johen_artgrafica" target="_blank" rel="noopener">{ICO['insta']}@johen_artgrafica</a>
    <p class="cnpj">Johen Arte Gráfica · CNPJ 65.480.613/0001-19</p>
    <a class="credito-lbg" href="https://labregoia.com.br" target="_blank" rel="noopener">Site por Labrego IA</a>
  </div></div>
</footer>
<a class="insta-flut" href="https://instagram.com/johen_artgrafica" target="_blank" rel="noopener" aria-label="Instagram @johen_artgrafica">{ICO['insta']}</a>
<a class="wpp-flut" href="{wpp('Olá! Vim pelo site e quero um orçamento.')}" aria-label="Falar no WhatsApp">{ICO['wpp']}</a>
<script src="{R}assets/site.js?v={VER}" defer></script>
{extra_head}
</body>
</html>"""
    os.makedirs(os.path.dirname(caminho) or ".", exist_ok=True)
    open(caminho, "w", encoding="utf-8").write(doc)

def gemeo(c, p):  # outro produto da mesma categoria com o mesmo nome
    return any(q["id"] != p["id"] and q["nome"].strip().lower() == p["nome"].strip().lower() for q in D[c])

def faixa_prazo(ps):  # "2 dias úteis" e "3 a 4 dias úteis" → "1 a 4 dias úteis" (a categoria mostra do menor ao maior prazo)
    nums = [int(n) for p in ps for n in re.findall(r"\d+", p.get("prazo", ""))]
    if not nums: return ps[0]["prazo"]
    lo, hi = min(nums), max(nums)
    return ps[0]["prazo"] if lo == hi and len({p["prazo"] for p in ps}) == 1 else f"{lo} a {hi} dias úteis" if lo != hi else f"{lo} {'dia útil' if lo == 1 else 'dias úteis'}"

def pcard(c, p, fundo):
    un = " o m²" if p.get("m2") else ""
    # subtítulo só quando acrescenta algo (ex.: "Couché Brilho" já está em "Couché 250g — Couché Brilho")
    norm = lambda x: " ".join(x.lower().split())
    sub = p.get('subNome', '')
    # "21x30cm (A4)" também não acrescenta nada a "21x30cm — 115g Brilho A4 (Frente)": todas as palavras já estão no nome
    palavras = lambda x: set(re.findall(r"[\w]+", x.lower()))
    sub_html = f"<small>{E(sub)}</small>" if sub and norm(sub) not in norm(p['nome']) and not palavras(sub) <= palavras(p['nome']) else ""
    # dois produtos com o mesmo nome na categoria (ex.: os dois "Copo Térmico 473ml"): o acabamento diz qual é qual
    if gemeo(c, p) and p.get("acab"): sub_html = f"<small>{E(p['acab'].strip())}</small>"
    return f'''<a class="pcard" href="{p['id']}/" data-sub="{p['sub']}"><div class="pcard-img {fundo}"><img src="../{p['img']}" alt="{E(p['nome'])}" loading="lazy"></div>
<div class="pcard-rod"><b>{E(p['nome'])}</b>{sub_html}<span class="pcard-preco">a partir de {brl(pmin(p))}{un}</span></div></a>'''

# ---------- categorias e produtos ----------
for slug, nome, masc, fundo, resumo, foto in CATS:
    ps = D[slug]
    subs = []
    for p in ps:
        if p["sub"] not in [s[0] for s in subs]: subs.append((p["sub"], p["subNome"]))
    filtros = '<button data-f="todos" aria-pressed="true">Todos</button>' + "".join(f'<button data-f="{s}" aria-pressed="false">{E(n)}</button>' for s,n in subs)
    prazo = faixa_prazo(ps)
    corpo = f'''<div class="wrap">
<section class="cabeca-cat"><div class="migalha"><a href="../">Início</a> › {E(nome)}</div><h1>{E(nome)}</h1><p>{E(resumo)} Produção em {E(prazo)}.</p></section>
<div class="filtros" role="group" aria-label="Filtrar por tipo">{filtros}</div>
<div class="grade">{"".join(pcard(slug,p,fundo) for p in ps)}</div>
<p class="envio-arte" style="margin-top:22px">Não achou o que precisa? <a href="{wpp(f'Olá! Procuro algo em {nome} que não achei no site.')}">Fale conosco no WhatsApp</a></p>
</div>'''
    pagina(f"{slug}/index.html", f"{nome} | Johen Arte Gráfica", f"{nome} personalizados em São Paulo. {resumo}", corpo, slug)

    for p in ps:
        dados = {"c": slug, "id": p["id"], "nome": p["nome"], "img": p["img"], "opcoes": p["opcoes"], "m2": p.get("m2"), "minimo": p.get("minimo"), "caixinha": p.get("caixinha"), "m2livre": p.get("m2livre")}
        if gemeo(slug, p) and p.get("acab"): dados["dif"] = p["acab"].strip()  # vai no pedido pra saber qual dos dois foi pedido
        if p.get("m2"):
            opc = f'''<div class="campo"><span class="rot">{"Tamanho da placa" if slug == "banners" else "Tamanho do adesivo"}</span><div class="dupla"><div><label for="largura">Largura (cm)</label><input id="largura" type="number" inputmode="decimal" min="1" value="50"></div><div><label for="altura">Altura (cm)</label><input id="altura" type="number" inputmode="decimal" min="1" value="50"></div></div><small>{brl(p['m2'])} o m². Pedido mínimo {brl(p['minimo'])}.</small><p class="aviso-min" id="aviso-min" hidden>Ficou abaixo do pedido mínimo, então o valor sobe pra {brl(p['minimo'])}.</p></div>'''
        elif len(p["opcoes"]) > 1:
            rot = "Quantidade" if " un." in p["opcoes"][0]["label"] else "Tamanho" if all(re.fullmatch(r"\d+×\d+cm", o["label"]) for o in p["opcoes"]) else "Escolha a opção"
            # banner: "Tamanho pronto" e "Outro tamanho" lado a lado, à vista (não escondido dentro da lista)
            cab = (f'<div class="rot-linha"><label for="opcao">{rot}</label><button class="ed-ajuda" id="ver-tour" type="button"><span aria-hidden="true">?</span> Como escolher</button></div>'
                   '<div class="tam-modo" id="tam-modo" role="group" aria-label="Tipo de tamanho"><button type="button" data-m="pronto" aria-pressed="true">Tamanho pronto</button><button type="button" data-m="livre" aria-pressed="false">Outro tamanho</button></div>') if p.get("m2livre") else f'<label for="opcao">{rot}</label>'
            opc = f'<div class="campo" id="campo-tam">{cab}<select id="opcao">' + "".join(f'<option>{E(o["label"])} — {brl(o["preco"])}</option>' for o in p["opcoes"])
            if p.get("m2livre"):  # banner: além dos tamanhos prontos, o cliente digita a medida que quiser (preço por m², com mínimo)
                opc += f'</select><div id="medida-livre" class="dupla" hidden><div><label for="largura">Largura (cm)</label><input id="largura" type="number" inputmode="decimal" min="1" value="100"></div><div><label for="altura">Altura (cm)</label><input id="altura" type="number" inputmode="decimal" min="1" value="100"></div></div><small id="medida-livre-info" hidden>{brl(p["m2livre"]).replace(" ", "&nbsp;")} o m². Banner pequeno paga o mínimo de {brl(p["minimo"]).replace(" ", "&nbsp;")}.</small></div>'
            else:
                opc += '</select></div>'
        else:
            opc = ""  # preço único já aparece logo abaixo do título
        un = p.get("unidade") or ""
        rot_qtd = "Quantas cartelas?" if "cartela" in un else "Quantas estampas?" if "estampa" in un else "Quantas peças?"
        un_topo = un if len(p["opcoes"]) == 1 and not p.get("m2") and un not in ("", "cada") else ""  # ex.: "por cartela" ao lado do preço
        if un_topo and not un_topo.startswith(("por ", "cada")): un_topo = "por " + un_topo  # "cartela A3" → "por cartela A3"
        dados["un"] = un_topo
        # quantidade com o nome certo no pedido e no WhatsApp: "3 cartelas", "2 estampas" (não "por cartela, 3 un.")
        dados["qn"] = ["cartela", "cartelas"] if "cartela" in un else ["estampa", "estampas"] if "estampa" in un else None
        opc += f'<div class="campo campo-qtd"><span class="rot">{rot_qtd}</span><div class="qtd"><button id="menos" aria-label="Menos">−</button><output id="qtd">1</output><button id="mais" aria-label="Mais">+</button></div></div>'
        editavel = True  # A pedido do Johen: "Personalize sem sair do site" em todos os produtos (cada um com o seu modelo no editor.js)
        caixinha = (f'<label class="check caixinha-op"><input type="checkbox" id="caixinha"><img src="../../img/produtos/canecas-caixinha.webp" alt="" width="44" height="44" loading="lazy"><span class="cx-txt">Caixinha personalizada<small><b>+ {brl(p["caixinha"])}</b> · opcional</small></span></label>' if p.get("caixinha") else "")
        personalizar = (f'<a class="btn btn-pri btn-bloco" id="personalizar" href="../../editor/?c={slug}&p={p["id"]}">Personalize sem sair do site</a>' if editavel else "")
        botoes = ('<button class="btn btn-sec btn-bloco" id="add">Adicionar ao pedido</button>' if editavel else '<button class="btn btn-pri btn-bloco" id="add">Adicionar ao pedido</button>')
        botoes += f'<a class="btn btn-wpp btn-bloco" id="pedir-agora" href="{wpp(f'Olá! Quero {({"cartoes": "Cartão de visita ", "panfletos": "Panfleto "}).get(slug, "")}{p["nome"]}.')}">{ICO["wpp"]} Pedir agora no WhatsApp</a>'
        specs = "".join(f"<dt>{k}</dt><dd>{E(v)}</dd>" for k,v in [("Material",p["material"]),("Tamanho" if slug == "panfletos" else "Acabamento",p["acab"]),("Impressão",p["impressao"]),("Prazo",p["prazo"])] if v)
        relac = [q for q in ps if q["sub"]==p["sub"] and q["id"]!=p["id"]][:4]; relac = (relac + [q for q in ps if q["id"]!=p["id"] and q not in relac])[:4]
        rel = "".join(pcard(slug,q,fundo).replace(f'href="{q["id"]}/"',f'href="../{q["id"]}/"').replace('src="../img','src="../../img') for q in relac)
        corpo = f'''<div class="wrap">
<div class="migalha" style="padding-top:18px"><a href="../../">Início</a> › <a href="../">{E(nome)}</a> › {E(p["subNome"])}</div>
<div class="produto">
  <div class="foto {fundo}"><img src="../../{p['img']}" alt="{E(p['nome'])}"></div>
  <div class="conf">
    <h1>{E(p["nome"])}</h1>
    <div class="preco-topo"><div class="total" aria-live="polite"><strong id="total">{brl(pmin(p))}</strong><span id="total-un">{E(un_topo)}</span></div>{caixinha}</div>
    {personalizar}
    {opc}
    <div class="acoes">{botoes}</div>
    <p class="envio-arte">Já tem a arte? Mande na conversa do WhatsApp ou <a href="{FORM}">envie pelo formulário</a>. Não tem? <a href="../../design/">A gente cria pra você.</a></p>
    <section class="detalhes" aria-labelledby="det-tit">
      <h2 id="det-tit">Detalhes do produto</h2>
      <p class="sub">{E(p["obs"])}</p>
      <dl class="specs">{specs}</dl>
      {f'<div class="alerta">{E(p["alerta"])}</div>' if p.get("alerta") else ""}
      {f'<div class="caixa-info"><h3>Você sabia?</h3><p>{TX(p["curiosidade"])}</p></div>' if p.get("curiosidade") else ""}
    </section>
  </div>
</div>
{f'<section class="secao" style="padding-top:0"><div class="secao-tit"><h2>Veja também</h2></div><div class="grade grade-4">{rel}</div></section>' if rel else ""}
</div>
<script type="application/json" id="dados-produto">{json.dumps(dados, ensure_ascii=False)}</script>'''
        pagina(f"{slug}/{p['id']}/index.html", f"{p['nome']} | Johen Arte Gráfica", f"{p['nome']}: {p['obs'][:140]}", corpo, slug,
               f'<script src="../../assets/tour.js?v={VER}" defer></script>' if p.get("m2livre") else "")  # guia "Como escolher o tamanho"

# ---------- serviços (rascunhos) ----------
SERV_TXT = {
 "gravacao-laser": [("Garrafas e copos", "Térmicos com nome, logo da empresa ou frase. Ótimo pra brinde corporativo."), ("Sua peça", "Traga seu copo, garrafa ou objeto e a gente grava."), ("Madeira e acrílico", "Placas, chaveiros, tábuas e troféus.")],
 "envelopamento": [("Frota e carros", "Adesivo com sua marca em carro, moto, van e caminhão."), ("Vitrine e fachada", "Adesivo de vitrine, jateado e recorte em vinil aplicado no local."), ("Medida no local", "A gente mede, cria a arte e aplica.")],
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
<div class="conf"><div class="serv-lista" style="grid-template-columns:1fr">{itens}</div>
<a class="btn btn-wpp btn-bloco" href="{wpp(f'Olá! Quero um orçamento de {nome}.')}">{ICO['wpp']} Pedir orçamento</a></div></div></div>'''
    pagina(f"{slug}/index.html", f"{nome} | Johen Arte Gráfica", f"{nome} em São Paulo. {resumo}", corpo, slug)

# ---------- pedido ----------
# "Como pagar" sempre aparece; a chave Pix (e o Mercado Pago, se tiver) vem logo abaixo
PIX_NOME, PIX_CIDADE = "JOHEN ARTE GRAFICA", "SAO PAULO"  # vão dentro do código Pix (até 25 e 15 letras, sem acento)
PIX_COPIA = re.sub(r"[^0-9]", "", PIX) if re.fullmatch(r"[0-9./-]+", PIX) else PIX  # CNPJ: só os números
if PIX:
    # Pix copia e cola já com o valor do pedido (montado pelo site.js), como nos apps de delivery
    PAGAMENTO = (f'<div class="pix" id="bloco-pix" style="margin-top:18px" data-chave="{E(PIX_COPIA)}" data-nome="{PIX_NOME}" data-cidade="{PIX_CIDADE}">'
        '<b>Pague com Pix</b>'
        '<p class="pag-txt">Copie o código, abra o app do seu banco em <b>Pix › Copia e cola</b> e cole. O valor de <b id="pix-valor"></b> já vem preenchido.</p>'
        '<code id="pix-codigo"></code>'
        '<button class="btn btn-turq" id="copiar-pix" type="button">Copiar código Pix</button>'
        '<p class="pag-txt"><b>Primeira compra?</b> Você ganha 5% OFF. Avise no WhatsApp antes de pagar.</p>'
        f'<p class="pag-txt">Prefere outra forma? Também aceitamos cartão de débito ou crédito e dinheiro, é só pedir no WhatsApp. Chave Pix (CNPJ): {E(PIX)}.</p>'
        + (f'<a class="btn btn-sec" href="{E(MERCADO_PAGO)}" target="_blank" rel="noopener">Pagar com cartão (Mercado Pago)</a>' if MERCADO_PAGO else '')
        + '</div>')
    POS_ENVIO = "Depois de pagar, envie o pedido e mande o comprovante e as artes na mesma conversa."
else:
    PAGAMENTO = '<div class="pix" style="margin-top:18px"><b>Como pagar</b><p class="pag-txt">Pix, cartão de débito ou crédito e dinheiro. Depois que você enviar o pedido, a gente confere a arte e manda o Pix ou o link do cartão na mesma conversa.</p></div>'
    POS_ENVIO = "Depois de enviar, mande as artes na mesma conversa (o comprovante, só depois de pagar)."
corpo = f'''<div class="wrap" style="max-width:720px">
<section class="cabeca-cat"><div class="migalha"><a href="../">Início</a> › Meu pedido</div><h1>Meu pedido</h1></section>
<div id="pedido-vazio" class="vazio" hidden><span class="vazio-ico" aria-hidden="true">{ICO['sacola']}</span><b>Seu pedido está vazio.</b><span>Escolha um produto e toque em “Adicionar ao pedido”.</span><a class="btn btn-pri" href="../">Ver produtos</a></div>
<div id="pedido-cheio" hidden>
  <div class="itens" id="itens"></div>
  <div class="total" style="margin-top:18px"><small>Total do pedido</small><strong id="pedido-total">R$ 0,00</strong></div>
  {PAGAMENTO}
  <div class="acoes" style="margin-top:18px">
    <a class="btn btn-wpp btn-bloco" id="enviar-pedido" href="https://wa.me/{WPP}">{ICO['wpp']} Enviar pedido no WhatsApp</a>
    <p class="envio-arte">{POS_ENVIO} Arquivo grande? <a href="{FORM}">Envie pelo formulário</a>.</p>
  </div>
</div></div>'''
pagina("pedido/index.html", "Meu pedido | Johen Arte Gráfica", "Revise seu pedido e envie pelo WhatsApp.", corpo)


# ---------- editor de caneca ----------
corpo = f'''<div class="wrap editor">
<div class="migalha" style="padding-top:14px"><a href="../">Início</a> › <a id="migalha-cat" href="../canecas/">Canecas</a> › Personalizar</div>
<div class="ed-cab"><h1 class="ed-tit" id="nome-produto">Carregando caneca…</h1><button class="ed-ajuda" id="ver-tour" type="button" aria-label="Como usar o editor"><span aria-hidden="true">?</span> Como usar</button></div>
<div class="ed-grid">
  <div class="ed-esq">
    <div class="ed-palco palco3d" id="palco3d"><canvas id="tela3d" aria-label="Caneca em 3D com a sua arte. Arraste para girar."></canvas><p id="aviso3d" class="aviso3d">Carregando 3D…</p><p class="dica3d" aria-hidden="true">Arraste para girar</p><button class="btn btn-sec cobrir3d" id="centralizar">Cobrir a caneca toda</button><div id="acoes3d" class="ed-3d-acoes"><button class="btn btn-sec" id="girar3d" aria-pressed="true">Girar sozinha</button><button class="btn btn-sec" id="foto3d">Baixar PNG</button><button class="btn btn-sec" id="video3d">Baixar vídeo</button></div></div>
    <div class="ed-faixa">
      <div class="ed-lados" id="lados" role="tablist" aria-label="Lado da camiseta" hidden><button role="tab" data-l="frente" aria-selected="true">Frente</button><button role="tab" data-l="costas" aria-selected="false">Costas</button></div>
      <div class="ed-faixa-tit"><span class="rot">Área de impressão</span><small>volta toda a caneca · 20 x 8,5 cm</small></div>
      <canvas id="tela" aria-label="Área de impressão aberta: arraste a arte para posicionar"></canvas>
      <div class="ed-faixa-guia" aria-hidden="true"><span>‹ lado da alça</span><span>frente</span><span>lado da alça ›</span></div>
    </div>
  </div>
  <div class="ed-lado">
    <div id="painel" class="ed-painel">
      <div id="bloco-espelho" class="campo espelho" hidden><span class="rot">Arte espelhada</span><p id="espelho-txt">Este adesivo é colado por dentro do vidro, então a impressão sai espelhada (invertida) pra ler certo de fora. Se a sua arte ainda não está espelhada, toque em <b>Espelhar arte</b>.</p><button class="btn btn-sec" id="espelhar" type="button" aria-pressed="false">Espelhar arte</button></div>
      <div id="ajustes" class="campo" hidden><label for="zoom">Tamanho da imagem</label><input id="zoom" type="range" min="40" max="300" value="100"><small>Arraste a imagem na área de impressão pra posicionar. No celular dá pra usar dois dedos.</small>
        <p id="fotos-dica" class="fotos-dica" hidden>Toque numa foto pra mexer nela. A que está com contorno laranja é a selecionada.</p>
        <div class="fotos-acoes"><label class="btn btn-sec" for="arquivo">+ Outra foto</label><button class="btn btn-sec" id="remover-foto">Remover esta foto</button></div>
        <label class="check" id="bloco-inverter" hidden><input type="checkbox" id="inverter"> Gravar as partes claras da imagem</label><p id="qualidade" class="aviso-min" hidden>Essa imagem tem resolução baixa e pode sair borrada. Se tiver uma maior, prefira ela.</p></div>
      <div id="bloco-texto" class="campo" hidden><label for="texto">Texto na caneca</label><input id="texto" type="text" maxlength="40" placeholder="Ex.: Melhor pai do mundo" style="height:50px;border:1.5px solid #c9d0d2;border-radius:10px;padding:0 14px"><label for="cor-texto" style="font-weight:600;font-size:14px">Cor do texto</label><input id="cor-texto" type="color" value="#1d2427" style="width:64px;height:40px;border:0;background:none"></div>
      <div id="cores" class="campo" hidden><span class="rot">Cor da alça e de dentro</span><div class="cores"></div></div>
      <label class="check campo"><input type="checkbox" id="caixinha"> Caixinha personalizada (+ R$ 5,00)</label>
      <div class="campo campo-qtd"><span class="rot" id="ed-qtd-rot">Quantas peças?</span><div class="qtd"><button id="ed-menos" type="button" aria-label="Menos">−</button><output id="ed-qtd" aria-labelledby="ed-qtd-rot">1</output><button id="ed-mais" type="button" aria-label="Mais">+</button></div></div>
      <div class="total"><small>Valor</small><strong id="total">R$ 0,00</strong><span id="total-un"></span></div>
    </div>
  </div>
</div>
<div class="ed-barra" id="barra-editar">
  <div class="ed-mais" id="mais-opcoes" hidden>
    <label class="btn btn-sec" for="arquivo">Enviar imagem</label>
    <button class="btn btn-sec" id="add-txt">Escrever texto</button>
  </div>
  <input type="file" id="arquivo" accept="image/*" class="sr">
  <button class="btn ed-plus" id="btn-mais" aria-haspopup="true">Adicionar arte</button>
  <button class="btn btn-sec" id="revisar">Revisar</button>
  <button class="btn btn-pri" id="comprar">Comprar</button>
</div>
<div class="ed-barra" id="barra-revisar" hidden>
  <button class="btn btn-sec" id="voltar">Editar</button>
  <button class="btn btn-pri" id="add-pedido">Comprar</button>
  <button class="btn btn-wpp" id="enviar-arte">{ICO['wpp']} Enviar</button>
</div>
</div>'''
pagina("editor/index.html", "Personalizar | Johen Arte Gráfica", "Monte sua caneca, copo térmico, camiseta ou banner com a sua arte e veja em 3D antes de pedir.", corpo, "canecas", f'<script src="../assets/editor.js?v={VER}" defer></script><script type="module" src="../assets/mockup3d.js?v={VER}"></script><script src="../assets/tour.js?v={VER}" defer></script>', classe="pag-editor")  # no editor a busca vira lupa (mais espaço pra montar)

# ---------- home (cinematográfica: o vídeo da bancada anda com a rolagem) ----------
# Frames em cine/frames/ (gerados do vídeo com o fatiar_frames.sh do Site Cinematográfico) e artes em img/cine/
CINE_FRAMES = 160
CORES_MASC = {"cartoes": "#E8650A", "panfletos": "#D7322A", "banners": "#7B5CC4", "adesivos": "#00C2C7", "camisetas": "#F5A623", "canecas": "#2199BE"}
PORTFOLIO = [  # fotos reais de trabalhos da loja (img/portfolio/). 1º e 6º ficam grandes. Vídeo: mesmo nome .mp4 + .webp de capa
  ("vitrine-bianca-souza", "Adesivo de vitrine do Bianca Souza Beauty Studio"), ("camisa-fast-lions", "Camisa sublimada do time Fast Lions"),
  ("copo-termico-dominique", "Copo térmico rosa gravado a laser com o nome Dominique"), ("panfletos-evds", "Panfletos da EVDS Serviços"),
  ("cartoes-didi-nanes", "Cartões de visita da Didi Nanes Modas e Acessórios", "video"), ("envelopamento-van-vergueiro", "Envelopamento da van da Carvão e Lenha Vergueiro"),
  ("caneca-minha-pessoa", "Caneca personalizada com ilustração e frases"), ("banner-dona-do-pedaco", "Banner da confeitaria A Dona do Pedaço"),
  ("chaveiros-mdf-cha-de-panela", "Chaveiros de MDF gravados a laser para chá de panela"), ("adesivos-frango-da-hora", "Adesivos redondos do Frango da Hora"),
]
def a_partir(slug):
    precos = [min(o["preco"] for o in p["opcoes"]) for p in D[slug] if not p.get("m2") and p.get("opcoes")]
    return f"a partir de {brl(min(precos))}" if precos else f"{len(D[slug])} opções"

masc_html = "".join(f'''<a class="cin-masc revelar" href="{s}/" style="--cor:{CORES_MASC.get(s, "#E8650A")}">{masc_anim(m, "", i)}<b>{E(n)}</b><small>{a_partir(s)}</small></a>'''
                    for i, (s, n, m, *_) in enumerate(CATS))
serv_html = "".join(f'<a class="mcard revelar" href="{s}/"><div class="mcard-img"><img src="{f}" alt="" loading="lazy"></div><span>{E(n)}</span></a>' for s, n, f, *_ in SERVS)
def port_item(a, t, tipo=""):
    if tipo == "video":
        return f'<figure class="revelar"><video src="img/portfolio/{a}.mp4" poster="img/portfolio/{a}.webp" autoplay muted loop playsinline preload="none" aria-label="{E(t)}"></video></figure>'
    return f'<figure class="revelar"><img src="img/portfolio/{a}.webp" alt="{E(t)}" loading="lazy"></figure>'
port_html = "".join(port_item(*x) for x in PORTFOLIO)
depo_html = "".join(f'<figure class="painel cin-depo revelar"><span class="estrelas" aria-label="{n} de 5 estrelas">{"★"*n}</span><blockquote>{E(t)}</blockquote><figcaption>{E(a)} · Google</figcaption></figure>' for a, t, n in AVALIACOES)
opcoes_form = "".join(f"<option>{E(n)}</option>" for _, n, *_ in CATS + SERVS)
MAPA_EMBED = "https://www.google.com/maps?q=R.+Pedro+Fernandes+Arag%C3%A3o,+269+-+Jardim+Selma,+S%C3%A3o+Paulo+-+SP,+04431-160&output=embed"
ROTA = "https://www.google.com/maps/dir/?api=1&destination=R.+Pedro+Fernandes+Arag%C3%A3o,+269,+S%C3%A3o+Paulo+-+SP,+04431-160"

corpo = f'''
<section id="inicio" class="cine" style="--altura:420vh" data-total="{CINE_FRAMES}" data-desktop="cine/frames/desktop/f_{{n}}.webp" data-mobile="cine/frames/mobile/f_{{n}}.webp">
  <div class="cine-palco">
    <canvas class="cine-canvas" aria-hidden="true"></canvas>
    <div class="cine-vinheta"></div>
    <div class="momento" data-de="0" data-ate="0.3"><div class="painel painel--vidro">
      <h1>Seja bem-vindo ao catálogo da Johen</h1>
      <p>Gráfica rápida e personalizados no Jardim Selma, zona sul de São Paulo. Cartão, adesivo, camiseta, banner, caneca e gravação a laser.</p>
    </div></div>
    <div class="momento momento--direita" data-de="0.38" data-ate="0.66"><div class="painel painel--vidro">
      <p class="destaque-cine">Mais de 5.000 clientes satisfeitos</p>
      <p>Monte o pedido aqui no site, personalize caneca e camiseta em 3D e feche tudo pelo WhatsApp. Na primeira compra, 5% OFF.</p>
    </div></div>
    <div class="momento momento--centro" data-de="0.74" data-ate="1"><div class="painel painel--vidro">
      <p class="destaque-cine">Da bancada para a sua mão</p>
      <a class="btn btn-pri" href="#produtos">Ver os produtos</a>
    </div></div>
    <div class="cine-dica" aria-hidden="true"><span></span>role</div>
  </div>
</section>

<section id="produtos" class="cin-secao cin-larga">
  <img class="arte arte--fundo" src="img/cine/categorias.webp" alt="" loading="lazy">
  <div class="painel revelar"><span class="rotulo">01</span><h2>Escolha o que vamos fazer pra você</h2></div>
  <div class="cin-mascotes">{masc_html}</div>
  <div class="cin-servicos">{serv_html}</div>
  <div class="painel revelar">
    <h3>Também fazemos</h3>
    <ul class="chips">{"".join(f'<li class="chip"><a href="{wpp(f"Olá! Quero um orçamento de {x}.")}">{E(x)}</a></li>' for x in TAMBEM)}</ul>
    <a class="link-seta" href="{wpp('Olá! Vim pelo site e não achei o que preciso no catálogo.')}">Não achou o que precisa? Fale com a gente no WhatsApp</a>
  </div>
</section>

<section id="arquivo" class="cin-secao">
  <img class="arte arte--esquerda" src="img/cine/arquivo.webp" alt="" loading="lazy">
  <div class="cin-grade cin-grade--direita"><div class="painel revelar">
    <span class="rotulo">02</span>
    <h2>Como preparar seu arquivo</h2>
    <ol class="passos">
      <li><strong>PDF ou imagem em alta</strong><span>PDF é o mais seguro. PNG ou JPG também servem, desde que tenham 300 dpi no tamanho real da peça.</span></li>
      <li><strong>Sangria de 3 mm</strong><span>Estique o fundo 3 mm além da linha de corte e deixe textos e logos pelo menos 3 mm para dentro. Assim nada some no corte.</span></li>
      <li><strong>Cores em CMYK</strong><span>A tela mostra luz (RGB); a impressora mistura ciano, magenta, amarelo e preto. Laranja e verde muito neon saem um pouco mais suaves no papel.</span></li>
      <li><strong>Fontes em curvas</strong><span>Converta os textos em curvas ou mande as fontes junto, senão o programa troca a letra por outra.</span></li>
      <li><strong>Não tem arte?</strong><span>A gente cria do zero ou ajeita a que você tem.</span></li>
    </ol>
    <p><a class="link-seta" href="{FORM}">Enviar meu arquivo pelo formulário</a></p>
    <p><a class="link-seta" href="design/">Quero que vocês criem a arte</a></p>
  </div></div>
</section>

<section id="portfolio" class="cin-secao cin-larga">
  <div class="painel revelar"><span class="rotulo">03</span><h2>Portfólio</h2>
    <p>Trabalhos que saíram da nossa bancada. Tem muito mais no Instagram <a href="https://instagram.com/johen_artgrafica" target="_blank" rel="noopener">@johen_artgrafica</a>.</p></div>
  <div class="cin-portfolio">{port_html}</div>
</section>

<section id="depoimentos" class="cin-secao cin-larga">
  <div class="painel cin-nota revelar"><span class="rotulo">04</span><h2>{NOTA_GOOGLE} no Google</h2>
    <p><span class="estrelas" aria-hidden="true">★★★★★</span> {TOTAL_AVALIACOES} avaliações de quem já passou pela loja.</p></div>
  <div class="cin-depos">{depo_html}</div>
  <section class="avaliar revelar" aria-labelledby="avaliar-tit">
    <img src="img/marca/ic-google.webp" alt="" width="44" height="57" loading="lazy">
    <div class="avaliar-txt"><span class="estrelas" aria-hidden="true">★★★★★</span><h2 id="avaliar-tit">Gostou do nosso trabalho?</h2><p>Sua avaliação no Google ajuda mais gente do bairro a encontrar a Johen.</p></div>
    <a class="btn btn-pri" href="{REVIEW}" target="_blank" rel="noopener">Nos avalie no Google</a>
  </section>
</section>

<section id="sobre" class="cin-secao">
  <img class="arte arte--direita" src="img/cine/sobre.webp" alt="" loading="lazy">
  <div class="cin-grade"><div class="painel revelar">
    <span class="rotulo">05</span>
    <h2>A gráfica do Jardim Selma</h2>
    <p>A Johen é gráfica rápida e loja de personalizados na zona sul de São Paulo. Atendemos o comércio do bairro, quem presta serviço e precisa de cartão e panfleto pra ontem, e quem quer dar um presente com nome, foto ou logo.</p>
    <p>Imprimimos, cortamos, estampamos e gravamos a laser aqui mesmo, e também criamos a arte quando você ainda não tem.</p>
    <dl class="fatos">
      <div><dt>Horário</dt><dd>Segunda a sábado, 11h às 20h</dd></div>
      <div><dt>Pagamento</dt><dd>Pix, dinheiro, débito e crédito</dd></div>
      <div><dt>Primeira compra</dt><dd>5% OFF</dd></div>
      <div><dt>Retirada</dt><dd>Na loja. Combine o horário pelo WhatsApp</dd></div>
    </dl>
  </div></div>
</section>

<section id="contato" class="cin-secao">
  <img class="arte arte--fundo arte--suave" src="img/cine/contato.webp" alt="" loading="lazy">
  <div class="cin-contato" style="width:100%;max-width:1240px;margin:0 auto">
    <div class="painel revelar">
      <span class="rotulo">06</span>
      <h2>Peça seu orçamento</h2>
      <p>Pelo WhatsApp a resposta é mais rápida. Se preferir, deixe seus dados aqui que a gente chama você.</p>
      <form class="cin-form" data-destino="{FORMSUBMIT}" novalidate>
        <div class="cin-campo"><label for="f-nome">Nome</label><input id="f-nome" name="nome" autocomplete="name" required></div>
        <div class="cin-campo"><label for="f-email">E-mail (opcional)</label><input id="f-email" name="email" type="email" autocomplete="email"></div>
        <div class="cin-campo"><label for="f-tel">WhatsApp</label><input id="f-tel" name="telefone" type="tel" autocomplete="tel" inputmode="tel" placeholder="(11) 90000-0000" required></div>
        <div class="cin-campo"><label for="f-prod">Produto</label><select id="f-prod" name="produto"><option value="">Escolha…</option>{opcoes_form}<option>Outro</option></select></div>
        <div class="cin-campo cin-inteiro"><label for="f-msg">O que você precisa? (quantidade, tamanho, prazo)</label><textarea id="f-msg" name="mensagem" rows="4"></textarea></div>
        <input type="text" name="_honey" class="pote" tabindex="-1" autocomplete="off" aria-hidden="true">
        <button type="submit" class="btn btn-pri cin-inteiro">Enviar</button>
        <p class="form-status cin-inteiro" role="status" aria-live="polite"></p>
      </form>
    </div>
    <div class="painel revelar">
      <h3>Onde estamos</h3>
      <p>R. Pedro Fernandes Aragão, 269<br>Jardim Selma, São Paulo - SP, 04431-160</p>
      <div class="cin-mapa"><iframe title="Mapa: Johen Arte Gráfica" src="{MAPA_EMBED}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
      <a class="link-seta" href="{ROTA}" target="_blank" rel="noopener">Traçar rota</a>
    </div>
  </div>
</section>'''
head_home = f'''<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap">
<link rel="stylesheet" href="assets/cine.css?v={VER}">
<link rel="preload" as="image" href="cine/frames/desktop/f_0001.webp">
<meta property="og:image" content="cine/frames/desktop/f_0001.webp">
'''
pagina("index.html", "Johen Arte Gráfica | Gráfica e personalizados no Jardim Selma, SP", "Cartões de visita, panfletos, banners, adesivos, camisetas e canecas personalizadas em São Paulo. Peça pelo site e acompanhe pelo WhatsApp.",
       corpo, extra_head=f'<script src="assets/cine.js?v={VER}" defer></script>', head=head_home, classe="home-cine")
print("ok")
