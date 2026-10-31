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
// "3 un.", ou "3 cartelas" / "1 estampa" quando o produto é vendido por cartela ou estampa
const qtdTxt = (n, qn) => qn ? `${n} ${n > 1 ? qn[1] : qn[0]}` : `${n} un.`;
// descrição + quantidade do item no pedido (por cartela/estampa a quantidade sempre aparece)
const linhaItem = x => [x.desc, x.qtd > 1 || !x.desc ? qtdTxt(x.qtd, x.qn) : ""].filter(Boolean).join(" · ");

// nome do item no pedido e no WhatsApp: "Couché 300g — Fosco…" sozinho não diz que é cartão de visita
const TIPO = { cartoes: "Cartão de visita", panfletos: "Panfleto" };
const nomeItem = x => TIPO[x.c] ? `${TIPO[x.c]} ${x.nome}` : x.nome;

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
// nomes que o cliente digita pra cada categoria e serviço (mesmos termos das páginas)
const BUSCA_CAT = { cartoes: "cartao de visita", panfletos: "panfleto folheto flyer", banners: "banner",
  adesivos: "adesivo", camisetas: "camiseta camisa", canecas: "caneca" };
const BUSCA_SERV = [
  ["gravacao-laser", "Gravação a Laser", "gravacao laser garrafa copo madeira acrilico placa chaveiro tabua trofeu", "img/produtos/canecas-p9.webp"],
  ["envelopamento", "Envelopamento e Vitrine", "envelopamento frota carro moto van caminhao vitrine fachada jateado", "img/produtos/adesivos-p16.webp"],
  ["design", "Criação de Arte", "criacao arte logo logotipo marca post instagram", "img/produtos/panfletos-p2.webp"],
  ["comercio", "Para seu Comércio", "comercio cardapio 3d site mensalidade comunicacao visual", "img/produtos/adesivos-p12.webp"]];
const PAL_VAZIA = new Set(["de", "da", "do", "das", "dos", "e", "com", "pra", "para", "o", "a", "um", "uma"]);
// "cartões"/"cartão" → "cartao", "canecas" → "caneca"
const raizes = s => s.split(/[^a-z0-9]+/).filter(Boolean).map(w => w.length > 3 ? w.replace(/(oes|aes)$/, "ao").replace(/s$/, "") : w);
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
      // palavra por palavra, sem ligar pra plural ("cartão" acha "cartões", "panfleto a4" acha o A4)
      const pals = raizes(q).filter(w => !PAL_VAZIA.has(w));
      const bate = txt => { const h = raizes(norm(txt)).join(" "); return pals.length && pals.every(w => h.includes(w)); };
      const res = [];
      for (const [c, ps] of Object.entries(cat)) for (const p of ps)
        if (bate([p.nome, p.subNome, p.material, p.acab, p.impressao, BUSCA_CAT[c] || c].join(" "))) res.push([c, p]);
      const serv = BUSCA_SERV.filter(s => bate(s[1] + " " + s[2]));
      box.innerHTML = (res.length || serv.length) ? res.slice(0, 12).map(([c, p]) =>
        `<a href="${ROOT}${c}/${p.id}/"><img src="${ROOT}${p.img}" alt="" loading="lazy"><span>${TIPO[c] ? TIPO[c] + " " : ""}${p.nome}<small>a partir de ${brl(precoMin(p))}${p.m2 ? " o m²" : ""}</small></span></a>`).join("") +
        serv.map(([slug, nome, , img]) =>
        `<a href="${ROOT}${slug}/"><img src="${ROOT}${img}" alt="" loading="lazy"><span>${nome}<small>orçamento pelo WhatsApp</small></span></a>`).join("")
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
    // opção única ("cada", "por cartela") não entra na descrição: vira "2 un." / "3 cartelas"
    // p.dif: acabamento que separa dois produtos de mesmo nome (ex.: copo com gravação 360º)
    const rotulo = [p.dif, p.opcoes.length === 1 ? "" : o.label.replace(/\s*\(\+R\$\s*\d+\)/, "")].filter(Boolean).join(" · ");
    desc = cx?.checked ? (rotulo ? rotulo + " + caixinha personalizada" : "com caixinha personalizada") : rotulo;
    return { total: un * (multiplica ? qtd : 1), un, desc };
  }
  // mensagem pronta do "Pedir agora": já sai com produto, opção, quantidade e valor
  function msgPedir() {
    const r = calc();
    const qt = p.qn || !r.desc ? qtdTxt(qtd, p.qn) : (multiplica || p.m2) && qtd > 1 ? `${qtd} ${p.m2 ? "peças" : "un."}` : "";
    return `Olá! Quero ${[nomeItem(p), r.desc, qt].filter(Boolean).join(", ")} – ${brl(r.total)}.`;
  }
  function render() {
    const r = calc();
    const novo = brl(r.total);
    if (totalEl.textContent.replace(/\s/g, "") !== novo.replace(/\s/g, "")) {
      totalEl.textContent = novo;
      // o valor "assenta" de leve quando muda (quantidade/opção), pra pessoa notar sem chamar atenção
      totalEl.classList.remove("muda"); void totalEl.offsetWidth; totalEl.classList.add("muda");
    } else totalEl.textContent = novo;
    if (unEl) unEl.textContent = multiplica && qtd > 1 ? `(${brl(r.un)} cada)` : (p.un || "");  // ex.: "por cartela"
    if (qtdOut) qtdOut.textContent = qtd;
    const pa = $("#pedir-agora"); if (pa) pa.href = wppLink(msgPedir());
    // leva a quantidade escolhida para o editor (senão o pedido montado lá sai com 1 peça só)
    const pers = $("#personalizar");
    if (pers) { const u = new URL(pers.href); qtd > 1 ? u.searchParams.set("q", qtd) : u.searchParams.delete("q"); pers.href = u.toString(); }
  }
  [sel, larg, alt, cx].forEach(el => el?.addEventListener("input", render));
  // leva a escolha da caixinha para o editor
  const pers = $("#personalizar");
  if (pers && cx) cx.addEventListener("change", () => { const u = new URL(pers.href); cx.checked ? u.searchParams.set("cx", "1") : u.searchParams.delete("cx"); pers.href = u.toString(); });
  // leva a opção escolhida (ex.: copo frente e verso) para o editor, com o mesmo preço
  if (pers && sel) sel.addEventListener("change", () => { const u = new URL(pers.href); sel.selectedIndex ? u.searchParams.set("o", sel.selectedIndex) : u.searchParams.delete("o"); pers.href = u.toString(); });
  $("#menos")?.addEventListener("click", () => { qtd = Math.max(1, qtd - 1); render(); });
  $("#mais")?.addEventListener("click", () => { qtd++; render(); });
  $("#add")?.addEventListener("click", () => {
    const r = calc();
    if (p.m2 && !(r.un > 0)) { toast("Coloque a largura e a altura em cm"); larg.focus(); return; }
    Pedido.add({ c: p.c, id: p.id, nome: p.nome, img: p.img, desc: r.desc, qtd: multiplica || p.m2 ? qtd : 1, qn: p.qn || undefined, total: r.total });
    toast(`Adicionado ao pedido. <a href="${ROOT}pedido/">Ver pedido</a>`);
  });
  $("#pedir-agora")?.addEventListener("click", e => { e.currentTarget.href = wppLink(msgPedir()); });
  render();
}

