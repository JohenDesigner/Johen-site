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
  // e cada um toca sozinho sempre que aparece na tela; saiu da tela, pausa
  var vids = [].slice.call(document.querySelectorAll(".natal-midia video"));
  if (!vids.length) return;
  function baixar() { vids.forEach(function (v) { if (v.preload !== "auto") { v.preload = "auto"; v.load(); } }); }
  function tocar(v) { if (calmo) return; var p = v.play(); if (p) p.catch(function () {}); }
  if (!("IntersectionObserver" in window)) { baixar(); vids.forEach(tocar); return; }
  var secao = document.querySelector("#natal");
  new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { baixar(); o.disconnect(); } }, { rootMargin: "1200px 0px" }).observe(secao || vids[0]);
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { baixar(); tocar(e.target); } else e.target.pause(); });
  }, { threshold: 0.2 });
  vids.forEach(function (v) { io.observe(v); });
})();
