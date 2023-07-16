import * as THREE from 'three';
import {DefaultValueMap, assertValidate, getValue} from './common';
import {toThreeTexture} from './texture';
THREE.ColorRepresentation
const MaterialParametersTypeMap = {
    clippingPlanes: Array,
    color: THREE.Color,
    map: THREE.Texture,
    lightMap: THREE.Texture,
    aoMap: THREE.Texture,
    emissive: THREE.Color,
    emissiveMap: THREE.Texture,
    bumpMap: THREE.Texture,
    normalMap: THREE.Texture,
    normalScale: THREE.Vector2,
    displacementMap: THREE.Texture,
    roughnessMap: THREE.Texture,
    metalnessMap: THREE.Texture,
    alphaMap: THREE.Texture,
    envMap: THREE.Texture,
    clearcoatMap: THREE.Texture,
    clearcoatRoughnessMap: THREE.Texture,
    clearcoatNormalScale: THREE.Vector2,
    clearcoatNormalMap: THREE.Texture,
    sheenColor: THREE.Color,
    sheenColorMap: THREE.Texture,
    sheenRoughnessMap: THREE.Texture,
    transmissionMap: THREE.Texture,
    thicknessMap: THREE.Texture,
    attenuationColor: THREE.Color,
    specularColor: THREE.Color,
    specularIntensityMap: THREE.Texture,
    specularColorMap: THREE.Texture,
    iridescenceMap: THREE.Texture,
    anisotropyMap: THREE.Texture
}

const materialSchema = {
    type: {values: ["standard", "physical"], valueTypes: ["string"], default: DefaultValueMap.Single("standard")},
    textureFinder: {optional: true}
}

const propertyProcessMap = {
    envMap: {func: processTextureConfig},
}
const typeProcessors = [
    { type: THREE.Texture, func: processTextureConfig },
];

export function toThreeMaterial(materialConfig) {
    assertValidate(materialConfig, materialSchema);
    const properties = processProperties(materialConfig);
    const type = getValue(materialConfig, "type", materialSchema);
    switch (type) {
        case "physical":
            return new THREE.MeshPhysicalMaterial(properties);
        case "standard":
        default:
            return new THREE.MeshStandardMaterial(properties);
    }
}

function getProcessorForProperty(key, property) {
    let result = propertyProcessMap[key];
    if(result) return result;
    if(MaterialParametersTypeMap[key] !== undefined)
        result = typeProcessors.find(tp => tp.type === MaterialParametersTypeMap[key]);
    if(result) return result;
    return null;
}

function processTextureConfig(key, textureKey, materialConfig) {
    const texture = materialConfig.textureFinder(textureKey);
    if(texture) return texture;
    return undefined;
}

function processProperties(materialConfig) {
    const properties = materialConfig.properties;
    if(!properties) return {};
    const result = {};
    for(const key in properties) {
        const property = properties[key];
        const processor = getProcessorForProperty(key, property);
        const processedProperty = processor ? processor(key, property, materialConfig) : property;
        result[key] = processedProperty; 
    }
    return result;
}