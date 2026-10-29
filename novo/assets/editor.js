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
    copo360: { tipo: "copo", w: 25.7, h: 12, laser: true, volta: true, obj: "copo", rot: "Área de gravação a laser", sub: "volta toda o copo (360°) · 12 cm de altura", guia: ["‹ costas", "frente", "costas ›"] },
    // camiseta DTF: estampa até 28 x 35 cm (aprox. A3) na frente; nas "Frente e Verso", também nas costas
    camiseta:  { tipo: "camiseta", w: 28, h: 35, laser: false, obj: "camiseta", rot: "Área de estampa", sub: "frente · até 28 x 35 cm", guia: null },
    camiseta2: { tipo: "camiseta", w: 28, h: 35, laser: false, verso: true, obj: "camiseta", rot: "Área de estampa", sub: "até 28 x 35 cm em cada lado", guia: null },
  };
  const MOD = MODELOS[cId === "camisetas" ? (["p8", "p9", "p10"].includes(pId) ? "camiseta2" : "camiseta") : ({ p6: "copo", p7nt99ze: "copo360" }[pId] || "caneca")];
  const corDoCorpo = MOD.tipo !== "caneca";               // copo e camiseta: a cor escolhida é a do produto todo
  const SEU = { caneca: "sua caneca", copo: "seu copo", camiseta: "sua camiseta" }[MOD.obj];
  const ACO = "#cfd3d6";                                   // cor do aço que aparece onde o laser grava
  // área na tela: lado maior com 1000 px, margem em volta
  const PAD = 16, larga = MOD.w >= MOD.h;
  const AW = larga ? 1000 - PAD * 2 : Math.round((1000 - PAD * 2) * MOD.w / MOD.h), AH = larga ? Math.round((1000 - PAD * 2) * MOD.h / MOD.w) : 1000 - PAD * 2;
  cv.width = AW + PAD * 2; cv.height = AH + PAD * 2;
  if (!larga) Object.assign(cv.style, { width: "auto", height: "min(440px, 62vh)", margin: "0 auto" });
  const A = { x: PAD, y: PAD, w: AW, h: AH };
  document.querySelector(".ed-faixa-tit .rot").textContent = MOD.rot;
  document.querySelector(".ed-faixa-tit small").textContent = MOD.sub;
  if (MOD.tipo !== "caneca") document.getElementById("centralizar").textContent = MOD.volta ? "Cobrir o copo todo" : "Preencher a área";
  const guia = document.querySelector(".ed-faixa-guia");
  if (MOD.guia) guia.querySelectorAll("span").forEach((el, i) => el.textContent = MOD.guia[i]); else guia.hidden = true;
  const CORES = MOD.tipo === "camiseta" ? [["Branca", "#f3f3f1"], ["Preta", "#1d1e20"]]
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
  // camiseta frente e verso: cada lado guarda a própria arte; as variáveis acima são sempre as do lado aberto
  const LADOS = MOD.verso ? ["frente", "costas"] : ["frente"];
  const est = {}; let lado = "frente";
  const guardar = () => { est[lado] = { img, arquivo, ix, iy, esc, texto, corTexto, gravada, temAlfa, inverter }; };
  const carregar = l => { ({ img, arquivo, ix, iy, esc, texto, corTexto, gravada, temAlfa, inverter } = est[l]); lado = l; };
  LADOS.forEach(l => { est[l] = { img: null, arquivo: null, ix: 0, iy: 0, esc: 1, texto: "", corTexto: "#1d2427", gravada: null, temAlfa: false, inverter: false }; });
  function comLado(l, fn) { if (!l || l === lado) return fn(); const atual = lado; guardar(); carregar(l); try { return fn(); } finally { carregar(atual); } }

  // desenha só a arte (imagem + texto) dentro da área de impressão; usado também pela caneca 3D
  function pintarArte(c) {
    c.save(); c.beginPath(); c.rect(A.x, A.y, A.w, A.h); c.clip();
    if (img) { const w = img.width * esc, h = img.height * esc; c.drawImage(gravada || img, A.x + A.w / 2 + ix - w / 2, A.y + A.h / 2 + iy - h / 2, w, h); }
    if (texto) {
      c.fillStyle = MOD.laser ? ACO : corTexto; c.textAlign = "center"; c.textBaseline = "middle";
      let fs = MOD.tipo === "camiseta" ? 160 : 72; c.font = `600 ${fs}px Outfit, Figtree, sans-serif`;
      while (c.measureText(texto).width > A.w * (larga && MOD.w > 15 ? .36 : .92) && fs > 24) { fs -= 2; c.font = `600 ${fs}px Outfit, Figtree, sans-serif`; }
      c.fillText(texto, A.x + A.w / 2, img ? A.y + A.h - fs * .8 : A.y + A.h / 2);
    }
    c.restore();
  }
  window.CanecaArte = {
    area: A,
    temArte: () => { guardar(); return LADOS.some(l => est[l].img || est[l].texto); },
    pintar: (c, l) => comLado(l, () => pintarArte(c)),
    lados: LADOS,
    cores: () => ({ corpo: fundoCaneca, detalhe }),
    nome: () => produto ? produto.nome : MOD.obj,
    modelo: MOD,
  };

  function desenhar(final) {
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
    if (!img && !texto) {
      ctx.fillStyle = "#4f5b60"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "600 34px Figtree, sans-serif"; ctx.fillText("Sua arte aqui", A.x + A.w / 2, A.y + A.h / 2 - 22);
      ctx.font = "26px Figtree, sans-serif"; ctx.fillText("toque em + para adicionar", A.x + A.w / 2, A.y + A.h / 2 + 22);
    }
    ctx.restore();
  }
  const zoom = document.getElementById("zoom");
  // imagem larga (como a da caneca toda) cobre a área; imagem quadrada/alta fica na frente, na altura toda.
  // Na área estreita do copo, a imagem cabe inteira na largura.
  const escCobrir = () => img ? Math.max(A.w / img.width, A.h / img.height) : 1;
  const escPadrao = () => !img ? 1 : !larga ? Math.min(A.w / img.width, A.h / img.height)
    : (img.width / img.height >= 1.8 ? escCobrir() : A.h / img.height);
  function encaixar(cobrir) { if (!img) return; esc = cobrir ? escCobrir() : escPadrao(); ix = iy = 0; zoom.value = Math.round(esc / escPadrao() * 100); }

  // arrastar e pinça na área de impressão
  const pts = new Map(); let base = null;
  const ponto = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
  cv.addEventListener("pointerdown", e => { if (!img) return; cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, ponto(e)); base = null; });
  cv.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId)) return; const p = ponto(e), ant = pts.get(e.pointerId);
    if (pts.size === 1) { ix += p.x - ant.x; iy += p.y - ant.y; }
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
    arquivo = f; const im = new Image();
    im.onload = () => { img = im; prepararLaser(); encaixar(false); desenhar(); document.getElementById("ajustes").hidden = false; fecharMais();
      // ~150 dpi: pelo menos 60 pixels da imagem por cm da área
      document.getElementById("qualidade").hidden = (1 / esc) * (A.w / MOD.w) >= 60; };
    im.onerror = () => toast("Não deu pra abrir essa imagem. Tente outra em JPG ou PNG.");
    im.src = URL.createObjectURL(f);
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
  const precoUn = () => produto ? produto.opcoes[0].preco + (cx.checked ? produto.caixinha || 0 : 0) : 0;
  const totalEl = document.getElementById("total");
  const atualizarPreco = () => { totalEl.textContent = brl(precoUn()); };
  cx.addEventListener("change", atualizarPreco);
  const descricao = () => { guardar();
    const comArte = LADOS.filter(l => est[l].img || est[l].texto);
    return `Cor: ${corNome}${cx.checked ? " · caixinha personalizada" : ""}${MOD.verso ? ` · estampa: ${comArte.join(" e ")}` : ""}${LADOS.map(l => est[l].texto ? ` · texto${MOD.verso ? " (" + l + ")" : ""}: "${est[l].texto}"` : "").join("")}`; };

  // foto da caneca 3D (se o aparelho abriu o 3D); senão, a faixa da área de impressão
  async function previa(tam) {
    if (window.Caneca3D) { try { return await window.Caneca3D.foto(tam); } catch (e) { } }
    desenhar(true); return await new Promise(r => cv.toBlob(r, "image/png"));
  }
  // Comprar: coloca no pedido com a prévia e abre a página do pedido
  async function comprar() {
    if (!window.CanecaArte.temArte()) { toast("Adicione uma imagem ou um texto antes de comprar."); return; }
    if (!produto) return;
    const b = await previa(260); const u = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
    Pedido.add({ c: cId, id: pId, nome: produto.nome, img: produto.img, arte: u, desc: descricao(), qtd: 1, total: precoUn() });
    location.href = ROOT + "pedido/";
  }
  document.getElementById("add-pedido").addEventListener("click", comprar);
  document.getElementById("comprar").addEventListener("click", comprar);
  document.getElementById("enviar-arte").addEventListener("click", async () => {
    const msg = `Olá! Montei ${SEU.replace("sua", "minha").replace("seu", "meu")} no site:\n• ${produto.nome}\n• ${descricao()}\n• Valor: ${brl(precoUn())}\n\nSegue a prévia, a arte posicionada e a arte original.`;
    const prev = new File([await previa(1080)], `previa-${MOD.obj}.png`, { type: "image/png" });
    guardar(); const files = [prev];
    for (const l of LADOS) {
      if (!est[l].img && !est[l].texto) continue;
      const blob = await comLado(l, () => { desenhar(true); return new Promise(r => cv.toBlob(r, "image/png")); });
      files.push(new File([blob], `arte-posicionada-${MOD.obj}${MOD.verso ? "-" + l : ""}.png`, { type: "image/png" }));
      if (est[l].arquivo) files.push(est[l].arquivo);
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
      document.getElementById("ajustes").hidden = !img; document.getElementById("qualidade").hidden = true;
      if (img) zoom.value = Math.round(esc / escPadrao() * 100);
      document.querySelector(".ed-faixa-tit small").textContent = `${lado} · até ${MOD.w} x ${MOD.h} cm`;
      document.dispatchEvent(new CustomEvent("mockup-lado", { detail: lado }));
      desenhar();
    });
    document.querySelector(".ed-faixa-tit small").textContent = `frente · até ${MOD.w} x ${MOD.h} cm`;
  }

  // carregar produto
  carregarCatalogo().then(cat => {
    produto = (cat[cId] || []).find(p => p.id === pId) || cat.canecas[0];
    if (cId === "camisetas") {             // migalha e menu apontam para Camisetas
      const m = document.getElementById("migalha-cat"); if (m) { m.textContent = "Camisetas"; m.href = ROOT + "camisetas/"; }
      document.querySelectorAll(".nav-cat a").forEach(a => { const s = new URL(a.href).pathname.replace(/\/$/, "").split("/").pop(); a.toggleAttribute("aria-current", s === "camisetas"); if (s === "camisetas") a.setAttribute("aria-current", "page"); });
    }
    document.getElementById("nome-produto").textContent = produto.nome;
    document.title = "Personalizar: " + produto.nome + " | Johen Arte Gráfica";
    if (!produto.caixinha) cx.closest("label").hidden = true; else if (q.get("cx") === "1") cx.checked = true;
    const coresBox = document.getElementById("cores");
    const lista = corDoCorpo || /cor/i.test(produto.nome) ? CORES : null;
    if (corDoCorpo) coresBox.querySelector(".rot").textContent = MOD.tipo === "camiseta" ? "Cor da camiseta" : "Cor do copo";
    if (/mágica/i.test(produto.nome)) { fundoCaneca = "#2a2a2a"; detalhe = "#2a2a2a"; corNome = "Preta (mágica)"; }
    if (lista) {
      coresBox.hidden = false;
      coresBox.querySelector("div").innerHTML = lista.map(([n, c], i) => `<button class="cor" style="--c:${c}" aria-label="${n}" aria-pressed="${i === 0}" data-c="${c}" data-n="${n}"></button>`).join("");
      coresBox.addEventListener("click", e => { const b = e.target.closest(".cor"); if (!b) return;
        coresBox.querySelectorAll(".cor").forEach(x => x.setAttribute("aria-pressed", x === b)); if (corDoCorpo) fundoCaneca = b.dataset.c; else detalhe = b.dataset.c; corNome = b.dataset.n; desenhar(); });
    }
    atualizarPreco(); desenhar();
  }).catch(() => { document.getElementById("nome-produto").textContent = "Não deu pra carregar o produto. Atualize a página."; });
  document.fonts && document.fonts.ready.then(() => desenhar());
  desenhar();
})();
