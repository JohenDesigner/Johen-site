/* Página inicial cinematográfica · Site Cinematográfico por Labrego IA · LBG-SC-2026-v1
   Rolagem que toca o vídeo (frames), revelar ao rolar, parallax leve e formulário → e-mail (FormSubmit). */
(() => {
  const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const celular = matchMedia("(max-width: 760px)").matches;

  /* ── Rolagem que toca o vídeo ─────────────────────────────────────────── */
  const cine = document.querySelector(".cine");
  const canvas = cine && cine.querySelector(".cine-canvas");
  const topo = document.querySelector(".topo");
  const medirTopo = () => topo && document.documentElement.style.setProperty("--topo-h", `${topo.offsetHeight}px`);
  medirTopo();
  addEventListener("resize", medirTopo);

  if (cine && canvas) {
    const ctx = canvas.getContext("2d");
    const total = +cine.dataset.total;
    const padrao = celular ? cine.dataset.mobile : cine.dataset.desktop;
    const src = (i) => padrao.replace("{n}", String(i + 1).padStart(4, "0"));
    const momentos = [...cine.querySelectorAll(".momento")];
    let alvo = 0, atual = 0;

    const progresso = () => {
      const r = cine.getBoundingClientRect();
      const curso = cine.offsetHeight - cine.querySelector(".cine-palco").offsetHeight;
      return Math.min(1, Math.max(0, -r.top / (curso || 1)));
    };
    const atualizarMomentos = (p) => {
      for (const m of momentos) {
        const de = parseFloat(m.dataset.de || 0), ate = parseFloat(m.dataset.ate || 1);
        m.classList.toggle("ativo", p >= de && (p < ate || (ate >= 1 && p >= 1)));
      }
      cine.classList.toggle("andou", p > 0.02);
    };
    // Os quadros do vídeo têm ~5px de faixa preta em cima e embaixo (sobra da gravação):
    // corta 6px de cada lado da imagem de origem para não aparecer uma linha escura sob o cabeçalho.
    const corteDe = (h) => Math.min(6, Math.floor(h * 0.01));

    // Por que travava: a cada quadro novo, o navegador abria (decodificava) a imagem inteira na hora de
    // desenhar, no meio da rolagem (~20 ms por quadro no celular). Agora:
    //  • os quadros chegam como arquivo (fetch) e são abertos fora da rolagem, em segundo plano
    //    (createImageBitmap), já recortados e no tamanho do palco;
    //  • só ficam abertos os quadros perto de onde a pessoa está (pouca memória no celular);
    //  • entre dois quadros, um se mistura no outro conforme a rolagem: o movimento fica contínuo.
    const moderno = "createImageBitmap" in window && "fetch" in window;
    const arquivos = new Array(total);           // Blob de cada quadro (comprimido, leve)
    const abertos = new Map();                   // índice → ImageBitmap pronto pra desenhar
    const abrindo = new Set();
    let natural = null, recorte = null, geracao = 0, sujo = true, visivel = true, rodando = false;
    const JANELA = celular ? 7 : 5;

    const baixar = (i) => {
      if (arquivos[i] || arquivos[i] === 0) return Promise.resolve();
      arquivos[i] = 0;                            // 0 = baixando
      return fetch(src(i)).then((r) => (r.ok ? r.blob() : null)).then((b) => {
        arquivos[i] = b || undefined;
        if (b) { pedirAbertura(); }
      }).catch(() => { arquivos[i] = undefined; });
    };

    // tamanho do palco em pixels, sem passar da resolução do próprio vídeo (mais que isso só pesa)
    const medirRecorte = () => {
      if (!natural) return;
      const sh = natural.h - corteDe(natural.h) * 2, sw = natural.w;
      const cw = canvas.clientWidth || 1, chh = canvas.clientHeight || 1;
      const esc = Math.max(cw / sw, chh / sh);   // "cover"
      const vw = cw / esc, vh = chh / esc;       // pedaço do vídeo que aparece
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const k = Math.min(dpr * esc, 1);          // nunca maior que o original
      recorte = { sx: (sw - vw) / 2, sy: corteDe(natural.h) + (sh - vh) / 2, sw: vw, sh: vh,
        w: Math.max(1, Math.round(vw * k)), h: Math.max(1, Math.round(vh * k)) };
      if (canvas.width !== recorte.w || canvas.height !== recorte.h) { canvas.width = recorte.w; canvas.height = recorte.h; }
      // tamanho mudou: os quadros abertos estavam em outra medida
      geracao++; abertos.forEach((b) => b.close && b.close()); abertos.clear(); abrindo.clear(); sujo = true;
    };

    const abrir = (i) => {
      const b = arquivos[i]; if (!b || !recorte || abertos.has(i) || abrindo.has(i)) return;
      abrindo.add(i); const g = geracao;
      createImageBitmap(b, Math.round(recorte.sx), Math.round(recorte.sy), Math.round(recorte.sw), Math.round(recorte.sh),
        { resizeWidth: recorte.w, resizeHeight: recorte.h, resizeQuality: "medium" })
        .then((bm) => { abrindo.delete(i); if (g !== geracao) { bm.close(); return; } abertos.set(i, bm); sujo = true; pedirAbertura(); acordar(); })
        .catch(() => abrindo.delete(i));
    };
    // abre os quadros perto de onde a pessoa está (primeiro os da frente, na direção da rolagem) e fecha os longe
    let ultimoCentro = 0;
    function pedirAbertura() {
      if (!recorte) return;
      const c = Math.round(atual), dir = alvo >= atual ? 1 : -1;
      for (const [i, bm] of abertos) if (Math.abs(i - c) > JANELA + 3) { bm.close && bm.close(); abertos.delete(i); }
      for (let d = 0; d <= JANELA && abrindo.size < 3; d++) {
        for (const i of [c + d * dir, c - d * dir]) if (i >= 0 && i < total && abrindo.size < 3) abrir(i);
      }
      ultimoCentro = c;
    }

    // quadro mais perto já aberto (enquanto o exato não fica pronto)
    const maisPerto = (i) => {
      for (let d = 0; d < total; d++) { if (abertos.has(i - d)) return i - d; if (abertos.has(i + d)) return i + d; }
      return -1;
    };
    function desenhar() {
      if (!recorte) return;
      const a = Math.floor(atual), f = atual - a;
      const ia = abertos.has(a) ? a : maisPerto(Math.round(atual));
      if (ia < 0) return;
      ctx.globalAlpha = 1; ctx.drawImage(abertos.get(ia), 0, 0);
      // mistura com o próximo quadro conforme a rolagem
      if (ia === a && f > 0.02 && abertos.has(a + 1)) { ctx.globalAlpha = f; ctx.drawImage(abertos.get(a + 1), 0, 0); ctx.globalAlpha = 1; }
      sujo = false;
    }

    const quadro = () => {
      alvo = progresso() * (total - 1);
      const antes = atual;
      atual += (alvo - atual) * 0.2; // suaviza: sensação de filme, não de slide
      if (Math.abs(alvo - atual) < 0.01) atual = alvo;
      if (atual !== antes) sujo = true;
      if (Math.round(atual) !== ultimoCentro) pedirAbertura();
      if (sujo) desenhar();
      atualizarMomentos(atual / (total - 1));
      // parado e fora da tela: dorme até a próxima rolagem
      if (visivel && (sujo || atual !== alvo || abrindo.size)) requestAnimationFrame(quadro); else rodando = false;
    };
    function acordar() { if (!rodando && !reduzir) { rodando = true; requestAnimationFrame(quadro); } }

    if (moderno) {
      // 1º quadro primeiro (mede o vídeo); depois o filme todo em passadas (1 a cada 8, depois 1 a cada 4…)
      baixar(0).then(() => {
        if (!arquivos[0]) return;
        createImageBitmap(arquivos[0]).then((bm) => {
          natural = { w: bm.width, h: bm.height }; bm.close(); medirRecorte(); pedirAbertura();
          if (reduzir) { const t = setInterval(() => { if (abertos.has(0)) { clearInterval(t); desenhar(); } }, 50); }
        });
      });
      if (!reduzir) {
        const fila = [];
        for (const passo of [8, 4, 2, 1]) for (let i = 0; i < total; i += passo) if (!fila.includes(i)) fila.push(i);
        let k = 0, ativos = 0;
        const proximo = () => { while (ativos < 6 && k < fila.length) { ativos++; baixar(fila[k++]).finally(() => { ativos--; proximo(); }); } };
        proximo();
      }
      let tmR; addEventListener("resize", () => { clearTimeout(tmR); tmR = setTimeout(() => { medirRecorte(); pedirAbertura(); acordar(); }, 150); });
      new IntersectionObserver((es) => { visivel = es[0].isIntersecting; if (visivel) acordar(); }).observe(cine);
      addEventListener("scroll", acordar, { passive: true });
      if (reduzir) atualizarMomentos(0); else acordar();
    } else {
      // navegador antigo: desenha direto das imagens (como antes)
      const quadros = new Array(total); let desenhado = -1;
      const carregar = (i) => { if (quadros[i]) return quadros[i]; const img = new Image(); img.src = src(i); img.onload = () => { if (desenhado === -1 || Math.round(atual) === i) velho(i, true); }; return (quadros[i] = img); };
      const ok = (i) => quadros[i] && quadros[i].complete && quadros[i].naturalWidth;
      function velho(i, forcar) {
        let j = -1; for (let d = 0; d < total && j < 0; d++) { if (ok(i - d)) j = i - d; else if (ok(i + d)) j = i + d; }
        if (j < 0 || (j === desenhado && !forcar)) return;
        const img = quadros[j], cw = canvas.width, ch = canvas.height, corte = corteDe(img.naturalHeight);
        const sw = img.naturalWidth, sh = img.naturalHeight - corte * 2, e = Math.max(cw / sw, ch / sh), w = sw * e, h = sh * e;
        ctx.drawImage(img, 0, corte, sw, sh, (cw - w) / 2, (ch - h) / 2, w, h); desenhado = j;
      }
      const ajustar = () => { const dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.round(canvas.clientWidth * dpr); canvas.height = Math.round(canvas.clientHeight * dpr); velho(Math.round(atual), true); };
      for (let i = 0; i < total; i++) carregar(i);
      const loop = () => { alvo = progresso() * (total - 1); atual += (alvo - atual) * 0.18; if (Math.abs(alvo - atual) < 0.05) atual = alvo; velho(Math.round(atual)); atualizarMomentos(atual / (total - 1)); requestAnimationFrame(loop); };
      addEventListener("resize", ajustar); ajustar();
      if (reduzir) atualizarMomentos(0); else requestAnimationFrame(loop);
    }
  }

  /* ── Parallax leve nas artes ──────────────────────────────────────────── */
  const artes = reduzir ? [] : [...document.querySelectorAll(".arte")];
  if (artes.length) {
    const mover = () => {
      for (const a of artes) {
        const r = a.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        a.style.transform = `translate3d(0, ${(c * -60).toFixed(1)}px, 0) scale(1.08)`;
      }
    };
    addEventListener("scroll", () => requestAnimationFrame(mover), { passive: true });
    mover();
  }

  /* ── Revelar ao rolar ─────────────────────────────────────────────────── */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); }
  }), { threshold: 0.18 });
  document.querySelectorAll(".revelar").forEach((el) => io.observe(el));

  /* ── Vídeos do portfólio: tocam só quando aparecem na tela ─────────────── */
  const vids = reduzir ? [] : [...document.querySelectorAll(".cin-portfolio video")];
  if (vids.length) {
    const ov = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) e.target.play().catch(() => {}); else e.target.pause();
    }), { threshold: 0.25 });
    vids.forEach((v) => ov.observe(v));
  }

  /* ── Formulário → e-mail (FormSubmit) ─────────────────────────────────── */
  const form = document.querySelector(".cin-form");
  if (form) {
    const status = form.querySelector(".form-status");
    const botao = form.querySelector("button[type=submit]");
    const avisar = (txt, tipo) => { status.textContent = txt; status.className = `form-status cin-inteiro ${tipo || ""}`; };

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      if (form.elements._honey.value) return; // robô
      let valido = true;
      // WhatsApp com DDD (10 ou 11 números, aceita +55); e-mail é opcional, mas se vier tem que ser válido
      const zap = form.elements.telefone.value.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
      const zapOk = zap.length === 10 || zap.length === 11;
      form.querySelectorAll("[required], [type=email]").forEach((c) => {
        const ok = c.type === "email" ? !c.value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.value.trim())
          : c.name === "telefone" ? zapOk : c.value.trim().length > 1;
        c.closest(".cin-campo").classList.toggle("erro", !ok);
        if (!ok) valido = false;
      });
      if (!valido) return avisar(!zapOk ? "Confira os campos destacados. O WhatsApp precisa do DDD, ex.: (11) 98287-7142." : "Confira os campos destacados.", "falha");

      const dados = Object.fromEntries(new FormData(form));
      delete dados._honey;
      botao.disabled = true;
      avisar("Enviando…");
      try {
        const r = await fetch(`https://formsubmit.co/ajax/${form.dataset.destino}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ _subject: "Novo orçamento pelo site Johen Arte Gráfica", _template: "table", _captcha: "false", ...dados }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || j.success === false || j.success === "false") throw new Error(j.message || r.status);
        form.reset();
        avisar("Recebemos seu pedido de orçamento. Em breve chamamos você no WhatsApp.", "ok");
      } catch (e) {
        console.warn("Falha no envio do formulário:", e);
        avisar("Não foi possível enviar agora. Chame a gente no WhatsApp.", "falha");
      } finally {
        botao.disabled = false;
      }
    });
  }
})();
