import { register } from "./DependencyManager.js";
import { ModifierLoader } from "./ModifierLoader.js";
import { ObjectDatabase } from "./ObjectDatabase.js";

/**
 * @extends ObjectDatabase<Object>
 */
export class ModifierDatabase extends ObjectDatabase {
    /**
     * @param {string} configsPath 
     */
    constructor(configsPath)
    {
        super(configsPath, ModifierLoader);
    }


    registerForDependencies()
    {
        register("modifiers", this);
    }

    /**
     * @type {ModifierDatabase}
     */
    static instance;
    /**
     * @public
     * @param {string} configsPath 
     * @returns {ModifierDatabase}
     */
    static setup(configsPath) {
        if(ModifierDatabase.instance === undefined) {
            ModifierDatabase.instance = new ModifierDatabase(configsPath);
            ModifierDatabase.instance.init();
        }
    }
}