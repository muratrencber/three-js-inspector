import { register } from "./DependencyManager.js";
import { ObjectDatabase } from "./ObjectDatabase.js";
import { MaterialLoader } from './MaterialLoader.js'; 
import * as THREE from 'three';

const CONFIGS_PATH = "./configs/materialtest.yaml";

/**
 * @extends ObjectDatabase<THREE.Material>
 */
export class MaterialDatabase extends ObjectDatabase {
    constructor()
    {
        super(CONFIGS_PATH, MaterialLoader);
    }


    registerForDependencies()
    {
        register("materials", this);
    }

    /**
     * @type {MaterialDatabase}
     */
    static instance;
    /**
     * @public
     * @returns {MaterialDatabase}
     */
    static setup() {
        if(MaterialDatabase.instance === undefined) {
            MaterialDatabase.instance = new MaterialDatabase();
            MaterialDatabase.instance.init();
        }
    }
}