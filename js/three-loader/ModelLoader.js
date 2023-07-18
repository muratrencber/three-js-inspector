import { ConfigLoader } from "./ConfigLoader.js";
import { SchemaKeys } from "./ConfigSchema.js";
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { DependencyDictionary } from "./DependencyManager.js";
import { getExtension, normalizePath } from "./path.js";

/**
 * @extends ConfigLoader<THREE.Mesh>
 */
export class ModelLoader extends ConfigLoader
{
    constructor()
    {
        super(SchemaKeys.MODEL);
    }

    getDependencies()
    {
        return new DependencyDictionary({
            materials: this.getMaterialDependencies()
        });
    }

    /**
     * @returns {Array<string>}
     */
    getMaterialDependencies()
    {
        const material = this.getValue("material", undefined);
        const materials = this.getValue("materials", []);
        const combined = material ? [material, ...materials] : materials;
        return new Array(new Set(combined))
    }

    async load()
    {
        const {path, extension} = this.getSourcePathAndExtension();
        /**
         * @type {THREE.Loader}
         */
        let loader = undefined;
        switch (extension) {
            case "fbx":
                loader = new FBXLoader();
                break;

            case "obj":
            default:
                loader = new THREE.ObjectLoader();
                break;
        }
        /**
         * @type {THREE.Group}
         */
        const group = await loader.loadAsync(path);
        this.applyMaterials(group);
        return group;
    }

    /**
     * 
     * @param {THREE.Group} group 
     */
    applyMaterials(group)
    {
        const defaultMaterial = this.getMaterial(this.getValue("material"));
        const materials = this.getValue("materials", []).map(matKey => this.getMaterial(matKey));
        const children = group.children;
        for(let i = 0; i < children.length; i++)
        {
            let selectedMaterial = defaultMaterial;
            if(i < materials.length) selectedMaterial = materials[i];
        }
    }

    /**
     * 
     * @returns {{path: string, extension: string}}
     */
    getSourcePathAndExtension()
    {
        const path = this.getValue("path", "");
        const extension = getExtension(path);
        if(extension === "") throw new Error(`PATH: "${path}": Extension not defined!`);
        return {
            path: normalizePath(path),
            extension: extension
        };
    }
}