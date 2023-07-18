import { ConfigLoader } from "./ConfigLoader.js";
import { SchemaKeys } from "./ConfigSchema.js";
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { DependencyDictionary } from "./DependencyManager.js";
import { getExtension, normalizePath } from "./path.js";

class MaterialMap
{
    /**
     * 
     * @param {THREE.Material} defaultMaterial 
     */
    constructor(defaultMaterial)
    {
        /**
         * @type {Array<{original: THREE.Material, new: THREE.Material | undefined}>}
         */
        this.map = [];
        /**
         * @type {THREE.Material}
         */
        this.defaultMaterial = defaultMaterial;
    }

    /**
     * 
     * @param {THREE.Material} material 
     * @returns {boolean}
     */
    hasMaterial(material)
    {
        if(this.getNewMaterial(material)) return true;
        return false;
    }

    /**
     * 
     * @param {THREE.Material} material 
     * @returns {{{original: THREE.Material, new: THREE.Material | undefined}}}
     */
    getMapFor(material)
    {
        return this.map.find(entry => entry.original === material);
    }

    /**
     * 
     * @param {THREE.Material} material 
     * @returns 
     */
    setMapFor(material)
    {
        if(this.hasMaterial(material)) return;
        this.map.push({
            original: material,
            new: this.defaultMaterial
        });
    }

    /**
     * 
     * @param {THREE.Material} material 
     * @param {number} index 
     * @returns 
     */
    setNewMaterialFromIndex(material, index)
    {
        if(index < 0 || index >= this.map.length) return;
        this.map[index].new = material;
    }

    /**
     * 
     * @param {THREE.Material} material 
     * @returns {THREE.Material}
     */
    getNewMaterial(material)
    {
        const map = this.getMapFor(material);
        if(map) return map.new;
        return undefined;
    }
}

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
        return Array.from(new Set(combined));
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
                loader = new OBJLoader();
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
        const materialMap = this.createMaterialMap(group, defaultMaterial);
        console.warn(`[${this.getValue("source", "")}]: MATCOUNT ${materialMap.map.length}`);
        for(let i = 0; i < materials.length; i++)
        {
            materialMap.setNewMaterialFromIndex(materials[i], i);
        }
        this.setFromMaterialMap(group, materialMap, defaultMaterial);
    }

    /**
     * 
     * @param {THREE.Group} group 
     * @param {THREE.Material} defaultMaterial 
     * @returns {MaterialMap}
     */
    createMaterialMap(group, defaultMaterial)
    {
        const map = new MaterialMap(defaultMaterial);
        group.traverse((obj) => {
            if(!obj.isMesh) return;
            map.setMapFor(obj.material);
        });
        return map;
    }

    /**
     * 
     * @param {THREE.Group} group 
     * @param {MaterialMap} materialMap 
     * @param {THREE.Material} defaultMaterial 
     */
    setFromMaterialMap(group, materialMap, defaultMaterial)
    {
        group.traverse((obj) => {
            if(!obj.isMesh) return;
            let selectedMaterial = materialMap.getNewMaterial(obj.material);
            if(!selectedMaterial) selectedMaterial = defaultMaterial;
            obj.material = selectedMaterial;
        })
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