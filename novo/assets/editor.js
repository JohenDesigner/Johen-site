// Editor de caneca: o cliente sobe a arte, ajusta na área de impressão e vê como fica
(function () {
  const cv = document.getElementById("tela"); if (!cv) return;
  const ctx = cv.getContext("2d");
  const S = 1000; cv.width = S; cv.height = S;
  const q = new URLSearchParams(location.search);
  const cId = q.get("c") || "canecas", pId = q.get("p") || "p1";
  // caneca (coordenadas na tela de 1000x1000)
  const M = { x: 250, y: 260, w: 420, h: 500, r: 34 };          // corpo
  const A = { x: M.x + 40, y: M.y + 70, w: M.w - 80, h: M.h - 140 }; // área de impressão
  const CORES = [["Branca", "#ffffff"], ["Vermelha", "#d6312b"], ["Preta", "#222222"], ["Azul", "#1f5fbf"], ["Verde", "#2f9e57"], ["Amarela", "#f2c230"], ["Rosa", "#ec7fb0"]];
  let produto = null, detalhe = "#ffffff", fundoCaneca = "#ffffff";
  let img = null, arquivo = null, ix = 0, iy = 0, esc = 1, texto = "", corTexto = "#1d2427", revisando = false;

  function corpoPath(c) {
    c.beginPath(); c.moveTo(M.x, M.y); c.lineTo(M.x + M.w, M.y); c.lineTo(M.x + M.w, M.y + M.h - M.r);
    c.quadraticCurveTo(M.x + M.w, M.y + M.h, M.x + M.w - M.r, M.y + M.h); c.lineTo(M.x + M.r, M.y + M.h);
    c.quadraticCurveTo(M.x, M.y + M.h, M.x, M.y + M.h - M.r); c.closePath();
  }
  function desenhar(final) {
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = "#eef1f1"; ctx.fillRect(0, 0, S, S);
    // sombra no chão
    const g0 = ctx.createRadialGradient(M.x + M.w / 2, M.y + M.h + 8, 10, M.x + M.w / 2, M.y + M.h + 8, 300);
    g0.addColorStop(0, "rgba(0,0,0,.22)"); g0.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g0; ctx.beginPath(); ctx.ellipse(M.x + M.w / 2 + 40, M.y + M.h + 6, 300, 26, 0, 0, Math.PI * 2); ctx.fill();
    // alça
    ctx.save(); ctx.lineWidth = 46; ctx.strokeStyle = detalhe; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(M.x + M.w - 6, M.y + 95);
    ctx.bezierCurveTo(M.x + M.w + 175, M.y + 80, M.x + M.w + 175, M.y + 390, M.x + M.w - 6, M.y + 380); ctx.stroke();
    ctx.lineWidth = 46; ctx.strokeStyle = "rgba(0,0,0,.10)"; ctx.stroke(); ctx.restore();
    // corpo
    ctx.save(); corpoPath(ctx); ctx.fillStyle = fundoCaneca; ctx.fill(); ctx.clip();
    // arte
    ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
    if (img) { const w = img.width * esc, h = img.height * esc; ctx.drawImage(img, A.x + A.w / 2 + ix - w / 2, A.y + A.h / 2 + iy - h / 2, w, h); }
    if (texto) {
      ctx.fillStyle = corTexto; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      let fs = 64; ctx.font = `600 ${fs}px Outfit, Figtree, sans-serif`;
      while (ctx.measureText(texto).width > A.w - 30 && fs > 22) { fs -= 2; ctx.font = `600 ${fs}px Outfit, Figtree, sans-serif`; }
      ctx.fillText(texto, A.x + A.w / 2, img ? A.y + A.h - fs * .8 : A.y + A.h / 2);
    }
    ctx.restore();
    // sombreamento cilíndrico
    const g = ctx.createLinearGradient(M.x, 0, M.x + M.w, 0);
    g.addColorStop(0, "rgba(0,0,0,.30)"); g.addColorStop(.12, "rgba(0,0,0,.08)"); g.addColorStop(.32, "rgba(255,255,255,.22)");
    g.addColorStop(.42, "rgba(255,255,255,0)"); g.addColorStop(.82, "rgba(0,0,0,.06)"); g.addColorStop(1, "rgba(0,0,0,.34)");
    ctx.fillStyle = g; ctx.fillRect(M.x, M.y, M.w, M.h);
    ctx.restore();
    // boca
    ctx.fillStyle = detalhe; ctx.beginPath(); ctx.ellipse(M.x + M.w / 2, M.y, M.w / 2, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(M.x + M.w / 2, M.y + 3, M.w / 2 - 14, 22, 0, 0, Math.PI * 2); ctx.fill();
    // área pontilhada
    if (!final) {
      ctx.save(); ctx.setLineDash([12, 9]); ctx.lineWidth = 3; ctx.strokeStyle = "#1d2427"; ctx.strokeRect(A.x, A.y, A.w, A.h);
      if (!img && !texto) {
        ctx.fillStyle = "#4f5b60"; ctx.textAlign = "center"; ctx.font = "600 30px Figtree, sans-serif";
        ctx.fillText("Sua arte aqui", A.x + A.w / 2, A.y + A.h / 2 - 10);
        ctx.font = "24px Figtree, sans-serif"; ctx.fillText("toque em + para adicionar", A.x + A.w / 2, A.y + A.h / 2 + 26);
      }
      ctx.restore();
    }
  }
  function encaixar() { if (!img) return; esc = Math.max(A.w / img.width, A.h / img.height); ix = iy = 0; zoom.value = 100; }
  // arrastar e pinça
  const pts = new Map(); let base = null;
  const ponto = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * S / r.width, y: (e.clientY - r.top) * S / r.height }; };
  cv.addEventListener("pointerdown", e => { if (!img || revisando) return; cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, ponto(e)); base = null; });
  cv.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId)) return; const p = ponto(e), ant = pts.get(e.pointerId);
    if (pts.size === 1) { ix += p.x - ant.x; iy += p.y - ant.y; }
    pts.set(e.pointerId, p);
    if (pts.size === 2) {
      const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (base) { esc *= d / base; zoom.value = Math.round(esc / escBase() * 100); }
      base = d;
    }
    desenhar();
  });
  ["pointerup", "pointercancel"].forEach(t => cv.addEventListener(t, e => { pts.delete(e.pointerId); base = null; }));
  const escBase = () => img ? Math.max(A.w / img.width, A.h / img.height) : 1;
  const zoom = document.getElementById("zoom");
  zoom.addEventListener("input", () => { esc = escBase() * zoom.value / 100; desenhar(); });
  // adicionar imagem / texto
  const inp = document.getElementById("arquivo");
  inp.addEventListener("change", () => {
    const f = inp.files[0]; if (!f) return;
    if (!f.type.startsWith("image/")) { aviso("Esse arquivo não é uma imagem. Use JPG ou PNG."); return; }
    arquivo = f; const u = URL.createObjectURL(f); const im = new Image();
    im.onload = () => { img = im; encaixar(); desenhar(); document.getElementById("ajustes").hidden = false; fecharMais();
      const min = Math.min(im.width / A.w, im.height / A.h); document.getElementById("qualidade").hidden = min >= 1.4; };
    im.onerror = () => aviso("Não deu pra abrir essa imagem. Tente outra em JPG ou PNG.");
    im.src = u;
  });
  const campoTxt = document.getElementById("texto");
  campoTxt.addEventListener("input", () => { texto = campoTxt.value.trim(); desenhar(); });
  document.getElementById("cor-texto").addEventListener("input", e => { corTexto = e.target.value; desenhar(); });
  document.getElementById("centralizar").addEventListener("click", () => { encaixar(); desenhar(); });
  const mais = document.getElementById("mais-opcoes");
  document.getElementById("btn-mais").addEventListener("click", () => { mais.hidden = !mais.hidden; });
  function fecharMais() { mais.hidden = true; }
  document.getElementById("add-txt").addEventListener("click", () => { fecharMais(); document.getElementById("bloco-texto").hidden = false; campoTxt.focus(); });
  // revisar
  const barraEd = document.getElementById("barra-editar"), barraRev = document.getElementById("barra-revisar");
  document.getElementById("revisar").addEventListener("click", () => {
    if (!img && !texto) { aviso("Adicione uma imagem ou um texto antes de revisar."); return; }
    revisando = true; desenhar(true); barraEd.hidden = true; barraRev.hidden = false; document.getElementById("painel").hidden = true;
  });
  document.getElementById("voltar").addEventListener("click", () => { revisando = false; desenhar(); barraEd.hidden = false; barraRev.hidden = true; document.getElementById("painel").hidden = false; });
  const precoUn = () => produto ? produto.opcoes[0].preco + (cx.checked ? produto.caixinha || 0 : 0) : 0;
  const cx = document.getElementById("caixinha");
  const totalEl = document.getElementById("total");
  const atualizarPreco = () => { totalEl.textContent = brl(precoUn()); };
  cx.addEventListener("change", atualizarPreco);
  const descricao = () => `Cor: ${corNome}${cx.checked ? " · caixinha personalizada" : ""}${texto ? ` · texto: "${texto}"` : ""}`;
  let corNome = "Branca";
  document.getElementById("add-pedido").addEventListener("click", () => {
    desenhar(true);
    const t = document.createElement("canvas"); t.width = t.height = 260; t.getContext("2d").drawImage(cv, 0, 0, 260, 260);
    Pedido.add({ c: cId, id: pId, nome: produto.nome, img: produto.img, arte: t.toDataURL("image/jpeg", .75), desc: descricao(), qtd: 1, total: precoUn() });
    toast(`Caneca adicionada. <a href="${ROOT}pedido/">Ver pedido</a>`);
  });
  document.getElementById("enviar-arte").addEventListener("click", async () => {
    desenhar(true);
    const msg = `Olá! Montei minha caneca no site:\n• ${produto.nome}\n• ${descricao()}\n• Valor: ${brl(precoUn())}\n\nSegue a prévia e a arte original.`;
    const blob = await new Promise(r => cv.toBlob(r, "image/png"));
    const prev = new File([blob], "previa-caneca.png", { type: "image/png" });
    const files = arquivo ? [prev, arquivo] : [prev];
    if (navigator.canShare && navigator.canShare({ files })) {
      try { await navigator.share({ files, text: msg }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "previa-caneca.png"; a.click();
    toast("Prévia baixada. Anexe ela e sua arte na conversa do WhatsApp.");
    setTimeout(() => location.href = wppLink(msg), 1200);
  });
  function aviso(t) { toast(t); }
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
  document.fonts && document.fonts.ready.then(() => desenhar(revisando));
  desenhar();
})();
