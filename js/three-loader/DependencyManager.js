import { TexturePack } from "./TexturePack.js";

export class DependencyDictionary
{
    constructor(textures, materials)
    {
        /**
         * @type {Array<string>}
         */
        this.textures = textures && Array.isArray(textures) ? textures : [];
        /**
         * @type {Array<string>}
         */
        this.materials = materials && Array.isArray(materials) ? materials : []; 
    }
}

/**
 * @interface
 * @template DependencyType
 */
class DependencyProvider
{
    /**
     * 
     * @param {string} key
     * @param {boolean} [loadedOnly=false] 
     * @returns {DependencyType}
     */
    getConfig(key, loadedOnly= false) {}

    /**
     * @param {string} key
     * @returns {DependencyType}
     */
    getLoadedConfig(key) {}

    /**
     * 
     * @param {string} key
     * @param {boolean} [checkDependencies=true] 
     * @returns {DependencyType} 
     */
    async load(key, checkDependencies = true) {}
}

/**
 * @extends DependencyProvider<TexturePack>
 */
class TexturePackProvider extends DependencyProvider {}

/**
 * @extends DependencyProvider<THREE.Material>
 */
class MaterialProvider extends DependencyProvider {}

/**
 * @type {{texturePacks: TexturePackProvider, materials: MaterialProvider}}
 */
const PROVIDERS = {
    "texturePacks": null,
    "materials": null
}


/**
 * @param {"texturePacks"|"materials"} key
 * @param {TexturePackProvider|MaterialProvider} provider 
 */
export function register(key, provider)
{
    if(PROVIDERS[key] === undefined) return;
    PROVIDERS[key] = provider;
}

/**
 * 
 * @returns {TexturePackProvider | null}
 */
export function getTexturePackProvider()
{
    return PROVIDERS.texturePacks;
}

/**
 * @returns {MaterialProvider | null}
 */
export function getMaterialProvider()
{
    return PROVIDERS.materials;
}