import { SceneNode } from "./SceneNode.js";
import { TexturePack } from "./TexturePack.js";

/**
 * @typedef {"texturePacks"|"materials"|"models"|"nodes"} DependencyTypeValues
 * @global
 */
export const DependencyType = {
    texturePacks: "texturePacks",
    materials: "materials",
    models: "models",
    nodes: "nodes"
} 

export class DependencyDictionary
{
    /**
     * 
     * @typedef {{texturePacks: Array<string>,materials: Array<string>,models: Array<string>, nodes: Array<string>}} DependencyDictionaryType
     * @param {DependencyDictionaryType} typesAndKeys 
     */
    constructor(typesAndKeys = {})
    {
        /**
         * @type {DependencyDictionaryType}
         * @private
         */
        this.dict = {
            texturePacks: {},
            materials: {},
            models: {},
            nodes: {}
        };
        for(const texturePackKey of (typesAndKeys.texturePacks ?? []))
            this.dict.texturePacks[texturePackKey] = undefined;
        for(const materialKey of (typesAndKeys.materials ?? []))
            this.dict.materials[materialKey] = undefined;
        for(const modelKey of (typesAndKeys.models ?? []))
            this.dict.models[modelKey] = undefined;
        for(const nodeKey of (typesAndKeys.nodes ?? []))
            this.dict.nodes[nodeKey] = undefined;
    }

    async loadAll()
    {
        for(const providerKey in this.dict)
        {
            const provider = getProivder(providerKey);
            const keysToLoad = Object.keys(this.dict[providerKey]);
            for(const keyToLoad of keysToLoad)
            {
                this.dict[providerKey][keyToLoad] = await provider?.load(keyToLoad);
            }
        }
    }

    /**
     * 
     * @param {DependencyTypeValues} dependencyType 
     */
    getObject(dependencyType, key)
    {
        let value = this.dict[dependencyType][key];
        if(value !== undefined) return value;
        return getProivder(dependencyType).getLoadedConfig(key);
    }

    /**
     * 
     * @returns {Object.<string, TexturePack>}
     */
    getTexturePackDictionary()
    {
        return this.dict.texturePacks;
    }
}

/**
 * @interface
 * @template DependencyTypeTemplate
 */
class DependencyProvider
{
    /**
     * 
     * @param {string} key
     * @param {boolean} [loadedOnly=false] 
     * @returns {DependencyTypeTemplate}
     */
    getConfig(key, loadedOnly= false) {}

    /**
     * @param {string} key
     * @returns {DependencyTypeTemplate}
     */
    getLoadedConfig(key) {}

    /**
     * 
     * @param {string} key
     * @param {boolean} [checkDependencies=true] 
     * @returns {DependencyTypeTemplate} 
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
 * @extends DependencyProvider<THREE.Group>
 */
class ModelProvider extends DependencyProvider {}

/**
 * @extends DependencyProvider<SceneNode>
 */
class NodeProvider extends DependencyProvider {}

/**
 * @typedef {import("./SceneUI.js").SceneUI} UIManager
 */

/**
 * @typedef {{texturePacks: TexturePackProvider, materials: MaterialProvider, models: ModelProvider, nodes: NodeProvider, uiManager: UIManager}} Provider
 * @type {Provider}
 */
const PROVIDERS = {
    "texturePacks": null,
    "materials": null,
    "models": null,
    "nodes": null,
    "uiManager": null,
}

/**
 * @param {keyof typeof PROVIDERS} key
 * @param {TexturePackProvider|MaterialProvider|ModelProvider|NodeProvider} provider 
 */
export function register(key, provider)
{
    if(PROVIDERS[key] === undefined) return;
    PROVIDERS[key] = provider;
}

/**
 * 
 * @param {DependencyTypeValues} key 
 * @returns {DependencyProvider}
 */
export function getProivder(key)
{
    return PROVIDERS[key];
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

/**
 * @returns {ModelProvider | null}
 */
export function getModelProvider()
{
    return PROVIDERS.models;
}

/**
 * @returns {NodeProvider | null}
 */
export function getNodeProvider()
{
    return PROVIDERS.nodes;
}

/**
 * @returns {UIManager | null}
 */
export function getUIManager()
{
    return PROVIDERS.uiManager;
}