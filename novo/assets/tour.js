// Tutorial do editor: caixinhas passo a passo que destacam cada parte da tela.
// Abre sozinho na primeira visita ao editor; o botão "Como usar" abre de novo.
(function () {
  if (!document.getElementById("tela")) return;
  const CHAVE = "johen-tour-editor-v1";
  const $ = s => document.querySelector(s);
  const visivel = el => el && !el.hidden && el.offsetParent !== null && el.getBoundingClientRect().width > 0;
  const obj = () => (window.CanecaArte && window.CanecaArte.modelo.obj) || "caneca";
  const nomeObj = () => ({ caneca: "a caneca", copo: "o copo", camiseta: "a camiseta" }[obj()]);

  // cada passo: o que destacar, título e texto. "se" decide se o passo aparece (ex.: abas só na camiseta)
  const PASSOS = () => [
    { alvo: "#btn-mais", tit: "1. Coloque sua arte",
      txt: "Toque em <b>Adicionar arte</b> pra enviar uma foto do celular ou escrever um texto. Pode pôr mais de uma foto." },
    { alvo: "#tela", tit: "2. Ajuste do seu jeito",
      txt: "Arraste a imagem pra posicionar. Use dois dedos ou a barra <b>Tamanho da imagem</b> pra aumentar e diminuir. Com várias fotos, toque na que quer mexer." },
    { alvo: "#lados", se: () => visivel($("#lados")), tit: "3. Frente e costas",
      txt: "Troque o lado aqui. Cada lado guarda a própria arte, e a camiseta vira sozinha pra mostrar." },
    { alvo: "#palco3d", tit: `${visivel($("#lados")) ? 4 : 3}. Veja como fica`,
      txt: `Aqui ${nomeObj()} aparece em 3D com a sua arte. Arraste pra girar e confira cada detalhe antes de pedir.` },
    { alvo: "#cores", se: () => visivel($("#cores")), tit: "Escolha a cor", txt: "Toque na cor que você quer. A prévia muda na hora." },
    { alvo: "#comprar", tit: "Pronto pra pedir",
      txt: "Gostou? Toque em <b>Comprar</b> pra colocar no pedido. Em <b>Revisar</b> você também pode mandar a prévia direto no nosso WhatsApp." },
  ];

  let passos = [], i = 0, ui = null, alvoAtual = null;

  function montar() {
    const fundo = document.createElement("div"); fundo.className = "tour-fundo";
    const luz = document.createElement("div"); luz.className = "tour-luz";
    const card = document.createElement("div"); card.className = "tour-card";
    card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.setAttribute("aria-labelledby", "tour-tit");
    card.innerHTML = `<div class="tour-topo"><span class="tour-num"></span><button class="tour-pular" type="button">Pular</button></div>
      <h2 id="tour-tit"></h2><p class="tour-txt"></p>
      <div class="tour-pontos" aria-hidden="true"></div>
      <div class="tour-acoes"><button class="btn btn-sec tour-voltar" type="button">Voltar</button><button class="btn btn-pri tour-prox" type="button">Próximo</button></div>`;
    document.body.append(fundo, luz, card);
    card.querySelector(".tour-pular").onclick = fechar;
    card.querySelector(".tour-voltar").onclick = () => ir(i - 1);
    card.querySelector(".tour-prox").onclick = () => (i < passos.length - 1 ? ir(i + 1) : fechar());
    fundo.onclick = fechar;
    ui = { fundo, luz, card };
  }

  function posicionar() {
    if (!ui || !alvoAtual) return;
    const r = alvoAtual.getBoundingClientRect(), m = 8, vw = innerWidth, vh = innerHeight;
    Object.assign(ui.luz.style, { left: r.left - m + "px", top: r.top - m + "px", width: r.width + m * 2 + "px", height: r.height + m * 2 + "px" });
    // caixinha embaixo do destaque se couber; senão em cima; se o destaque ocupa quase a tela, no rodapé da tela
    const c = ui.card, ch = c.offsetHeight, cw = Math.min(360, vw - 32);
    c.style.width = cw + "px";
    let top;
    if (r.bottom + m + 14 + ch < vh - 8) top = r.bottom + m + 14;
    else if (r.top - m - 14 - ch > 8) top = r.top - m - 14 - ch;
    else top = Math.max(8, vh - ch - 96);
    c.style.top = top + "px";
    c.style.left = Math.min(vw - cw - 16, Math.max(16, r.left + r.width / 2 - cw / 2)) + "px";
  }

  function ir(n) {
    i = Math.max(0, Math.min(passos.length - 1, n));
    const p = passos[i], c = ui.card;
    alvoAtual = $(p.alvo);
    c.querySelector(".tour-num").textContent = `Passo ${i + 1} de ${passos.length}`;
    c.querySelector("#tour-tit").textContent = p.tit.replace(/^\d+\.\s*/, "");
    c.querySelector(".tour-txt").innerHTML = p.txt;
    c.querySelector(".tour-pontos").innerHTML = passos.map((_, k) => `<span${k === i ? ' class="on"' : ""}></span>`).join("");
    c.querySelector(".tour-voltar").hidden = i === 0;
    c.querySelector(".tour-prox").textContent = i === passos.length - 1 ? "Começar" : "Próximo";
    const fixo = getComputedStyle(alvoAtual.closest(".ed-barra") || alvoAtual).position === "fixed";
    if (!fixo) {
      // rola pra que o destaque e a caixinha caibam juntos entre o topo do site e a barra de baixo
      c.style.width = Math.min(360, innerWidth - 32) + "px";
      const r = alvoAtual.getBoundingClientRect(), ch = c.offsetHeight;
      const cima = ($(".topo")?.getBoundingClientRect().bottom || 0) + 12;
      const baixo = innerHeight - ($("#barra-editar")?.offsetHeight || 0) - 8;
      const livre = baixo - cima, bloco = r.height + 30 + ch;
      const topoDesejado = bloco < livre ? cima + (livre - bloco) / 2 : cima;
      scrollBy({ top: r.top - topoDesejado, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
    posicionar(); setTimeout(posicionar, 350); setTimeout(posicionar, 700);
    c.querySelector(".tour-prox").focus({ preventScroll: true });
  }

  function abrir() {
    if (ui) return;
    passos = PASSOS().filter(p => (!p.se || p.se()) && $(p.alvo));
    if (!passos.length) return;
    const mais = $("#mais-opcoes"); if (mais) mais.hidden = true;
    montar(); document.documentElement.classList.add("tour-aberto"); ir(0);
    addEventListener("resize", posicionar); addEventListener("scroll", posicionar, { passive: true });
    document.addEventListener("keydown", tecla);
  }
  function fechar() {
    if (!ui) return;
    Object.values(ui).forEach(el => el.remove()); ui = null; alvoAtual = null;
    document.documentElement.classList.remove("tour-aberto");
    removeEventListener("resize", posicionar); removeEventListener("scroll", posicionar);
    document.removeEventListener("keydown", tecla);
    try { localStorage.setItem(CHAVE, "1"); } catch (e) {}
    scrollTo({ top: 0, behavior: "auto" });
  }
  function tecla(e) {
    if (e.key === "Escape") fechar();
    else if (e.key === "ArrowRight") ui.card.querySelector(".tour-prox").click();
    else if (e.key === "ArrowLeft" && i > 0) ir(i - 1);
  }

  $("#ver-tour")?.addEventListener("click", abrir);
  // primeira visita: espera o editor terminar de carregar (nome do produto e 3D) antes de abrir
  let visto = false; try { visto = localStorage.getItem(CHAVE) === "1"; } catch (e) {}
  if (!visto && !/[?&]sem-tour/.test(location.search)) {
    let n = 0; const t = setInterval(() => {
      n++; const pronto = window.CanecaArte && !/^Carregando/.test($("#nome-produto")?.textContent || "");
      if (pronto || n > 20) { clearInterval(t); setTimeout(abrir, 600); }
    }, 250);
  }
  window.TourEditor = { abrir };
})();
