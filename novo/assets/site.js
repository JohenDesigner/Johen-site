// Johen Arte Grafica — scripts do site novo
const ROOT = document.documentElement.dataset.root || "./";
const WPP = "5511982877142";
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- pedido (carrinho) ---------- */
const Pedido = {
  ler() { try { return JSON.parse(localStorage.getItem("johen-pedido") || "[]"); } catch (e) { return []; } },
  salvar(itens) { try { localStorage.setItem("johen-pedido", JSON.stringify(itens)); } catch (e) {} Pedido.contar(); },
  add(item) { const i = Pedido.ler(); i.push({ ...item, uid: Date.now() + Math.random().toString(36).slice(2, 6) }); Pedido.salvar(i); },
  tirar(uid) { Pedido.salvar(Pedido.ler().filter(x => x.uid !== uid)); },
  contar() { const n = Pedido.ler().length; $$(".contador").forEach(c => { c.textContent = n; c.hidden = !n; }); }
};
function toast(html) {
  $(".toast")?.remove();
  const t = document.createElement("div"); t.className = "toast"; t.innerHTML = html; t.setAttribute("role", "status");
  document.body.appendChild(t); setTimeout(() => t.remove(), 4200);
}
function wppLink(msg) { return `https://wa.me/${WPP}?text=${encodeURIComponent(msg)}`; }

/* ---------- menu ---------- */
function iniciarMenu() {
  const m = $("#menu"); if (!m) return;
  $$("[data-abrir-menu]").forEach(b => b.addEventListener("click", () => { m.hidden = false; $(".fechar", m).focus(); }));
  $$("[data-fechar-menu]").forEach(b => b.addEventListener("click", () => m.hidden = true));
  m.addEventListener("click", e => { if (e.target === m) m.hidden = true; });
  document.addEventListener("keydown", e => { if (e.key === "Escape") m.hidden = true; });
}

/* ---------- busca ---------- */
let catalogo = null;
async function carregarCatalogo() {
  if (catalogo) return catalogo;
  const r = await fetch(ROOT + "dados/produtos.json"); catalogo = await r.json(); return catalogo;
}
const norm = s => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function precoMin(p) { if (p.m2) return p.m2; return Math.min(...p.opcoes.map(o => o.preco)); }
function iniciarBusca() {
  const inp = $("#busca"), box = $("#resultados"); if (!inp) return;
  let tm;
  inp.addEventListener("input", () => {
    clearTimeout(tm);
    tm = setTimeout(async () => {
      const q = norm(inp.value.trim());
      if (q.length < 2) { box.hidden = true; return; }
      let cat;
      try { cat = await carregarCatalogo(); } catch (e) { box.innerHTML = "<p>Não deu pra buscar agora. Confira sua internet e tente de novo.</p>"; box.hidden = false; return; }
      const res = [];
      for (const [c, ps] of Object.entries(cat)) for (const p of ps)
        if (norm(p.nome + " " + p.subNome + " " + c + " " + p.material).includes(q)) res.push([c, p]);
      box.innerHTML = res.length ? res.slice(0, 12).map(([c, p]) =>
        `<a href="${ROOT}${c}/${p.id}/"><img src="${ROOT}${p.img}" alt="" loading="lazy"><span>${p.nome}<small>a partir de ${brl(precoMin(p))}${p.m2 ? " o m²" : ""}</small></span></a>`).join("")
        : `<p>Nada encontrado pra "${inp.value}". Tente "caneca", "cartão" ou "adesivo", ou <a href="${wppLink("Olá! Procurei no site e não achei: " + inp.value)}">pergunte no WhatsApp</a>.</p>`;
      box.hidden = false;
    }, 180);
  });
  document.addEventListener("click", e => { if (!e.target.closest(".busca")) box.hidden = true; });
}

/* ---------- hero (vídeo ou slides) ---------- */
function iniciarHero() {
  const midia = $(".hero-midia"); if (!midia) return;
  const imgs = $$("img", midia), vid = $("video", midia);
  let i = 0, timer;
  const passar = () => { imgs.forEach(x => x.classList.remove("on")); imgs[i % imgs.length].classList.add("on"); i++; };
  const slides = () => { passar(); timer = setInterval(passar, 3000); };
  slides();
  if (vid) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { vid.remove(); return; }
    vid.addEventListener("playing", () => { clearInterval(timer); imgs.forEach(x => x.remove()); $(".hero .rascunho")?.remove(); });
  }
}

/* ---------- filtros da categoria ---------- */
function iniciarFiltros() {
  const bar = $(".filtros"); if (!bar) return;
  bar.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$("button", bar).forEach(x => x.setAttribute("aria-pressed", x === b));
    const f = b.dataset.f;
    $$(".grade .pcard").forEach(c => c.hidden = f !== "todos" && c.dataset.sub !== f);
  });
}

