import { ConfigLoader } from "./ConfigLoader.js";
import { SchemaKeys } from "./ConfigSchema.js";

export class ModifierLoader extends ConfigLoader
{
    constructor()
    {
        super(SchemaKeys.MODIFIER);
    }

    async load()
    {
        let sanitizedConfig = {};
        for(const key in this.config)
        {
            let value = this.getValue(key, this.config[key]);
            if(value === undefined || value === null) continue;
            sanitizedConfig[key] = value;
        }
        return Promise.resolve(sanitizedConfig);
    }
}