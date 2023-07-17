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
     * @private
     * @type {MaterialDatabase}
     */
    static _instance;

    /**
     * @public
     * @returns {MaterialDatabase}
     */
    static get instance() {
        if(MaterialDatabase._instance === undefined) {
            MaterialDatabase._instance = new MaterialDatabase();
            MaterialDatabase._instance.init();
        }
        return MaterialDatabase._instance;
    }
}