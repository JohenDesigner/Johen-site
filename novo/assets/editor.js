// Editor de caneca, copo térmico e camiseta: o cliente sobe a arte, posiciona na área de impressão/gravação aberta
// e vê o resultado no produto em 3D (assets/mockup3d.js).
(function () {
  const cv = document.getElementById("tela"); if (!cv) return;
  const ctx = cv.getContext("2d");
  const q = new URLSearchParams(location.search);
  const cId = q.get("c") || "canecas", pId = q.get("p") || "p1";
  // modelos: medidas da área em cm (largura x altura) vindas da descrição do produto
  const MODELOS = {
    caneca:  { tipo: "caneca", w: 20, h: 8.5, laser: false, obj: "caneca", rot: "Área de impressão", sub: "volta toda a caneca · 20 x 8,5 cm", guia: ["‹ lado da alça", "frente", "lado da alça ›"] },
    copo:    { tipo: "copo", w: 4.8, h: 12, laser: true, obj: "copo", rot: "Área de gravação a laser", sub: "frente do copo · 4,8 x 12 cm", guia: null },
    copo360: { tipo: "copo", w: 25.7, h: 12, laser: true, volta: true, obj: "copo", rot: "Área de gravação a laser", sub: "volta todo o copo (360°) · 12 cm de altura", guia: ["‹ costas", "frente", "costas ›"] },
    // camiseta DTF: estampa até 28 x 35 cm (aprox. A3) na frente; nas "Frente e Verso", também nas costas
    camiseta:  { tipo: "camiseta", w: 28, h: 35, laser: false, obj: "camiseta", rot: "Área de estampa", sub: "frente · até 28 x 35 cm", guia: null },
    // DTF Premium Frente e Verso (p8, p9, p10): regra do produto — frente até 10 cm de estampa, costas até 25 x 40 cm
    camiseta2: { tipo: "camiseta", w: 28, h: 35, laser: false, verso: true, obj: "camiseta", rot: "Área de estampa", sub: "frente até 10 cm · costas até 25 x 40 cm", guia: null,
                 limites: { frente: [10, 10, "frente · estampa até 10 cm"], costas: [25, 40, "costas · estampa até 25 x 40 cm"] } },
    // sublimação comum (poliéster): frente e verso, só em camiseta branca (a sublimação não aparece em tecido escuro)
    camisetaSub: { tipo: "camiseta", w: 28, h: 35, laser: false, verso: true, soBranca: true, obj: "camiseta", rot: "Área de estampa", sub: "até 28 x 35 cm em cada lado", guia: null },
  };
  // peças planas (banner, placa, adesivo, cartela, cartão, panfleto): a área é a própria peça.
  // Banner e itens por m² têm a medida escolhida (vem da página do produto em ?w=&h= e pode trocar aqui).
  const qm = (k, d) => Math.max(5, parseFloat(q.get(k)) || d);
  const PL = o => ({ tipo: "plano", laser: false, rot: "Área de impressão", sub: "", guia: null, ...o });
  const LONA = cId === "banners" && ["p1", "p2", "p3"].includes(pId);
  const PANF = { p1: [10, 14], p2: [10, 14], p3: [10, 14], p4: [10, 14], p5: [15, 21], p6: [15, 21], p7: [15, 21], p8: [15, 21], p9: [21, 30], p10: [21, 30] };
  const PLANO = LONA ? PL({ obj: "banner", w: qm("w", 60), h: qm("h", 40), medida: true, madeira: pId !== "p3", ilhos: pId === "p3", fosco: pId === "p2", esp: 0.05 })
    : cId === "banners" ? PL({ obj: "placa", w: qm("w", 50), h: qm("h", 50), medida: true, m2: true, esp: ["p5", "p8", "p9"].includes(pId) ? 0.2 : 0.1, fosco: ["p6", "p9"].includes(pId) })
    : cId === "adesivos" ? (["p1", "p2", "p3"].includes(pId) ? PL({ obj: "cartela", w: 21, h: 29.7, esp: 0.02, sub: pId === "p3" ? "folha adesiva inteira" : "cartela de etiquetas · arte da folha inteira" })
      : pId === "p8" ? PL({ obj: "cartela", w: 29.7, h: 42, esp: 0.02, sub: "cartela A3 · 29,7 x 42 cm" })
      : pId === "p9" ? PL({ obj: "cartela", w: 21, h: 29.7, esp: 0.02, sub: "cartela A4 · 21 x 29,7 cm" })
      : PL({ obj: "adesivo", w: qm("w", 50), h: qm("h", 50), medida: true, m2: true, esp: 0.02, espelho: pId === "p22" }))
    : cId === "cartoes" ? PL({ obj: "cartao", w: 9, h: 5, verso: pId !== "p1", cantos: ["p5", "p7"].includes(pId) ? 0.4 : 0, papel: true, esp: 0.035, sub: "cartão de visita · 9 x 5 cm" })
    : cId === "panfletos" ? PL({ obj: "panfleto", w: (PANF[pId] || [15, 21])[0], h: (PANF[pId] || [15, 21])[1], verso: ["p2", "p4", "p6", "p8", "p10"].includes(pId), papel: true, esp: 0.015,
        sub: `panfleto · ${(PANF[pId] || [15, 21]).join(" x ")} cm` })
    : null;
  const MED = !!(PLANO && PLANO.medida);
  // camisetas e térmicos que não tinham editor: reaproveitam os modelos acima
  const ESTAMPA = t => ({ frente: [t[0], t[1], t[2]], costas: [t[0], t[1], t[2]] });
  const MOD = PLANO || (cId === "camisetas" ? (
        pId === "p2" ? { tipo: "camiseta", w: 60, h: 76, desce: -6, total: true, laser: false, verso: true, soBranca: true, obj: "camiseta", rot: "Área de estampa", sub: "sublimação total · frente e costas", guia: null }
      : pId === "p6" ? { ...MODELOS.camiseta, propria: true, sub: "estampa até 10 cm", limites: ESTAMPA([10, 10, "estampa até 10 cm"]) }
      : pId === "p7" ? { ...MODELOS.camiseta, propria: true, sub: "estampa até 25 x 40 cm", limites: ESTAMPA([25, 40, "estampa até 25 x 40 cm"]) }
      : MODELOS[pId === "p1" ? "camisetaSub" : ["p8", "p9", "p10"].includes(pId) ? "camiseta2" : "camiseta"])
    : pId === "p7nt99ze" ? MODELOS.copo360
    : ["p5", "p6", "p7", "p8", "p9", "p10", "p11", "p12", "p13"].includes(pId) ? { ...MODELOS.copo, verso: true, versoOp: true, ...(["p5", "p7", "p9"].includes(pId) ? { w: 4, sub: "frente da garrafa · 4 x 12 cm" } : ["p10", "p11", "p12", "p13"].includes(pId) ? { sub: "frente da peça · 4,8 x 12 cm" } : {}),
        propria: ["p10", "p11", "p12", "p13"].includes(pId), obj: ["p5", "p7", "p9"].includes(pId) ? "garrafa" : ["p10", "p11", "p12", "p13"].includes(pId) ? "peca" : "copo" }
    : MODELOS.caneca);
  // artigo + nome de cada peça: "o banner", "seu banner", "no banner"
  const NOMES = { caneca: ["a caneca", "sua caneca", "na caneca"], copo: ["o copo", "seu copo", "no copo"], garrafa: ["a garrafa", "sua garrafa", "na garrafa"],
    peca: ["a peça", "sua peça", "na peça"], camiseta: ["a camiseta", "sua camiseta", "na camiseta"], banner: ["o banner", "seu banner", "no banner"],
    placa: ["a placa", "sua placa", "na placa"], adesivo: ["o adesivo", "seu adesivo", "no adesivo"], cartela: ["a cartela", "sua cartela", "na cartela"],
    cartao: ["o cartão", "seu cartão", "no cartão"], panfleto: ["o panfleto", "seu panfleto", "no panfleto"] }[MOD.obj];
  const corDoCorpo = MOD.tipo !== "caneca" && MOD.tipo !== "plano";              // copo e camiseta: a cor escolhida é a do produto todo
  const SEU = NOMES[1];
  const ACO = "#cfd3d6";                                   // cor do aço que aparece onde o laser grava
  // área na tela: lado maior com 1000 px, margem em volta
  const PAD = 16, A = { x: PAD, y: PAD, w: 0, h: 0 };
  let larga;
  // mede a área na proporção do produto (no banner, roda de novo quando o tamanho muda)
  function medirArea() {
    larga = MOD.w >= MOD.h;
    A.w = larga ? 1000 - PAD * 2 : Math.round((1000 - PAD * 2) * MOD.w / MOD.h); A.h = larga ? Math.round((1000 - PAD * 2) * MOD.h / MOD.w) : 1000 - PAD * 2;
    cv.width = A.w + PAD * 2; cv.height = A.h + PAD * 2;
    Object.assign(cv.style, larga ? { width: "", height: "", margin: "" } : { width: "auto", height: "min(440px, 62vh)", margin: "0 auto" });
    if (MED) document.querySelector(".ed-faixa-tit small").textContent = `tamanho ${NOMES[0].startsWith("a ") ? "da" : "do"} ${NOMES[0].slice(2)} · ${String(MOD.w).replace(".", ",")} x ${String(MOD.h).replace(".", ",")} cm`;
  }
  medirArea();
  document.querySelector(".ed-faixa-tit .rot").textContent = MOD.rot;
  if (!MED) document.querySelector(".ed-faixa-tit small").textContent = MOD.sub;
  if (MOD.tipo !== "caneca") document.getElementById("centralizar").textContent = MOD.tipo === "plano" ? "Preencher " + NOMES[0] : MOD.volta ? "Cobrir o copo todo" : "Preencher a área";
  { const t = document.querySelector('label[for="texto"]'); if (t) t.textContent = "Texto " + NOMES[2]; }
  if (MOD.tipo === "plano") document.getElementById("texto").placeholder = { cartao: "Ex.: Ana Souza · Confeitaria", panfleto: "Ex.: Inauguração sábado!", banner: "Ex.: Feliz aniversário, Ana!" }[MOD.obj] || "Ex.: Seu nome ou sua marca";
  const guia = document.querySelector(".ed-faixa-guia");
  if (MOD.guia) guia.querySelectorAll("span").forEach((el, i) => el.textContent = MOD.guia[i]); else guia.hidden = true;
  const CORES = MOD.tipo === "plano" || MOD.soBranca ? [["Branca", "#f3f3f1"]] : MOD.tipo === "camiseta" ? [["Branca", "#f3f3f1"], ["Preta", "#1d1e20"]]
    : MOD.tipo === "copo" ? [["Preto", "#1e1f21"], ["Branco", "#f4f4f2"]]
    : [["Branca", "#ffffff"], ["Vermelha", "#d6312b"], ["Preta", "#222222"], ["Azul", "#1f5fbf"], ["Verde", "#2f9e57"], ["Amarela", "#f2c230"], ["Rosa", "#ec7fb0"]];
  let produto = null, detalhe = "#ffffff", fundoCaneca = corDoCorpo ? CORES[0][1] : "#ffffff", corNome = corDoCorpo ? CORES[0][0] : "Branca";
  // gravação a laser: a imagem vira uma "máscara" em cor de aço (só uma cor, como sai de verdade)
  let gravada = null, temAlfa = false, inverter = false;
  function prepararLaser() {
    if (!img || !MOD.laser) { gravada = null; return; }
    const k = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    const x = c.getContext("2d"); x.drawImage(img, 0, 0, c.width, c.height);
    const d = x.getImageData(0, 0, c.width, c.height), px = d.data;
    let transp = 0; for (let i = 3; i < px.length; i += 4) if (px[i] < 250) transp++;
    temAlfa = transp > px.length / 4 * 0.05;
    for (let i = 0; i < px.length; i += 4) {
      const a = px[i + 3] / 255, lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
      const e = temAlfa ? a : a * Math.min(1, Math.max(0, inverter ? (lum - 0.4) / 0.2 : (0.6 - lum) / 0.2));
      px[i] = 207; px[i + 1] = 211; px[i + 2] = 214; px[i + 3] = Math.round(e * 255);
    }
    x.putImageData(d, 0, 0); gravada = c;
    document.getElementById("bloco-inverter").hidden = temAlfa;
  }
  let img = null, arquivo = null, ix = 0, iy = 0, esc = 1, texto = "", corTexto = "#1d2427";
  // várias fotos por lado: "fotos" guarda todas; img/arquivo/ix/iy/esc/gravada/temAlfa/inverter são as da foto selecionada
  let fotos = [], sel = -1;
  // adesivo de vitrine: colado por dentro do vidro, a impressão sai espelhada; "Espelhar arte" vira tudo na horizontal
  let espelhar = false;
  const meio = () => A.x + A.w / 2;
  const virar = c => { if (espelhar) { c.translate(2 * meio(), 0); c.scale(-1, 1); } };
  const VAZIA = { img: null, arquivo: null, ix: 0, iy: 0, esc: 1, gravada: null, temAlfa: false, inverter: false };
  function sincronizar() { if (sel >= 0 && fotos[sel]) fotos[sel] = { img, arquivo, ix, iy, esc, gravada, temAlfa, inverter }; }
  function selecionar(i) { sincronizar(); sel = fotos[i] ? i : -1; ({ img, arquivo, ix, iy, esc, gravada, temAlfa, inverter } = fotos[i] || VAZIA); }
  // camiseta frente e verso: cada lado guarda a própria arte; as variáveis acima são sempre as do lado aberto
  // camiseta só de um lado: LADOS tem um lado só, e o cliente escolhe se é a frente ou as costas
  const LADOS = MOD.verso ? ["frente", "costas"] : ["frente"];
  // térmicos (copo, garrafa, gravação avulsa): o verso só vale quando a opção escolhida é "Frente e Verso"
  let versoOn = !MOD.versoOp;
  const ATIVOS = () => MOD.versoOp && !versoOn ? ["frente"] : LADOS;
  const nomeLado = l => MOD.versoOp && l === "costas" ? "verso" : l;
  const est = {}; let lado = "frente";
  const guardar = () => { sincronizar(); est[lado] = { fotos, sel, texto, corTexto }; };
  const carregar = l => { const e = est[l]; sel = -1; fotos = e.fotos; texto = e.texto; corTexto = e.corTexto; lado = l; selecionar(e.sel); };
  LADOS.forEach(l => { est[l] = { fotos: [], sel: -1, texto: "", corTexto: "#1d2427" }; });
  function comLado(l, fn) { if (!l || l === lado) return fn(); const atual = lado; guardar(); carregar(l); try { return fn(); } finally { carregar(atual); } }

  // desenha só a arte (imagem + texto) dentro da área de impressão; usado também pela caneca 3D
  function pintarArte(c) {
    c.save(); c.beginPath(); c.rect(A.x, A.y, A.w, A.h); c.clip(); virar(c);
    sincronizar();
    for (const f of fotos) { const w = f.img.width * f.esc, h = f.img.height * f.esc; c.drawImage(f.gravada || f.img, A.x + A.w / 2 + f.ix - w / 2, A.y + A.h / 2 + f.iy - h / 2, w, h); }
    if (texto) {
      c.fillStyle = MOD.laser ? ACO : corTexto; c.textAlign = "center"; c.textBaseline = "middle";
      let fs = MOD.tipo === "plano" ? Math.round(Math.min(170, A.h * .26)) : MOD.tipo === "camiseta" ? 160 : 72; c.font = `600 ${fs}px Outfit, Figtree, sans-serif`;
      const Lt = MOD.limites && MOD.limites[lado], maxTxt = Math.min(A.w * (larga && MOD.w > 15 && MOD.tipo !== "plano" ? .36 : .92), Lt ? Lt[0] * A.w / MOD.w : Infinity);
      while (c.measureText(texto).width > maxTxt && fs > 24) { fs -= 2; c.font = `600 ${fs}px Outfit, Figtree, sans-serif`; }
      c.fillText(texto, A.x + A.w / 2, fotos.length ? A.y + A.h - fs * .8 : A.y + A.h / 2);
    }
    c.restore();
  }
  window.CanecaArte = {
    area: A,
    temArte: () => { guardar(); return ATIVOS().some(l => est[l].fotos.length || est[l].texto); },
    pintar: (c, l) => comLado(l, () => pintarArte(c)),
    lados: LADOS,
    ativos: () => ATIVOS(),
    cores: () => ({ corpo: fundoCaneca, detalhe }),
    nome: () => produto ? produto.nome : MOD.obj,
    modelo: MOD,
  };

  function desenhar(final) {
    if (img && MOD.limites) limitar();
    document.dispatchEvent(new Event("caneca-mudou"));
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = fundoCaneca; ctx.fillRect(A.x, A.y, A.w, A.h);
    pintarArte(ctx);
    if (final) return;
    ctx.save();
    // guias: linha da frente (centro) e terços que ficam nas laterais
    ctx.strokeStyle = "rgba(29,36,39,.22)"; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(A.x + A.w / 2, A.y + 8); ctx.lineTo(A.x + A.w / 2, A.y + A.h - 8); ctx.stroke();
    ctx.setLineDash([12, 9]); ctx.lineWidth = 3; ctx.strokeStyle = "#1d2427"; ctx.strokeRect(A.x, A.y, A.w, A.h);
    // com mais de uma foto, a selecionada ganha contorno laranja (é ela que mexe ao arrastar)
    if (img && fotos.length > 1) {
      const w = img.width * esc, h = img.height * esc; virar(ctx);
      ctx.setLineDash([10, 7]); ctx.lineWidth = 4; ctx.strokeStyle = "#E8650A";
      ctx.strokeRect(A.x + A.w / 2 + ix - w / 2, A.y + A.h / 2 + iy - h / 2, w, h);
    }
    if (!fotos.length && !texto) {
      ctx.fillStyle = "#4f5b60"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "600 34px Figtree, sans-serif"; ctx.fillText("Sua arte aqui", A.x + A.w / 2, A.y + A.h / 2 - 22);
      ctx.font = "26px Figtree, sans-serif"; ctx.fillText("toque em + para adicionar", A.x + A.w / 2, A.y + A.h / 2 + 22);
    }
    ctx.restore();
    salvarDepois();
  }
  const zoom = document.getElementById("zoom");
  // imagem larga (como a da caneca toda) cobre a área; imagem quadrada/alta fica na frente, na altura toda.
  // Na área estreita do copo, a imagem cabe inteira na largura.
  const escCobrir = () => img ? Math.max(A.w / img.width, A.h / img.height) : 1;
  // tamanho máximo da estampa no lado aberto (camiseta DTF frente e verso: frente até 10 cm, costas até 25 x 40 cm)
  const escMax = () => { const L = MOD.limites && MOD.limites[lado]; if (!L || !img) return Infinity;
    const k = A.w / MOD.w; return Math.min(L[0] * k / img.width, Math.min(L[1], MOD.h) * k / img.height); };
  const escPadrao = () => Math.min(escMax(), !img ? 1 : !larga || MOD.tipo === "plano" ? Math.min(A.w / img.width, A.h / img.height)
    : (img.width / img.height >= 1.8 ? escCobrir() : A.h / img.height));
  let avisouLimite = false;
  function limitar() { const m = escMax(); if (esc <= m * 1.001) return; esc = m; zoom.value = 100;
    if (!avisouLimite && pronto) { avisouLimite = true; toast(`Tamanho máximo: ${MOD.limites[lado][2].replace(" · ", ": ")}.`); } }
  function encaixar(cobrir) { if (!img) return; esc = cobrir ? escCobrir() : escPadrao(); ix = iy = 0; zoom.value = Math.round(esc / escPadrao() * 100); }

  // arrastar e pinça na área de impressão
  const pts = new Map(); let base = null;
  const ponto = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
  function fotoNoPonto(p) {
    sincronizar(); if (espelhar) p = { x: 2 * meio() - p.x, y: p.y };
    for (let i = fotos.length - 1; i >= 0; i--) {
      const f = fotos[i], w = f.img.width * f.esc, h = f.img.height * f.esc;
      if (Math.abs(p.x - (A.x + A.w / 2 + f.ix)) <= w / 2 && Math.abs(p.y - (A.y + A.h / 2 + f.iy)) <= h / 2) return i;
    }
    return -1;
  }
  cv.addEventListener("pointerdown", e => {
    if (!fotos.length) return;
    if (!pts.size) { const i = fotoNoPonto(ponto(e)); if (i >= 0 && i !== sel) { selecionar(i); mostrarAjustes(); desenhar(); } }
    if (!img) return; cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, ponto(e)); base = null;
  });
  cv.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId)) return; const p = ponto(e), ant = pts.get(e.pointerId);
    if (pts.size === 1) { ix += (espelhar ? -1 : 1) * (p.x - ant.x); iy += p.y - ant.y; }
    pts.set(e.pointerId, p);
    if (pts.size === 2) {
      const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (base) { esc *= d / base; zoom.value = Math.round(esc / escPadrao() * 100); }
      base = d;
    }
    desenhar();
  });
  ["pointerup", "pointercancel"].forEach(t => cv.addEventListener(t, e => { pts.delete(e.pointerId); base = null; }));
  zoom.addEventListener("input", () => { esc = escPadrao() * zoom.value / 100; desenhar(); });

  // adicionar imagem / texto
  const inp = document.getElementById("arquivo");
  inp.addEventListener("change", () => {
    const f = inp.files[0]; if (!f) return;
    if (!f.type.startsWith("image/")) { toast("Esse arquivo não é uma imagem. Use JPG ou PNG."); return; }
    inp.value = "";                       // deixa escolher a mesma foto de novo
    const im = new Image();
    im.onload = () => {
      // cada foto nova entra como mais uma, sem apagar as que já estão
      sincronizar(); const outras = fotos.length;
      fotos.push({ ...VAZIA, img: im, arquivo: f }); sel = -1; selecionar(fotos.length - 1);
      prepararLaser(); encaixar(false);
      if (outras) {                         // espalha as fotos pra não cair uma em cima da outra
        if (larga) { ix = [0, .3, -.3, .15, -.15][outras % 5] * A.w; esc *= .9; }
        else { esc *= .6; iy = (outras % 2 ? .22 : -.22) * A.h; }
        zoom.value = Math.round(esc / escPadrao() * 100);
      }
      desenhar(); mostrarAjustes(); fecharMais();
      if (outras) toast("Foto adicionada. Toque numa foto pra mexer nela.");
      // ~150 dpi: pelo menos 60 pixels da imagem por cm da área
      document.getElementById("qualidade").hidden = (1 / esc) * (A.w / MOD.w) >= (MED ? 12 : 60); };  // banner é visto de longe: ~30 dpi basta
    im.onerror = () => toast("Não deu pra abrir essa imagem. Tente outra em JPG ou PNG.");
    im.src = URL.createObjectURL(f);
  });
  function mostrarAjustes() {
    document.getElementById("ajustes").hidden = !img;
    if (img) zoom.value = Math.round(esc / escPadrao() * 100);
    document.getElementById("inverter").checked = inverter;
    if (MOD.laser && img) document.getElementById("bloco-inverter").hidden = temAlfa;
    const n = document.getElementById("fotos-dica"); if (n) n.hidden = fotos.length < 2;
  }
  document.getElementById("remover-foto").addEventListener("click", () => {
    if (sel < 0) return; fotos.splice(sel, 1); sel = -1; selecionar(fotos.length - 1);
    document.getElementById("qualidade").hidden = true; mostrarAjustes(); desenhar();
  });
  const campoTxt = document.getElementById("texto");
  campoTxt.addEventListener("input", () => { texto = campoTxt.value.trim(); desenhar(); });
  document.getElementById("cor-texto").addEventListener("input", e => { corTexto = e.target.value; desenhar(); });
  if (MOD.laser) document.getElementById("cor-texto").closest("div").querySelectorAll('[for="cor-texto"],#cor-texto').forEach(el => el.hidden = true);
  document.getElementById("inverter").addEventListener("change", e => { inverter = e.target.checked; prepararLaser(); desenhar(); });
  document.getElementById("centralizar").addEventListener("click", () => {
    if (!img) { toast("Primeiro toque em Adicionar arte e envie sua imagem."); mais.hidden = false; return; }
    encaixar(true); desenhar();
  });
  const mais = document.getElementById("mais-opcoes");
  document.getElementById("btn-mais").addEventListener("click", () => { mais.hidden = !mais.hidden; });
  function fecharMais() { mais.hidden = true; }
  document.getElementById("add-txt").addEventListener("click", () => { fecharMais(); document.getElementById("bloco-texto").hidden = false; campoTxt.focus(); });

  // adesivo de vitrine: aviso + botão "Espelhar arte" (a prévia, a arte posicionada e o PNG saem espelhados, como vão ser impressos)
  const btEsp = document.getElementById("espelhar");
  function marcarEspelho(on) {
    espelhar = on; btEsp.setAttribute("aria-pressed", on); btEsp.textContent = on ? "Desfazer espelho" : "Espelhar arte";
    document.getElementById("espelho-txt").innerHTML = on
      ? "Pronto: a arte está espelhada, do jeito que vai ser impressa. Colada por dentro do vidro, ela fica certa pra quem olha de fora."
      : "Este adesivo é colado por dentro do vidro, então a impressão sai espelhada (invertida) pra ler certo de fora. Se a sua arte ainda não está espelhada, toque em <b>Espelhar arte</b>.";
  }
  if (MOD.espelho) {
    document.getElementById("bloco-espelho").hidden = false;
    btEsp.addEventListener("click", () => { marcarEspelho(!espelhar); desenhar(); });
  }

  // revisar
  const barraEd = document.getElementById("barra-editar"), barraRev = document.getElementById("barra-revisar");
  const painel = document.getElementById("painel");
  document.getElementById("revisar").addEventListener("click", () => {
    if (!window.CanecaArte.temArte()) { toast("Adicione uma imagem ou um texto antes de revisar."); return; }
    desenhar(true); barraEd.hidden = true; barraRev.hidden = false; painel.hidden = true;
    document.getElementById("palco3d").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.getElementById("voltar").addEventListener("click", () => { desenhar(); barraEd.hidden = false; barraRev.hidden = true; painel.hidden = false; });

  const cx = document.getElementById("caixinha");
  // opção do produto (ex.: copo "Gravação 1 lado" / "Frente e Verso"): vem da página do produto (?o=) e pode trocar aqui
  let opIdx = MED && q.get("o") === "livre" ? 0 : Math.max(0, parseInt(q.get("o"), 10) || 0);
  const opcao = () => produto && produto.opcoes.length > 1 ? produto.opcoes[Math.min(opIdx, produto.opcoes.length - 1)] : null;
  // banner com "Outro tamanho": medida × preço do m², nunca abaixo do mínimo (mesma conta da página do produto)
  let medLivre = MED && (!!MOD.m2 || q.get("o") === "livre");   // por m²: sempre largura × altura
  const precoLivre = () => Math.max(produto.minimo || 0, Math.round(MOD.w * MOD.h / 10000 * produto.m2livre * 100) / 100);
  const precoUn = () => !produto ? 0 : MOD.m2 && produto.m2 ? Math.round(MOD.w * MOD.h / 10000 * produto.m2 * 100) / 100
    : MED && medLivre && produto.m2livre ? precoLivre() : (opcao() || produto.opcoes[0]).preco + (cx.checked ? produto.caixinha || 0 : 0);
  // por m² (placa, adesivo): o pedido mínimo vale pro total, igual à página do produto
  let POR_UN = false, QN;
  const precoTotal = () => { const t = precoUn() * qtd; return MOD.m2 && produto && t > 0 && t < (produto.minimo || 0) ? produto.minimo : t; };
  const medidaTxt = () => MOD.m2 ? `${MOD.w} × ${MOD.h} cm` : medLivre ? `${MOD.w} × ${MOD.h} cm (tamanho personalizado)` : opcao() ? opcao().label : `${MOD.w}×${MOD.h}cm`;
  const totalEl = document.getElementById("total");
  // quantas peças iguais: vem da página do produto (?q=) e pode mudar aqui; vai junto pro pedido
  let qtd = Math.max(1, parseInt(q.get("q"), 10) || 1);
  const qtdEl = document.getElementById("ed-qtd"), unEl = document.getElementById("total-un");
  const atualizarPreco = () => { totalEl.textContent = brl(precoTotal()); if (qtdEl) qtdEl.textContent = qtd;
    if (unEl) unEl.textContent = qtd > 1 && Math.abs(precoTotal() - precoUn() * qtd) < 0.01 ? `(${brl(precoUn())} cada)` : ""; };
  const mudarQtd = n => { if (POR_UN) return; qtd = Math.max(1, n); atualizarPreco(); salvarDepois();
    // recarregar a página mantém a quantidade escolhida aqui (e não a que veio do produto)
    try { const u = new URL(location.href); qtd > 1 ? u.searchParams.set("q", qtd) : u.searchParams.delete("q"); history.replaceState(history.state, "", u); } catch (err) {} };
  document.getElementById("ed-menos")?.addEventListener("click", () => mudarQtd(qtd - 1));
  document.getElementById("ed-mais")?.addEventListener("click", () => mudarQtd(qtd + 1));
  cx.addEventListener("change", atualizarPreco);
  const descricao = () => { guardar();
    const comArte = ATIVOS().filter(l => est[l].fotos.length || est[l].texto);
    const nFotos = ATIVOS().reduce((n, l) => n + est[l].fotos.length, 0);
    const gemeo = (catalogo?.[cId] || []).some(o => o.id !== produto.id && o.nome.trim() === produto.nome.trim());  // dois produtos com o mesmo nome: o acabamento diz qual é
    if (MOD.tipo === "plano") return [MED ? medidaTxt() : opcao() ? opcao().label : "", MOD.espelho ? (espelhar ? "arte espelhada no site" : "arte enviada já espelhada") : "", MOD.verso ? (comArte.length > 1 ? "arte na frente e no verso" : comArte[0] === "costas" ? "arte só no verso" : "arte só na frente") : "",  ...LADOS.map(l => est[l].texto ? `texto: "${est[l].texto}"` : ""), nFotos > Math.max(1, comArte.length) ? `${nFotos} fotos` : ""].filter(Boolean).join(" · ");
    return `${gemeo && produto.acab ? produto.acab.trim() + " · " : ""}${opcao() ? opcao().label.replace(/\s*\(\+R\$\s*\d+\)/, "") + " · " : ""}${MOD.propria ? "na peça do cliente" : "Cor: " + corNome}${cx.checked ? " · caixinha personalizada" : ""}${MOD.versoOp ? (versoOn ? (comArte.length > 1 ? " · arte na frente e no verso" : comArte[0] === "costas" ? " · arte só no verso" : " · arte só na frente") : "") : MOD.verso ? ` · estampa: ${comArte.join(" e ")}` : MOD.tipo === "camiseta" ? ` · estampa ${lado === "costas" ? "nas costas" : "na frente"}` : ""}${ATIVOS().map(l => est[l].texto ? ` · texto${ATIVOS().length > 1 ? " (" + nomeLado(l) + ")" : ""}: "${est[l].texto}"` : "").join("")}${nFotos > comArte.length ? ` · ${nFotos} fotos` : ""}`; };

  // foto da caneca 3D (se o aparelho abriu o 3D); senão, a faixa da área de impressão
  async function previa(tam, l) {
    if (window.Caneca3D) { try { return await window.Caneca3D.foto(tam, l); } catch (e) { } }
    return await comLado(l, () => { desenhar(true); return new Promise(r => cv.toBlob(r, "image/png")); });
  }
  // frente e verso (camiseta, cartão, térmico) com arte nos dois lados: uma prévia de cada lado (senão a das costas some)
  const ladosPrevia = () => { guardar(); const c = ATIVOS().filter(l => est[l].fotos.length || est[l].texto); return MOD.verso && c.length ? c : [null]; };   // um lado só com arte: a prévia vira pra ele (senão sai o lado vazio)
  const paraURL = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
  // Comprar: coloca no pedido com a prévia e abre a página do pedido
  // enquanto a prévia é preparada, os botões travam e dizem "Preparando…": tocar de novo não põe o mesmo item duas vezes no pedido
  let comprando = false, avisouVerso = false, avisouEspelho = false;
  const btsComprar = () => ["comprar", "add-pedido"].map(id => document.getElementById(id)).filter(Boolean);
  const travarComprar = on => btsComprar().forEach(b => {
    if (on) { b.dataset.rot = b.textContent; b.textContent = "Preparando…"; } else if (b.dataset.rot) b.textContent = b.dataset.rot;
    b.disabled = on; b.setAttribute("aria-busy", on); });
  addEventListener("pageshow", () => { if (comprando) { comprando = false; travarComprar(false); } });   // voltou do pedido pelo botão de voltar
  // ---- arquivos pro Johen: com a pasta do Google Drive ligada (build.py: ARQUIVOS_DRIVE), o Comprar manda a foto original,
  // a arte posicionada em alta (PNG transparente, só a área de impressão) e a prévia 3D de cada lado pra uma pasta com o código do pedido
  const DRIVE = document.documentElement.dataset.arquivos || "";
  const novoCodigo = () => { const d = new Date(), z = n => String(n).padStart(2, "0");
    return `J${String(d.getFullYear()).slice(2)}${z(d.getMonth() + 1)}${z(d.getDate())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; };
  const base64 = b => paraURL(b).then(u => u.slice(u.indexOf(",") + 1));
  // arte só da área de impressão, ~300 dpi na medida real (entre 1500 e 6000 px no lado maior), fundo transparente
  function arteAlta(l) {
    const px = Math.max(1500, Math.min(6000, Math.round(Math.max(MOD.w, MOD.h) / 2.54 * 300))), k = px / Math.max(A.w, A.h);
    const c = document.createElement("canvas"); c.width = Math.round(A.w * k); c.height = Math.round(A.h * k);
    const x = c.getContext("2d"); x.scale(k, k); x.translate(-A.x, -A.y);
    comLado(l, () => pintarArte(x));
    return new Promise(r => c.toBlob(r, "image/png"));
  }
  async function enviarArquivos(codigo, desc) {
    guardar();
    const arqs = [], nomeL = l => ATIVOS().length > 1 || MOD.tipo === "camiseta" ? "-" + nomeLado(l) : "";
    const add = async (nome, blob) => blob && arqs.push({ nome, tipo: blob.type || "application/octet-stream", dados: await base64(blob) });
    for (const l of ATIVOS()) {
      if (!est[l].fotos.length && !est[l].texto) continue;
      let n = 0;
      for (const f of est[l].fotos) if (f.arquivo) { n++; const ext = (f.arquivo.name || "").match(/\.\w+$/)?.[0] || ".jpg"; await add(`original${nomeL(l)}-${n}${ext}`, f.arquivo); }
      await add(`arte-posicionada${nomeL(l)}.png`, await arteAlta(l));
    }
    for (const l of ladosPrevia()) await add(`previa${l ? nomeL(l) : ""}.png`, await previa(1080, l));
    const corpo = JSON.stringify({ codigo, produto: nomeItem({ c: cId, nome: produto.nome }), desc, qtd: qtdTxt(qtd, QN), total: brl(precoTotal()),
      textos: ATIVOS().map(l => est[l].texto ? `${nomeLado(l)}: ${est[l].texto}` : "").filter(Boolean), arquivos: arqs });
    // Apps Script não responde com CORS: "no-cors" envia igual (a resposta não dá pra ler); 60 s no máximo
    await Promise.race([fetch(DRIVE, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: corpo }),
      new Promise((_, erro) => setTimeout(() => erro(new Error("tempo")), 60000))]);
  }
  async function comprar() {
    if (comprando) return;
    if (!window.CanecaArte.temArte()) { toast("Adicione uma imagem ou um texto antes de comprar."); return; }
    if (!produto) return;
    if (MOD.versoOp && versoOn && !avisouVerso) { guardar(); const f = ATIVOS().filter(l => est[l].fotos.length || est[l].texto);
      if (f.length < 2) { avisouVerso = true; toast(`Você escolheu Frente e Verso, mas só tem arte ${f[0] === "costas" ? "no verso" : "na frente"}. Toque em ${f[0] === "costas" ? "Frente" : "Verso"} pra pôr a outra, ou em Comprar de novo pra seguir assim.`); return; } }
    if (MOD.espelho && !espelhar && !avisouEspelho) { avisouEspelho = true;
      toast("Adesivo de vitrine sai espelhado. Se a sua arte ainda não está espelhada, toque em Espelhar arte. Se já está, toque em Comprar de novo."); document.getElementById("bloco-espelho").scrollIntoView({ block: "center" }); return; }
    comprando = true; travarComprar(true);
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));   // mostra o "Preparando…" antes do trabalho pesado
    try {
      const artes = [];
      for (const l of ladosPrevia()) artes.push(await paraURL(await previa(260, l)));
      // manda os arquivos pro Drive do Johen; se falhar (sem internet, demorou), o pedido segue e o WhatsApp pede as artes como antes
      let cod;
      if (DRIVE) { const c = novoCodigo(); btsComprar().forEach(b => b.textContent = "Enviando sua arte…");
        try { await enviarArquivos(c, descricao()); cod = c; } catch (e) { } }
      Pedido.add({ c: cId, id: pId, nome: produto.nome, img: produto.img, arte: artes[0], artes: artes.length > 1 ? artes : undefined, desc: descricao(), qtd, qn: QN, total: precoTotal(), cod });
      await apagarSalvo();
      location.href = ROOT + "pedido/";
    } catch (e) { comprando = false; travarComprar(false); toast("Não deu pra preparar a prévia. Tente de novo."); }
  }
  document.getElementById("add-pedido").addEventListener("click", comprar);
  document.getElementById("comprar").addEventListener("click", comprar);
  document.getElementById("enviar-arte").addEventListener("click", async () => {
    const msg = `Olá! Montei ${SEU.replace("sua", "minha").replace("seu", "meu")} no site:\n• ${nomeItem({ c: cId, nome: produto.nome })}\n• ${descricao()}${qtd > 1 ? `\n• Quantidade: ${qtdTxt(qtd, QN)}` : ""}\n• Valor: ${brl(precoTotal())}\n\nSegue a prévia, a arte posicionada e a arte original.`;
    const files = [];
    for (const l of ladosPrevia()) files.push(new File([await previa(1080, l)], `previa-${MOD.obj}${l ? "-" + l : ""}.png`, { type: "image/png" }));
    const prev = files[0]; guardar();
    for (const l of ATIVOS()) {
      if (!est[l].fotos.length && !est[l].texto) continue;
      const blob = await comLado(l, () => { desenhar(true); return new Promise(r => cv.toBlob(r, "image/png")); });
      files.push(new File([blob], `arte-posicionada-${MOD.obj}${MOD.tipo === "camiseta" || ATIVOS().length > 1 ? "-" + nomeLado(l) : ""}.png`, { type: "image/png" }));
      est[l].fotos.forEach(f => f.arquivo && files.push(f.arquivo));
    }
    desenhar(true);
    if (navigator.canShare && navigator.canShare({ files })) {
      try { await navigator.share({ files, text: msg }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(prev); a.download = prev.name; a.click();
    toast("Prévia baixada. Anexe ela e sua arte na conversa do WhatsApp.");
    setTimeout(() => location.href = wppLink(msg), 1200);
  });

  // camiseta frente e verso: abas Frente / Costas trocam o lado que está sendo editado e viram a camiseta 3D
  const abas = document.getElementById("lados");
  if (abas && MOD.verso) {
    abas.hidden = false;
    abas.addEventListener("click", e => {
      const b = e.target.closest("[data-l]"); if (!b || b.dataset.l === lado) return;
      guardar(); carregar(b.dataset.l);
      abas.querySelectorAll("[data-l]").forEach(x => x.setAttribute("aria-selected", x === b));
      campoTxt.value = texto; document.getElementById("cor-texto").value = corTexto;
      document.getElementById("bloco-texto").hidden = !texto;
      document.getElementById("qualidade").hidden = true; mostrarAjustes();
      document.querySelector(".ed-faixa-tit small").textContent = MOD.versoOp ? MOD.sub.replace(/^frente/, nomeLado(lado)) : MOD.limites ? MOD.limites[lado][2] : MOD.total ? `${lado} · camiseta inteira` : MOD.tipo === "plano" ? `${lado === "costas" ? "verso" : "frente"} · ${MOD.sub}` : `${lado} · até ${MOD.w} x ${MOD.h} cm`;
      document.dispatchEvent(new CustomEvent("mockup-lado", { detail: lado }));
      desenhar();
    });
    document.querySelector(".ed-faixa-tit small").textContent = MOD.versoOp ? MOD.sub : MOD.limites ? MOD.limites.frente[2] : MOD.total ? "frente · camiseta inteira" : MOD.tipo === "plano" ? `frente · ${MOD.sub}` : `frente · até ${MOD.w} x ${MOD.h} cm`;
    if (MOD.tipo === "plano" || MOD.versoOp) { abas.setAttribute("aria-label", "Lado"); abas.querySelector('[data-l="costas"]').textContent = "Verso"; }
  } else if (abas && MOD.tipo === "camiseta") {
    // camiseta de um lado só: o cliente escolhe onde vai a estampa; a mesma arte muda de lado
    abas.hidden = false; abas.setAttribute("aria-label", "Onde vai a estampa");
    abas.querySelector('[data-l="frente"]').textContent = "Estampa na frente";
    abas.querySelector('[data-l="costas"]').textContent = "Estampa nas costas";
    abas.addEventListener("click", e => {
      const b = e.target.closest("[data-l]"); if (!b || b.dataset.l === lado) return;
      guardar(); est[b.dataset.l] = est[lado]; delete est[lado]; LADOS.splice(0, 1, b.dataset.l); lado = b.dataset.l;
      abas.querySelectorAll("[data-l]").forEach(x => x.setAttribute("aria-selected", x === b));
      document.querySelector(".ed-faixa-tit small").textContent = MOD.limites ? `${lado === "costas" ? "costas" : "frente"} · ${MOD.limites[lado][2]}` : `${lado === "costas" ? "costas" : "frente"} · até ${MOD.w} x ${MOD.h} cm`;
      document.dispatchEvent(new CustomEvent("mockup-lado", { detail: lado }));
      desenhar();
    });
  }

  // ---- banner: tamanho pronto ou "Outro tamanho" (largura × altura), igual à página do produto
  function mudarMedida(w, h) {
    if (!MED || !(w >= 5 && h >= 10) || (w === MOD.w && h === MOD.h)) return;
    guardar(); const ow = A.w, oh = A.h; MOD.w = w; MOD.h = h; medirArea();
    const kx = A.w / ow, ky = A.h / oh, k = Math.min(kx, ky);       // a arte acompanha a nova proporção
    for (const l of LADOS) for (const f of est[l].fotos) { f.ix *= kx; f.iy *= ky; f.esc *= k; }
    carregar(lado); mostrarAjustes();
    document.dispatchEvent(new Event("banner-medida")); desenhar();
  }
  function lembrarTamanho() {   // recarregar a página mantém o tamanho escolhido aqui
    try { const u = new URL(location.href); u.searchParams.set("o", medLivre ? "livre" : opIdx); u.searchParams.set("w", MOD.w); u.searchParams.set("h", MOD.h); history.replaceState(history.state, "", u); } catch (err) {}
  }
  const medidaDoRotulo = i => (produto.opcoes[i].label.match(/(\d+)×(\d+)/) || []).slice(1).map(Number);
  function definirTamanho(o, w, h) {
    const bloco = document.getElementById("ed-tam"); if (!bloco) return;
    medLivre = !!MOD.m2 || (o === "livre" && !!produto.m2livre);
    if (!medLivre) { opIdx = Math.min(Math.max(0, parseInt(o, 10) || 0), produto.opcoes.length - 1); [w, h] = medidaDoRotulo(opIdx); }
    bloco.querySelectorAll("[data-m]").forEach(x => x.setAttribute("aria-pressed", (x.dataset.m === "livre") === medLivre));
    const so = document.getElementById("ed-opcao"); if (so) { so.selectedIndex = opIdx; so.hidden = medLivre; }
    document.getElementById("ed-livre").hidden = document.getElementById("ed-livre-info").hidden = !medLivre;
    if (medLivre) { document.getElementById("ed-larg").value = w; document.getElementById("ed-alt").value = h; }
    mudarMedida(w, h); atualizarPreco(); lembrarTamanho(); salvarDepois();
  }
  function montarTamanho() {
    const bloco = document.createElement("div"); bloco.className = "campo"; bloco.id = "ed-tam";
    const rotT = `Tamanho ${NOMES[0].startsWith("a ") ? "da" : "do"} ${NOMES[0].slice(2)}`;
    bloco.innerHTML = MOD.m2 ? `<span class="rot">${rotT}</span>
      <div id="ed-livre" class="dupla"><div><label for="ed-larg">Largura (cm)</label><input id="ed-larg" type="number" inputmode="decimal" min="5" value="${MOD.w}"></div><div><label for="ed-alt">Altura (cm)</label><input id="ed-alt" type="number" inputmode="decimal" min="5" value="${MOD.h}"></div></div>
      <small id="ed-livre-info">${brl(produto.m2 || 0)} o m². Pedido mínimo ${brl(produto.minimo || 0)}.</small>` : `<label for="ed-opcao">${rotT}</label>
      ${produto.m2livre ? '<div class="tam-modo" role="group" aria-label="Tipo de tamanho"><button type="button" data-m="pronto" aria-pressed="true">Tamanho pronto</button><button type="button" data-m="livre" aria-pressed="false">Outro tamanho</button></div>' : ""}
      <select id="ed-opcao">${produto.opcoes.map(o => `<option>${o.label} — ${brl(o.preco)}</option>`).join("")}</select>
      <div id="ed-livre" class="dupla" hidden><div><label for="ed-larg">Largura (cm)</label><input id="ed-larg" type="number" inputmode="decimal" min="10" value="${MOD.w}"></div><div><label for="ed-alt">Altura (cm)</label><input id="ed-alt" type="number" inputmode="decimal" min="10" value="${MOD.h}"></div></div>
      ${produto.m2livre ? `<small id="ed-livre-info" hidden>${brl(produto.m2livre)} o m². Banner pequeno paga o mínimo de ${brl(produto.minimo || 0)}.</small>` : '<small id="ed-livre-info" hidden></small>'}`;
    (painel.querySelector(".campo-qtd") || painel.querySelector(".total")).before(bloco);   // tamanho antes da quantidade
    bloco.querySelector("select")?.addEventListener("change", e => definirTamanho(e.target.selectedIndex));
    bloco.addEventListener("click", e => { const b = e.target.closest("[data-m]"); if (!b) return;
      if (b.dataset.m === "livre") { definirTamanho("livre", MOD.w, MOD.h); document.getElementById("ed-larg").focus(); } else definirTamanho(opIdx); });
    let tm; const digitou = () => { clearTimeout(tm); tm = setTimeout(() => {
      const w = parseFloat(document.getElementById("ed-larg").value), h = parseFloat(document.getElementById("ed-alt").value);
      if (w >= 5 && h >= 5) { mudarMedida(w, h); atualizarPreco(); lembrarTamanho(); salvarDepois(); } }, 350); };
    ["ed-larg", "ed-alt"].forEach(id => document.getElementById(id).addEventListener("input", digitou));
    definirTamanho(q.get("o") === "livre" ? "livre" : opIdx, MOD.w, MOD.h);
  }

  // ---- salvar o que o cliente montou (IndexedDB): recarregar a página não perde a arte
  const CHAVE = `editor:${cId}:${pId}`;
  let pronto = false, tmSalvar;
  function banco() { return new Promise((ok, erro) => { const r = indexedDB.open("johen-editor", 1); r.onupgradeneeded = () => r.result.createObjectStore("montagens"); r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error); }); }
  async function op(modo, fn) { const db = await banco(); return new Promise((ok, erro) => { const t = db.transaction("montagens", modo); const r = fn(t.objectStore("montagens")); t.oncomplete = () => ok(r && r.result); t.onerror = () => erro(t.error); }); }
  function salvarDepois() {
    if (!pronto) return; clearTimeout(tmSalvar);
    tmSalvar = setTimeout(() => {
      guardar();
      const lados = {}; for (const l of LADOS) lados[l] = { sel: est[l].sel, texto: est[l].texto, corTexto: est[l].corTexto, fotos: est[l].fotos.map(f => ({ arquivo: f.arquivo, ix: f.ix, iy: f.iy, esc: f.esc, inverter: f.inverter })) };
      op("readwrite", s => s.put({ lados, ordem: [...LADOS], lado, corNome, espelhar, cx: cx.checked, op: opIdx, qtd, area: { w: A.w, h: A.h }, med: MED ? { w: MOD.w, h: MOD.h, livre: medLivre } : undefined }, CHAVE)).catch(() => {});
    }, 400);
  }
  function apagarSalvo() { return op("readwrite", s => s.delete(CHAVE)).catch(() => {}); }
  async function restaurar() {
    let m; try { m = await op("readonly", s => s.get(CHAVE)); } catch (e) { return; }
    if (!m || !m.lados) return;
    const abrir = a => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = URL.createObjectURL(a); });
    if (MED && m.med && !q.has("w")) definirTamanho(m.med.livre ? "livre" : m.op || 0, m.med.w, m.med.h);
    // fotos salvas noutra medida de área (banner trocou de tamanho): reposiciona na proporção
    const kx = m.area ? A.w / m.area.w : 1, ky = m.area ? A.h / m.area.h : 1, kk = Math.min(kx, ky);
    if (!MOD.verso && m.ordem && m.ordem[0] !== LADOS[0]) abas.querySelector(`[data-l="${m.ordem[0]}"]`)?.click();
    for (const l of LADOS) {
      const s = m.lados[l] || m.lados[Object.keys(m.lados)[0]]; if (!s) continue;
      sel = -1; fotos = []; texto = s.texto || ""; corTexto = s.corTexto || "#1d2427"; lado = l;
      for (const f of s.fotos) { const im = await abrir(f.arquivo); if (!im) continue; sincronizar(); fotos.push({ ...VAZIA, ...f, ix: f.ix * kx, iy: f.iy * ky, esc: f.esc * kk, img: im }); sel = -1; selecionar(fotos.length - 1); prepararLaser(); sincronizar(); }
      sel = -1; selecionar(Math.min(s.sel, fotos.length - 1)); guardar();
    }
    carregar(MOD.verso && m.lado && est[m.lado] ? m.lado : LADOS[0]);
    if (MOD.espelho && m.espelhar) marcarEspelho(true);
    if (MOD.verso && lado !== "frente") { abas.querySelectorAll("[data-l]").forEach(x => x.setAttribute("aria-selected", x.dataset.l === lado)); document.dispatchEvent(new CustomEvent("mockup-lado", { detail: lado })); }
    campoTxt.value = texto; document.getElementById("cor-texto").value = corTexto; document.getElementById("bloco-texto").hidden = !texto;
    if (m.cx && !cx.closest("label").hidden) { cx.checked = true; atualizarPreco(); }
    if (!MED && !q.has("o") && m.op && opcao()) { opIdx = m.op; const so = document.getElementById("ed-opcao"); if (so) so.selectedIndex = Math.min(opIdx, so.options.length - 1); atualizarPreco(); }
    if (!POR_UN && !q.has("q") && m.qtd > 1) mudarQtd(m.qtd);
    ajustarVerso();
    const b = document.querySelector(`#cores .cor[data-n="${m.corNome}"]`); if (b) b.click();
    mostrarAjustes(); desenhar();
    if (fotos.length || texto) toast("Sua arte foi recuperada.");
  }

  // térmicos: abas Frente / Verso só aparecem com a opção "Frente e Verso"; voltou pra 1 lado, volta pra frente (a arte do verso fica guardada)
  function ajustarVerso() {
    if (!MOD.versoOp || !abas) return;
    versoOn = /verso/i.test((opcao() || {}).label || "");
    abas.hidden = !versoOn;
    if (!versoOn && lado === "costas") abas.querySelector('[data-l="frente"]').click();
    desenhar();
  }

  // carregar produto
  carregarCatalogo().then(cat => {
    produto = (cat[cId] || []).find(p => p.id === pId) || cat.canecas[0];
    const CAT = { camisetas: "Camisetas", banners: "Banners e Placas", adesivos: "Adesivos e Etiquetas", cartoes: "Cartões de Visita", panfletos: "Panfletos" }[cId];
    if (CAT) {                             // migalha e menu apontam para a categoria certa
      const m = document.getElementById("migalha-cat"); if (m) { m.textContent = CAT; m.href = ROOT + cId + "/"; }
      document.querySelectorAll(".nav-cat a").forEach(a => { const s = new URL(a.href).pathname.replace(/\/$/, "").split("/").pop(); a.toggleAttribute("aria-current", s === cId); if (s === cId) a.setAttribute("aria-current", "page"); });
    }
    document.getElementById("nome-produto").textContent = produto.nome;
    document.title = "Personalizar: " + produto.nome + " | Johen Arte Gráfica";
    if (!produto.caixinha) cx.closest("label").hidden = true; else if (q.get("cx") === "1") cx.checked = true;
    // cartão/panfleto: a quantidade já vem na opção ("500 un."), então some o + e −; cartela/estampa: "Quantas cartelas?"
    POR_UN = produto.opcoes.length > 1 && produto.opcoes[0].label.includes(" un.");
    const un = produto.unidade || ""; QN = /cartela/.test(un) ? ["cartela", "cartelas"] : /estampa/.test(un) ? ["estampa", "estampas"] : MOD.m2 ? ["peça", "peças"] : undefined;  // por m²: "2 peças", igual ao "Pedir agora" da página do produto
    if (POR_UN) { qtd = 1; painel.querySelector(".campo-qtd").hidden = true; }
    else if (QN) document.getElementById("ed-qtd-rot").textContent = `Quantas ${QN[1]}?`;
    if (MED) montarTamanho();
    else if (produto.opcoes.length > 1) {        // mesma escolha da página do produto, com o mesmo preço
      const bloco = document.createElement("div"); bloco.className = "campo";
      bloco.innerHTML = `<label for="ed-opcao">${produto.opcoes[0].label.startsWith("Gravação") ? "Gravação" : POR_UN ? "Quantidade" : "Escolha a opção"}</label><select id="ed-opcao">${produto.opcoes.map(o => `<option>${o.label} — ${brl(o.preco)}</option>`).join("")}</select>`;
      painel.querySelector(".total").before(bloco);
      const so = bloco.querySelector("select"); opIdx = Math.min(opIdx, produto.opcoes.length - 1); so.selectedIndex = opIdx;
      so.addEventListener("change", () => { opIdx = so.selectedIndex; atualizarPreco(); ajustarVerso(); salvarDepois();
        // recarregar a página (no celular, abrir a galeria pode recarregar) mantém a opção escolhida aqui, e não a que veio do produto
        try { const u = new URL(location.href); u.searchParams.set("o", opIdx); history.replaceState(history.state, "", u); } catch (err) {} });
    }
    const coresBox = document.getElementById("cores");
    const lista = corDoCorpo || /cor/i.test(produto.nome) ? CORES : null;
    if (corDoCorpo) coresBox.querySelector(".rot").textContent = MOD.propria ? "Cor da sua peça (só pra ver a prévia)" : `Cor ${NOMES[0].startsWith("a ") ? "da" : "do"} ${NOMES[0].slice(2)}`;
    if (/mágica/i.test(produto.nome)) { fundoCaneca = "#2a2a2a"; detalhe = "#2a2a2a"; corNome = "Preta (mágica)"; }
    if (lista && lista.length > 1) {   // uma cor só (sublimação): nem mostra a escolha
      coresBox.hidden = false;
      coresBox.querySelector("div").innerHTML = lista.map(([n, c], i) => `<button class="cor" style="--c:${c}" aria-label="${n}" aria-pressed="${i === 0}" data-c="${c}" data-n="${n}"></button>`).join("");
      coresBox.addEventListener("click", e => { const b = e.target.closest(".cor"); if (!b) return;
        coresBox.querySelectorAll(".cor").forEach(x => x.setAttribute("aria-pressed", x === b)); if (corDoCorpo) fundoCaneca = b.dataset.c; else detalhe = b.dataset.c; corNome = b.dataset.n; desenhar(); });
    }
    atualizarPreco(); ajustarVerso(); desenhar();
    return restaurar().catch(() => {});
  }).then(() => { pronto = true; }).catch(() => { document.getElementById("nome-produto").textContent = "Não deu pra carregar o produto. Atualize a página."; });
  document.fonts && document.fonts.ready.then(() => desenhar());
  desenhar();
})();
