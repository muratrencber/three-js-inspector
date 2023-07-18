import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextureDatabase } from './three-loader/TextureDatabase.js';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js';
import { MaterialDatabase } from './three-loader/MaterialDatabase.js';
import { registerCallback } from './three-loader/CallbackManager.js';
import { TexturePack } from './three-loader/TexturePack.js';
import { setup } from './three-loader/setup.js';
import { ModelDatabase } from './three-loader/ModelDatabase.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const renderer = new THREE.WebGLRenderer({antialias: true});

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0,0,5);

function getMat()
{
    return MaterialDatabase.instance?.getLoadedConfig("mario");
}

function getMar()
{
    return ModelDatabase.instance?.getLoadedConfig("mario");
}

setup().then(() => {
    registerCallback("yokohama/loadedAll",
    ([pack]) => {
        const tex = pack.getTexture("group1");
        scene.background = tex;
    });

    registerCallback("grass/loadlog",
    ([mat]) => {
        console.log("loaded material GRASS:");
        console.log(mat);
    });
    ModelDatabase.instance.load("mario").then(obj => {
        scene.add(obj);
        obj.scale.set(0.1,0.1,0.1);
        obj.position.set(0,-5,-10);
    });
})



let lightProbe = null;
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
document.getElementById("ambient-input").addEventListener("input", (nv) => {
    ambientLight.intensity = parseFloat(nv.target.value);
})
document.getElementById("roughness-input").addEventListener("input", (nv) => {
    const value = parseFloat(nv.target.value);
    getMat().roughness = value;
})
document.getElementById("metalness-input").addEventListener("input", (nv) => {
    const value = parseFloat(nv.target.value);
    getMat().metalness = value;
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
document.addEventListener("keydown", (ev) => {
    const key = ev.keyCode;
    const deg2Rad = 3.14 / 180;
    const rotateAmount = deg2Rad * 3;
    console.log(key);
    let target = getMar();
    if(key == 37)
    {
        target.rotateY(-rotateAmount);
    }
    else if(key == 39)
    {
        target.rotateY(rotateAmount);
    }
    else if(key == 38)
    {
        target.rotateX(rotateAmount);
    }
    else if(key == 40)
    {
        target.rotateX(-rotateAmount);
    }
    else if(key == 75)
    {
        target.rotateZ(-rotateAmount);
    }
    else if(key == 76)
    {
        target.rotateZ(rotateAmount);
    }
});
const size = Math.min(window.innerWidth, window.innerHeight);
renderer.setSize(size, size);
document.body.appendChild(renderer.domElement);

render();


function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    //SECTION TESTING
    //ENDSECT TESTING
}