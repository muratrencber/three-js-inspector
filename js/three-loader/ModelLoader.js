import { ConfigLoader } from "./ConfigLoader.js";
import { SchemaKeys } from "./ConfigSchema.js";
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DependencyDictionary, getMaterialProvider } from "./DependencyManager.js";
import { getExtension, normalizePath } from "./path.js";
import { applyMaterialArray, applyMaterialDict, createMaterialMap } from "./MaterialUtils.js";


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
        let resultSet = new Set();
        Object.values(this.getValue("materialMap", {})).forEach(elem => resultSet.add(elem));
        this.getValue("materials", []).forEach(elem => resultSet.add(elem));
        return Array.from(resultSet);
    }

    async load()
    {
        const {path, extension} = this.getSourcePathAndExtension();
        /**
         * @type {THREE.Loader}
         */
        let loader = undefined;
        switch (extension.toLowerCase()) {
            case "fbx":
                loader = new FBXLoader();
                break;

            case "gltf":
            case "glb":
                loader = new GLTFLoader();
                break;

            case "obj":
            default:
                loader = new OBJLoader();
                break;
        }
        /**
         * @type {THREE.Group}
         */
        let group = await loader.loadAsync(path);
        if(loader instanceof GLTFLoader)
        {
            group = group.scene;
        }
        let materialMap = this.getValue("materialMap", {});
        for(const originalKey in materialMap)
        {
            materialMap[originalKey] = this.getMaterial(materialMap[originalKey]);
        }
        let materials = this.getValue("materials", []).map(mat => this.getMaterial(mat));
        const defaultMaterial = this.getMaterial(this.getValue("material","error"));
        if(Object.keys(materialMap).length > 0) applyMaterialDict(group, materialMap);
        else applyMaterialArray(group, materials, defaultMaterial);
        this.applyRotation(group);
        return group;
    }

    /**
     * 
     * @param {THREE.Group} group 
     */
    applyRotation(group)
    {
        const deg2Rad = Math.PI / 180;
        const isLocal = this.getValue("rotateLocal", false);
        const xRotation = this.getValue("rotateX", 0) * deg2Rad;
        const yRotation = this.getValue("rotateY", 0) * deg2Rad;
        const zRotation = this.getValue("rotateZ", 0) * deg2Rad;
        if(isLocal)
        {
            group.rotateX(xRotation);
            group.rotateY(yRotation);
            group.rotateZ(zRotation);
        }
        else
        {
            group.rotateOnWorldAxis(new THREE.Vector3(1,0,0), xRotation);
            group.rotateOnWorldAxis(new THREE.Vector3(0,1,0), yRotation);
            group.rotateOnWorldAxis(new THREE.Vector3(0,0,1), zRotation);
        }
    }

    /**
     * 
     * @returns {{path: string, extension: string}}
     */
    getSourcePathAndExtension()
    {
        const path = this.getValue("source", "");
        const extension = getExtension(path);
        if(extension === "") throw new Error(`PATH: "${path}": Extension not defined!`);
        return {
            path: normalizePath(path),
            extension: extension
        };
    }
}