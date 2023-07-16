import {Schema, SchemaKeys, GetSchema} from './ConfigSchema.js';

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

    async load() { throw new Error("Cannot load with abstract base class ConfigLoader!"); }
}