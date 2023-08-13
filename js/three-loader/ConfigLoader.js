import { invokeCallback } from './CallbackManager.js';
import {Schema, SchemaKeys, GetSchema} from './ConfigSchema.js';
import { DependencyDictionary, DependencyType } from './DependencyManager.js';
import { SceneNode } from './SceneNode.js';
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
        let value = this.getValueWithSchema(this.config, key, this.schema, undefined);
        if(!value) return defaultValue;
        const subSchema = this.schema?.subSchemas[key];
        if(subSchema)
        {
            const valuesToEvaluate = !subSchema.iterates ? [value] : subSchema.iterates === "dict" ? Object.values(value) : value;
            for(const val of valuesToEvaluate)
            {
                for(const valKey in val)
                    val[valKey] ??= this.getValueWithSchema(val, valKey, subSchema);
            }
        }
        return value;
    }

    /**
     * @private
     * @param {Object} object 
     * @param {string} key 
     * @param {Schema} schema 
     * @param {any} defaultValue 
     * @returns 
     */
    getValueWithSchema(object, key, schema, defaultValue = undefined)
    {
        let value = defaultValue;
        if(object && object[key])
            value = object[key];
        else
            value ??= schema?.tryGetValue(object, key);
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
        if(splitted.length > 1) {
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

    invokeCallbackFunction(functionKey, ...values)
    {
        const registeredKey = this.getValue(functionKey, undefined);
        if(!registeredKey) return;
        invokeCallback(registeredKey, values);
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
     * 
     * @param {string} key 
     * @returns {SceneNode}
     */
    getNode(key)
    {
        if(!this.dependencies) return null;
        return this.dependencies.getObject(DependencyType.nodes, key);
    }

    /**
     * @returns {Promise<ConfigType>}
     */
    async load() { throw new Error("Cannot load with abstract base class ConfigLoader!"); }
}