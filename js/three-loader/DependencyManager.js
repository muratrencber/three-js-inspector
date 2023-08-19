import { SceneNode } from "./SceneNode.js";
import { TexturePack } from "./TexturePack.js";

const DEPENDENCY_TYPE_VALUES = {
    "texturePacks": 0,
    "materials": 0,
    "models": 0,
    "nodes": 0,
    "modifiers": 0
}
/**
 * @typedef {keyof typeof DEPENDENCY_TYPE_VALUES} DependencyTypeValues
 * @global
 */

export const DependencyType = {
    texturePacks: "texturePacks",
    materials: "materials",
    models: "models",
    nodes: "nodes",
    modifiers: "modifiers"
} 

export class DependencyDictionary
{
    /**
     * @typedef DependencyDictionaryType
     * @property {Array<string>} texturePacks
     * @property {Array<string>} materials
     * @property {Array<string>} models
     * @property {Array<string>} nodes
     * @property {Array<string>} modifiers
     */

    /**
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
            nodes: {},
            modifiers: {}
        };
        for(const texturePackKey of (typesAndKeys.texturePacks ?? []))
            this.dict.texturePacks[texturePackKey] = undefined;
        for(const materialKey of (typesAndKeys.materials ?? []))
            this.dict.materials[materialKey] = undefined;
        for(const modelKey of (typesAndKeys.models ?? []))
            this.dict.models[modelKey] = undefined;
        for(const nodeKey of (typesAndKeys.nodes ?? []))
            this.dict.nodes[nodeKey] = undefined;
        for(const modifierKey of (typesAndKeys.modifiers ?? []))
            this.dict.modifiers[modifierKey] = undefined;
    }

    async loadAll()
    {
        for(const providerKey in this.dict)
        {
            const provider = getProivder(providerKey);
            const keysToLoad = Object.keys(this.dict[providerKey]);
            for(const keyToLoad of keysToLoad)
            {
                const result = await provider?.load(keyToLoad);
                if(result === undefined || result === null) continue;
                this.dict[providerKey][keyToLoad] = result;
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
 * @extends DependencyProvider<Object>
 */
class ModifierProvider extends DependencyProvider {}

/**
 * @typedef {import("./SceneUI.js").SceneUI} UIManager
 */

/**
 * @typedef Provider
 * @property {TexturePackProvider} texturePacks
 * @property {MaterialProvider} materials
 * @property {ModelProvider} models
 * @property {NodeProvider} nodes
 * @property {UIManager} uiManager
 * @property {ModifierProvider} modifiers
 */

/**
 * @type {Provider}
 */
const PROVIDERS = {
    "texturePacks": null,
    "materials": null,
    "models": null,
    "nodes": null,
    "uiManager": null,
    "modifiers": null
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

/**
 * 
 * @returns {ModifierProvider | null}
 */
export function getModifierProvider()
{
    return PROVIDERS.modifiers;
}