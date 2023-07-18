import { DependencyType, register } from "./DependencyManager.js";
import { ModelLoader } from "./ModelLoader.js";
import { ObjectDatabase } from "./ObjectDatabase.js";
import * as THREE from 'three';

const CONFIGS_PATH = "./configs/modelstest.yaml";

/**
 * @extends ObjectDatabase<THREE.Group>
 */
export class ModelDatabase extends ObjectDatabase
{
    constructor()
    {
        super(CONFIGS_PATH, ModelLoader);
    }

    registerForDependencies()
    {
        register(DependencyType.models, this);
    }

    /**
     * @type {ModelDatabase}
     */
    static instance;
    static setup()
    {
        if(!ModelDatabase.instance)
        {
            ModelDatabase.instance = new ModelDatabase();
            ModelDatabase.instance.init();
        }
    }
}