/* ---------- página de produto ---------- */
function iniciarProduto() {
  const dado = $("#dados-produto"); if (!dado) return;
  const p = JSON.parse(dado.textContent);
  const sel = $("#opcao"), larg = $("#largura"), alt = $("#altura"), cx = $("#caixinha");
  const qtdOut = $("#qtd"), totalEl = $("#total"), unEl = $("#total-un"), minEl = $("#aviso-min");
  let qtd = 1;
  const multiplica = !p.m2 && !(p.opcoes[0]?.label || "").includes(" un.");
  if (!multiplica && $(".campo-qtd")) $(".campo-qtd").hidden = true;
  function calc() {
    let un, desc;
    if (p.m2) {
      const w = parseFloat(larg.value) || 0, h = parseFloat(alt.value) || 0;
      const area = (w / 100) * (h / 100);
      un = area * p.m2; desc = `${w} × ${h} cm`;
      let tot = un * qtd;
      minEl.hidden = !(tot > 0 && tot < p.minimo);
      if (tot > 0 && tot < p.minimo) tot = p.minimo;
      return { total: tot, un, desc };
    }
    const o = p.opcoes[sel ? sel.selectedIndex : 0];
    un = o.preco + (cx?.checked ? p.caixinha : 0);
    desc = o.label + (cx?.checked ? " + caixinha personalizada" : "");
    return { total: un * (multiplica ? qtd : 1), un, desc };
  }
  function render() {
    const r = calc();
    totalEl.textContent = brl(r.total);
    if (unEl) unEl.textContent = multiplica && qtd > 1 ? `(${brl(r.un)} cada)` : "";
    if (qtdOut) qtdOut.textContent = qtd;
  }
  [sel, larg, alt, cx].forEach(el => el?.addEventListener("input", render));
  $("#menos")?.addEventListener("click", () => { qtd = Math.max(1, qtd - 1); render(); });
  $("#mais")?.addEventListener("click", () => { qtd++; render(); });
  $("#add")?.addEventListener("click", () => {
    const r = calc();
    if (p.m2 && !(r.un > 0)) { toast("Coloque a largura e a altura em cm"); larg.focus(); return; }
    Pedido.add({ c: p.c, id: p.id, nome: p.nome, img: p.img, desc: r.desc, qtd: multiplica || p.m2 ? qtd : 1, total: r.total });
    toast(`Adicionado ao pedido. <a href="${ROOT}pedido/">Ver pedido</a>`);
  });
  $("#pedir-agora")?.addEventListener("click", e => {
    const r = calc();
    e.currentTarget.href = wppLink(`Olá! Quero pedir:\n• ${p.nome}\n• ${r.desc}${(multiplica || p.m2) && qtd > 1 ? `\n• Quantidade: ${qtd}` : ""}\n• Total no site: ${brl(r.total)}\n\nVou mandar a arte aqui na conversa.`);
  });
  render();
}

/* ---------- página do pedido ---------- */
function iniciarPedido() {
  const lista = $("#itens"); if (!lista) return;
  function render() {
    const itens = Pedido.ler();
    const tot = itens.reduce((s, x) => s + x.total, 0);
    $("#pedido-cheio").hidden = !itens.length; $("#pedido-vazio").hidden = !!itens.length;
    lista.innerHTML = itens.map(x => `
      <div class="item">
        <img src="${x.arte || ROOT + x.img}" alt="">
        <div><b>${x.nome}</b><small>${x.desc}${x.qtd > 1 ? ` · ${x.qtd} un.` : ""}</small>${x.arte ? "<small>Com sua arte (prévia)</small>" : ""}<button data-tirar="${x.uid}">Remover</button></div>
        <div class="valor">${brl(x.total)}</div>
      </div>`).join("");
    $("#pedido-total").textContent = brl(tot);
    const msg = "Olá! Quero fazer este pedido pelo site:\n\n" + itens.map((x, n) => `${n + 1}. ${x.nome}\n   ${x.desc}${x.qtd > 1 ? ` · ${x.qtd} un.` : ""} — ${brl(x.total)}`).join("\n") + `\n\nTotal: ${brl(tot)}\n\nVou mandar as artes aqui na conversa.`;
    $("#enviar-pedido").href = wppLink(msg);
  }
  lista.addEventListener("click", e => { const b = e.target.closest("[data-tirar]"); if (b) { Pedido.tirar(b.dataset.tirar); render(); } });
  $("#copiar-pix")?.addEventListener("click", async e => {
    const txt = $("#chave-pix").textContent.trim();
    try { await navigator.clipboard.writeText(txt); toast("Chave Pix copiada"); }
    catch (err) { const r = document.createRange(); r.selectNodeContents($("#chave-pix")); getSelection().removeAllRanges(); getSelection().addRange(r); toast("Chave selecionada, toque em Copiar"); }
  });
  render();
}

document.addEventListener("DOMContentLoaded", () => {
  Pedido.contar(); iniciarMenu(); iniciarBusca(); iniciarHero(); iniciarFiltros(); iniciarProduto(); iniciarPedido();
});
