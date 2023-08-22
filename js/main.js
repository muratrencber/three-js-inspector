import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TextureDatabase } from './three-loader/TextureDatabase.js';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js';
import { MaterialDatabase } from './three-loader/MaterialDatabase.js';
import { registerCallback } from './three-loader/CallbackManager.js';
import { TexturePack } from './three-loader/TexturePack.js';
import { setup } from './three-loader/setup.js';
import { ModelDatabase } from './three-loader/ModelDatabase.js';
import { SceneNodeDatabase } from './three-loader/SceneNodeDatabase.js';
import { SceneNode } from './three-loader/SceneNode.js';
import { SceneNodeConnection } from './three-loader/SceneNodeConnection.js';
import { SceneNodeGraph } from './three-loader/SceneNodeGraph.js';
import { SceneUI } from './three-loader/SceneUI.js';
import { createMaterialMap } from './three-loader/MaterialUtils.js';
import { DemoDOMConnection } from './testing/DemoDOMConnection.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderManager } from './three-loader/RenderManager.js';

const stats = new Stats();
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom

const camera = new THREE.PerspectiveCamera();
const renderer = new THREE.WebGLRenderer({antialias: true});
const scene = new THREE.Scene();
const size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
renderer.setSize(size, size);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById("three-container").appendChild(stats.dom);
//scene.fog = new THREE.Fog( 0xffffff, 10, 30 );

camera.position.set(-3.04, 4.02, 2.52);
camera.rotation.set(-0.89, -0.65, -0.64);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0,1,0);
controls.enableDamping = true;
controls.update();

const cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 128, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter } );
const cubeCamera = new THREE.CubeCamera( 1, 100000, cubeRenderTarget );
scene.add( cubeCamera );

let lightProbe = null;
const ambientLight = new THREE.PointLight(0xffffff, 1);
ambientLight.position.set(1,4,0);
scene.add(ambientLight);

const params = {
    threshold: 0,
    strength: 0.1,
    radius: 1,
    exposure: 1
};

const renderScene = new RenderPass( scene, camera );

const bloomPass = new UnrealBloomPass( new THREE.Vector2( 0, 0 ), 1.5, 0.4, 0.85 );
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;

const outputPass = new OutputPass();

const composer = new EffectComposer( renderer );
composer.addPass( renderScene );
composer.addPass( bloomPass );
composer.addPass( outputPass );
composer.setSize(size, size);

const graph = new SceneNodeGraph(scene);
const DOMConnection = new DemoDOMConnection();
const ui = new SceneUI().init({
    graph: graph,
    DOMConnection: DOMConnection
});
const renderManager = new RenderManager(scene, camera, renderer);

const diamondrem = document.getElementById("remove-diamond");
const diamondadd = document.getElementById("add-diamond");
diamondrem.addEventListener("click", removeDiamond);
diamondadd.addEventListener("click", addDiamond);

diamondrem.style.display = "none";
diamondadd.style.display = "none";


setup().then(() => {
    registerCallback("envMap/loadedStudio", arr => {
        /**
         * @type {[TexturePack]}
         */
        const [pack] = arr;
        scene.background = pack.getTexture("studio");
    });
    ui.setLoading(true);
    SceneNodeDatabase.instance.load("root").then(node => {
        ui.setLoading(false);
        graph.addNode(node);
        diamondrem.style.display = "";
    });
    DOMConnection.addTHREEtoDOM(renderer.domElement);
    
    render();
});


function removeDiamond()
{
    try{
        graph.disconnect(graph.nodes["diamond-ring"].connections["stone-holder"], graph.nodes["diamond02"].connections["bottom"]);
        diamondrem.style.display = "none";
        diamondadd.style.display = "";
    }catch(e)
    {
        console.warn(e);
    }
}

function addDiamond()
{
    try
    {
        graph.connect(graph.nodes["diamond-ring"].connections["stone-holder"], SceneNodeDatabase.instance.getLoadedConfig("diamond02").connections["bottom"]);
        diamondrem.style.display = "";
        diamondadd.style.display = "none";
    }
    catch(e)
    {

    }
}
    
    
function render() {
    requestAnimationFrame(render);
    stats.begin();
    renderManager.render();
    //composer.render();
    controls.update();
    stats.end();
}