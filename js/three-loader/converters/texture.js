import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { DefaultValueMap, getValue, assertValidate } from './common.js';



/**
 * 
 * @param {Object} textureConfig 
 * @param {ProgressEvent<EventTarget>} progressCallback
 * @returns {(Promise<THREE.Texture>)}
 */
export async function toThreeTexture(textureConfig, progressCallback = undefined) {
    assertValidate(textureConfig, textureSchema);
    const loader = getLoader(textureConfig);
    const root = getValue(textureConfig, "root", textureSchema, null);
    if(root) loader.setPath(sanitizeRoot(root));
    const sources = getSources(textureConfig);
    const texture = await loader.loadAsync(sources, progressCallback);
    for(const key in getValue(textureConfig, "properties", textureSchema)) {
        texture[key] = textureConfig.properties[key];
    }
    return texture;  
}

/**
 * 
 * @param {String} root 
 * @returns {String} 
 */
function sanitizeRoot(root) {
    if(!root) return root;
    if(root.endsWith("/")) return root;
    return root + "/";
}

/**
 * 
 * @param {String} extension 
 * @returns {String}
 */
function sanitizeExtension(extension) {
    if(!extension) return extension;
    if(!extension.startsWith(".")) return extension;
    return extension.substring(1);
}

/**
 * 
 * @param {String} path 
 * @param {String} extension 
 * @returns {String}
 */
function sanitizePath(path, extension) {
    if(extension === undefined) return path;
    const sanitizedExtension = sanitizeExtension(extension);
    const splittedPath = path.split("/");
    const fileName = splittedPath[splittedPath.length - 1];
    const extensionSplit = fileName.split(".");
    if(extensionSplit.length > 1) return path;
    return `${path}.${sanitizedExtension}`;
}

/**
 * 
 * @param {Object} textureConfig 
 * @returns {(String|Array<String>)}
 */
function getSources(textureConfig) {
    const type = getValue(textureConfig, "type", textureSchema);
    let sources = getValue(textureConfig, "sources", textureSchema);
    if(!Array.isArray(sources))
        sources = [sources];
    const extension = getValue(textureConfig, "defaultExtension", textureSchema);
    const sanitizedSources = sources.map(s => sanitizePath(s, extension));
    if(type !== "cubemap") return sanitizedSources[0];
    return sanitizedSources;
}

/**
 * 
 * @param {Object} textureConfig 
 * @returns {THREE.Loader} 
 */
function getLoader(textureConfig) {
    const type = getValue(textureConfig, "type", textureSchema);
    switch (type) {
        case "hdri":
            return new RGBELoader();
        case "cubemap":
            return new THREE.CubeTextureLoader();
        case "texture":
        default:
            return new THREE.TextureLoader();
    }
}