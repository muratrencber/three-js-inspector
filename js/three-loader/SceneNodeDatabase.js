import { DependencyType, register } from "./DependencyManager.js";
import { ObjectDatabase } from "./ObjectDatabase.js";
import { SceneNode } from "./SceneNode.js";
import { SceneNodeLoader } from "./SceneNodeLoader.js";

const CONFIGS_PATH = "./configs/scenenodestest.yaml";

/**
 * @extends ObjectDatabase<SceneNode>
 */
export class SceneNodeDatabase extends ObjectDatabase
{
    constructor()
    {
        super(CONFIGS_PATH, SceneNodeLoader);
    }

    registerForDependencies()
    {
        register(DependencyType.nodes, this);
    }

    /**
     * @type {SceneNodeDatabase}
     */
    static instance;
    static setup()
    {
        if(!SceneNodeDatabase.instance)
        {
            SceneNodeDatabase.instance = new SceneNodeDatabase();
            SceneNodeDatabase.instance.init();
        }
    }
}