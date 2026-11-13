import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createScene } from './scene.js?v=20261112a';
// The panel remains usable even when WebGL cannot start.
const panelToggle=document.querySelector('#panel-toggle');
if(panelToggle){
 let panelTouched=false;
 const landscapePhone=()=>window.matchMedia('(max-width: 1000px) and (max-height: 600px) and (orientation: landscape)').matches;
 const updatePanelToggle=()=>{const isOpen=!document.body.classList.contains('panel-closed');panelToggle.setAttribute('aria-expanded',String(isOpen));const label=isOpen?'Ocultar panel':'Mostrar panel';panelToggle.setAttribute('aria-label',label);panelToggle.title=label};
 const applyDefaultPanel=()=>{if(!panelTouched&&!document.body.classList.contains('expanded-view')){document.body.classList.toggle('panel-closed',landscapePhone());updatePanelToggle()}};
 panelToggle.addEventListener('click',()=>{panelTouched=true;document.body.classList.toggle('panel-closed');updatePanelToggle()});
 window.addEventListener('resize',applyDefaultPanel);applyDefaultPanel();
}
// Fullscreen is always opt-in: the viewer asks before requesting it.
// Browsers without the Fullscreen API can expand the site inside the available viewport.
const fullscreenToggle=document.querySelector('#fullscreen-toggle');
const fullscreenConfirm=document.querySelector('#fullscreen-confirm');
const fullscreenAccept=document.querySelector('#fullscreen-accept');
const fullscreenCancel=document.querySelector('#fullscreen-cancel');
const fullscreenDetails=document.querySelector('#fullscreen-details');
const fullscreenHelp=document.querySelector('#fullscreen-help');
const fullscreenHelpClose=document.querySelector('#fullscreen-help-close');
if(fullscreenToggle&&fullscreenConfirm&&fullscreenAccept&&fullscreenCancel&&fullscreenDetails&&fullscreenHelp&&fullscreenHelpClose){
 const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
 const supported=()=>Boolean(document.fullscreenEnabled&&document.documentElement.requestFullscreen);
 let forceExpanded=false;
 const openDialog=dialog=>{if(!dialog.open){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','')}};
 const closeDialog=dialog=>{if(dialog.open){if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open')}};
 const updateFullscreen=()=>{
  const nativeActive=Boolean(document.fullscreenElement);
  const expanded=document.body.classList.contains('expanded-view');
  const active=nativeActive||expanded;
  const canFullscreen=supported()&&!forceExpanded;
  const label=nativeActive?'Salir de pantalla completa':expanded?'Salir de vista ampliada':canFullscreen?'Pantalla completa':'Ampliar vista';
  const labelElement=fullscreenToggle.querySelector('.fullscreen-label');
  if(labelElement)labelElement.textContent=label;
  fullscreenToggle.setAttribute('aria-label',label);
  fullscreenToggle.setAttribute('aria-pressed',String(active));
  fullscreenToggle.title=label;
  // Home-screen web apps already hide the browser's address and tab bars.
  fullscreenToggle.hidden=standalone();
 };
 fullscreenToggle.addEventListener('click',()=>{
  if(document.fullscreenElement){
   document.exitFullscreen().catch(()=>openDialog(fullscreenHelp));
  }else if(document.body.classList.contains('expanded-view')){
   document.body.classList.remove('expanded-view');updateFullscreen();
  }else{
   const canFullscreen=supported()&&!forceExpanded;
   document.querySelector('#fullscreen-confirm-title').textContent=canFullscreen?'¿Abrir en pantalla completa?':'¿Ampliar la vista?';
   document.querySelector('#fullscreen-confirm-text').textContent=canFullscreen?'El visualizador ocupará toda la pantalla disponible. Puedes salir cuando quieras.':'Ocultaremos el encabezado para dar más espacio al mueble. El navegador puede mantener sus barras visibles. Puedes salir cuando quieras.';
   fullscreenDetails.hidden=canFullscreen;
   openDialog(fullscreenConfirm);
  }
 });
 fullscreenAccept.addEventListener('click',()=>{
  closeDialog(fullscreenConfirm);
  if(!supported()||forceExpanded){
   // Keep the options control available; close an open panel to maximize the model.
   if(!document.body.classList.contains('panel-closed'))panelToggle?.click();
   document.body.classList.add('expanded-view');updateFullscreen();
   return;
  }
  // Keep requestFullscreen directly in the confirmation click: browsers require user activation.
  const offerExpanded=()=>{forceExpanded=true;updateFullscreen();document.querySelector('#fullscreen-confirm-title').textContent='¿Ampliar la vista?';document.querySelector('#fullscreen-confirm-text').textContent='No fue posible abrir la pantalla completa. Podemos ocultar el encabezado para dar más espacio al mueble; el navegador puede mantener sus barras visibles.';fullscreenDetails.hidden=false;openDialog(fullscreenConfirm)};
  try{
   const request=document.documentElement.requestFullscreen();
   if(request&&typeof request.catch==='function')request.catch(offerExpanded);
  }catch(error){offerExpanded()}
 });
 fullscreenCancel.addEventListener('click',()=>closeDialog(fullscreenConfirm));
 fullscreenDetails.addEventListener('click',()=>{closeDialog(fullscreenConfirm);openDialog(fullscreenHelp)});
 fullscreenHelpClose.addEventListener('click',()=>{closeDialog(fullscreenHelp);openDialog(fullscreenConfirm)});
 document.addEventListener('fullscreenchange',updateFullscreen);
 window.matchMedia('(display-mode: standalone)').addEventListener?.('change',updateFullscreen);
 updateFullscreen();
}

const wrap=document.querySelector('#canvas-wrap');
const rotate=document.querySelector('#rotate');
let dismissed=false;
function dismiss(){dismissed=true;rotate.classList.add('fade');setTimeout(()=>{rotate.classList.add('dismissed');rotate.classList.remove('visible','fade')},350)}
document.querySelector('#close-rotate').addEventListener('click',dismiss);
document.querySelector('#continue').addEventListener('click',dismiss);
function orientation(){if(matchMedia('(orientation: landscape)').matches){rotate.classList.remove('visible');rotate.classList.add('dismissed')}else if(!dismissed&&matchMedia('(max-width: 700px)').matches){rotate.classList.remove('dismissed');rotate.classList.add('visible')}}
window.addEventListener('resize',orientation);orientation();
async function init(){
 try{
  await document.fonts.load('600 12px Poppins');
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  const touchDevice=window.matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,touchDevice?1.75:2));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
  const api=await createScene(THREE,renderer);
  const {scene,groups,target}=api;
  wrap.appendChild(renderer.domElement);document.querySelector('#loading').remove();
  const camera=new THREE.PerspectiveCamera(65,1,.03,100);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(target);
  controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=.85;controls.maxDistance=9;controls.maxPolarAngle=Math.PI*.49;controls.enablePan=true;
  // Frente = lado de los cajones; Posterior = lado de los bancos. Ambas se refieren al mueble.
  const views={front:[0,.2,1],back:[0,.24,-1],perspective:[-.62,.46,1]};
  const baseDistance=1.8;
  const fitDistance=(aspect)=>Math.max(baseDistance,2.5/(2*Math.tan(THREE.MathUtils.degToRad(32.5))*Math.max(.15,aspect))*1.15);
  let lastFit=1, initialized=false;
  function resize(){const w=wrap.clientWidth,h=wrap.clientHeight;if(!w||!h)return;camera.aspect=w/h;
   const fit=Math.max(1,fitDistance(camera.aspect)/baseDistance);
   if(initialized){const offset=camera.position.clone().sub(controls.target).multiplyScalar(fit/lastFit);camera.position.copy(controls.target).add(offset)}
   lastFit=fit;camera.updateProjectionMatrix();renderer.setSize(w,h,false);controls.update();}
  function setView(name){const dir=new THREE.Vector3(...views[name]).normalize();const d=(name==='perspective'?1.95:1.8)*lastFit;
   controls.target.copy(target);camera.position.copy(target).addScaledVector(dir,d);controls.update();
   document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));}
  new ResizeObserver(resize).observe(wrap);resize();setView('perspective');initialized=true;

  // Etiquetas "Toca para abrir / cerrar" ancladas al frente de cada cajón.
  const chips=[...document.querySelectorAll('.drawer-chip')].map(el=>({el,drawer:api.drawers[el.dataset.drawer],name:el.dataset.drawer,text:el.querySelector('span')}));
  const drawerNames={inferior:'cajón inferior',medio:'cajón medio',interior:'cajón interior'};
  function refreshChips(){for(const c of chips){const open=c.drawer.open;c.text.textContent=open?'Toca para cerrar':'Toca para abrir';c.el.setAttribute('aria-pressed',String(open));c.el.setAttribute('aria-label',(open?'Cerrar ':'Abrir ')+drawerNames[c.name])}}
  chips.forEach(c=>c.el.addEventListener('click',()=>api.toggleDrawer(c.name)));
  api.onDrawerChange(refreshChips);refreshChips();
  const anchor=new THREE.Vector3(),toCamera=new THREE.Vector3();
  function placeChips(){
   const w=wrap.clientWidth,h=wrap.clientHeight;
   for(const c of chips){
    c.drawer.anchorNode.getWorldPosition(anchor);
    toCamera.copy(camera.position).sub(anchor);
    // El frente mira hacia +Z; la etiqueta solo se muestra cuando ese frente es visible.
    let visible=toCamera.z>.15;
    if(c.name==='interior')visible=visible&&(api.drawers.medio.t>.85||c.drawer.t>.02);
    anchor.project(camera);
    if(anchor.z>1||Math.abs(anchor.x)>1.05||Math.abs(anchor.y)>1.05)visible=false;
    if(c.el.hidden===visible)c.el.hidden=!visible;
    if(visible){const x=(anchor.x*.5+.5)*w,y=(-anchor.y*.5+.5)*h;c.el.style.transform=`translate(-50%,-50%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`}
   }
  }
  if(new URLSearchParams(location.search).has('debug'))window.__viewer={camera,controls,api,THREE};
  renderer.shadowMap.autoUpdate=false;let shadowDirty=6;
  function animate(){requestAnimationFrame(animate);controls.update();if(api.update(camera))shadowDirty=2;if(shadowDirty>0){renderer.shadowMap.needsUpdate=true;shadowDirty--}renderer.render(scene,camera);placeChips()}animate();

  const toggles={cotas:v=>{groups.cotas.visible=v},bancos:v=>{groups.bancos.visible=v},persona:v=>{groups.persona.visible=v},utileria:v=>{groups.utileria.visible=v},'utileria-cajones':v=>api.setContentsVisible(v),lampara:v=>api.setLamp(v)};
  for(const [id,apply] of Object.entries(toggles)){const input=document.getElementById(id);const update=()=>{apply(input.checked);shadowDirty=3};input.addEventListener('change',update);update()}
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  document.querySelector('#reset').addEventListener('click',()=>setView('perspective'));
  function zoom(factor){const v=camera.position.clone().sub(controls.target);const next=THREE.MathUtils.clamp(v.length()*factor,controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(v.setLength(next));controls.update()}
  document.querySelector('#zoom-in').addEventListener('click',()=>zoom(.78));document.querySelector('#zoom-out').addEventListener('click',()=>zoom(1.28));
  const canvas=renderer.domElement;canvas.style.touchAction='none';let tapStart=null,lastTap=null;
  canvas.addEventListener('touchstart',event=>{if(event.touches.length!==1){tapStart=null;lastTap=null;return}const t=event.touches[0];tapStart={x:t.clientX,y:t.clientY,time:performance.now()}},{passive:true});
  canvas.addEventListener('touchmove',event=>{if(!tapStart)return;if(event.touches.length!==1){tapStart=null;lastTap=null;return}const t=event.touches[0];if(Math.hypot(t.clientX-tapStart.x,t.clientY-tapStart.y)>12){tapStart=null;lastTap=null}},{passive:true});
  canvas.addEventListener('touchend',event=>{if(!tapStart||event.touches.length!==0||event.changedTouches.length!==1){tapStart=null;return}const t=event.changedTouches[0],now=performance.now();const isTap=now-tapStart.time<280&&Math.hypot(t.clientX-tapStart.x,t.clientY-tapStart.y)<=12;tapStart=null;if(!isTap){lastTap=null;return}if(lastTap&&now-lastTap.time<340&&Math.hypot(t.clientX-lastTap.x,t.clientY-lastTap.y)<32){if(event.cancelable)event.preventDefault();lastTap=null;zoom(.78)}else lastTap={x:t.clientX,y:t.clientY,time:now}},{passive:false});
  canvas.addEventListener('touchcancel',()=>{tapStart=null;lastTap=null},{passive:true});
 }catch(error){console.error(error);const loading=document.querySelector('#loading');if(loading)loading.textContent='No fue posible mostrar el modelo 3D. Prueba abrir el enlace en Chrome o Safari actualizado.'}
}
init();
