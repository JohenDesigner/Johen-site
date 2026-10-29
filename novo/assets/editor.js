// Editor de caneca: o cliente sobe a arte, posiciona na área de impressão aberta (volta toda a caneca)
// e vê o resultado na caneca 3D (assets/mockup3d.js).
(function () {
  const cv = document.getElementById("tela"); if (!cv) return;
  const ctx = cv.getContext("2d");
  // área de impressão: 20 x 8,5 cm (proporção 2,35), com uma margem em volta na tela
  const PAD = 16, AW = 1000 - PAD * 2, AH = Math.round(AW * 8.5 / 20);
  cv.width = 1000; cv.height = AH + PAD * 2;
  const A = { x: PAD, y: PAD, w: AW, h: AH };
  const CORES = [["Branca", "#ffffff"], ["Vermelha", "#d6312b"], ["Preta", "#222222"], ["Azul", "#1f5fbf"], ["Verde", "#2f9e57"], ["Amarela", "#f2c230"], ["Rosa", "#ec7fb0"]];
  const q = new URLSearchParams(location.search);
  const cId = q.get("c") || "canecas", pId = q.get("p") || "p1";
  let produto = null, detalhe = "#ffffff", fundoCaneca = "#ffffff", corNome = "Branca";
  let img = null, arquivo = null, ix = 0, iy = 0, esc = 1, texto = "", corTexto = "#1d2427";

  // desenha só a arte (imagem + texto) dentro da área de impressão; usado também pela caneca 3D
  function pintarArte(c) {
    c.save(); c.beginPath(); c.rect(A.x, A.y, A.w, A.h); c.clip();
    if (img) { const w = img.width * esc, h = img.height * esc; c.drawImage(img, A.x + A.w / 2 + ix - w / 2, A.y + A.h / 2 + iy - h / 2, w, h); }
    if (texto) {
      c.fillStyle = corTexto; c.textAlign = "center"; c.textBaseline = "middle";
      let fs = 72; c.font = `600 ${fs}px Outfit, Figtree, sans-serif`;
      while (c.measureText(texto).width > A.w * .36 && fs > 24) { fs -= 2; c.font = `600 ${fs}px Outfit, Figtree, sans-serif`; }
      c.fillText(texto, A.x + A.w / 2, img ? A.y + A.h - fs * .8 : A.y + A.h / 2);
    }
    c.restore();
  }
  window.CanecaArte = {
    area: A,
    temArte: () => !!(img || texto),
    pintar: pintarArte,
    cores: () => ({ corpo: fundoCaneca, detalhe }),
    nome: () => produto ? produto.nome : "caneca",
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
  // imagem larga (como a da caneca toda) cobre a área; imagem quadrada/alta fica na frente, na altura toda
  const escCobrir = () => img ? Math.max(A.w / img.width, A.h / img.height) : 1;
  const escPadrao = () => !img ? 1 : (img.width / img.height >= 1.8 ? escCobrir() : A.h / img.height);
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
    im.onload = () => { img = im; encaixar(false); desenhar(); document.getElementById("ajustes").hidden = false; fecharMais();
      // ~150 dpi na impressão: pelo menos 1,25 pixel da imagem por pixel da área (48 px por cm)
      document.getElementById("qualidade").hidden = 1 / esc >= 1.25; };
    im.onerror = () => toast("Não deu pra abrir essa imagem. Tente outra em JPG ou PNG.");
    im.src = URL.createObjectURL(f);
  });
  const campoTxt = document.getElementById("texto");
  campoTxt.addEventListener("input", () => { texto = campoTxt.value.trim(); desenhar(); });
  document.getElementById("cor-texto").addEventListener("input", e => { corTexto = e.target.value; desenhar(); });
  document.getElementById("centralizar").addEventListener("click", () => { encaixar(true); desenhar(); });
  const mais = document.getElementById("mais-opcoes");
  document.getElementById("btn-mais").addEventListener("click", () => { mais.hidden = !mais.hidden; });
  function fecharMais() { mais.hidden = true; }
  document.getElementById("add-txt").addEventListener("click", () => { fecharMais(); document.getElementById("bloco-texto").hidden = false; campoTxt.focus(); });

  // revisar
  const barraEd = document.getElementById("barra-editar"), barraRev = document.getElementById("barra-revisar");
  const painel = document.getElementById("painel");
  document.getElementById("revisar").addEventListener("click", () => {
    if (!img && !texto) { toast("Adicione uma imagem ou um texto antes de revisar."); return; }
    desenhar(true); barraEd.hidden = true; barraRev.hidden = false; painel.hidden = true;
    document.getElementById("palco3d").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.getElementById("voltar").addEventListener("click", () => { desenhar(); barraEd.hidden = false; barraRev.hidden = true; painel.hidden = false; });

  const cx = document.getElementById("caixinha");
  const precoUn = () => produto ? produto.opcoes[0].preco + (cx.checked ? produto.caixinha || 0 : 0) : 0;
  const totalEl = document.getElementById("total");
  const atualizarPreco = () => { totalEl.textContent = brl(precoUn()); };
  cx.addEventListener("change", atualizarPreco);
  const descricao = () => `Cor: ${corNome}${cx.checked ? " · caixinha personalizada" : ""}${texto ? ` · texto: "${texto}"` : ""}`;

  // foto da caneca 3D (se o aparelho abriu o 3D); senão, a faixa da área de impressão
  async function previa(tam) {
    if (window.Caneca3D) { try { return await window.Caneca3D.foto(tam); } catch (e) { } }
    desenhar(true); return await new Promise(r => cv.toBlob(r, "image/png"));
  }
  document.getElementById("add-pedido").addEventListener("click", async () => {
    const b = await previa(260); const u = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
    Pedido.add({ c: cId, id: pId, nome: produto.nome, img: produto.img, arte: u, desc: descricao(), qtd: 1, total: precoUn() });
    toast(`Caneca adicionada. <a href="${ROOT}pedido/">Ver pedido</a>`);
  });
  document.getElementById("enviar-arte").addEventListener("click", async () => {
    const msg = `Olá! Montei minha caneca no site:\n• ${produto.nome}\n• ${descricao()}\n• Valor: ${brl(precoUn())}\n\nSegue a prévia, a arte posicionada e a arte original.`;
    const prev = new File([await previa(1080)], "previa-caneca.png", { type: "image/png" });
    desenhar(true);
    const faixa = new File([await new Promise(r => cv.toBlob(r, "image/png"))], "arte-posicionada-caneca.png", { type: "image/png" });
    const files = arquivo ? [prev, faixa, arquivo] : [prev, faixa];
    if (navigator.canShare && navigator.canShare({ files })) {
      try { await navigator.share({ files, text: msg }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(prev); a.download = prev.name; a.click();
    toast("Prévia baixada. Anexe ela e sua arte na conversa do WhatsApp.");
    setTimeout(() => location.href = wppLink(msg), 1200);
  });

  // carregar produto
  carregarCatalogo().then(cat => {
    produto = (cat[cId] || []).find(p => p.id === pId) || cat.canecas[0];
    document.getElementById("nome-produto").textContent = produto.nome;
    document.title = "Personalizar: " + produto.nome + " | Johen Arte Gráfica";
    if (!produto.caixinha) cx.closest("label").hidden = true;
    const coresBox = document.getElementById("cores");
    const lista = /cor/i.test(produto.nome) ? CORES : null;
    if (/mágica/i.test(produto.nome)) { fundoCaneca = "#2a2a2a"; detalhe = "#2a2a2a"; corNome = "Preta (mágica)"; }
    if (lista) {
      coresBox.hidden = false;
      coresBox.querySelector("div").innerHTML = lista.map(([n, c], i) => `<button class="cor" style="--c:${c}" aria-label="${n}" aria-pressed="${i === 0}" data-c="${c}" data-n="${n}"></button>`).join("");
      coresBox.addEventListener("click", e => { const b = e.target.closest(".cor"); if (!b) return;
        coresBox.querySelectorAll(".cor").forEach(x => x.setAttribute("aria-pressed", x === b)); detalhe = b.dataset.c; corNome = b.dataset.n; desenhar(); });
    }
    atualizarPreco(); desenhar();
  }).catch(() => { document.getElementById("nome-produto").textContent = "Não deu pra carregar o produto. Atualize a página."; });
  document.fonts && document.fonts.ready.then(() => desenhar());
  desenhar();
})();
