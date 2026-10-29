// Caneca 3D (mockup): mostra a arte da área de impressão dando a volta na caneca, gira com o dedo/mouse,
// troca cor, baixa foto PNG e grava vídeo girando. Usa three.js (assets/vendor/).
const palco = document.getElementById("palco3d"), cv = document.getElementById("tela3d");
const acoes = document.getElementById("acoes3d"), aviso3d = document.getElementById("aviso3d");
const bGirar = document.getElementById("girar3d"), bFoto = document.getElementById("foto3d"), bVideo = document.getElementById("video3d");
const FUNDO = "#eef1f1";
// marca d'água: logo da Johen bem clarinha, repetida na diagonal, no fundo da tela e nas fotos/vídeos baixados
const MARCA = new Image();
MARCA.src = new URL("../img/marca/logo-wordmark.webp", import.meta.url).href;
function fundoComMarca(tam) {
  const c = document.createElement("canvas"); c.width = c.height = tam; const x = c.getContext("2d");
  x.fillStyle = FUNDO; x.fillRect(0, 0, tam, tam);
  if (MARCA.complete && MARCA.naturalWidth) {
    x.save(); x.globalAlpha = 0.06; x.translate(tam / 2, tam / 2); x.rotate(-Math.PI / 9);
    const w = tam * 0.24, h = w * MARCA.naturalHeight / MARCA.naturalWidth, sx = w * 1.7, sy = h * 3.4;
    for (let yy = -tam, i = 0; yy < tam; yy += sy, i++) for (let xx = -tam - (i % 2) * sx / 2; xx < tam; xx += sx) x.drawImage(MARCA, xx, yy, w, h);
    x.restore();
  }
  return c;
}
function marcaNaTela() {
  const palco = document.getElementById("palco3d"); if (!palco) return;
  palco.style.backgroundImage = `url(${fundoComMarca(900).toDataURL("image/png")})`;
  palco.style.backgroundSize = "cover"; palco.style.backgroundPosition = "center";
}
if (MARCA.complete) marcaNaTela(); else MARCA.addEventListener("load", marcaNaTela);
let gravando = false;

iniciar().then(v => {
  // só anima enquanto a caneca está na tela (economiza bateria)
  new IntersectionObserver(([e]) => e.isIntersecting ? v.ligar() : v.parar()).observe(palco);
}).catch(err => {
  console.warn(err); acoes.hidden = true;
  aviso3d.textContent = "Seu aparelho não conseguiu abrir o 3D. A área de impressão abaixo continua funcionando.";
});