/* ---------- Pix copia e cola (BR Code do Banco Central) com o valor do pedido ---------- */
function pixCopiaECola(chave, nome, cidade, valor) {
  const campo = (id, v) => id + String(v.length).padStart(2, "0") + v;
  const conta = campo("00", "br.gov.bcb.pix") + campo("01", chave);
  let p = campo("00", "01") + campo("26", conta) + campo("52", "0000") + campo("53", "986")
    + (valor > 0 ? campo("54", valor.toFixed(2)) : "") + campo("58", "BR")
    + campo("59", nome.slice(0, 25)) + campo("60", cidade.slice(0, 15)) + campo("62", campo("05", "***")) + "6304";
  let crc = 0xFFFF;                       // CRC16-CCITT, exigido no fim do código
  for (const ch of p) { crc ^= ch.charCodeAt(0) << 8; for (let k = 0; k < 8; k++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF; }
  return p + crc.toString(16).toUpperCase().padStart(4, "0");
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
        ${x.artes ? `<div class="item-fotos">${x.artes.map(a => `<img src="${a}" alt="">`).join("")}</div>` : `<img src="${x.arte || ROOT + x.img}" alt="">`}
        <div><b>${nomeItem(x)}</b><small>${linhaItem(x)}</small>${x.artes ? "<small>Com sua arte (prévia da frente e das costas)</small>" : x.arte ? "<small>Com sua arte (prévia)</small>" : ""}<button data-tirar="${x.uid}">Remover</button></div>
        <div class="valor">${brl(x.total)}</div>
      </div>`).join("");
    $("#pedido-total").textContent = brl(tot);
    const msg = "Olá! Quero fazer este pedido pelo site:\n\n" + itens.map((x, n) => `${n + 1}. ${nomeItem(x)}\n   ${linhaItem(x)} — ${brl(x.total)}`).join("\n") + `\n\nTotal: ${brl(tot)}\n\nVou mandar as artes aqui na conversa.`;
    $("#enviar-pedido").href = wppLink(msg);
    const bp = $("#bloco-pix");
    if (bp) { const v = Math.round(tot * 100) / 100; $("#pix-codigo").textContent = pixCopiaECola(bp.dataset.chave, bp.dataset.nome, bp.dataset.cidade, v); $("#pix-valor").textContent = brl(v); }
  }
  lista.addEventListener("click", e => { const b = e.target.closest("[data-tirar]"); if (b) { Pedido.tirar(b.dataset.tirar); render(); } });
  $("#copiar-pix")?.addEventListener("click", async e => {
    const alvo = $("#pix-codigo") || $("#chave-pix"); const txt = alvo.textContent.trim();
    try { await navigator.clipboard.writeText(txt); toast("Código Pix copiado. Agora cole no app do banco."); }
    catch (err) { const r = document.createRange(); r.selectNodeContents(alvo); getSelection().removeAllRanges(); getSelection().addRange(r); toast("Código selecionado, toque em Copiar"); }
  });
  render();
}

document.addEventListener("DOMContentLoaded", () => {
  // links para "#seção" param abaixo do cabeçalho fixo, não por baixo dele
  const topo = $(".topo");
  if (topo) { const folga = () => document.documentElement.style.scrollPaddingTop = topo.offsetHeight + 12 + "px"; folga(); addEventListener("resize", folga); }
  Pedido.contar(); iniciarMenu(); iniciarBusca(); iniciarHero(); iniciarFiltros(); iniciarProduto(); iniciarPedido();
});
