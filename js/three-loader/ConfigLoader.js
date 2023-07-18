import {Schema, SchemaKeys, GetSchema} from './ConfigSchema.js';
import { DependencyDictionary, DependencyType } from './DependencyManager.js';
import { TexturePack } from './TexturePack.js';
import * as THREE from 'three';

/**
 * @template ConfigType
 * @abstract
 */
export class ConfigLoader 
{
    /**
     * 
     * @param {SchemaKeys} schemaKey 
     */
    constructor(schemaKey)
    {
        /**
         * @type {Schema}
         */
        this.schema = GetSchema(schemaKey);
        /**
         * @type {DependencyDictionary}
         * @private
         */
        this.dependencies = new DependencyDictionary();
    }

    /**
     * 
     * @param {Object} config 
     * @returns {ConfigLoader}
     */
    setConfig(config) {
        this.schema.assertValidate(config);
        this.config = config;
    }

    getValue(key, defaultValue = undefined)
    {
        let value = defaultValue;
        if(this.config && this.config[key])
            value = this.config[key];
        else
            value ??= this.schema.tryGetValue(this.config, key);
        return value;
    }

    /**
     * @async
     * @public
     */
    async loadDependencies()
    {
        this.dependencies = this.getDependencies();
        await this.dependencies.loadAll();
    }

    /**
     * 
     * @returns { DependencyDictionary }
     * @protected
     */
    getDependencies()
    {
        return new DependencyDictionary();
    }

    /**
     * 
     * @param {string} key 
     * @returns {THREE.Texture} 
     */
    getTexture(key)
    {
        if(!this.dependencies) return null;
        let splitted = key.split("/");
        if(splitted > 1) {
            const [packKey, textureKey] = splitted;
            /**
             * @type {TexturePack}
             */
            const pack = this.dependencies.getObject(DependencyType.texturePacks, packKey);
            return pack.getTexture(textureKey);
        }
        const packs = this.dependencies.getTexturePackDictionary();
        for(const packKey in packs)
        {
            const pack = packs[packKey];
            if(pack.hasTexture(key)) return pack.getTexture(key);
        }
        return null;
    }

    /**
     * 
     * @param {string} key 
     * @returns {THREE.Material}
     */
    getMaterial(key)
    {
        if(!this.dependencies) return null;
        return this.dependencies.getObject(DependencyType.materials, key);
    }

    /**
     * @returns {Promise<ConfigType>}
     */
    async load() { throw new Error("Cannot load with abstract base class ConfigLoader!"); }
}