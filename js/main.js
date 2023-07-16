import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextureLoader } from './three-loader/TextureLoader.js' 


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);

//SECTION TESTING
const cubeGeometry = new THREE.SphereGeometry(1,256,256);
const cubeMaterial = new THREE.MeshPhysicalMaterial({});
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.rotateX(200);
scene.add(cube);
camera.position.set(0,0,5);

const envMapConfig = {
    type: "cubemap",
    root: "/texture/cubemap/yokohama",
    defaultExtension: "jpg"
};
const cubeDiffuseConfig = {
    sources: "/texture/coast_sand_rocks/diffuse.jpg"
};
const cubeDisplacementConfig = {
    sources: "/texture/coast_sand_rocks/displacement.jpg"
};
const cubeNormalConfig = {
    sources: "/texture/coast_sand_rocks/normal.jpg"
};
const cubeRoughnessConfig = {
    sources: "/texture/coast_sand_rocks/roughness.jpg"
};
const cubeAOConfig = {
    sources: "/texture/coast_sand_rocks/ao.jpg"
};
const cubeArmConfig = {
    sources: "/texture/coast_sand_rocks/arm.jpg"
};
const txloader = new TextureLoader();
txloader.setConfig(envMapConfig);
txloader.load().then(tex => {
    cubeMaterial.envMap = tex;
    scene.background = tex;
    const lp = LightProbeGenerator.fromCubeTexture(tex);
    scene.add(lp);
});
/*
const cubeDiffuse = toThreeTexture(cubeDiffuseConfig);
const cubeDisplacement = toThreeTexture(cubeDisplacementConfig);
const cubeNormal = toThreeTexture(cubeNormalConfig);
const cubeRoughness = toThreeTexture(cubeRoughnessConfig);
const cubeAO = toThreeTexture(cubeAOConfig);
const cubeArm = toThreeTexture(cubeArmConfig);
Promise.all([cubeDiffuse, cubeDisplacement, cubeNormal, cubeRoughness, cubeAO, cubeArm]).then(texes => {
    const [diff, disp, norm, rough, ao, arm] = texes;
    cubeMaterial.roughnessMap = rough;
    cubeMaterial.map = diff;
    cubeMaterial.displacementMap = disp;
    cubeMaterial.displacementScale = 0.1;
    cubeMaterial.normalMap = norm;
    cubeMaterial.aoMap = ao;
    cubeMaterial.anisotropyMap = arm;

})*/
//ENDSECT TESTING



const size = Math.min(window.innerWidth, window.innerHeight);
renderer.setSize(size, size);
document.body.appendChild(renderer.domElement);

new THREE.LightProbe()

render();

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);

    //SECTION TESTING
    //ENDSECT TESTING
}