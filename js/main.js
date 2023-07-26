import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextureDatabase } from './three-loader/TextureDatabase.js';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js';
import { MaterialDatabase } from './three-loader/MaterialDatabase.js';
import { registerCallback } from './three-loader/CallbackManager.js';
import { TexturePack } from './three-loader/TexturePack.js';
import { setup } from './three-loader/setup.js';
import { ModelDatabase } from './three-loader/ModelDatabase.js';
import { SceneNodeDatabase } from './three-loader/SceneNodeDatabase.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const renderer = new THREE.WebGLRenderer({antialias: true});
//scene.fog = new THREE.Fog( 0xffffff, 10, 30 );

camera.position.set(-0.34, 8.7, 16.37);
camera.rotation.set(-0.53, -0.018, -0.010);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0,-0.9,0);

const cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 128, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter } );
const cubeCamera = new THREE.CubeCamera( 1, 100000, cubeRenderTarget );
scene.add( cubeCamera );

//const sphereGeometry = new THREE.SphereGeometry(8);
//const sphereMaterial = new THREE.MeshPhongMaterial({});
//const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
//scene.add(sphere);


let lightProbe = null;
const ambientLight = new THREE.PointLight(0xffffff, 10);
ambientLight.position.set(1,4,0);
scene.add(ambientLight);
const axesHelper = new THREE.AxesHelper( 5 );
//scene.add( axesHelper );

function getMat()
{
    return MaterialDatabase.instance?.getLoadedConfig("yokohamaReflector");
}

function getMar()
{
    return ModelDatabase.instance?.getLoadedConfig("mario");
}

const renderScene = new RenderPass( scene, camera );

const params = {
    threshold: 0,
    strength: 0.1,
    radius: 1,
    exposure:1
};
const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 0.1, 0.4, 0.85 );
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;
const outputPass = new OutputPass( THREE.ReinhardToneMapping );
const composer = new EffectComposer( renderer );
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass( renderScene );
composer.addPass( bloomPass );
composer.addPass( outputPass );

setup().then(() => {
    registerCallback("envMap/loadedStudio", arr => {
        /**
         * @type {[TexturePack]}
         */
        const [pack] = arr;
        scene.background = pack.getTexture("studio");
    });
    ModelDatabase.instance.load("ring2").then(model => {
        scene.add(model);
        model.scale.set(40,40,40);
        model.rotateX(THREE.MathUtils.degToRad(-90));
        model.rotateZ(THREE.MathUtils.degToRad(-60));
    });
})

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
    composer.render();
    //SECTION TESTING
    //ENDSECT TESTING
}