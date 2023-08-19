import { register, DependencyType } from "./DependencyManager.js";
import { ObjectDatabase } from "./ObjectDatabase.js";
import { MaterialLoader } from './MaterialLoader.js'; 
import * as THREE from 'three';
/**
 * @extends ObjectDatabase<THREE.Material>
 */
export class MaterialDatabase extends ObjectDatabase {
    
    /**
     * @param {string} configsPath 
     */
    constructor(configsPath)
    {
        super(configsPath, MaterialLoader);
    }


    registerForDependencies()
    {
        register(DependencyType.materials, this);
    }

    /**
     * 
     * @param {THREE.Material} object 
     * @returns 
     */
    copyLoadedObject(object)
    {
        return this.loadedConfigMap[object];
    }

    /**
     * @type {MaterialDatabase}
     */
    static instance;
    /**
     * @param {string} configsPath 
     */
    static setup(configsPath) {
        if(MaterialDatabase.instance === undefined) {
            MaterialDatabase.instance = new MaterialDatabase(configsPath);
            MaterialDatabase.instance.init();
        }
    }
}