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
      if (e.target.closest("a, .natal-som")) return;
      if (v.paused) { v.dataset.manual = ""; baixar(); if (v.readyState < 3) m.classList.add("carregando"); tocar(v); }
      else { v.dataset.manual = "1"; v.pause(); }   // pausou na mão: a rolagem não toca de novo sozinha
    });
  });
  // música: o navegador só deixa tocar com som depois de um toque, então começa mudo.
  // Tocou no alto-falante: liga o som desse vídeo e deixa os outros mudos; ao rolar, o som passa pro vídeo que aparece.
  var somLigado = false;
  function marcarSom(v) { var b = v.parentNode.querySelector(".natal-som"); if (!b) return; var on = !v.muted; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); b.setAttribute("aria-label", on ? "Desligar a música do vídeo" : "Ligar a música do vídeo"); b.querySelector("span").textContent = on ? "Som ligado" : "Ouvir"; }
  function somEm(v) {
    vids.forEach(function (o) { if (o !== v && !o.muted) { o.muted = true; marcarSom(o); } });
    v.muted = false; marcarSom(v);
    var p = v.play(); if (p) p.catch(function () { v.muted = true; marcarSom(v); tocar(v); });   // celular recusou som: volta mudo e segue tocando
  }
  vids.forEach(function (v) {
    var b = v.parentNode.querySelector(".natal-som"); if (!b) return;
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      if (v.muted) { somLigado = true; v.dataset.manual = ""; baixar(); somEm(v); }
      else { somLigado = false; v.muted = true; marcarSom(v); }
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
          if (e.isIntersecting) { if (calmo || v.dataset.manual === "1") return; baixar(); if (v.readyState < 3) v.parentNode.classList.add("carregando"); if (somLigado) somEm(v); else tocar(v); }
          else { v.pause(); if (!v.muted) { v.muted = true; marcarSom(v); } }
        });
      }, { threshold: 0.2 });
      vids.forEach(function (v) { io.observe(v); });
    }
  }

  // cupom de Natal no fim da home: botão de copiar
  var chao = document.querySelector(".noel-chao");
  if (chao) {
    var cp = chao.querySelector(".cupom-copiar");
    if (cp) cp.addEventListener("click", function () {
      var c = cp.dataset.cupom;
      try { localStorage.setItem("johen-cupom", c); } catch (e) {}
      (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(function () { cp.textContent = "Cupom copiado!"; }, function () { cp.textContent = "Cupom: " + c; });
      setTimeout(function () { cp.textContent = "Copiar cupom"; }, 2500);
    });
  }
})();
