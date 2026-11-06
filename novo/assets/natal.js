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
  var vids = document.querySelectorAll(".natal-midia video");
  if (!vids.length) return;
  if (!("IntersectionObserver" in window)) { vids.forEach(function (v) { v.play && v.play().catch(function () {}); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting && !calmo) { v.preload = "auto"; var p = v.play(); if (p) p.catch(function () {}); }
      else v.pause();
    });
  }, { threshold: 0.35 });
  vids.forEach(function (v) { io.observe(v); });
})();
