// Utilería del visor: bancos, lámpara, artículos sobre la cubierta y contenido de los cajones.
// Todo en metros. Las piezas torneadas se generan por revolución para que queden limpias y sin deformaciones.
export function createProps(THREE, models, textures = {}) {
  const std = o => new THREE.MeshStandardMaterial(o);
  const M = {
    walnut: std({ color: '#b98a72', roughness: .46 }),
    fabric: std({ color: '#e9e1d1', roughness: .97 }),
    brass: std({ color: '#c9a45c', roughness: .28, metalness: 1 }),
    globe: std({ color: '#fff4e2', emissive: '#ffdfae', emissiveIntensity: 1.35, roughness: .35 }),
    enamel: std({ color: '#3b3d40', roughness: .42, metalness: .25 }),
    enamelIn: std({ color: '#2b2c2e', roughness: .5, metalness: .2 }),
    steel: std({ color: '#d6d8da', roughness: .24, metalness: .92, side: THREE.DoubleSide }),
    steelBrushed: std({ color: '#bfc2c5', roughness: .38, metalness: .9 }),
    blackHandle: std({ color: '#1d1e20', roughness: .55 }),
    ceramic: std({ color: '#f5f3ee', roughness: .28 }),
    ceramicSage: std({ color: '#c9cfc2', roughness: .35 }),
    glass: std({ color: '#e6f1f2', roughness: .04, metalness: 0, transparent: true, opacity: .26, depthWrite: false }),
    jarGlass: std({ color: '#eef4f4', roughness: .05, transparent: true, opacity: .22, depthWrite: false }),
    bamboo: std({ color: '#d8b06f', roughness: .6 }),
    boardWood: std({ color: '#b98a55', roughness: .6 }),
    boardDark: std({ color: '#7a5233', roughness: .6 }),
    ambia: std({ color: '#3d4043', roughness: .5, metalness: .45 }),
    mat: std({ color: '#4b4e51', roughness: .9 }),
    tray: std({ color: '#aeb1b4', roughness: .62 }),
    stem: std({ color: '#5f8052', roughness: .7 }),
    petalA: std({ color: '#f3e9e2', roughness: .6 }),
    petalB: std({ color: '#e9b9b4', roughness: .6 }),
    silicone: std({ color: '#d9cdb8', roughness: .8 }),
  };

  // Texturas reales: veta de madera a lo largo de cada pieza del banco y relieve de tela en el tapizado.
  if (textures.stoolWood) { const t = textures.stoolWood; t.center.set(.5, .5); t.rotation = Math.PI / 2; t.repeat.set(1.4, .22); M.walnut.map = t; }
  if (textures.fabricNormal) { const t = textures.fabricNormal; t.repeat.set(7, 7); M.fabric.normalMap = t; M.fabric.normalScale = new THREE.Vector2(1.1, 1.1); }

  const shadow = (o, cast = true) => { o.traverse(m => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = true; } }); return o; };
  const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
  function lathe(points, mat, segments = 40) {
    return mesh(new THREE.LatheGeometry(points.map(p => new THREE.Vector2(p[0], p[1])), segments), mat);
  }
  function box(parent, mat, size, pos) { const m = mesh(new THREE.BoxGeometry(...size), mat); m.position.set(...pos); parent.add(m); return m; }
  // Viga recta entre dos puntos, con sección w × t.
  function beam(parent, mat, a, b, w, t) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), len = va.distanceTo(vb);
    const m = mesh(new THREE.BoxGeometry(w, len, t), mat);
    m.position.copy(va).add(vb).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    parent.add(m); return m;
  }
  function roundedRect(w, h, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  // Placa horizontal con esquinas redondeadas (w en X, d en Z, t de espesor); su base queda en y = 0.
  function slab(w, d, t, r, mat, bevel = 0) {
    const g = new THREE.ExtrudeGeometry(roundedRect(w, d, r), { depth: t - 2 * bevel, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 10 });
    g.rotateX(-Math.PI / 2); g.translate(0, bevel, 0);
    return mesh(g, mat);
  }
  const clone = name => { const m = models[name]; return m ? m.clone(true) : new THREE.Group(); };

  // ---------------------------------------------------------------- Banco (referencia: Banco Lia)
  function stool() {
    const g = new THREE.Group();
    const seatY = .66;
    const seat = slab(.5, .44, .075, .1, M.fabric, .018); seat.position.set(0, seatY - .075, .02); g.add(seat);
    box(g, M.walnut, [.42, .028, .36], [0, seatY - .09, .02]);
    for (const sx of [-1, 1]) {
      const x = sx * .238;
      beam(g, M.walnut, [x, 0, .23], [x, .84, -.172], .034, .05);     // pata delantera que sube hasta el respaldo
      beam(g, M.walnut, [x, 0, -.27], [x, .6, -.06], .034, .05);     // pata trasera
      beam(g, M.walnut, [x, .25, .125], [x, .25, -.165], .026, .03); // travesaño lateral
    }
    beam(g, M.walnut, [-.238, .27, .118], [.238, .27, .118], .03, .034);   // descansapiés
    beam(g, M.walnut, [-.238, .25, -.165], [.238, .25, -.165], .026, .03);
    box(g, M.steelBrushed, [.45, .004, .036], [0, .288, .118]);
    // respaldo curvo tapizado
    const arc = new THREE.Shape(); const R = .275, r = .215, a0 = THREE.MathUtils.degToRad(8), a1 = THREE.MathUtils.degToRad(172);
    arc.absarc(0, 0, R, a0, a1, false); arc.absarc(0, 0, r, a1, a0, true);
    const bg = new THREE.ExtrudeGeometry(arc, { depth: .19, bevelEnabled: true, bevelSize: .016, bevelThickness: .016, bevelSegments: 3, curveSegments: 28 });
    bg.rotateX(-Math.PI / 2); const back = mesh(bg, M.fabric); back.position.set(0, .745, .05); back.scale.set(1, 1, .9); g.add(back);
    return shadow(g);
  }

  // ---------------------------------------------------------------- Lámpara (referencia: Corda, 12 luces)
  function lamp() {
    const g = new THREE.Group();
    const glowTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
      const gr = x.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,236,200,.85)'); gr.addColorStop(.35, 'rgba(255,220,170,.28)'); gr.addColorStop(1, 'rgba(255,210,150,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    const glowMat = new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    const globeGeo = new THREE.SphereGeometry(.046, 28, 20), beadGeo = new THREE.SphereGeometry(.011, 12, 10), capGeo = new THREE.CylinderGeometry(.012, .02, .016, 14);
    function globe(x, y, z) {
      const s = mesh(globeGeo, M.globe); s.position.set(x, y, z); g.add(s);
      const c = mesh(capGeo, M.brass); c.position.set(x, y + .05, z); g.add(c);
      const b = mesh(beadGeo, M.brass); b.position.set(x, y - .052, z); b.scale.setScalar(.7); g.add(b);
      const sp = new THREE.Sprite(glowMat); sp.position.set(x, y, z); sp.scale.setScalar(.3); g.add(sp);
    }
    function chain(points, beads) {
      const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
      g.add(mesh(new THREE.TubeGeometry(curve, 40, .0032, 6), M.brass));
      for (let i = 1; i < beads; i++) { const b = mesh(beadGeo, M.brass); b.position.copy(curve.getPoint(i / beads)); g.add(b); }
      return curve;
    }
    // florón central y dos anclajes laterales
    const canopy = mesh(new THREE.CylinderGeometry(.075, .075, .028, 32), M.brass); canopy.position.y = -.014; g.add(canopy);
    for (const sx of [-1, 1]) {
      const cone = mesh(new THREE.ConeGeometry(.026, .05, 18), M.brass); cone.position.set(sx * .6, -.025, 0); cone.rotation.x = Math.PI; g.add(cone);
      const swag = chain([[sx * .05, -.03, 0], [sx * .2, -.2, .01], [sx * .38, -.24, .01], [sx * .6, -.05, 0]], 9);
      for (const t of [.33, .62]) { const p = swag.getPoint(t); globe(p.x, p.y - .05, p.z); }
      const drop = sx < 0 ? [-.2, -.62] : [-.3, -.7];
      chain([[sx * .6, -.05, 0], [sx * .6, drop[1] + .05, 0]], 7);
      globe(sx * .6, drop[0], 0); globe(sx * .6, drop[1], 0);
    }
    chain([[0, -.03, 0], [0, -.78, 0]], 9);
    globe(-.035, -.3, .02); globe(.04, -.36, -.015); globe(-.01, -.43, .03); globe(0, -.84, 0);
    // luz cálida de la lámpara encendida
    const lights = [];
    for (const [x, y, i] of [[0, -.42, 10]]) {   // una sola luz puntual: mismo ambiente, menos carga para gráficas integradas
      const l = new THREE.PointLight('#ffd7a1', i, 6, 2); l.position.set(x, y, 0); l.userData.on = i; g.add(l); lights.push(l);
    }
    // Encender y apagar: las luces se quedan en la escena con intensidad 0, para no recompilar materiales.
    g.userData.setOn = on => {
      lights.forEach(l => { l.intensity = on ? l.userData.on : 0; });
      M.globe.emissiveIntensity = on ? 1.35 : 0; M.globe.color.set(on ? '#fff4e2' : '#ece6da'); glowMat.visible = on;
    };
    return g;
  }

  // ---------------------------------------------------------------- Batería de cocina
  function pot(r, h, withLid = true) {
    const g = new THREE.Group();
    g.add(lathe([[0, 0], [r - .012, 0], [r, .012], [r, h - .004], [r + .005, h], [r - .003, h], [r - .006, h - .004], [r - .006, .01], [0, .008]], M.enamel));
    for (const sx of [-1, 1]) {
      const hg = new THREE.TorusGeometry(.03, .0055, 8, 18, Math.PI); hg.rotateX(Math.PI / 2);
      const hd = mesh(hg, M.enamel); hd.rotation.y = sx * Math.PI / 2; hd.position.set(sx * (r - .002), h - .03, 0); g.add(hd);
    }
    if (withLid) { const l = lid(r); l.position.y = h; g.add(l); }
    return shadow(g);
  }
  function lid(r) {
    const g = new THREE.Group();
    g.add(lathe([[0, .024], [r * .45, .021], [r * .86, .006], [r - .002, -.004], [r + .003, 0], [r * .86, .012], [r * .45, .027], [0, .03]], M.enamel));
    const stemM = mesh(new THREE.CylinderGeometry(.006, .008, .014, 12), M.brass); stemM.position.y = .036; g.add(stemM);
    const knob = lathe([[0, 0], [.012, 0], [.019, .006], [.019, .012], [.012, .017], [0, .018]], M.brass, 24); knob.position.y = .042; g.add(knob);
    return shadow(g);
  }
  function pan(r, steel = false) {
    const g = new THREE.Group(), h = .048, body = steel ? M.steel : M.enamel;
    g.add(lathe([[0, 0], [r * .8, 0], [r * .86, .006], [r, h], [r + .004, h], [r - .003, h - .002], [r * .86 - .004, .01], [r * .8, .006], [0, .006]], body));
    const hm = steel ? M.steelBrushed : M.blackHandle;
    const neck = mesh(new THREE.BoxGeometry(.02, .008, .05), hm); neck.position.set(0, h - .008, r + .02); neck.rotation.x = -.2; g.add(neck);
    const grip = mesh(new THREE.CapsuleGeometry(.011, .11, 4, 10), hm); grip.rotation.x = Math.PI / 2 - .1; grip.scale.set(1.25, 1, .75); grip.position.set(0, h + .006, r + .1); g.add(grip);
    return shadow(g);
  }
  function plate(r) { return shadow(lathe([[0, 0], [r * .56, 0], [r * .62, .004], [r, .02], [r, .0235], [r * .62, .0075], [0, .0055]], M.ceramic, 48)); }
  function bowl(r, h, mat = M.ceramic) { return shadow(lathe([[0, 0], [r * .42, 0], [r * .8, h * .5], [r, h], [r - .0035, h], [r * .8 - .004, h * .5], [r * .42, .005], [0, .005]], mat, 40)); }
  function glass(r, h) { const m = lathe([[0, 0], [r * .84, 0], [r, h], [r - .0025, h], [r * .84 - .003, .008], [0, .008]], M.glass, 28); m.renderOrder = 3; return m; }
  function stack(make, n, pitch) { const g = new THREE.Group(); for (let i = 0; i < n; i++) { const p = make(); p.position.y = i * pitch; g.add(p); } return g; }
  function board(w, d, t, mat) { const b = slab(w, d, t, .03, mat, .003); return shadow(b); }

  // ---------------------------------------------------------------- Cubiertos
  function cutleryShape(pts) { const s = new THREE.Shape(); s.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) s.lineTo(...pts[i]); s.closePath(); return s; }
  function flat(shape, t = .0022) { const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 12 }); g.rotateX(-Math.PI / 2); return g; } // forma (x, y) → (x, -z)
  const knifeGeo = (() => {
    const s = new THREE.Shape(); s.moveTo(-.008, 0); s.lineTo(.008, 0); s.lineTo(.0075, .095); s.lineTo(.011, .1);
    s.quadraticCurveTo(.0125, .19, .002, .225); s.quadraticCurveTo(-.006, .215, -.0075, .1); s.lineTo(-.008, 0); return flat(s);
  })();
  const forkGeo = (() => {
    const p = [[-.006, 0], [.006, 0], [.0045, .11], [.012, .14], [.012, .2]];
    for (let i = 0; i < 4; i++) { const x1 = .012 - i * .008, x0 = x1 - .0048; p.push([x1, .2], [x0, .2], [x0, .15]); if (i < 3) p.push([x0 - .0032, .15]); }
    p.push([-.012, .14], [-.0045, .11]);
    return flat(cutleryShape(p));
  })();
  const spoonHandleGeo = flat(cutleryShape([[-.006, 0], [.006, 0], [.0038, .13], [-.0038, .13]]));
  const spoonBowlGeo = (() => { const g = new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); g.scale(.02, .007, .031); return g; })();
  function knife(scale = 1) { const m = mesh(knifeGeo, M.steel); m.scale.setScalar(scale); return m; }
  function fork(scale = 1) { const m = mesh(forkGeo, M.steel); m.scale.setScalar(scale); return m; }
  function spoon(scale = 1) {
    const g = new THREE.Group(); g.add(mesh(spoonHandleGeo, M.steel));
    const b = mesh(spoonBowlGeo, M.steel); b.position.set(0, .0075, -.157); g.add(b); g.scale.setScalar(scale); return g;
  }
  // Pila de cubiertos acomodados dentro de un compartimento (mango hacia el frente del cajón).
  function cutleryPile(make, n) {
    const g = new THREE.Group();
    for (let i = 0; i < n; i++) { const c = make(); c.position.set((i % 2 ? 1 : -1) * .0025, .0015 + i * .0034, (i % 3) * .003); c.rotation.y = (i % 2 ? 1 : -1) * .012; g.add(c); }
    return g;
  }
  function chefKnife() {
    const g = new THREE.Group();
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(.045, 0); s.quadraticCurveTo(.046, .14, .004, .2); s.lineTo(0, .2); s.lineTo(0, 0);
    g.add(mesh(flat(s, .002), M.steel));
    const h = mesh(new THREE.BoxGeometry(.022, .016, .115), M.blackHandle); h.position.set(.012, .004, .06); g.add(h);
    return shadow(g);
  }

  // ---------------------------------------------------------------- Especieros con etiqueta
  const SPICES = [['Laurel', '#6f7a4a'], ['Canela Molida', '#8a5a34'], ['Hierbas Italianas', '#5d6b3c'], ['Chile Pico de Pájaro', '#9e2f1f'],
    ['Clavo', '#4a2f22'], ['Canela', '#7a4a2b'], ['Cebolla en Polvo', '#d8c9a1'], ['Ajonjolí Negro', '#2a2826'],
    ['Ajonjolí', '#e2d3a8'], ['Orégano', '#6c7445'], ['Comino Molido', '#9b7a45'], ['Paprika', '#a8371c'],
    ['Chiltepín Rojo', '#b5421f'], ['Pimienta Entera', '#33302c'], ['Perejil', '#566b35'], ['Ajo Molido', '#e3d6b4']];
  const jarGeo = new THREE.BoxGeometry(.086, .046, .046), fillGeo = new THREE.BoxGeometry(.078, .026, .038);
  const lidGeo = (() => { const g = new THREE.CylinderGeometry(.0235, .0235, .022, 24); g.rotateZ(Math.PI / 2); return g; })();
  const labelGeo = (() => { const g = new THREE.PlaneGeometry(.05, .03); g.rotateX(-Math.PI / 2); return g; })();
  function label(text) {
    const c = document.createElement('canvas'); c.width = 320; c.height = 192; const x = c.getContext('2d');
    x.fillStyle = '#fdfcf8'; x.beginPath(); x.roundRect(4, 4, 312, 184, 26); x.fill();
    x.fillStyle = '#2b2a27'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const words = text.split(' '), lines = words.length > 2 ? [words.slice(0, 2).join(' '), words.slice(2).join(' ')] : words.length === 2 ? words : [text];
    const size = lines.some(l => l.length > 9) ? 44 : 54; x.font = `600 ${size}px Poppins, Arial, sans-serif`;
    lines.forEach((l, i) => x.fillText(l, 160, 96 + (i - (lines.length - 1) / 2) * (size + 8)));
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return new THREE.MeshStandardMaterial({ map: t, roughness: .7 });
  }
  function spiceJar([name, color]) {
    const g = new THREE.Group();
    const fill = mesh(fillGeo, std({ color, roughness: .95 })); fill.position.set(.002, -.008, 0); g.add(fill);
    const body = mesh(jarGeo, M.jarGlass); body.renderOrder = 3; g.add(body);
    const l = mesh(lidGeo, M.bamboo); l.position.x = -.054; g.add(l);
    const lb = mesh(labelGeo, label(name)); lb.position.set(.004, .0236, 0); lb.renderOrder = 4; g.add(lb);
    return g;
  }

  // ---------------------------------------------------------------- Organizadores tipo AMBIA-LINE
  // Marco perimetral de acero gris sobre el fondo del cajón; (x0..x1, z0..z1) en coordenadas locales del grupo.
  function frame(parent, x0, x1, z0, z1, h = .05, t = .006, mat = M.ambia) {
    box(parent, mat, [x1 - x0, h, t], [(x0 + x1) / 2, h / 2, z0 + t / 2]); box(parent, mat, [x1 - x0, h, t], [(x0 + x1) / 2, h / 2, z1 - t / 2]);
    box(parent, mat, [t, h, z1 - z0 - 2 * t], [x0 + t / 2, h / 2, (z0 + z1) / 2]); box(parent, mat, [t, h, z1 - z0 - 2 * t], [x1 - t / 2, h / 2, (z0 + z1) / 2]);
  }
  function peg(parent, x, z, h = .12) { const p = mesh(new THREE.CylinderGeometry(.007, .007, h, 12), M.ambia); p.position.set(x, h / 2, z); parent.add(p); const f = mesh(new THREE.CylinderGeometry(.016, .018, .008, 16), M.ambia); f.position.set(x, .004, z); parent.add(f); }

  // Cajón inferior: ollas, sartenes y tapas. Origen en la esquina frontal izquierda del fondo; x a la derecha, z hacia atrás (negativo).
  function potsDrawer(w, d) {
    const g = new THREE.Group();
    box(g, M.mat, [w - .004, .002, d - .004], [w / 2, .001, -d / 2]);
    const xa = w * .36, xb = w * .68;
    frame(g, .004, xa, -d + .004, -.004); frame(g, xa + .004, xb, -d + .004, -.004); frame(g, xb + .004, w - .004, -d + .004, -.004);
    // zona izquierda: dos ollas con tapa
    const p1 = pot(.125, .13); p1.position.set(xa / 2, .002, -d * .72); g.add(p1);
    const p2 = pot(.098, .105); p2.position.set(xa / 2 + .02, .002, -d * .225); p2.rotation.y = .5; g.add(p2);
    // zona central: olla grande y cacerola
    const p3 = pot(.135, .15); p3.position.set((xa + xb) / 2 + .004, .002, -d * .66); p3.rotation.y = 1.1; g.add(p3);
    const sp = pan(.075, true); sp.scale.setScalar(.9); sp.position.set(xa + .084, .002, -d * .2); sp.rotation.y = Math.PI / 2; g.add(sp);
    // zona derecha: sartenes y tapas de canto, separadas por postes
    const x0 = xb + .03, slots = [[.13, 'pan'], [.12, 'pan'], [.11, 'pan'], [.14, 'lid'], [.125, 'lid']];
    const pitch = (w - .03 - x0) / slots.length;
    slots.forEach(([r, kind], i) => {
      const x = x0 + pitch * (i + .5);
      const it = kind === 'pan' ? pan(r) : lid(r);
      it.rotation.order = 'ZYX';
      if (kind === 'pan') { it.rotation.set(0, Math.PI, Math.PI / 2); it.position.set(x + .022, r + .004, -(r + .012)); }
      else { it.rotation.set(0, 0, -Math.PI / 2 + .1); it.position.set(x - .014, r + .004, -d * .56); }
      g.add(it);
      peg(g, x - pitch / 2 + .002, -d * .2, .15); peg(g, x - pitch / 2 + .002, -d * .62, .15);
    });
    peg(g, w - .024, -d * .2, .15); peg(g, w - .024, -d * .62, .15);
    return shadow(g);
  }

  // Cajón medio: platos, tazones, vasos y tablas para picar.
  function dishesDrawer(w, d) {
    const g = new THREE.Group();
    box(g, M.mat, [w - .004, .002, d - .004], [w / 2, .001, -d / 2]);
    const xa = w * .56, xb = w * .78;
    frame(g, .004, xa, -d + .004, -.004); frame(g, xa + .004, xb, -d + .004, -.004); frame(g, xb + .004, w - .004, -d + .004, -.004);
    const add = (o, x, z) => { o.position.set(x, .002, z); g.add(o); return o; };
    // platos trinche al frente; platos pequeños y tazones atrás, con postes portaplatos
    const stacks = [[() => plate(.13), 8, .0058, .145, -.142, .13], [() => plate(.13), 6, .0058, .425, -.142, .13],
      [() => plate(.095), 8, .0052, .11, -.372, .095], [() => bowl(.08, .06), 5, .013, .3, -.378, .08], [() => bowl(.068, .075, M.ceramicSage), 4, .016, .47, -.385, .068]];
    for (const [make, n, pitch, x, z, r] of stacks) {
      add(stack(make, n, pitch), x, z);
      for (let k = 0; k < 3; k++) { const a = (z < -.3 ? Math.PI / 2 : Math.PI / 6) + k * Math.PI * 2 / 3; peg(   // fila trasera: ningún poste hacia la trasera del cajón
g, x + Math.cos(a) * (r + .012), z + Math.sin(a) * (r + .012), .1); }
    }
    // vasos
    for (let i = 0; i < 2; i++) for (let k = 0; k < 4; k++) add(glass(.037, .125), xa + .062 + i * .095, -.07 - k * .105);
    // tablas para picar apiladas
    add(board(.19, .4, .018, M.boardDark), (xb + w) / 2, -d / 2);
    const b2 = add(board(.17, .34, .016, M.boardWood), (xb + w) / 2, -d / 2 + .02); b2.position.y = .02;
    return shadow(g);
  }

  // Cajón interior: especias a la izquierda y cubertero a la derecha.
  function cutleryDrawer(w, d) {
    const g = new THREE.Group();
    // especias: dos columnas de frascos acostados con la etiqueta hacia arriba
    const sw = .258;
    box(g, M.ambia, [sw, .004, d - .008], [sw / 2 + .004, .002, -d / 2]);
    frame(g, .004, sw + .004, -d + .004, -.004, .02, .005);
    box(g, M.ambia, [.005, .02, d - .018], [.004 + sw / 2, .01, -d / 2]);
    SPICES.forEach((s, i) => {
      const col = i % 2, row = Math.floor(i / 2), j = spiceJar(s);
      j.position.set(.004 + sw * (col ? .75 : .25) + .012, .028, -.036 - row * .0565); g.add(j);
    });
    // cubertero
    const tx0 = sw + .014, tw = w - tx0 - .004, td = d - .012, th = .042, wall = .004;
    const tray = new THREE.Group(); tray.position.set(tx0, 0, -.006); g.add(tray);
    box(tray, M.tray, [tw, .004, td], [tw / 2, .002, -td / 2]);
    frame(tray, 0, tw, -td, 0, th, wall, M.tray);
    const narrow = 5, nw = .084, longStart = narrow * nw, frontLen = td * .62;
    for (let i = 1; i <= narrow; i++) box(tray, M.tray, [wall, th, i === narrow ? td : frontLen], [i * nw, th / 2, i === narrow ? -td / 2 : -frontLen / 2]);
    box(tray, M.tray, [longStart, th, wall], [longStart / 2, th / 2, -frontLen]);
    box(tray, M.tray, [wall, th, td - frontLen], [longStart / 2, th / 2, -(frontLen + td) / 2]);
    const longN = 3, lw = (tw - longStart) / longN;
    for (let i = 1; i < longN; i++) box(tray, M.tray, [wall, th, td], [longStart + i * lw, th / 2, -td / 2]);
    const piles = [[() => knife(), 6], [() => fork(), 6], [() => spoon(), 6], [() => fork(.82), 6], [() => spoon(.78), 6]];
    piles.forEach(([make, n], i) => { const p = cutleryPile(make, n); p.position.set(nw * (i + .5), .004, -.02); tray.add(p); });
    // compartimentos traseros: cuchillos de mesa extra y cucharitas atravesadas
    const extra = cutleryPile(() => spoon(.62), 4); extra.rotation.y = -Math.PI / 2; extra.position.set(.04, .004, -(frontLen + td) / 2 - .01); tray.add(extra);
    const extra2 = cutleryPile(() => knife(.8), 4); extra2.rotation.y = -Math.PI / 2; extra2.position.set(longStart / 2 + .02, .004, -(frontLen + td) / 2); tray.add(extra2);
    // compartimentos largos: cuchara de madera, espátula y cuchillo de chef
    const ws = clone('wooden_spoon'); ws.rotation.y = Math.PI; ws.position.set(longStart + lw * .5, .02, -td * .47); tray.add(ws);
    const spat = new THREE.Group();
    spat.add(mesh(new THREE.CapsuleGeometry(.008, .17, 4, 10), M.boardWood).rotateX(Math.PI / 2).translateY(0));
    const head = slab(.06, .09, .006, .014, M.silicone, .002); head.position.set(0, -.003, -.15); spat.add(head);
    spat.position.set(longStart + lw * 1.5, .014, -td * .32); tray.add(spat);
    const ck = chefKnife(); ck.position.set(longStart + lw * 2.5 - .024, .006, -.15); ck.scale.setScalar(1.05); tray.add(ck);
    return shadow(g, false);
  }

  // ---------------------------------------------------------------- Artículos sobre la cubierta
  function flowers() {
    const g = new THREE.Group();
    const bud = (mat) => { const b = lathe([[0, 0], [.012, .006], [.017, .022], [.014, .042], [.006, .052], [0, .05]], mat, 14); return b; };
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, lean = .05 + (i % 3) * .035, h = .2 + (i % 4) * .035;
      const top = new THREE.Vector3(Math.cos(a) * lean * 1.6, h, Math.sin(a) * lean * 1.6);
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -.2, 0), new THREE.Vector3(Math.cos(a) * lean * .4, h * .45, Math.sin(a) * lean * .4), top]);
      g.add(mesh(new THREE.TubeGeometry(curve, 14, .0022, 6), M.stem));
      const b = bud(i % 3 === 0 ? M.petalB : M.petalA); b.position.copy(top); b.rotation.set(Math.sin(a) * lean * 2.2, 0, -Math.cos(a) * lean * 2.2); g.add(b);
      if (i % 2 === 0) { const leaf = mesh(new THREE.SphereGeometry(1, 10, 8), M.stem); leaf.scale.set(.011, .05, .003); leaf.position.copy(curve.getPoint(.55)); leaf.rotation.set(0, -a, .5); g.add(leaf); }
    }
    return shadow(g);
  }
  function counterProps() {
    const g = new THREE.Group();
    // florero con flores
    const vase = clone('ceramic_vase_01'); vase.scale.setScalar(.72); vase.position.set(-.36, 0, -.1); g.add(vase);
    const fl = flowers(); fl.position.set(-.36, .29, -.1); g.add(fl);
    // frutero
    const fb = clone('wooden_bowl_01'); fb.scale.setScalar(.9); fb.position.set(.3, 0, -.14); g.add(fb);
    [['food_apple_01', -.05, .03, .01, 0], ['food_apple_01', .05, .03, -.04, 2], ['food_lime_01', .01, .035, .07, 1], ['food_lime_01', -.02, .075, -.02, 4], ['lemon', .06, .035, .05, 3]].forEach(([n, x, y, z, r]) => {
      const f = clone(n); f.position.set(.3 + x, y, -.14 + z); f.rotation.y = r; g.add(f);
    });
    // tabla con alimentos y cuchillo
    const cb = clone('wooden_cutting_board'); cb.position.set(.02, 0, .2); cb.rotation.y = .12; g.add(cb);
    const av = clone('food_avocado_01'); av.scale.setScalar(.8); av.rotation.set(Math.PI / 2, 0, .6); av.position.set(-.05, .055, .2); g.add(av);
    const le = clone('lemon'); le.position.set(.07, .018, .16); g.add(le);
    const ck = chefKnife(); ck.rotation.y = -1.25; ck.position.set(.12, .021, .26); g.add(ck);
    // bote de utensilios
    const crock = lathe([[0, 0], [.058, 0], [.064, .01], [.064, .15], [.06, .15], [.058, .012], [0, .012]], M.ceramicSage, 36); crock.position.set(-.47, 0, .27); g.add(crock);
    [[.5, .25, 0], [-.35, .3, 2.2], [.1, -.4, 4]].forEach(([rx, rz, ry], i) => {
      const s = clone('wooden_spoon'); const h = new THREE.Group(); s.rotation.x = -Math.PI / 2; s.position.y = .2; h.add(s);
      h.rotation.set(rx * .35, ry, rz * .35); h.position.set(-.47, .012, .27); h.scale.setScalar(i === 2 ? .9 : 1); g.add(h);
    });
    return shadow(g);
  }

  return { stool, lamp, potsDrawer, dishesDrawer, cutleryDrawer, counterProps, materials: M };
}
