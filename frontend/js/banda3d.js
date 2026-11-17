// Modelo 3D de la banda. Recibe datos desde app.js con window.Banda3D.
// Los productos solo aparecen bajo un sensor activo: no se inventan posiciones.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const cont = document.getElementById("vista3d");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true });
} catch (e) {
  cont.insertAdjacentHTML(
    "beforeend",
    "<p class='ayuda-3d'>WebGL no disponible en este navegador.</p>",
  );
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
cont.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e1e1e);
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(5.5, 3.6, 6.5);
const controles = new OrbitControls(camera, renderer.domElement);
controles.target.set(0, 1, 0);
controles.enableDamping = true;
controles.minDistance = 4;
controles.maxDistance = 18;
controles.maxPolarAngle = Math.PI / 2 - 0.05; // no baja del piso
controles.update();
controles.saveState();
document
  .getElementById("btn-vista")
  .addEventListener("click", () => controles.reset());

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const luz = new THREE.DirectionalLight(0xffffff, 1.4);
luz.position.set(4, 8, 5);
scene.add(luz);
scene.add(new THREE.GridHelper(20, 20, 0x3a3a3a, 0x2a2a2a));

/* ---------- Utilidades ---------- */
const mat = (color) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.3 });
function caja(w, h, d, x, y, z, m) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  scene.add(o);
  return o;
}
function cilindro(r, largo, x, y, z, m, eje) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, largo, 24), m);
  o.position.set(x, y, z);
  if (eje === "z") o.rotation.x = Math.PI / 2;
  if (eje === "x") o.rotation.z = Math.PI / 2;
  scene.add(o);
  return o;
}
function etiqueta(texto, x, y, z) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#9b9b9b";
  g.font = "28px sans-serif";
  g.textAlign = "center";
  g.fillText(texto, 128, 40);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }),
  );
  s.scale.set(1.6, 0.4, 1);
  s.position.set(x, y, z);
  scene.add(s);
}

/* ---------- Estructura ---------- */
const gris = mat(0x4a4a4a),
  oscuro = mat(0x333333);
[-2.4, 2.4].forEach((x) =>
  [-0.5, 0.5].forEach((z) => caja(0.1, 0.9, 0.1, x, 0.45, z, gris)),
);
[-0.52, 0.52].forEach((z) => caja(6.3, 0.12, 0.06, 0, 0.92, z, gris));

// Banda con listones (textura que se desplaza cuando el motor está en marcha)
const lienzo = document.createElement("canvas");
lienzo.width = 64;
lienzo.height = 8;
const gl = lienzo.getContext("2d");
gl.fillStyle = "#2a2a2a";
gl.fillRect(0, 0, 64, 8);
gl.fillStyle = "#4a4a4a";
gl.fillRect(0, 0, 6, 8);
const texBanda = new THREE.CanvasTexture(lienzo);
texBanda.wrapS = texBanda.wrapT = THREE.RepeatWrapping;
texBanda.repeat.set(40, 1);
texBanda.colorSpace = THREE.SRGBColorSpace;
caja(
  6,
  0.06,
  0.9,
  0,
  1.0,
  0,
  new THREE.MeshStandardMaterial({ map: texBanda, roughness: 0.9 }),
);
[-3, 3].forEach((x) => cilindro(0.1, 1.0, x, 0.93, 0, oscuro, "z"));

// Motor M1 y eje
const motor = caja(0.55, 0.45, 0.5, -3.6, 0.93, 0, mat(0x3a3a3a));
cilindro(0.04, 0.5, -3.3, 0.93, 0, gris, "x");
etiqueta("Motor M1", -3.6, 1.5, 0);

// Sensores fotoeléctricos con brazo sobre la banda
function sensor(x, nombre) {
  caja(0.05, 0.75, 0.05, x, 1.38, -0.62, gris);
  caja(0.05, 0.05, 0.62, x, 1.73, -0.31, gris);
  const cab = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    mat(0x555555),
  );
  cab.position.set(x, 1.65, 0);
  scene.add(cab);
  const haz = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.54, 8),
    new THREE.MeshBasicMaterial({ color: 0x4cc38a }),
  );
  haz.position.set(x, 1.3, 0);
  haz.visible = false;
  scene.add(haz);
  const prod = caja(0.5, 0.35, 0.42, x, 1.205, 0, mat(0x8c8c8c));
  prod.visible = false;
  etiqueta(nombre, x, 2.0, 0);
  return { cab, haz, prod };
}
const entrada = sensor(-1.86, "Sensor de entrada");
const salida = sensor(1.86, "Sensor de salida");

function activar(s, on) {
  s.cab.material.color.setHex(on ? 0x4cc38a : 0x555555);
  s.cab.material.emissive.setHex(on ? 0x1b5e3f : 0x000000);
  s.haz.visible = on;
  s.prod.visible = on;
}

/* ---------- API para app.js ---------- */
let marcha = false;
window.Banda3D = {
  actualizar(d) {
    motor.material.emissive.setHex(d.motor === true ? 0x1b5e3f : 0x000000);
    activar(entrada, d.sensorEntrada === true);
    activar(salida, d.sensorSalida === true);
  },
  setMarcha(b) {
    marcha = !!b;
  },
};

/* ---------- Tamaño y animación ---------- */
function ajustar() {
  const w = cont.clientWidth,
    h = cont.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(ajustar).observe(cont);
ajustar();

let anterior = performance.now();
renderer.setAnimationLoop(() => {
  const ahora = performance.now();
  const dt = Math.min((ahora - anterior) / 1000, 0.1); // segundos; tope por si la pestaña estuvo inactiva
  anterior = ahora;
  if (marcha) texBanda.offset.x -= dt * 0.6; // sentido entrada a salida
  controles.update();
  renderer.render(scene, camera);
});
