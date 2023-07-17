import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextureDatabase } from './three-loader/TextureDatabase.js';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js';
import { MaterialDatabase } from './three-loader/MaterialDatabase.js';
import { registerCallback } from './three-loader/CallbackManager.js';
import { TexturePack } from './three-loader/TexturePack.js';

TextureDatabase.instance;
MaterialDatabase.instance;


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);

//SECTION TESTING
const cubeGeometry = new THREE.PlaneGeometry(1,1,256,256);
const cubeMaterial = new THREE.MeshPhysicalMaterial({color: 0x00ff00});
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.rotateX(200);
scene.add(cube);
camera.position.set(0,0,5);

registerCallback("yokohama/loadedAll",
([pack]) => {
    const tex = pack.getTexture("group1");
    cubeMaterial.envMap = tex;
    scene.background = tex;
});
registerCallback("grass/loadlog",
([mat]) => {
    console.log("loaded material GRASS:");
    console.log(mat);
});
MaterialDatabase.instance.load("grass").then(mat => {
    cube.material = mat;
});
let lightProbe = null;
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
document.getElementById("ambient-input").addEventListener("input", (nv) => {
    ambientLight.intensity = parseFloat(nv.target.value);
})
document.getElementById("roughness-input").addEventListener("input", (nv) => {
    const value = parseFloat(nv.target.value);
    cube.material.roughness = value;
})
document.getElementById("metalness-input").addEventListener("input", (nv) => {
    const value = parseFloat(nv.target.value);
    cube.material.metalness = value;
})
document.getElementById("use-lp").addEventListener("click", () => {
    try {
        scene.remove(ambientLight);
    } catch {}
    if(!lightProbe) {
        renderer.domElement.style.opacity = 0.2;
        setTimeout(setLP, 100);
        return;
    }
    try {
        scene.remove(lightProbe);
    } catch {}
    scene.add(lightProbe);
})
function setLP()
{
    lightProbe = LightProbeGenerator.fromCubeTexture(scene.background);
    try {
        scene.remove(lightProbe);
    } catch {}
    scene.add(lightProbe);
    renderer.domElement.style.opacity = 1;
}
document.getElementById("use-al").addEventListener("click", () => {
    try {
        scene.remove(lightProbe);
    } catch {}
    try {
        scene.remove(ambientLight);
    } catch {}
    scene.add(ambientLight);
})

const size = Math.min(window.innerWidth, window.innerHeight);
renderer.setSize(size, size);
document.body.appendChild(renderer.domElement);

render();

document.addEventListener("keydown", (ev) => {
    const key = ev.keyCode;
    const deg2Rad = 3.14 / 180;
    const rotateAmount = deg2Rad * 3;
    console.log(key);
    if(key == 37)
    {
        cube.rotateY(-rotateAmount);
    }
    else if(key == 39)
    {
        cube.rotateY(rotateAmount);
    }
    else if(key == 38)
    {
        cube.rotateX(rotateAmount);
    }
    else if(key == 40)
    {
        cube.rotateX(-rotateAmount);
    }
    else if(key == 75)
    {
        cube.rotateZ(-rotateAmount);
    }
    else if(key == 76)
    {
        cube.rotateZ(rotateAmount);
    }
});

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    //SECTION TESTING
    //ENDSECT TESTING
}