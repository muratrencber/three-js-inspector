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
     * 
     * @param {string} key 
     * @returns {THREE.Group}
     */
    resetRotation(key)
    {
        const config = super.getConfig(key);
        const group = super.getLoadedConfig(key);
        group.rotation.set(0,0,0);
        const mL = new ModelLoader();
        mL.setConfig(config);
        mL.applyRotation(group);
        return group;
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