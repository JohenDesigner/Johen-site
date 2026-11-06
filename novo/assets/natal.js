/* Tema de Natal: neve na seção de promoções e vídeos que só tocam quando aparecem na tela */
(function () {
  var calmo = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var neve = document.querySelector(".natal-neve");
  if (neve && !calmo) {
    var n = window.innerWidth < 700 ? 22 : 45, h = "";
    for (var i = 0; i < n; i++) {
      var s = (2 + Math.random() * 4).toFixed(1);
      h += '<i style="--x:' + (Math.random() * 100).toFixed(1) + '%;--s:' + s + 'px;--o:' + (0.35 + Math.random() * 0.55).toFixed(2) +
        ';--t:' + (7 + Math.random() * 9).toFixed(1) + 's;--d:-' + (Math.random() * 14).toFixed(1) + 's;--dx:' + ((Math.random() - 0.5) * 120).toFixed(0) + 'px"></i>';
    }
    neve.innerHTML = h;
  }
  // vídeos: os dois começam a baixar juntos quando a seção chega perto (não um depois do outro)
  // e cada um toca sozinho sempre que aparece na tela; saiu da tela, pausa.
  // Botão de play transparente quando está parado; círculo girando enquanto carrega.
  var vids = [].slice.call(document.querySelectorAll(".natal-midia video"));
  function baixar() { vids.forEach(function (v) { if (v.preload !== "auto") { v.preload = "auto"; v.load(); } }); }
  function tocar(v) { var p = v.play(); if (p) p.catch(function () { v.parentNode.classList.remove("carregando"); v.parentNode.classList.add("pausado"); }); }
  vids.forEach(function (v) {
    var m = v.parentNode, btn = m.querySelector(".natal-play"), nome = btn ? btn.getAttribute("aria-label").replace(/^Tocar o vídeo: /, "") : "";
    function marcar() { m.classList.toggle("pausado", v.paused); if (btn) btn.setAttribute("aria-label", (v.paused ? "Tocar o vídeo: " : "Pausar o vídeo: ") + nome); }
    v.addEventListener("play", marcar); v.addEventListener("pause", marcar);
    v.addEventListener("waiting", function () { if (!v.paused) m.classList.add("carregando"); });
    v.addEventListener("playing", function () { m.classList.remove("carregando"); marcar(); });
    v.addEventListener("canplay", function () { if (v.paused) m.classList.remove("carregando"); });
    m.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;
      if (v.paused) { v.dataset.manual = ""; baixar(); if (v.readyState < 3) m.classList.add("carregando"); tocar(v); }
      else { v.dataset.manual = "1"; v.pause(); }   // pausou na mão: a rolagem não toca de novo sozinha
    });
  });
  if (vids.length) {
    if (!("IntersectionObserver" in window)) baixar();
    else {
      var secao = document.querySelector("#natal");
      new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { baixar(); o.disconnect(); } }, { rootMargin: "1200px 0px" }).observe(secao || vids[0]);
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var v = e.target;
          if (e.isIntersecting) { if (calmo || v.dataset.manual === "1") return; baixar(); if (v.readyState < 3) v.parentNode.classList.add("carregando"); tocar(v); }
          else v.pause();
        });
      }, { threshold: 0.2 });
      vids.forEach(function (v) { io.observe(v); });
    }
  }

  // Papai Noel desce a escada da janela até o chão conforme a rolagem; no chão libera o cupom
  var trilho = document.querySelector(".noel-trilho"), chao = document.querySelector(".noel-chao");
  if (trilho && chao) {
    var noel = trilho.querySelector(".noel"), main = trilho.parentNode, topoT = 0, alturaT = 0, fim = 0, alturaNoel = 0, aberto = false, ultimo = -1, pedidoQuadro = 0;
    function medir() {
      var rm = main.getBoundingClientRect(), rc = chao.getBoundingClientRect(), y = window.scrollY;
      topoT = rm.top + y;
      var superficie = rc.bottom + y - 34;   // pé da escada na neve, embaixo do presente (o cupom fica visível quando ele pisa)
      alturaT = Math.max(200, superficie - topoT);
      trilho.style.setProperty("--trilho-h", alturaT + "px");
      alturaNoel = noel.offsetHeight;
      fim = Math.max(1, Math.min(superficie + 34 - window.innerHeight, document.documentElement.scrollHeight - window.innerHeight));  // rolagem em que ele pisa no chão
      mover();
    }
    function abrir() {
      if (aberto) return; aberto = true;
      chao.classList.add("aberto"); noel.classList.add("chegou");
      var ab = chao.querySelector(".cupom-aberto"); if (ab) ab.removeAttribute("aria-hidden");
      try { localStorage.setItem("johen-cupom-liberado", "1"); } catch (e) {}
    }
    function mover() {
      pedidoQuadro = 0;
      var inicio = trilho.querySelector(".noel-janela").offsetHeight * 0.45;
      var p = calmo ? 1 : Math.min(1, Math.max(0, window.scrollY / fim));
      var y = inicio + p * (alturaT - alturaNoel - inicio);
      noel.style.setProperty("--noel-y", y.toFixed(1) + "px");
      var degrau = Math.floor(y / 28);
      if (degrau !== ultimo) { noel.classList.toggle("passo", degrau % 2 === 0); ultimo = degrau; }
      if (p >= 0.995) abrir();
      else if (aberto && p < 0.9) { noel.classList.remove("chegou"); }
      else if (aberto && p >= 0.995) noel.classList.add("chegou");
    }
    window.addEventListener("scroll", function () { if (!pedidoQuadro) pedidoQuadro = requestAnimationFrame(mover); }, { passive: true });
    window.addEventListener("resize", medir);
    window.addEventListener("load", medir);
    if ("ResizeObserver" in window) new ResizeObserver(medir).observe(document.body);
    medir();
    try { if (localStorage.getItem("johen-cupom-liberado") && calmo) abrir(); } catch (e) {}
    var cp = chao.querySelector(".cupom-copiar");
    if (cp) cp.addEventListener("click", function () {
      var c = cp.dataset.cupom;
      try { localStorage.setItem("johen-cupom", c); } catch (e) {}
      (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(function () { cp.textContent = "Cupom copiado!"; }, function () { cp.textContent = "Cupom: " + c; });
      setTimeout(function () { cp.textContent = "Copiar cupom"; }, 2500);
    });
  }
})();
