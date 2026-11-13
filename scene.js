// Isla de cocina: modelo exportado del archivo de SketchUp del proyecto (assets/isla.glb),
// con sus cajones Blum animados, entorno ilustrativo, utilería y cotas. Coordenadas en metros.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildKitchen } from './kitchen.js?v=20261112a';
import { createProps } from './props.js?v=20261112a';

// El modelo viene con su origen en una esquina; se centra la cubierta (1.253 × 0.946 m) en el origen.
const OFFSET = [-.5815, 0, .438];
const PROP_MODELS = ['ceramic_vase_01', 'wooden_bowl_01', 'food_apple_01', 'food_lime_01', 'food_avocado_01', 'lemon', 'wooden_cutting_board', 'wooden_spoon'];

export async function createScene(THREE, renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e9e7e1');
  scene.fog = new THREE.Fog('#e9e7e1', 9, 21);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  // ---------- carga de recursos ----------
  const texLoader = new THREE.TextureLoader(), gltfLoader = new GLTFLoader();
  // Los modelos se sirven como .glb; en la versión publicada van como JSON (glTF + búfer en base64),
  // que aquí se vuelve a armar en memoria como GLB.
  const MODEL_EXT = '.glb';
  async function loadModel(name) {
    const url = `./assets/${name}${MODEL_EXT}`;
    if (MODEL_EXT === '.glb') return gltfLoader.loadAsync(url);
    const { gltf, bin } = await (await fetch(url)).json();
    const jsonBytes = new TextEncoder().encode(JSON.stringify(gltf)), jsonLen = Math.ceil(jsonBytes.length / 4) * 4;
    const raw = atob(bin), binLen = Math.ceil(raw.length / 4) * 4;
    const out = new Uint8Array(12 + 8 + jsonLen + 8 + binLen).fill(0x20, 20, 20 + jsonLen), view = new DataView(out.buffer);
    view.setUint32(0, 0x46546C67, true); view.setUint32(4, 2, true); view.setUint32(8, out.length, true);
    view.setUint32(12, jsonLen, true); view.setUint32(16, 0x4E4F534A, true); out.set(jsonBytes, 20);
    view.setUint32(20 + jsonLen, binLen, true); view.setUint32(24 + jsonLen, 0x004E4942, true);
    const o = 28 + jsonLen; for (let i = 0; i < raw.length; i++) out[o + i] = raw.charCodeAt(i);
    for (let i = raw.length; i < binLen; i++) out[o + i] = 0;
    return new Promise((resolve, reject) => gltfLoader.parse(out.buffer, './assets/', resolve, reject));
  }
  const loadTex = async url => { const t = await texLoader.loadAsync(url); t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAniso; return t; };
  const [erena, granite, mdf, marble, fabricNormal, stoolWood, personTex, islandGltf, ...propGltfs] = await Promise.all([
    loadTex('./assets/erena.jpg'), loadTex('./assets/granito.jpg'), loadTex('./assets/mdf.jpg'),
    loadTex('./assets/marmol.jpg'), loadTex('./assets/tela-normal.jpg'), loadTex('./assets/roble-banco.jpg'),
    texLoader.loadAsync('./assets/persona-ama.webp'),
    loadModel('isla'),
    ...PROP_MODELS.map(loadModel),
  ]);
  const models = {};
  PROP_MODELS.forEach((n, i) => { models[n] = propGltfs[i].scene; });

  // ---------- reflejos: un estudio sencillo como mapa de entorno ----------
  {
    const env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.BoxGeometry(10, 6, 10), new THREE.MeshBasicMaterial({ color: '#8f8d88', side: THREE.BackSide })));
    const panel = (w, h, pos, rot, c) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(...pos); m.rotation.set(...rot); env.add(m); };
    panel(6, 6, [0, 2.9, 0], [Math.PI / 2, 0, 0], '#ffffff'); panel(4, 2.4, [-4.9, .6, 0], [0, Math.PI / 2, 0], '#f3f6fa'); panel(4, 2.4, [0, .6, 4.9], [0, 0, 0], '#fff3e2'); panel(3, 2, [4.9, .4, -1], [0, Math.PI / 2, 0], '#d8dade');
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(env, .03).texture; scene.environmentIntensity = .55;
    pmrem.dispose();
  }

  const groups = {};
  const group = (name, parent = scene) => { const g = new THREE.Group(); g.name = name; groups[name] = g; parent.add(g); return g; };

  // ---------- materiales de la isla ----------
  const std = o => new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, ...o });
  const MAT = {
    'Erena': std({ map: erena, roughness: .52 }),
    'M04_Stone_Frost': std({ map: granite, roughness: .24, envMapIntensity: 1.15 }),
    'Bco. Absoluto': std({ color: '#f1f0ec', roughness: .68 }),
    'MDF Natural 15 mm1': std({ map: mdf, roughness: .85 }),
  };
  // Los herrajes Blum llegan sin color desde E-Services: se asignan aquí por número de artículo.
  const BLUM = {
    orion: std({ color: '#484b4e', roughness: .52, metalness: .4 }),       // MERIVOBOX gris orión mate
    steel: std({ color: '#c2c5c8', roughness: .36, metalness: .9 }),       // guías
    zinc: std({ color: '#9a9ea2', roughness: .48, metalness: .75 }),       // fijaciones frontales
    plastic: std({ color: '#6f7276', roughness: .62 }),                    // unidades TIP-ON BLUMOTION
    greyPanel: std({ color: '#55585b', roughness: .72 }),                  // fondo y trasera MERIVOBOX
    whitePanel: MAT['Bco. Absoluto'],
  };
  function blumMaterial(ri, label) {
    if (/^(470M|ZR4|ZB4|Z96)/.test(label)) return BLUM.orion;
    if (/^ZF4/.test(label)) return BLUM.zinc;
    if (/^(450|560H)/.test(label)) return BLUM.steel;
    if (/^(T60H|T51)/.test(label)) return BLUM.plastic;
    if (/^(T60|T57)/.test(label)) return BLUM.steel;
    if (/^(Fondo|Trasera)/i.test(label)) return ri === '4' ? BLUM.whitePanel : BLUM.greyPanel;
    return BLUM.orion;
  }
  const edgeMat = new THREE.LineBasicMaterial({ color: '#2e241b', transparent: true, opacity: .3 });

  // ---------- isla y cajones ----------
  const island = group('isla'); island.position.set(...OFFSET);
  const DRAWERS = {
    inferior: { ri: '2', travel: .5, anchor: [.5825, .25, .004] },
    medio: { ri: '3', travel: .4, anchor: [.5825, .57, .004] },
    interior: { ri: '4', travel: .4, anchor: [.3, .842, -.02] },
  };
  for (const [name, d] of Object.entries(DRAWERS)) {
    d.name = name; d.t = 0; d.open = false; d.anim = null;
    d.box = new THREE.Group(); d.mid = new THREE.Group(); d.contents = new THREE.Group(); d.box.add(d.contents);
    d.anchorNode = new THREE.Object3D(); d.anchorNode.position.set(...d.anchor); d.box.add(d.anchorNode);
    island.add(d.mid, d.box);
  }
  const byRi = { 2: DRAWERS.inferior, 3: DRAWERS.medio, 4: DRAWERS.interior };
  for (const node of [...islandGltf.scene.children]) {
    const [ri, , label = ''] = (node.userData.name || node.name).split('|');
    node.traverse(m => {
      if (!m.isMesh) return;
      const matName = m.material.name;
      m.material = MAT[matName] || blumMaterial(ri, label);
      m.castShadow = true; m.receiveShadow = true;
      if (MAT[matName] && m.geometry.attributes.position.count < 2000) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), edgeMat));
    });
    const d = byRi[ri];
    if (!d) { island.add(node); continue; }
    // Las guías Blum son ocultas: el perfil de cuerpo (450 MERIVOBOX, 560H TANDEM) y las unidades TIP-ON BLUMOTION
    // se quedan en el módulo. Al abrir, del MERIVOBOX solo se ve su lateral metálico y del TANDEM solo la melamina.
    if (/^(450|560H|T60|T57)/.test(label)) island.add(node);
    else d.box.add(node);
  }

  // ---------- utilería ----------
  fabricNormal.colorSpace = THREE.NoColorSpace;
  const props = createProps(THREE, models, { fabricNormal, stoolWood });
  // Coordenadas del modelo de SketchUp (mm; x ancho, y fondo, z alto) → coordenadas locales de la isla.
  const at = (x, y, z) => new THREE.Vector3(x / 1000, z / 1000, -y / 1000);
  const fill = (drawer, build, x0, x1, y0, y1, z) => { const g = build((x1 - x0) / 1000, (y1 - y0) / 1000); g.position.copy(at(x0, y0, z)); drawer.contents.add(g); };
  fill(DRAWERS.inferior, props.potsDrawer, 70, 1094, 16, 490, 151);
  fill(DRAWERS.medio, props.dishesDrawer, 70, 1094, 16, 490, 515);
  fill(DRAWERS.interior, props.cutleryDrawer, 66, 1099, 33, 508, 738);

  const utileria = group('utileria'); const counter = props.counterProps(); counter.position.y = .9; utileria.add(counter);
  const bancos = group('bancos');
  for (const x of [-.31, .31]) { const s = props.stool(); s.position.set(x, 0, -.66); s.rotation.y = x < 0 ? .08 : -.06; bancos.add(s); }
  const lamp = props.lamp(); lamp.position.set(0, 2.5, 0); scene.add(lamp);

  // escala humana: figura 2D que siempre mira a la cámara
  const persona = group('persona');
  const figure = new THREE.Mesh(new THREE.PlaneGeometry(.6385, 1.712), new THREE.MeshBasicMaterial({ map: personTex, transparent: true, alphaTest: .35, side: THREE.DoubleSide }));
  personTex.colorSpace = THREE.SRGBColorSpace;
  personTex.anisotropy = maxAniso;
  figure.position.set(1.18, .85, .25); persona.add(figure);
  {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const gr = x.createRadialGradient(64, 64, 6, 64, 64, 62); gr.addColorStop(0, 'rgba(30,28,24,.42)'); gr.addColorStop(1, 'rgba(30,28,24,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(.62, .36), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.set(1.18, .004, .25); persona.add(blob);
  }

  // ---------- entorno ----------
  // La isla queda a 1.10 m de paso de la barra de la ventana, y el borde de su cubierta (lado de la sala)
  // se alinea con el borde exterior de la torre de alacena; por eso el paso hacia la estufa resulta mayor.
  // PASS: pase libre de 1.10 m entre la cubierta de la isla y la cubierta de la L, en ambos lados.
  // La isla no se mueve: la L de la cocina se acomoda a esas medidas.
  const TOWER_EDGE_X = -.95, WINDOW_WALL_Z = 2.2, L_COUNTER_DEPTH = .63, PASS = 1.10;   // TOWER_EDGE_X y WINDOW_WALL_Z: posiciones en el modelo de la cocina
  const kitchenOffset = new THREE.Vector3(-.6265 - TOWER_EDGE_X, 0, (.473 + PASS + L_COUNTER_DEPTH) - WINDOW_WALL_Z);
  const cornerX = (.6265 + PASS + L_COUNTER_DEPTH) - kitchenOffset.x;
  const kitchen = buildKitchen(THREE, { granite, marble: marble.image, maxAniso, offset: kitchenOffset, cornerX }); scene.add(kitchen.root);

  // ---------- cotas generales (independientes de las demás casillas) ----------
  const cotas = group('cotas');
  const dimMaterial = new THREE.LineBasicMaterial({ color: '#5f5a53', transparent: true, opacity: .8, depthTest: false });
  function dimLine(points) { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p))), dimMaterial); l.renderOrder = 9; cotas.add(l); }
  function dimLabel(text, pos) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 112;
    const c = canvas.getContext('2d'); c.fillStyle = 'rgba(255,253,249,.9)'; c.beginPath(); c.roundRect(0, 0, 512, 112, 14); c.fill();
    c.fillStyle = '#474440'; c.font = '600 67px Poppins, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 256, 57);
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, sizeAttenuation: false, fog: false }));
    sprite.position.set(...pos); sprite.scale.set(.17, .0372, 1); sprite.renderOrder = 10; cotas.add(sprite);
  }
  const X = .6265, Z = .473;
  dimLine([[-X, .9, Z], [-X, 1.03, Z], [X, 1.03, Z], [X, .9, Z]]); dimLabel('1.25 m', [0, 1.09, Z]);
  dimLine([[-X, .9, -Z], [-X - .14, .9, -Z], [-X - .14, .9, Z], [-X, .9, Z]]); dimLabel('0.95 m', [-X - .23, .92, 0]);
  dimLine([[-X, 0, Z], [-X - .14, 0, Z], [-X - .14, .9, Z]]); dimLabel('0.90 m', [-X - .23, .45, Z]);

  // ---------- iluminación ----------
  scene.add(new THREE.HemisphereLight('#ffffff', '#b9b3a8', 1.3));
  const key = new THREE.DirectionalLight('#fff6e8', 1.9); key.position.set(-2.6, 5.5, 4.2); key.target.position.set(0, .5, .2); scene.add(key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -3.2, right: 3.2, top: 3.2, bottom: -3.2, near: .5, far: 14 });
  key.shadow.bias = -.0002; key.shadow.normalBias = .02; key.shadow.radius = 4; scene.add(key);
  const fillLight = new THREE.DirectionalLight('#eef2f6', .55); fillLight.position.set(3.5, 3, -3.5); scene.add(fillLight);

  // ---------- animación de cajones (TIP-ON BLUMOTION: empuje breve, expulsión y cierre suave) ----------
  // El recorrido siempre se anima, incluso con «reducir movimiento» activado en el teléfono: es el contenido
  // del visor, no un adorno. El avance se acumula cuadro a cuadro con un tope por cuadro, de modo que el
  // deslizamiento se ve completo aunque el equipo vaya lento o haya una pausa al tocar.
  const easeOut = p => 1 - Math.pow(1 - p, 3), easeInOut = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const listeners = new Set(); const notify = () => listeners.forEach(f => f());
  function start(d, open, delay = 0) {
    if (d.open === open) return;
    d.open = open; d.anim = { from: d.t, to: open ? 1 : 0, wait: delay, p: 0, dur: open ? 1500 : 1300, push: open && d.t < .02 }; notify();
  }
  function toggleDrawer(name) {
    const d = DRAWERS[name]; if (!d) return;
    if (name === 'interior') { if (DRAWERS.medio.open || d.open) start(d, !d.open); return; }
    if (name === 'medio' && d.open && DRAWERS.interior.open) { start(DRAWERS.interior, false); start(d, false, 800); return; }
    start(d, !d.open);
  }
  function place(d) {
    const z = d.travel * d.t + (d.pushIn || 0);
    d.box.position.z = z; d.mid.position.z = Math.max(0, z) * .5;
  }
  let lastFrame = performance.now();
  // Devuelve true cuando algo que proyecta sombra cambió en este cuadro.
  function update(camera, now = performance.now()) {
    const dt = Math.min(Math.max(now - lastFrame, 0), 100); lastFrame = now;
    let moved = false;
    for (const d of Object.values(DRAWERS)) {
      const showContents = contentsOn && (d.t > 0 || !!d.anim);
      if (d.contents.visible !== showContents) { d.contents.visible = showContents; moved = true; }
      const a = d.anim; if (!a) continue;
      if (a.wait > 0) { a.wait -= dt; continue; }
      a.p = Math.min(1, a.p + dt / a.dur); const p = a.p;
      d.pushIn = 0;
      if (a.push) {
        const pushEnd = .09;
        if (p < pushEnd) { d.pushIn = -.004 * Math.sin(Math.PI * p / pushEnd); d.t = a.from; }
        else d.t = a.from + (a.to - a.from) * easeOut((p - pushEnd) / (1 - pushEnd));
      } else d.t = a.from + (a.to - a.from) * easeInOut(p);
      place(d); moved = true;
      if (p >= 1) { d.anim = null; notify(); }
    }
    if (kitchen.update(camera)) moved = true;
    figure.rotation.y = Math.atan2(camera.position.x - figure.position.x, camera.position.z - figure.position.z);
    return moved;
  }
  let contentsOn = true;
  function setContentsVisible(v) { contentsOn = v; }

  return {
    scene, groups, target: new THREE.Vector3(0, .56, .16), update, toggleDrawer, setContentsVisible, setLamp: on => lamp.userData.setOn(on),
    drawers: DRAWERS, onDrawerChange: f => listeners.add(f),
  };
}
