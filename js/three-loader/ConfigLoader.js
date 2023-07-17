import {Schema, SchemaKeys, GetSchema} from './ConfigSchema.js';
import { DependencyDictionary } from './DependencyManager.js';

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
     * 
     * @returns { DependencyDictionary }
     */
    getDependencies()
    {
        return new DependencyDictionary();
    }

    /**
     * @returns {Promise<ConfigType>}
     */
    async load() { throw new Error("Cannot load with abstract base class ConfigLoader!"); }
}