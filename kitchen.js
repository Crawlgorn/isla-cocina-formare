// Entorno ilustrativo de la cocina, interpretado a partir de las fotografías del cliente.
// Coordenadas en metros. La isla está centrada en el origen; los cajones abren hacia +Z.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function buildKitchen(THREE, { granite, marble, maxAniso = 8, offset = new THREE.Vector3() }) {
  const root = new THREE.Group(); root.name = 'entorno'; root.position.copy(offset);

  // ---------- texturas procedurales ----------
  function canvasTexture(size, draw, repeat) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    draw(c.getContext('2d'), size);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAniso;
    if (repeat) t.repeat.set(...repeat);
    return t;
  }
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // Piso: porcelanato tipo mármol en piezas de 0.60 × 1.20 m. Cada pieza toma un recorte distinto
  // de una fotografía de mármol blanco veteado, para que las vetas no se repitan de una pieza a otra.
  const floorTex = canvasTexture(2048, (g, s) => {
    const cols = 4, rows = 2, tw = s / cols, th = s / rows, iw = marble.width, ih = marble.height;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const k = r * cols + c, sx = (k % 2) * iw / 2, flipX = k % 4 >= 2, flipY = r === 1;
      g.save(); g.translate(c * tw + tw / 2, r * th + th / 2); g.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      g.drawImage(marble, sx, 0, iw / 2, ih, -tw / 2, -th / 2, tw, th); g.restore();
    }
    g.fillStyle = 'rgba(255,255,255,.38)'; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(168,168,164,.85)'; g.lineWidth = 2.2; g.beginPath();
    for (let c = 0; c <= cols; c++) { g.moveTo(c * tw, 0); g.lineTo(c * tw, s); }
    for (let r = 0; r <= rows; r++) { g.moveTo(0, r * th); g.lineTo(s, r * th); }
    g.stroke();
  });
  // Muro de piedra en tiras (salpicadero): tiras de mármol de 15 mm con relieve.
  const STRIP_ROWS = 36;
  const stoneLayout = [];
  for (let r = 0; r < STRIP_ROWS; r++) { let x = -rnd() * .1; while (x < 1) { const w = .11 + rnd() * .2; stoneLayout.push({ r, x, w, tone: rnd(), height: rnd(), sx: rnd(), sy: rnd() }); x += w; } }
  const stoneTex = canvasTexture(1024, (g, s) => {
    const h = s / STRIP_ROWS; g.fillStyle = '#8f9192'; g.fillRect(0, 0, s, s);
    for (const t of stoneLayout) {
      const x = t.x * s, w = t.w * s, y = t.r * h;
      g.drawImage(marble, t.sx * marble.width * .8, t.sy * marble.height * .9, marble.width * .2, marble.height * .05, x + 1, y + 1, w - 2, h - 2);
      g.fillStyle = t.tone < .5 ? `rgba(255,255,255,${.05 + t.tone * .3})` : `rgba(96,100,106,${(t.tone - .5) * .5})`; g.fillRect(x + 1, y + 1, w - 2, h - 2);
    }
  });
  const stoneNormal = (() => {
    const s = 512, hc = document.createElement('canvas'); hc.width = hc.height = s; const g = hc.getContext('2d'), h = s / STRIP_ROWS;
    g.fillStyle = '#000'; g.fillRect(0, 0, s, s);
    for (const t of stoneLayout) { const v = 110 + Math.floor(t.height * 145); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(t.x * s + 1, t.r * h + 1, t.w * s - 2, h - 2); }
    const src = g.getImageData(0, 0, s, s).data, out = g.createImageData(s, s), at = (x, y) => src[(((y + s) % s) * s + ((x + s) % s)) * 4] / 255;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 2.2, dy = (at(x, y + 1) - at(x, y - 1)) * 2.2, l = Math.hypot(dx, dy, 1), o = (y * s + x) * 4;
      out.data[o] = (-dx / l * .5 + .5) * 255; out.data[o + 1] = (dy / l * .5 + .5) * 255; out.data[o + 2] = (1 / l * .5 + .5) * 255; out.data[o + 3] = 255;
    }
    g.putImageData(out, 0, 0);
    const t = new THREE.CanvasTexture(hc); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxAniso; return t;
  })();
  stoneTex.repeat.set(4.8, 4.5); stoneNormal.repeat.set(4.8, 4.5);

  const M = {
    wall: new THREE.MeshStandardMaterial({ color: '#f1efea', roughness: .95 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#f6f5f1', roughness: 1 }),
    stone: new THREE.MeshStandardMaterial({ map: stoneTex, normalMap: stoneNormal, normalScale: new THREE.Vector2(1.3, 1.3), roughness: .62 }),
    blue: new THREE.MeshStandardMaterial({ color: '#5a6779', roughness: .62 }),
    white: new THREE.MeshStandardMaterial({ color: '#f2f1ed', roughness: .6 }),
    kick: new THREE.MeshStandardMaterial({ color: '#3b424c', roughness: .8 }),
    counter: new THREE.MeshStandardMaterial({ map: granite, color: '#c9c9c4', roughness: .26 }),
    steel: new THREE.MeshStandardMaterial({ color: '#c7cacc', roughness: .34, metalness: .9 }),
    steelDark: new THREE.MeshStandardMaterial({ color: '#8d9093', roughness: .4, metalness: .85 }),
    black: new THREE.MeshStandardMaterial({ color: '#17181a', roughness: .3, metalness: .2 }),
    glass: new THREE.MeshStandardMaterial({ color: '#0e1113', roughness: .08, metalness: .6 }),
    daylight: new THREE.MeshBasicMaterial({ color: '#f4f8fb' }),
    door: new THREE.MeshStandardMaterial({ color: '#e9e8e4', roughness: .7 }),
  };

  // ---------- constructor de cajas fusionadas por material ----------
  function builder(matrix) {
    const bins = new Map();
    const push = (mat, geo) => { geo.applyMatrix4(matrix); if (!bins.has(mat)) bins.set(mat, []); bins.get(mat).push(geo); };
    const api = {
      box(mat, size, center) { const g = new THREE.BoxGeometry(...size); g.translate(...center); push(mat, g); },
      cyl(mat, r, h, center, axis = 'y', seg = 20) {
        const g = new THREE.CylinderGeometry(r, r, h, seg);
        if (axis === 'x') g.rotateZ(Math.PI / 2); if (axis === 'z') g.rotateX(Math.PI / 2);
        g.translate(...center); push(mat, g);
      },
      geo(mat, g) { push(mat, g); },
      // Frente tipo shaker: tablero con marco perimetral y jaladera de barra.
      front(mat, x0, x1, y0, y1, z, handle) {
        const w = x1 - x0 - .004, h = y1 - y0 - .004, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, f = Math.min(.06, h * .28);
        api.box(mat, [w, h, .014], [cx, cy, z + .007]);
        api.box(mat, [w, f, .006], [cx, y1 - .002 - f / 2, z + .017]); api.box(mat, [w, f, .006], [cx, y0 + .002 + f / 2, z + .017]);
        api.box(mat, [f, h - 2 * f, .006], [x0 + .002 + f / 2, cy, z + .017]); api.box(mat, [f, h - 2 * f, .006], [x1 - .002 - f / 2, cy, z + .017]);
        if (handle === 'h') { api.cyl(M.steel, .006, Math.min(.16, w * .5), [cx, cy, z + .045], 'x', 10); }
        if (handle === 'vl' || handle === 'vr') { const hx = handle === 'vl' ? x0 + .05 : x1 - .05; api.cyl(M.steel, .006, .16, [hx, y1 - .14, z + .045], 'y', 10); }
        if (handle === 'tall-l' || handle === 'tall-r') { const hx = handle === 'tall-l' ? x0 + .05 : x1 - .05; api.cyl(M.steel, .007, .32, [hx, cy, z + .045], 'y', 10); }
      },
      // Módulo bajo: zoclo, cuerpo, cajón superior y puertas.
      base(x0, x1, doors, depth = .6) {
        api.box(M.kick, [x1 - x0, .1, depth - .08], [(x0 + x1) / 2, .05, (depth - .08) / 2]);
        api.box(M.blue, [x1 - x0, .77, depth - .02], [(x0 + x1) / 2, .485, (depth - .02) / 2]);
        const n = doors, w = (x1 - x0) / n;
        for (let i = 0; i < n; i++) {
          api.front(M.blue, x0 + i * w, x0 + (i + 1) * w, .715, .87, depth - .02, 'h');
          api.front(M.blue, x0 + i * w, x0 + (i + 1) * w, .1, .712, depth - .02, i % 2 ? 'vl' : 'vr');
        }
      },
      upper(x0, x1, doors, y0 = 1.45, y1 = 2.3, depth = .34) {
        api.box(M.white, [x1 - x0, y1 - y0, depth - .02], [(x0 + x1) / 2, (y0 + y1) / 2, (depth - .02) / 2]);
        api.box(M.white, [x1 - x0 + .03, .07, depth + .03], [(x0 + x1) / 2, y1 + .035, depth / 2]);
        const w = (x1 - x0) / doors;
        for (let i = 0; i < doors; i++) api.front(M.white, x0 + i * w, x0 + (i + 1) * w, y0, y1, depth - .02, i % 2 ? 'tall-l' : 'tall-r');
      },
      finish(group) {
        for (const [mat, geos] of bins) {
          const mesh = new THREE.Mesh(mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g)), mat);
          mesh.castShadow = mat !== M.wall && mat !== M.ceiling && mat !== M.daylight && mat !== M.stone;
          mesh.receiveShadow = true; group.add(mesh);
        }
        return group;
      }
    };
    return api;
  }

  // ---------- piso y techo ----------
  floorTex.repeat.set(16 / 2.4, 16 / 2.4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .16, metalness: 0, envMapIntensity: .9 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; root.add(floor);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(5.45, 3.9), M.ceiling);
  ceiling.rotation.x = Math.PI / 2; ceiling.position.set(-.275, 2.5, .25); root.add(ceiling);

  // ---------- muro de ventana (los cajones de la isla abren hacia él) ----------
  // Marco local: x a lo largo del muro desde la esquina, z saliendo del muro hacia la cocina.
  const w1 = new THREE.Group(); w1.name = 'muro-ventana';
  const b1 = builder(new THREE.Matrix4().makeRotationY(Math.PI).setPosition(2.45, 0, 2.2));
  b1.box(M.wall, [5.45, 2.5, .02], [2.725, 1.25, -.01]);
  b1.box(M.stone, [2.65, 2.5, .012], [1.325, 1.25, .006]);
  b1.base(0, .62, 1); b1.base(.62, 1.95, 3); b1.base(1.95, 2.65, 2);
  b1.box(M.counter, [2.67, .03, .63], [1.335, .885, .315]);
  // tarja y llave
  b1.box(M.steelDark, [.72, .012, .4], [1.12, .902, .3]);
  b1.box(M.steel, [.34, .006, .36], [.94, .905, .3]); b1.box(M.steel, [.34, .006, .36], [1.3, .905, .3]);
  b1.cyl(M.steel, .014, .3, [1.12, 1.05, .09], 'y', 12); b1.cyl(M.steel, .012, .2, [1.12, 1.2, .18], 'z', 12); b1.cyl(M.steel, .016, .07, [1.12, 1.17, .28], 'y', 12);
  // ventana con persianas
  b1.box(M.white, [1.32, 1.02, .05], [1.15, 1.56, .03]);
  b1.box(M.daylight, [1.2, .9, .012], [1.15, 1.56, .058]);
  b1.box(M.white, [.05, .9, .03], [1.15, 1.56, .075]);
  for (let p = 0; p < 2; p++) for (let i = 0; i < 13; i++) {
    const g = new THREE.BoxGeometry(.55, .052, .008); g.rotateX(-.55); g.translate(.85 + p * .6, 1.15 + i * .068, .078); b1.geo(M.white, g);
  }
  b1.upper(1.9, 2.65, 2);
  // alacena alta de dos cuerpos
  b1.box(M.white, [.75, 2.3, .6], [3.025, 1.15, .3]);
  b1.box(M.white, [.78, .07, .65], [3.025, 2.335, .31]);
  b1.front(M.white, 2.65, 3.4, 1.16, 2.3, .6, 'tall-r'); b1.front(M.white, 2.65, 3.4, .0, 1.155, .6, 'tall-r');
  // puerta
  b1.box(M.white, [.98, 2.12, .03], [4.1, 1.06, .012]); b1.box(M.door, [.86, 2.04, .04], [4.1, 1.02, .02]);
  b1.cyl(M.steel, .028, .05, [3.76, 1.0, .05], 'z', 14);
  b1.finish(w1); root.add(w1);

  // ---------- muro de estufa y refrigerador ----------
  const w2 = new THREE.Group(); w2.name = 'muro-estufa';
  const b2 = builder(new THREE.Matrix4().makeRotationY(-Math.PI / 2).setPosition(2.45, 0, -1.7));
  b2.box(M.wall, [3.9, 2.5, .02], [1.95, 1.25, -.01]);
  b2.box(M.stone, [2.65, 2.5, .012], [2.575, 1.25, .006]);
  // refrigerador
  b2.box(M.steelDark, [.9, 1.8, .66], [.75, .9, .33]);
  b2.box(M.steel, [.446, 1.05, .04], [.525, 1.27, .68]); b2.box(M.steel, [.446, 1.05, .04], [.975, 1.27, .68]);
  b2.box(M.steel, [.896, .34, .04], [.75, .56, .68]); b2.box(M.steel, [.896, .36, .04], [.75, .2, .68]);
  b2.box(M.black, [.02, 1.0, .03], [.72, 1.27, .715]); b2.box(M.black, [.02, 1.0, .03], [.78, 1.27, .715]);
  b2.box(M.black, [.6, .02, .03], [.75, .7, .715]); b2.box(M.black, [.6, .02, .03], [.75, .345, .715]);
  b2.box(M.white, [1.0, .45, .6], [.75, 2.075, .3]); b2.front(M.white, .25, .75, 1.85, 2.3, .6, 'h'); b2.front(M.white, .75, 1.25, 1.85, 2.3, .6, 'h');
  b2.box(M.white, [.03, 2.3, .66], [.265, 1.15, .33]); b2.box(M.white, [1.03, .07, .65], [.75, 2.335, .31]);
  // botellero
  b2.box(M.white, [.25, 1.0, .34], [1.375, 1.8, .17]);
  for (let i = 0; i < 5; i++) b2.box(M.kick, [.17, .15, .01], [1.375, 1.4 + i * .19, .342]);
  b2.base(1.25, 1.5, 1); b2.box(M.counter, [.26, .03, .63], [1.375, .885, .315]);
  // estufa
  b2.box(M.steel, [.9, .78, .62], [1.95, .51, .31]); b2.box(M.steelDark, [.9, .12, .56], [1.95, .06, .3]);
  b2.box(M.glass, [.74, .4, .012], [1.95, .45, .626]); b2.cyl(M.steel, .012, .76, [1.95, .7, .67], 'x', 12);
  b2.box(M.steel, [.9, .1, .03], [1.95, .83, .635]);
  for (let i = 0; i < 6; i++) b2.cyl(M.black, .02, .03, [1.6 + i * .14, .83, .66], 'z', 14);
  b2.box(M.black, [.86, .025, .56], [1.95, .915, .3]);
  for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) b2.cyl(M.steelDark, .05, .012, [1.67 + i * .28, .935, .17 + k * .26], 'y', 16);
  // campana
  { const g = new THREE.CylinderGeometry(.24, .64, .09, 4, 1); g.rotateY(Math.PI / 4); g.scale(1, 1, .72); g.translate(1.95, 1.72, .26); b2.geo(M.steel, g); }
  b2.box(M.steel, [.9, .05, .5], [1.95, 1.655, .25]); b2.box(M.steel, [.3, .75, .28], [1.95, 2.13, .15]);
  // módulos y alacenas hasta la esquina
  b2.base(2.4, 3.28, 2); b2.box(M.counter, [.9, .03, .63], [2.84, .885, .315]);
  b2.upper(2.4, 3.9, 3);
  b2.finish(w2); root.add(w2);
  // remate corto junto al refrigerador
  const stub = new THREE.Mesh(new THREE.PlaneGeometry(.95, 2.5), M.wall); stub.position.set(1.975, 1.25, -1.7); w2.add(stub);

  // Al pasar la cámara detrás de un muro, ese muro se oculta para no tapar la isla.
  function update(camera) {
    const a = camera.position.z < 1.5 + offset.z, b = camera.position.x < 1.75 + offset.x;
    const changed = a !== w1.visible || b !== w2.visible;
    w1.visible = a; w2.visible = b;
    ceiling.visible = camera.position.y < 2.45;
    return changed;
  }
  return { root, update, materials: M };
}
