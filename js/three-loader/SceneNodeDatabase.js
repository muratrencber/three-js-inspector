import { DependencyType, register } from "./DependencyManager.js";
import { ObjectDatabase } from "./ObjectDatabase.js";
import { SceneNode } from "./SceneNode.js";
import { SceneNodeLoader } from "./SceneNodeLoader.js";
/**
 * @extends ObjectDatabase<SceneNode>
 */
export class SceneNodeDatabase extends ObjectDatabase {
    
    /**
     * @param {string} configsPath 
     */
    constructor(configsPath)
    {
        super(configsPath, SceneNodeLoader);
    }

    registerForDependencies()
    {
        register(DependencyType.nodes, this);
    }

    /**
     * @type {SceneNodeDatabase}
     */
    static instance;
    /**
     * @param {string} configsPath 
     */
    static setup(configsPath)
    {
        if(!SceneNodeDatabase.instance)
        {
            SceneNodeDatabase.instance = new SceneNodeDatabase(configsPath);
            SceneNodeDatabase.instance.init();
        }
    }
}