async function iniciar() {
  const T = await import("./vendor/three.module.min.js");
  const { RoomEnvironment } = await import("./vendor/RoomEnvironment.js");
  const renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = T.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);
  const scene = new T.Scene();
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const luz = new T.DirectionalLight(0xffffff, 0.9); luz.position.set(-2, 3, 2.5); scene.add(luz);
  const camera = new T.PerspectiveCamera(28, 1, 0.1, 20);
  const MOD = (window.CanecaArte && window.CanecaArte.modelo) || { tipo: "caneca", w: 20, h: 8.5 };
  const caneca = new T.Group(); scene.add(caneca);           // grupo que gira (caneca ou copo)
  const TW = Math.min(3072, renderer.capabilities.maxTextureSize);
  const V = (x, y) => new T.Vector2(x, y);
  const M = MOD.tipo === "camiseta" ? montarCamiseta() : MOD.tipo === "copo" ? montarCopo() : montarCaneca();
  const alvo = M.alvo, pintarTextura = M.pintar;
  camera.far = Math.max(20, M.dist * 2.5); camera.updateProjectionMatrix();

  // ---------- caneca de cerâmica (1 unidade = 10 cm): 8,2 cm de diâmetro, 9,5 cm de altura
  function montarCaneca() {
    const R = 0.41, H = 0.95, BASE = 0.03, PAREDE = H - BASE;
    // textura da parede = volta inteira; começa e termina na alça, centro = frente (lado oposto à alça)
    const TH = Math.round(TW * PAREDE / (2 * Math.PI * R));
    const tc = document.createElement("canvas"); tc.width = TW; tc.height = TH; const tx = tc.getContext("2d");
    const tex = new T.CanvasTexture(tc); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const pxU = TW / (2 * Math.PI * R), pxV = TH / PAREDE;
    const ceramica = { roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.85 };
    const matParede = new T.MeshPhysicalMaterial({ ...ceramica, map: tex });
    const matCorpo = new T.MeshPhysicalMaterial({ ...ceramica, side: T.DoubleSide });
    const matDetalhe = new T.MeshPhysicalMaterial({ ...ceramica, side: T.DoubleSide });
    const parede = new T.Mesh(new T.CylinderGeometry(R, R, PAREDE, 160, 1, true, Math.PI / 2, Math.PI * 2), matParede);
    parede.position.y = BASE + PAREDE / 2; caneca.add(parede);
    caneca.add(new T.Mesh(new T.LatheGeometry([V(0, 0), V(0.36, 0), V(0.395, 0.008), V(R, BASE)], 160), matCorpo));
    caneca.add(new T.Mesh(new T.LatheGeometry([V(R, H), V(0.409, H + 0.006), V(0.403, H + 0.011), V(0.394, H + 0.011), V(0.388, H + 0.006),
      V(0.385, H), V(0.385, 0.10), V(0.37, 0.085), V(0, 0.08)], 160), matDetalhe));
    // alça em "D", mais fina e achatada nas laterais, como a de uma caneca de 325 ml
    const curva = new T.CatmullRomCurve3([[0.38, 0.79], [0.50, 0.80], [0.61, 0.77], [0.68, 0.68], [0.70, 0.54], [0.67, 0.40], [0.59, 0.29], [0.49, 0.245], [0.38, 0.24]].map(([x, y]) => new T.Vector3(x, y, 0)));
    const alcaGeo = new T.TubeGeometry(curva, 140, 0.036, 32, false); alcaGeo.scale(1, 1, 1.5);
    for (const y of [0.795, 0.24]) {        // encontro da alça com a parede um pouco mais cheio
      const junta = new T.Mesh(new T.SphereGeometry(0.046, 32, 16), matDetalhe);
      junta.scale.set(0.9, 1, 1.45); junta.position.set(0.395, y, 0); caneca.add(junta);
    }
    caneca.add(new T.Mesh(alcaGeo, matDetalhe));
    function pintar() {
      const E = window.CanecaArte; const cor = E ? E.cores() : { corpo: "#ffffff", detalhe: "#ffffff" };
      tx.fillStyle = cor.corpo; tx.fillRect(0, 0, TW, TH);
      if (E) {
        const A = E.area, w = MOD.w / 10 * pxU, h = MOD.h / 10 * pxV, x0 = TW / 2 - w / 2, y0 = TH / 2 - h / 2;
        tx.save(); tx.translate(x0, y0); tx.scale(w / A.w, h / A.h); tx.translate(-A.x, -A.y); E.pintar(tx); tx.restore();
      }
      tex.needsUpdate = true; matCorpo.color.set(cor.corpo); matDetalhe.color.set(cor.detalhe);
    }
    return { alvo: new T.Vector3(0, 0.47, 0), dist: 3.3, rot: 0.45, pintar };
  }

  // ---------- copo térmico 473 ml: inox com pintura, base e borda de aço, tampa preta com trava
  function montarCopo() {
    const r = y => 0.36 + 0.06 * y;                         // copo mais largo em cima (7,2 → 9 cm)
    const B = 0.22, TOPO = 1.42, PINT = TOPO - B, RM = r((B + TOPO) / 2);
    const TH = Math.round(TW * PINT / (2 * Math.PI * RM));
    const pxU = TW / (2 * Math.PI * RM), pxV = TH / PINT;
    const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
    const tc = mk(TW, TH), tx = tc.getContext("2d");     // cor: pintura + aço onde grava
    const pc = mk(TW, TH), px = pc.getContext("2d");     // verde = aspereza, azul = metal
    const gc = mk(TW, TH), gx = gc.getContext("2d");     // máscara da gravação
    const tex = new T.CanvasTexture(tc); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const props = new T.CanvasTexture(pc);
    const aco = { color: 0xd9dcdf, metalness: 1, roughness: 0.26, envMapIntensity: 1 };
    const matPint = new T.MeshPhysicalMaterial({ map: tex, metalnessMap: props, roughnessMap: props, metalness: 1, roughness: 1, clearcoat: 0.35, clearcoatRoughness: 0.4 });
    const matAco = new T.MeshPhysicalMaterial({ ...aco, side: T.DoubleSide });
    const matTampa = new T.MeshPhysicalMaterial({ color: 0x18191b, roughness: 0.55, metalness: 0, clearcoat: 0.2, side: T.DoubleSide });
    const corpo = new T.Mesh(new T.CylinderGeometry(r(TOPO), r(B), PINT, 160, 1, true, Math.PI, Math.PI * 2), matPint);
    corpo.position.y = B + PINT / 2; caneca.add(corpo);
    caneca.add(new T.Mesh(new T.LatheGeometry([V(0, 0.004), V(0.335, 0), V(0.352, 0.005), V(r(0.014), 0.014), V(r(B - 0.006), B - 0.006), V(r(B) - 0.003, B - 0.002), V(r(B), B)], 160), matAco));
    caneca.add(new T.Mesh(new T.LatheGeometry([V(r(TOPO), TOPO), V(r(TOPO) - 0.003, TOPO + 0.003), V(r(1.5), 1.5), V(r(1.5) - 0.004, 1.506)], 160), matAco));
    caneca.add(new T.Mesh(new T.LatheGeometry([V(r(1.5) - 0.004, 1.503), V(0.448, 1.525), V(0.44, 1.545), V(0.40, 1.552), V(0, 1.552)], 160), matTampa));
    const trava = new T.Mesh(new T.BoxGeometry(0.15, 0.03, 0.08), matAco); trava.position.set(0, 1.56, 0.35); caneca.add(trava);
    function pintar() {
      const E = window.CanecaArte; const cor = E ? E.cores() : { corpo: "#1e1f21" };
      tx.fillStyle = cor.corpo; tx.fillRect(0, 0, TW, TH);
      px.fillStyle = "rgb(0,135,0)"; px.fillRect(0, 0, TW, TH);
      gx.clearRect(0, 0, TW, TH);
      if (E) {
        const A = E.area, w = MOD.w / 10 * pxU, h = MOD.h / 10 * pxV, x0 = TW / 2 - w / 2, y0 = TH / 2 - h / 2;
        for (const c of [tx, gx]) { c.save(); c.translate(x0, y0); c.scale(w / A.w, h / A.h); c.translate(-A.x, -A.y); E.pintar(c); c.restore(); }
        gx.save(); gx.globalCompositeOperation = "source-in"; gx.fillStyle = "rgb(0,70,255)"; gx.fillRect(0, 0, TW, TH); gx.restore();
        px.drawImage(gc, 0, 0);
      }
      tex.needsUpdate = true; props.needsUpdate = true;
    }
    return { alvo: new T.Vector3(0, 0.78, 0), dist: 3.9, rot: -0.25, pintar };
  }

  // ---------- camiseta (1 unidade = 10 cm, tamanho M) vestida num manequim invisível: tronco com volume de corpo
  // (peito, costas e ombros arredondados), mangas em tubo caindo para os lados, gola canelada, barra e mangas abertas,
  // dobrinhas de tecido e trama de malha. Frente e costas têm textura própria (estampa); com "Girar sozinha" ligado,
  // a camiseta "caminha" de leve (mangas balançam e o tronco acompanha).
  function montarCamiseta() {
    const lerp = (a, b, t) => a + (b - a) * t, G = (v, s) => Math.exp(-(v * v) / s);
    // seções do tronco, de baixo para cima: altura, meia largura, meia profundidade, centro (z) e "quadradez" da seção
    const SEC = [[0, 2.02, 1.12, 0, 2.25], [1.3, 1.98, 1.08, 0, 2.25], [2.6, 1.95, 1.07, 0.02, 2.3], [3.8, 2.06, 1.16, 0.05, 2.4],
      [4.8, 2.2, 1.24, 0.07, 2.5], [5.6, 2.25, 1.2, 0.05, 2.5], [6.2, 2.24, 1.06, 0.02, 2.4]];
    const S0 = 0.8;                               // até aqui é tronco reto; depois sobe pelos ombros até a gola
    const cr = (p0, p1, p2, p3, t) => 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
    function secao(u) {                            // seção interpolada (Catmull-Rom) no índice u
      const i = Math.min(SEC.length - 2, Math.floor(u)), t = u - i, k = j => SEC[Math.max(0, Math.min(SEC.length - 1, j))];
      return SEC[0].map((_, f) => cr(k(i - 1)[f], k(i)[f], k(i + 1)[f], k(i + 2)[f], t));
    }
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const unit = v => { const l = Math.hypot(...v) || 1; return v.map(c => c / l); };
    const pw = (v, e) => Math.sign(v) * Math.abs(v) ** e;
    function anel([y, a, b, zc, n], th) { const e = 2 / n; return [a * pw(Math.sin(th), e), y, zc + b * pw(Math.cos(th), e)]; }
    function gola(th) {                            // decote: fundo na frente, raso nas costas
      const c = Math.cos(th), f = c > 0;
      return [0.98 * Math.sin(th), 7.25 - (f ? 0.58 : 0.1) * Math.abs(c) ** 1.6, (f ? 0.84 : 0.6) * c - 0.04];
    }
    const TOPO = secao(SEC.length - 1);
    function P(s, th) {                            // ponto da superfície do tronco (s: barra 0 → gola 1; th: 0 = meio da frente)
      if (s <= S0) {
        const sc = secao(s / S0 * (SEC.length - 1)), p = anel(sc, th), y = p[1];
        // volume: peitoral, escápulas, cava funda embaixo da manga e dobras verticais que crescem perto da barra
        const t = Math.atan2(Math.sin(th), Math.cos(th)), at = Math.abs(t);
        const baixo = Math.max(0, 1 - y / 3.2) ** 2;
        const d = 0.06 * G(y - 5.0, 0.4) * (G(t - 0.45, 0.07) + G(t + 0.45, 0.07))
          + 0.035 * G(y - 5.4, 0.5) * G(at - 2.45, 0.12)
          - 0.06 * G(y - 5.25, 0.25) * G(at - Math.PI / 2, 0.05)
          + baixo * (0.03 * Math.sin(t * 7 + 0.6) + 0.014 * Math.sin(t * 13 + y * 1.3))
          + 0.012 * G(y - 2.7, 0.6) * Math.sin(t * 9 - 1);
        const some = Math.min(1, Math.max(0, (6.2 - y) / 0.7)), dd = d * some * some * (3 - 2 * some);   // some perto do ombro (sem vinco)
        const rx = p[0], rz = p[2] - sc[3], l = Math.hypot(rx, rz) || 1;
        return [p[0] + rx / l * dd, y, p[2] + rz / l * dd];
      }
      const t = (s - S0) / (1 - S0), L = anel(TOPO, th), U = gola(th);
      // controle na continuação da parede de baixo (sem vinco): ombro arredondado
      const dir = unit(sub(L, anel(secao(SEC.length - 1.06), th))), k = (lerp(L[1], U[1], 0.72) - L[1]) / Math.max(dir[1], 0.3);
      const C = [0, 1, 2].map(c => L[c] + dir[c] * k);
      return [0, 1, 2].map(k => (1 - t) * (1 - t) * L[k] + 2 * (1 - t) * t * C[k] + t * t * U[k]);
    }
    // textura de cada lado: tecido "aberto" (largura = caminho em volta do tronco, altura = caminho desde a barra)
    const X0 = -3.1, X1 = 3.1, Y0 = -0.2, Y1 = 8.0;
    const NC = 112, NS = 170;
    function painel(l) {
      const th0 = l === "frente" ? -Math.PI / 2 : Math.PI / 2;
      const pos = [], nor = [], grid = [];
      for (let j = 0; j <= NS; j++) { const s = j / NS, linha = [];
        for (let i = 0; i <= NC; i++) {
          const th = th0 + Math.PI * i / NC, p = P(s, th);
          const h = 1e-3, n = unit(cruz(sub(P(s, th + h), P(s, th - h)), sub(P(Math.min(1, s + h), th), P(Math.max(0, s - h), th))));
          linha.push(p); pos.push(...p); nor.push(...n);
        }
        grid.push(linha);
      }
      // coordenadas do tecido aberto: x = caminho pelo anel a partir do meio; y = caminho por cada coluna desde a barra
      const meio = NC / 2, uv = new Float32Array((NS + 1) * (NC + 1) * 2), fy = new Float32Array(NC + 1);
      for (let j = 0; j <= NS; j++) {
        const fx = new Float32Array(NC + 1);
        for (let i = meio + 1; i <= NC; i++) fx[i] = fx[i - 1] + Math.hypot(...sub(grid[j][i], grid[j][i - 1]));
        for (let i = meio - 1; i >= 0; i--) fx[i] = fx[i + 1] - Math.hypot(...sub(grid[j][i], grid[j][i + 1]));
        for (let i = 0; i <= NC; i++) {
          if (j) fy[i] += Math.hypot(...sub(grid[j][i], grid[j - 1][i]));
          const k = (j * (NC + 1) + i) * 2; uv[k] = (fx[i] - X0) / (X1 - X0); uv[k + 1] = (fy[i] - Y0) / (Y1 - Y0);
        }
      }
      const ind = [];
      for (let j = 0; j < NS; j++) for (let i = 0; i < NC; i++) {
        const a = j * (NC + 1) + i, b = a + 1, c = a + NC + 1, d = c + 1; ind.push(a, b, d, a, d, c);
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new T.Float32BufferAttribute(nor, 3));
      g.setAttribute("uv", new T.BufferAttribute(uv, 2)); g.setIndex(ind);
      return { g, gola: fy[meio] };                  // altura (no tecido) do meio da gola
    }
    const veste = new T.Group(); caneca.add(veste);  // tudo da camiseta (balança junto na animação)
    const TWc = Math.min(2048, TW), THc = Math.round(TWc * (Y1 - Y0) / (X1 - X0)), ppu = TWc / (X1 - X0);
    const P2 = (x, y) => [(x - X0) * ppu, (Y1 - y) * ppu];
    const malha = document.createElement("canvas"); malha.width = malha.height = 256;       // trama do tecido
    { const m = malha.getContext("2d"), d = m.createImageData(256, 256);
      for (let i = 0; i < 256 * 256; i++) { const x = i % 256, y = (i / 256) | 0, v = 128 + 22 * Math.sin(x * 2.1) * Math.sin(y * 2.1) + (Math.random() - 0.5) * 30;
        d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
      m.putImageData(d, 0, 0); }
    const tecido = { roughness: 0.92, metalness: 0, sheen: 1, sheenRoughness: 0.55, envMapIntensity: 0.42 };
    // luz de estúdio só para a camiseta: principal de cima/lado e um contraluz fraco (dá volume ao peito e às dobras)
    const chave = new T.DirectionalLight(0xffffff, 1.05); chave.position.set(-4, 7, 6); scene.add(chave);
    const recorte = new T.DirectionalLight(0xffffff, 0.35); recorte.position.set(5, 3, -5); scene.add(recorte);
    luz.intensity = 0.3; renderer.toneMappingExposure = 0.92;
    const novaTex = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h;
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return [c, t]; };
    const dentros = [];
    const lados = {};
    for (const l of ["frente", "costas"]) {
      const [c, t] = novaTex(TWc, THc), { g, gola: yg } = painel(l);
      const mat = new T.MeshPhysicalMaterial({ ...tecido, map: t });
      const dentroMat = new T.MeshPhysicalMaterial({ ...tecido, side: T.BackSide, color: 0x9a9a9a }); dentros.push(dentroMat);
      veste.add(new T.Mesh(g, mat)); veste.add(new T.Mesh(g, dentroMat));
      lados[l] = { c, x: c.getContext("2d"), t, yg };
    }
    // mangas: tubo que sai do ombro e cai para o lado (o começo fica escondido dentro do tronco)
    const ANG = 0.6, R0 = 0.62, R1 = 0.55, TI = -0.3, TF = 2.0;
    const [mc, mt] = novaTex(512, 512), mx = mc.getContext("2d");
    const matManga = new T.MeshPhysicalMaterial({ ...tecido, map: mt });
    const dentroManga = new T.MeshPhysicalMaterial({ ...tecido, side: T.BackSide, color: 0x9a9a9a }); dentros.push(dentroManga);
    const mangas = [];
    for (const k of [1, -1]) {
      const u = [k * Math.cos(ANG), Math.sin(ANG), 0], d = unit([k * Math.sin(ANG), -Math.cos(ANG), 0.06]);
      const w = unit(cruz(u, d)), topo = [k * 2.12, 6.66, 0.02];
      const S = [0, 1, 2].map(c => topo[c] - R0 * u[c]);     // eixo da manga no começo (giro da animação)
      const NA = 72, NT = 60, pos = [], uv = [], ind = [];
      for (let j = 0; j <= NT; j++) { const tt = TI + (TF - TI) * j / NT, f = Math.max(0, tt) / TF;
        let r = lerp(R0, R1, f * f * (3 - 2 * f)); if (tt > TF - 0.12) r += 0.012;          // barra dobrada
        const cap = Math.min(1, Math.max(0, (tt - TI) / (0.55 - TI))), capR = 0.45 + 0.55 * cap * cap * (3 - 2 * cap);   // copa: o alto da manga nasce rente ao ombro
        for (let i = 0; i <= NA; i++) { const a = 2 * Math.PI * i / NA, ca = Math.cos(a) * (Math.cos(a) > 0 ? capR : 1), sa = Math.sin(a) * 0.9;
          const dob = 0.012 * Math.sin(a * 5 + tt * 3) * f;                                   // leve amassado
          for (let c = 0; c < 3; c++) pos.push(d[c] * tt + (r + dob) * (ca * u[c] + sa * w[c]));
          uv.push(i / NA, 1 - j / NT);
        }
      }
      for (let j = 0; j < NT; j++) for (let i = 0; i < NA; i++) {
        const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, e = c + 1;
        k > 0 ? ind.push(a, c, e, a, e, b) : ind.push(a, e, c, a, b, e);
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
      g.setIndex(ind); g.computeVertexNormals();
      const piv = new T.Group(); piv.position.set(...S); piv.add(new T.Mesh(g, matManga), new T.Mesh(g, dentroManga));
      veste.add(piv); mangas.push(piv);
    }
    // gola canelada em volta do decote
    const golaPts = []; for (let i = 0; i < 160; i++) { const p = P(1, 2 * Math.PI * i / 160); golaPts.push(new T.Vector3(p[0] * 1.02, p[1] - 0.03, p[2] * 1.02)); }
    const matGola = new T.MeshPhysicalMaterial({ roughness: 0.95, sheen: 1, sheenRoughness: 0.5 });
    veste.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(golaPts, true), 240, 0.07, 12, true), matGola));
    caneca.position.y = 0.02;
    function trama(x, w, h, escuro) {
      x.globalCompositeOperation = escuro ? "screen" : "multiply"; x.globalAlpha = escuro ? 0.05 : 0.09;
      x.fillStyle = x.createPattern(malha, "repeat"); x.fillRect(0, 0, w, h);
      x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
    }
    function pesponto(x, escuro, lw) { x.lineWidth = lw; x.setLineDash([lw * 1.7, lw]); x.strokeStyle = escuro ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.18)"; }
    function pintar() {
      const E = window.CanecaArte; const cor = E ? E.cores() : { corpo: "#f3f3f1" };
      const escuro = new T.Color(cor.corpo).getHSL({}).l < 0.3;
      for (const l of ["frente", "costas"]) {
        const { x, c, t, yg } = lados[l];
        x.globalCompositeOperation = "source-over"; x.fillStyle = cor.corpo; x.fillRect(0, 0, c.width, c.height);
        x.save(); pesponto(x, escuro, 0.035 * ppu); x.beginPath(); x.moveTo(0, P2(0, 0.2)[1]); x.lineTo(c.width, P2(0, 0.2)[1]); x.stroke(); x.restore();
        if (E && E.lados && E.lados.includes(l)) {
          const A = E.area, w = MOD.w / 10 * ppu, h = MOD.h / 10 * ppu;
          const [cx, ty] = P2(0, yg - (l === "frente" ? 0.75 : 0.9));          // 7,5 cm abaixo da gola
          x.save(); x.translate(cx - w / 2, ty); x.scale(w / A.w, h / A.h); x.translate(-A.x, -A.y);
          x.beginPath(); x.rect(A.x, A.y, A.w, A.h); x.clip(); E.pintar(x, l); x.restore();
        }
        trama(x, c.width, c.height, escuro);             // a estampa fica "no tecido"
        t.needsUpdate = true;
      }
      mx.fillStyle = cor.corpo; mx.fillRect(0, 0, 512, 512);
      mx.save(); pesponto(mx, escuro, 6); const yb = 512 * (1 - (TF - 0.18 - TI) / (TF - TI));
      mx.beginPath(); mx.moveTo(0, yb); mx.lineTo(512, yb); mx.stroke(); mx.restore();
      trama(mx, 512, 512, escuro); mt.needsUpdate = true;
      for (const m of dentros) m.color.set(cor.corpo).multiplyScalar(0.62);
      matGola.color.set(cor.corpo).multiplyScalar(escuro ? 1.15 : 0.96);
    }
    // caminhada leve: mangas balançam em oposição, tronco gira e sobe/desce um pouquinho
    function animar(seg, amp) {
      const f = seg * Math.PI * 2 * 0.9;
      mangas[0].rotation.x = amp * 0.13 * Math.sin(f); mangas[1].rotation.x = -amp * 0.13 * Math.sin(f);
      veste.rotation.y = amp * 0.05 * Math.sin(f); veste.rotation.z = amp * 0.012 * Math.sin(f);
      veste.position.y = amp * 0.035 * Math.abs(Math.cos(f));
    }
    return { alvo: new T.Vector3(0, 3.7, 0), dist: 19, rot: 0.3, elev: 0.1, sombra: [6, 3.2], pintar, animar };
  }

  // sombra suave no chão (não gira junto)
  const sc = document.createElement("canvas"); sc.width = sc.height = 256; const sx = sc.getContext("2d");
  const g = sx.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, "rgba(0,0,0,.30)"); g.addColorStop(.45, "rgba(0,0,0,.12)"); g.addColorStop(1, "rgba(0,0,0,0)");
  sx.fillStyle = g; sx.fillRect(0, 0, 256, 256);
  const sombra = new T.Mesh(new T.PlaneGeometry(1.5, 1.5), new T.MeshBasicMaterial({ map: new T.CanvasTexture(sc), transparent: true, depthWrite: false }));
  sombra.rotation.x = -Math.PI / 2; sombra.position.set(0.05, 0.001, 0); scene.add(sombra);
  if (M.sombra) sombra.scale.set(M.sombra[0] / 1.5, M.sombra[1] / 1.5, 1);

  // ---- câmera e giro
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let amp = 0, rotY = M.rot, elev = M.elev ?? 0.3, vel = 0, rotAlvo = null, auto = !calmo, arrastando = false, sujo = true, ligado = false;
  const DIST = M.dist;
  function posicionar() {
    camera.position.set(alvo.x, alvo.y + Math.sin(elev) * DIST, Math.cos(elev) * DIST);
    camera.lookAt(alvo); caneca.rotation.y = rotY;
  }
  function tamanho() {
    const w = cv.clientWidth || 600; renderer.setSize(w, w, false); camera.aspect = 1; camera.updateProjectionMatrix();
  }
  new ResizeObserver(() => { if (!gravando) tamanho(); }).observe(cv);
  document.addEventListener("caneca-mudou", () => { sujo = true; });
  // aba Frente / Costas: vira o produto para o lado escolhido pelo caminho mais curto
  document.addEventListener("mockup-lado", e => {
    const alvoL = (e.detail === "costas" ? Math.PI : 0) + M.rot * (e.detail === "costas" ? -1 : 1) * 0.6;
    const d = Math.atan2(Math.sin(alvoL - rotY), Math.cos(alvoL - rotY));
    rotAlvo = rotY + d; vel = 0; marcarAuto(false);
  });

  let ult = null;
  cv.addEventListener("pointerdown", e => { if (gravando) return; cv.setPointerCapture(e.pointerId); arrastando = true; ult = e; vel = 0; rotAlvo = null; marcarAuto(false); });
  cv.addEventListener("pointermove", e => {
    if (!arrastando) return; const r = cv.getBoundingClientRect();
    const dx = (e.clientX - ult.clientX) / r.width, dy = (e.clientY - ult.clientY) / r.height;
    rotY += dx * 5; vel = dx * 5; elev = Math.min(0.75, Math.max(0.02, elev + dy * 1.6)); ult = e;
  });
  ["pointerup", "pointercancel"].forEach(t => cv.addEventListener(t, () => { arrastando = false; }));

  function marcarAuto(v) { auto = v; bGirar.setAttribute("aria-pressed", v); }
  marcarAuto(auto);
  bGirar.addEventListener("click", () => marcarAuto(!auto));

  function quadro() {
    if (!ligado) return;
    if (!gravando) {
      if (rotAlvo !== null && !arrastando) { rotY += (rotAlvo - rotY) * 0.12; if (Math.abs(rotAlvo - rotY) < 0.002) { rotY = rotAlvo; rotAlvo = null; } }
      else if (!arrastando) { if (Math.abs(vel) > 0.0005) { rotY += vel; vel *= 0.92; } else if (auto) rotY += 0.006; }
      if (sujo) { pintarTextura(); sujo = false; }
      if (M.animar) { amp += ((auto && !calmo ? 1 : 0) - amp) * 0.06; M.animar(performance.now() / 1000, amp); }
      posicionar(); renderer.render(scene, camera);
    }
    requestAnimationFrame(quadro);
  }
  function ligar() { if (ligado) return; ligado = true; tamanho(); requestAnimationFrame(quadro); }
  const parar = () => { ligado = false; };

  // ---- baixar foto e gravar vídeo
  const nomeArq = ext => "mockup-" + (window.CanecaArte ? window.CanecaArte.nome() : "caneca").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "." + ext;
  async function entregar(blob, nome, tipo) {
    const f = new File([blob], nome, { type: tipo });
    if (navigator.canShare && navigator.canShare({ files: [f] })) {
      try { await navigator.share({ files: [f] }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast(tipo.startsWith("video") ? "Vídeo salvo." : "Foto salva.");
  }
  function emAlta(fn, tam = 1080) {           // renderiza em tam x tam (fundo transparente), depois volta ao normal
    renderer.setPixelRatio(1); renderer.setSize(tam, tam, false); renderer.setClearColor(FUNDO, 1);
    const tx = new T.CanvasTexture(fundoComMarca(tam)); tx.colorSpace = T.SRGBColorSpace; scene.background = tx;   // marca d'água no fundo
    const r = fn();
    const volta = () => { scene.background = null; tx.dispose(); renderer.setClearColor(0x000000, 0); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); tamanho(); };
    return r && r.then ? r.finally(volta) : (volta(), r);
  }
  // foto: produto 3D com a marca d'água no fundo (scene.background em emAlta)
  function fotoComMarca() {
    renderer.render(scene, camera);
    return new Promise(ok => cv.toBlob(ok, "image/png"));
  }
  bFoto.addEventListener("click", () => {
    if (gravando) return;
    pintarTextura(); posicionar();
    const blob = emAlta(() => fotoComMarca(1080));
    blob.then(b => entregar(b, nomeArq("png"), "image/png"));
  });
  const TIPOS = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
  const tipoVideo = window.MediaRecorder && HTMLCanvasElement.prototype.captureStream ? TIPOS.find(t => MediaRecorder.isTypeSupported(t)) : null;
  if (!tipoVideo) bVideo.hidden = true;
  bVideo.addEventListener("click", () => {
    if (gravando || !tipoVideo) return;
    gravando = true; marcarAuto(false); bVideo.disabled = true; const txt = bVideo.textContent; bVideo.textContent = "Gravando…";
    pintarTextura();
    emAlta(() => new Promise(fim => {
      // grava uma cópia 2D do quadro 3D (mais confiável que gravar o canvas WebGL direto)
      const gc = document.createElement("canvas"); gc.width = gc.height = 1080; const gx = gc.getContext("2d");
      const stream = gc.captureStream(30), rec = new MediaRecorder(stream, { mimeType: tipoVideo, videoBitsPerSecond: 8e6 }), partes = [];
      rec.ondataavailable = e => e.data.size && partes.push(e.data);
      rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); fim(new Blob(partes, { type: tipoVideo.split(";")[0] })); };
      const ini = rotY, DUR = 6000; let t0 = null;
      rec.start();
      (function passo(t) {
        if (t0 === null) t0 = t;
        const p = Math.min(1, (t - t0) / DUR), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        rotY = ini + e * Math.PI * 2; if (M.animar) M.animar(t / 1000, 1); posicionar(); renderer.render(scene, camera); gx.drawImage(cv, 0, 0, 1080, 1080);
        if (p < 1) requestAnimationFrame(passo); else setTimeout(() => rec.stop(), 150);
      })(performance.now());
    })).then(blob => {
      gravando = false; bVideo.disabled = false; bVideo.textContent = txt;
      entregar(blob, nomeArq(tipoVideo.includes("mp4") ? "mp4" : "webm"), blob.type);
    });
  });

  // foto da caneca para o pedido e para o WhatsApp (editor.js)
  window.Caneca3D = { foto: tam => { if (gravando) return Promise.reject(); pintarTextura(); posicionar();
    return emAlta(() => fotoComMarca(tam), tam); } };
  aviso3d.hidden = true;
  return { ligar, parar };
}
