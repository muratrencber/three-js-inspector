import * as THREE from 'three';
import { shaderStructs, shaderIntersectFunction, MeshBVHUniformStruct, MeshBVH, SAH } from 'three-mesh-bvh';
import { getRenderManager } from '../three-loader/DependencyManager.js';

function isCubeTexture(envMap) {
  return envMap !== undefined && envMap !== null && envMap.isCubeTexture;
}

function getDefines(parameters) {
  if (!parameters) parameters = {};
  let defines = {};
  const aberrationStrength = parameters["aberrationStrength"];
  const fastChroma = parameters["fastChroma"];
  const envMap = parameters["envMap"];
  const isCubeMap = isCubeTexture(envMap);
  const w = (isCubeMap ? envMap.image[0]?.width : envMap?.image.width) ?? 1024;
  const cubeSize = w / 4
  const _lodMax = Math.floor(Math.log2(cubeSize))
  const _cubeSize = Math.pow(2, _lodMax)
  const width = 3 * Math.max(_cubeSize, 16 * 7)
  const height = 4 * _cubeSize
  if (isCubeMap) defines.ENVMAP_TYPE_CUBEM = ''
  defines.CUBEUV_TEXEL_WIDTH = `${1.0 / width}`
  defines.CUBEUV_TEXEL_HEIGHT = `${1.0 / height}`
  defines.CUBEUV_MAX_MIP = `${_lodMax}.0`
  // Add defines from chromatic aberration
  if (aberrationStrength > 0) defines.CHROMATIC_ABERRATIONS = ''
  if (fastChroma) defines.FAST_CHROMA = ''
  return defines;
}

export class MeshRefractionMaterial extends THREE.ShaderMaterial {
  /**
   * 
   * @param {Object.<string, any>} parameters 
   */
  constructor(parameters) {
    if (!parameters) parameters = {};
    /**
     * @type {MeshBVHUniformStruct}
     */
    parameters["bvh"] = new MeshBVHUniformStruct();
    /**
     * @type {THREE.Matrix4}
     */
    parameters["viewMatrixInverse"] = new THREE.Matrix4();
    /**
     * @type {THREE.Matrix4}
     */
    parameters["projectionMatrixInverse"] = new THREE.Matrix4();
    const defines = getDefines(parameters);


    let uniforms = {};
    for (const paramKey in parameters) {
      const uniformEntry = new THREE.Uniform(parameters[paramKey]);
      uniforms[paramKey] = uniformEntry;
    };

    super({
      defines: defines,
      uniforms: uniforms,
      fragmentShader: FRAGMENT_SHADER,
      vertexShader: VERTEX_SHADER
    });

    this.parameters = parameters;
  }

  /**
   * 
   * @param {THREE.Mesh} mesh 
   */
  onAddedToMesh(mesh) {
    this.setGeometry(mesh.geometry);
    getRenderManager().callbacks.addListener("onBeforeRender", ({renderManager}) => {
      this.parameters["viewMatrixInverse"] = renderManager.camera.matrixWorld;
      this.parameters["projectionMatrixInverse"] = renderManager.camera.projectionMatrixInverse;

      this.uniforms.viewMatrixInverse = new THREE.Uniform(this.parameters.viewMatrixInverse);
      this.uniforms.projectionMatrixInverse = new THREE.Uniform(this.parameters.projectionMatrixInverse);
      this.needsUpdate = true;
    });
  }

  /**
   * 
   * @param {THREE.Mesh} mesh 
   */
  onRemovedFromMesh(mesh)
  {

  }

  setGeometry(geometry) {
    if (!geometry) {
      this.geometry = undefined;
      this.parameters.bvh = new MeshBVHUniformStruct();
    }
    else {
      this.parameters["bvh"].updateFrom(
        new MeshBVH(geometry.toNonIndexed(), { lazyGeneration: true, strategy: SAH })
      );
      this.geometry = geometry;
    }
    this.uniforms.bvh = new THREE.Uniform(this.parameters.bvh);
    this.needsUpdate = true;

  }

  set envMap(value) {
    this.parameters.envMap = value;
    const defines = getDefines(this.parameters);
    this.defines = defines;
    this.uniforms.envMap = new THREE.Uniform(this.parameters.envMap);
    this.needsUpdate = true;
  }

  clone() {
    let result = super.clone();
    result.parameters = this.parameters;
    result.parameters.bvh = this.geometry ? MeshBVH.deserialize(MeshBVH.serialize(this.parameters.bvh), this.parameters.bvh.geometry) : new MeshBVHUniformStruct();
    result.needsUpdate = true;
    return result;
  }
}

