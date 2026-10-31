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
  const M = MOD.tipo === "camiseta" ? await montarCamiseta() : MOD.tipo === "banner" ? montarBanner() : MOD.tipo === "copo" ? montarCopo() : montarCaneca();
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

  // ---------- banner de lona: medida escolhida no editor (muda na hora), frente com a arte e verso liso.
  // Lona com madeira: ripas em cima e embaixo e cordinha pra pendurar. Ilhós total: argolas de metal em volta.
  function montarBanner() {
    const TB = Math.min(2048, TW);
    const tc = document.createElement("canvas"); tc.width = tc.height = TB; const tx = tc.getContext("2d");
    const tex = new T.CanvasTexture(tc); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const matFrente = new T.MeshPhysicalMaterial({ map: tex, roughness: MOD.fosco ? 0.85 : 0.4, metalness: 0, clearcoat: MOD.fosco ? 0 : 0.45, clearcoatRoughness: 0.35 });
    const matVerso = new T.MeshStandardMaterial({ color: 0xe6e6e2, roughness: 0.92 });
    const matMadeira = new T.MeshStandardMaterial({ color: 0xc79a62, roughness: 0.72 });
    const matMetal = new T.MeshStandardMaterial({ color: 0xd3d6d8, metalness: 1, roughness: 0.28 });
    const matCorda = new T.MeshStandardMaterial({ color: 0x3b3a38, roughness: 0.9 });
    const frente = new T.Mesh(new T.PlaneGeometry(1, 1), matFrente);
    const verso = new T.Mesh(new T.PlaneGeometry(1, 1), matVerso); verso.rotation.y = Math.PI;
    const extras = new T.Group(); caneca.add(frente, verso, extras);
    const cil = (a, b, r, mat) => {     // cilindro de a até b
      const d = new T.Vector3().subVectors(b, a), m = new T.Mesh(new T.CylinderGeometry(r, r, d.length(), 16), mat);
      m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m;
    };
    function montar() {
      extras.children.forEach(o => o.geometry.dispose()); extras.clear();
      const S = 2.2 / Math.max(MOD.w, MOD.h), W = MOD.w * S, H = MOD.h * S;   // maior lado com 2,2 unidades
      frente.scale.set(W, H, 1); verso.scale.set(W, H, 1);
      if (MOD.ilhos) {                  // argola a cada ~30 cm, 3 cm pra dentro da borda
        const g = new T.TorusGeometry(Math.max(0.9 * S, 0.012), Math.max(0.28 * S, 0.004), 8, 24), dentro = 3 * S;
        const nx = Math.max(2, Math.round((MOD.w - 6) / 30) + 1), ny = Math.max(2, Math.round((MOD.h - 6) / 30) + 1);
        const pts = [];
        for (let i = 0; i < nx; i++) { const x = -W / 2 + dentro + (W - 2 * dentro) * i / (nx - 1); pts.push([x, H / 2 - dentro], [x, -H / 2 + dentro]); }
        for (let j = 1; j < ny - 1; j++) { const y = -H / 2 + dentro + (H - 2 * dentro) * j / (ny - 1); pts.push([-W / 2 + dentro, y], [W / 2 - dentro, y]); }
        for (const [x, y] of pts) for (const z of [0.002, -0.002]) { const m = new T.Mesh(g, matMetal); m.position.set(x, y, z); extras.add(m); }
      } else {                          // ripas de madeira (2,5 cm além de cada lado) e cordinha
        const r = Math.max(1.2 * S, 0.016), L = W + 5 * S;
        for (const y of [H / 2 + r * 0.5, -H / 2 - r * 0.5]) extras.add(cil(new T.Vector3(-L / 2, y, 0), new T.Vector3(L / 2, y, 0), r, matMadeira));
        const topo = H / 2 + r * 0.5, gancho = new T.Vector3(0, topo + Math.min(0.35, W * 0.18), 0), rc = Math.max(0.25 * S, 0.004);
        for (const x of [-L / 2 + r, L / 2 - r]) extras.add(cil(new T.Vector3(x, topo, 0), gancho, rc, matCorda));
      }
    }
    function pintar() {
      const E = window.CanecaArte;
      tx.fillStyle = "#ffffff"; tx.fillRect(0, 0, TB, TB);
      if (E) { const A = E.area; tx.save(); tx.scale(TB / A.w, TB / A.h); tx.translate(-A.x, -A.y); E.pintar(tx); tx.restore(); }
      tex.needsUpdate = true;
    }
    document.addEventListener("banner-medida", montar);
    montar();
    return { alvo: new T.Vector3(0, 0.08, 0), dist: 6, rot: 0.35, elev: 0.08, semSombra: true, balanco: true, pintar };
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

  // ---------- camiseta: modelo 3D real (assets/modelos/camiseta.glb, gerado no Tripo e otimizado), com dobras, costuras,
  // gola e barras de verdade. A cor escolhida tinge o tecido (o sombreado do modelo continua) e a estampa é projetada
  // de frente (e de costas) sobre ele, sumindo nas laterais como numa estampa DTF de verdade. 1 unidade = 10 cm.
  async function montarCamiseta() {
    const { GLTFLoader } = await import("./vendor/GLTFLoader.js");
    const gltf = await new GLTFLoader().loadAsync(new URL("./modelos/camiseta.glb", import.meta.url).href);
    let malha = null; gltf.scene.updateMatrixWorld(true); gltf.scene.traverse(o => { if (o.isMesh && !malha) malha = o; });
    const geo = malha.geometry.clone(); geo.applyMatrix4(malha.matrixWorld);
    geo.rotateY(-Math.PI / 2);                        // o modelo veio com a frente para o lado: vira para a câmera
    geo.computeBoundingBox(); let bb = geo.boundingBox;
    const esc = 7.3 / (bb.max.y - bb.min.y);          // ~73 cm do ombro à barra (tamanho M)
    geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2); geo.scale(esc, esc, esc);
    geo.computeBoundingBox(); bb = geo.boundingBox;
    // altura da gola no meio da frente e no meio das costas (para a estampa começar 7,5 cm abaixo dela)
    const P = geo.attributes.position; let gF = 0, gC = 0;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      if (Math.abs(x) < 0.12) { if (z > 0.3 && y > gF) gF = y; if (z < -0.3 && y > gC) gC = y; } }
    // telas das estampas (fundo transparente), cobrindo a frente inteira da camiseta
    const X0 = -3.2, X1 = 3.2, Y0 = 0, Y1 = 7.6;
    const TWc = Math.min(2048, TW), THc = Math.round(TWc * (Y1 - Y0) / (X1 - X0)), ppu = TWc / (X1 - X0);
    const lados = {};
    for (const l of ["frente", "costas"]) {
      const c = document.createElement("canvas"); c.width = TWc; c.height = THc;
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      t.wrapS = t.wrapT = T.ClampToEdgeWrapping; lados[l] = { c, x: c.getContext("2d"), t, yg: l === "frente" ? gF : gC };
    }
    const sombra = malha.material.map; if (sombra) sombra.colorSpace = T.SRGBColorSpace;
    const U = { cor: { value: new T.Color("#f3f3f1") }, artF: { value: lados.frente.t }, artC: { value: lados.costas.t },
      faixa: { value: new T.Vector4(X0, X1, Y0, Y1) } };
    const mat = new T.MeshPhysicalMaterial({ map: sombra, roughness: 0.9, metalness: 0, sheen: 0.6, sheenRoughness: 0.6, envMapIntensity: 0.55, side: T.DoubleSide });
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = "varying vec2 vPlano; varying float vNz;\n" + sh.vertexShader.replace("#include <begin_vertex>",
        "#include <begin_vertex>\n vPlano = position.xy; vNz = normal.z;");
      sh.fragmentShader = "uniform vec3 cor; uniform sampler2D artF; uniform sampler2D artC; uniform vec4 faixa; varying vec2 vPlano; varying float vNz;\n" +
        sh.fragmentShader.replace("#include <map_fragment>", `
          vec3 base = cor;
          #ifdef USE_MAP
            float lum = dot(texture2D(map, vMapUv).rgb, vec3(0.299, 0.587, 0.114));
            base *= clamp(lum / 0.7, 0.3, 1.1);          // sombreado do tecido (dobras e costuras)
          #endif
          float u = (vPlano.x - faixa.x) / (faixa.y - faixa.x), v = (vPlano.y - faixa.z) / (faixa.w - faixa.z);
          vec4 aF = texture2D(artF, vec2(u, v)), aC = texture2D(artC, vec2(1.0 - u, v));
          float wF = smoothstep(0.08, 0.4, vNz), wC = smoothstep(0.08, 0.4, -vNz);
          #ifdef USE_MAP
            float tom = mix(1.0, clamp(lum / 0.7, 0.45, 1.08), 0.85);      // a estampa acompanha as dobras
          #else
            float tom = 1.0;
          #endif
          base = mix(base, aF.rgb * tom, aF.a * wF); base = mix(base, aC.rgb * tom, aC.a * wC);
          diffuseColor.rgb = base;`);
    };
    const veste = new T.Group(); caneca.add(veste);
    veste.add(new T.Mesh(geo, mat));
    // luz de estúdio só para a camiseta: principal de cima/lado e contraluz fraco (dá volume às dobras)
    const chave = new T.DirectionalLight(0xffffff, 1.1); chave.position.set(-4, 7, 6); scene.add(chave);
    const recorte = new T.DirectionalLight(0xffffff, 0.35); recorte.position.set(5, 3, -5); scene.add(recorte);
    luz.intensity = 0.35; renderer.toneMappingExposure = 0.88;
    caneca.position.y = 0.02;
    function pintar() {
      const E = window.CanecaArte; const cor = E ? E.cores() : { corpo: "#f3f3f1" };
      U.cor.value.set(cor.corpo);
      for (const l of ["frente", "costas"]) {
        const { x, c, t, yg } = lados[l];
        x.clearRect(0, 0, c.width, c.height);
        if (E && E.lados && E.lados.includes(l)) {
          const A = E.area, w = MOD.w / 10 * ppu, h = MOD.h / 10 * ppu;
          const cx = (0 - X0) * ppu, ty = (Y1 - (yg - (l === "frente" ? 0.75 : 0.9))) * ppu;   // 7,5 cm abaixo da gola
          x.save(); x.translate(cx - w / 2, ty); x.scale(w / A.w, h / A.h); x.translate(-A.x, -A.y);
          x.beginPath(); x.rect(A.x, A.y, A.w, A.h); x.clip(); E.pintar(x, l); x.restore();
        }
        t.needsUpdate = true;
      }
    }
    // caminhada leve: o tronco gira e sobe/desce um pouquinho
    function animar(seg, amp) {
      const f = seg * Math.PI * 2 * 0.9;
      veste.rotation.y = amp * 0.05 * Math.sin(f); veste.rotation.z = amp * 0.012 * Math.sin(f);
      veste.position.y = amp * 0.03 * Math.abs(Math.cos(f));
    }
    return { alvo: new T.Vector3(0, 3.65, 0), dist: 19, rot: 0.3, elev: 0.1, sombra: [(bb.max.x - bb.min.x) * 1.05, (bb.max.z - bb.min.z) * 1.2], pintar, animar };
  }

  // sombra suave no chão (não gira junto)
  const sc = document.createElement("canvas"); sc.width = sc.height = 256; const sx = sc.getContext("2d");
  const g = sx.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, "rgba(0,0,0,.30)"); g.addColorStop(.45, "rgba(0,0,0,.12)"); g.addColorStop(1, "rgba(0,0,0,0)");
  sx.fillStyle = g; sx.fillRect(0, 0, 256, 256);
  const sombra = new T.Mesh(new T.PlaneGeometry(1.5, 1.5), new T.MeshBasicMaterial({ map: new T.CanvasTexture(sc), transparent: true, depthWrite: false }));
  sombra.rotation.x = -Math.PI / 2; sombra.position.set(0.05, 0.001, 0); scene.add(sombra);
  if (M.semSombra) sombra.visible = false;
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
      else if (!arrastando) { if (Math.abs(vel) > 0.0005) { rotY += vel; vel *= 0.92; } else if (auto) { if (M.balanco) rotY += (M.rot + 0.55 * Math.sin(performance.now() / 1900) - rotY) * 0.04; else rotY += 0.006; } }
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
        rotY = M.balanco ? ini + 0.6 * Math.sin(e * Math.PI * 2) : ini + e * Math.PI * 2; if (M.animar) M.animar(t / 1000, 1); posicionar(); renderer.render(scene, camera); gx.drawImage(cv, 0, 0, 1080, 1080);
        if (p < 1) requestAnimationFrame(passo); else setTimeout(() => rec.stop(), 150);
      })(performance.now());
    })).then(blob => {
      gravando = false; bVideo.disabled = false; bVideo.textContent = txt;
      entregar(blob, nomeArq(tipoVideo.includes("mp4") ? "mp4" : "webm"), blob.type);
    });
  });

  // foto da caneca para o pedido e para o WhatsApp (editor.js)
  // com "lado" (camiseta frente e verso), vira o produto pra esse lado só durante a foto
  window.Caneca3D = { foto: (tam, lado) => { if (gravando) return Promise.reject(); pintarTextura();
    const r0 = rotY, a0 = rotAlvo;
    if (lado) { rotY = (lado === "costas" ? Math.PI : 0) + M.rot * (lado === "costas" ? -1 : 1) * 0.6; rotAlvo = null; }
    posicionar();
    return emAlta(() => fotoComMarca(tam), tam).finally(() => { if (lado) { rotY = r0; rotAlvo = a0; posicionar(); } }); } };
  aviso3d.hidden = true;
  return { ligar, parar };
}
