import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextureDatabase } from './three-loader/TextureDatabase.js';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator.js';
import { MaterialDatabase } from './three-loader/MaterialDatabase.js';

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

/*TextureDatabase.instance.load("coast_sand_rocks").then(resultMap => {
    console.log(resultMap);
    const newMat = new THREE.MeshPhysicalMaterial({map: resultMap.diffuse});
    newMat.map = resultMap.diffuse;
    newMat.displacementMap = resultMap.displacement;
    newMat.displacementScale = 0.025;
    newMat.normalMap = resultMap.normal;
    newMat.roughnessMap = resultMap.roughness;
    newMat.aoMap = resultMap.ao;
    cube.material = newMat;
});*/
TextureDatabase.instance.load("yokohama").then(resultPack => {
    const tex = resultPack.getTexture("group1");
    cubeMaterial.envMap = tex;
    scene.background = tex;
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    //const lp = LightProbeGenerator.fromCubeTexture(tex);
    //scene.add(lp);
});
MaterialDatabase.instance.load("grass").then(mat => {
    cube.material = mat;
});
/*
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



const size = Math.min(window.innerWidth, window.innerHeight);
renderer.setSize(size, size);
document.body.appendChild(renderer.domElement);

render();

document.addEventListener("keydown", (ev) => {
    const key = ev.keyCode;
    const deg2Rad = 3.14 / 180;
    const rotateAmount = deg2Rad;
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