const VERTEX_SHADER = `uniform mat4 viewMatrixInverse;

varying vec3 vWorldPosition;  
varying vec3 vNormal;
varying mat4 vModelMatrixInverse;

#ifdef USE_INSTANCING_COLOR
  varying vec3 vInstanceColor;
#endif

void main() {        
  vec4 transformedNormal = vec4(normal, 0.0);
  vec4 transformedPosition = vec4(position, 1.0);
  #ifdef USE_INSTANCING
    transformedNormal = instanceMatrix * transformedNormal;
    transformedPosition = instanceMatrix * transformedPosition;
  #endif

  #ifdef USE_INSTANCING
    vModelMatrixInverse = inverse(modelMatrix * instanceMatrix);
  #else
    vModelMatrixInverse = inverse(modelMatrix);
  #endif

  #ifdef USE_INSTANCING_COLOR
    vInstanceColor = instanceColor.rgb;
  #endif

  vWorldPosition = (modelMatrix * transformedPosition).xyz;
  vNormal = normalize((viewMatrixInverse * vec4(normalMatrix * transformedNormal.xyz, 0.0)).xyz);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * transformedPosition;
}`;
const FRAGMENT_SHADER = `#define ENVMAP_TYPE_CUBE_UV
precision highp isampler2D;
precision highp usampler2D;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying mat4 vModelMatrixInverse;

#ifdef USE_INSTANCING_COLOR
  varying vec3 vInstanceColor;
#endif
  
#ifdef ENVMAP_TYPE_CUBEM
  uniform samplerCube envMap;
#else
  uniform sampler2D envMap;
#endif
  
uniform float bounces;
${shaderStructs}
${shaderIntersectFunction}
uniform BVH bvh;
uniform float ior;
uniform bool correctMips;
uniform vec2 resolution;
uniform float fresnel;
uniform mat4 modelMatrix;
uniform mat4 projectionMatrixInverse;
uniform mat4 viewMatrixInverse;
uniform float aberrationStrength;
uniform vec3 color;

float fresnelFunc(vec3 viewDirection, vec3 worldNormal) {
  return pow( 1.0 + dot( viewDirection, worldNormal), 10.0 );
}
  
vec3 totalInternalReflection(vec3 ro, vec3 rd, vec3 normal, float ior, mat4 modelMatrixInverse) {
  vec3 rayOrigin = ro;
  vec3 rayDirection = rd;
  rayDirection = refract(rayDirection, normal, 1.0 / ior);
  rayOrigin = vWorldPosition + rayDirection * 0.001;
  rayOrigin = (modelMatrixInverse * vec4(rayOrigin, 1.0)).xyz;
  rayDirection = normalize((modelMatrixInverse * vec4(rayDirection, 0.0)).xyz);
  for(float i = 0.0; i < bounces; i++) {
    uvec4 faceIndices = uvec4( 0u );
    vec3 faceNormal = vec3( 0.0, 0.0, 1.0 );
    vec3 barycoord = vec3( 0.0 );
    float side = 1.0;
    float dist = 0.0;
    bvhIntersectFirstHit( bvh, rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist );
    vec3 hitPos = rayOrigin + rayDirection * max(dist - 0.001, 0.0);      
    vec3 tempDir = refract(rayDirection, faceNormal, ior);
    if (length(tempDir) != 0.0) {
      rayDirection = tempDir;
      break;
    }
    rayDirection = reflect(rayDirection, faceNormal);
    rayOrigin = hitPos + rayDirection * 0.01;
  }
  rayDirection = normalize((modelMatrix * vec4(rayDirection, 0.0)).xyz);
  return rayDirection;
}
  
#include <common>
#include <cube_uv_reflection_fragment>
  
#ifdef ENVMAP_TYPE_CUBEM
  vec4 textureGradient(samplerCube envMap, vec3 rayDirection, vec3 directionCamPerfect) {
    return textureGrad(envMap, rayDirection, dFdx(correctMips ? directionCamPerfect: rayDirection), dFdy(correctMips ? directionCamPerfect: rayDirection));
  }
#else
  vec4 textureGradient(sampler2D envMap, vec3 rayDirection, vec3 directionCamPerfect) {
    vec2 uvv = equirectUv( rayDirection );
    vec2 smoothUv = equirectUv( directionCamPerfect );
    return textureGrad(envMap, uvv, dFdx(correctMips ? smoothUv : uvv), dFdy(correctMips ? smoothUv : uvv));
  }
#endif

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec3 directionCamPerfect = (projectionMatrixInverse * vec4(uv * 2.0 - 1.0, 0.0, 1.0)).xyz;
  directionCamPerfect = (viewMatrixInverse * vec4(directionCamPerfect, 0.0)).xyz;
  directionCamPerfect = normalize(directionCamPerfect);
  vec3 normal = vNormal;
  vec3 rayOrigin = cameraPosition;
  vec3 rayDirection = normalize(vWorldPosition - cameraPosition);
  vec3 finalColor;
  #ifdef CHROMATIC_ABERRATIONS
    vec3 rayDirectionG = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior, 1.0), vModelMatrixInverse);
    #ifdef FAST_CHROMA 
      vec3 rayDirectionR = normalize(rayDirectionG + 1.0 * vec3(aberrationStrength / 2.0));
      vec3 rayDirectionB = normalize(rayDirectionG - 1.0 * vec3(aberrationStrength / 2.0));
    #else
      vec3 rayDirectionR = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior * (1.0 - aberrationStrength), 1.0), vModelMatrixInverse);
      vec3 rayDirectionB = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior * (1.0 + aberrationStrength), 1.0), vModelMatrixInverse);
    #endif
    float finalColorR = textureGradient(envMap, rayDirectionR, directionCamPerfect).r;
    float finalColorG = textureGradient(envMap, rayDirectionG, directionCamPerfect).g;
    float finalColorB = textureGradient(envMap, rayDirectionB, directionCamPerfect).b;
    finalColor = vec3(finalColorR, finalColorG, finalColorB);
  #else
    rayDirection = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior, 1.0), vModelMatrixInverse);
    finalColor = textureGradient(envMap, rayDirection, directionCamPerfect).rgb;    
  #endif

  finalColor *= color;
  #ifdef USE_INSTANCING_COLOR
    finalColor *= vInstanceColor;
  #endif

  vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
  float nFresnel = fresnelFunc(viewDirection, normal) * fresnel;
  gl_FragColor = vec4(mix(finalColor, vec3(1.0), nFresnel), 1.0);      
  #include <tonemapping_fragment>
  #include <${parseInt(THREE.REVISION.replace(/\D+/g, '')) >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
}`;