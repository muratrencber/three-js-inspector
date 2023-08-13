import { getMaterialProvider, getModelProvider } from "./DependencyManager.js";
import { applyMaterialArray } from "./MaterialUtils.js";
import { ModelDatabase } from "./ModelDatabase.js";
import { SceneNodeConnection } from "./SceneNodeConnection.js";
import * as THREE from 'three';

/**
 * @enum {string}
 */
export const SceneNodeObjectTypes = {
    "empty": "empty",
    "model": "model",
    "primitive/cube": "primitive/cube",
    "primitive/plane": "primitive/plane",
    "primitive/sphere": "primitive/sphere",
    "light/point": "light/point",
    "connection/receiver": "connection/receiver",
    "connection/plug": "connection/plug"
}

/**
 * @global
 * @typedef {{x: number, y: number, z: number}} vector3
 * @typedef {{position: THREE.Vector3, rotation: THREE.Euler, scale: THREE.Vector3}} transform
 * @typedef {keyof typeof SceneNodeObjectTypes} nodeType
 */
export class SceneNodeObjectSpecification
{
    /**
     * 
     * @param {nodeType} type 
     * @param {string} key 
     */
    constructor(type, key)
    {
        if(!type || !SceneNodeObjectTypes[type])
            type = SceneNodeObjectTypes.empty;
        /**
         * @type {nodeType}
         */
        this.type = type;
        /**
         * @type {string}
         */
        this.key = key;
        /**
         * @type {THREE.Matrix4}
         */
        this.transform = new THREE.Matrix4();
        /**
         * @type {Array<string>}
         */
        this.materials = [];
        /**
         * @type {{intensity: number, color: THREE.Color}}
         */
        this.lightProperties = {intensity: 0, color: new THREE.Color().setHex(0xffffff)};
    }

    /**
     * 
     * @returns {THREE.Object3D}
     */
    getObject()
    {
        const threeObject = this.createObjectType();
        this.setTransform(threeObject);
        this.setMaterials(threeObject);
        this.setLightProperties(threeObject);
        if(this.type.startsWith("connection"))
        {
            const [_, connectionType] = this.type.split("/");
            return new SceneNodeConnection(connectionType, threeObject);
        }
        return threeObject;
    }

    /**
     * @private
     * @returns {THREE.Object3D}
     */
    createObjectType()
    {
        const typeChain = this.type.split("/");
        const firstPart = typeChain[0];
        switch(firstPart)
        {
            case "model":
                return ModelDatabase.instance.resetRotation(this.key);
            case "primitive":
                const primitiveType = typeChain[1];
                const material = new THREE.MeshBasicMaterial({color: 0xff0000, name:"default"});
                let geometry = undefined;
                switch(primitiveType)
                {
                    case "sphere":
                        geometry = new THREE.SphereGeometry();
                        break;
                    case "plane":
                        geometry = new THREE.PlaneGeometry();
                        geometry.rotateX(-Math.PI / 2);
                        break;
                    default:
                    case "cube":
                        geometry = new THREE.BoxGeometry(2,2,2);
                        break;
                }
                return new THREE.Mesh(geometry, material);
            case "light":
                const lightType = typeChain[1];
                switch(lightType)
                {
                    default:
                    case "point":
                        return new THREE.PointLight(0xffffff);
                }
            case "connection":
                return new THREE.Group();
            case "empty":
                return new THREE.Object3D();
        }
    }

    /**
     * @private
     * @param {THREE.Object3D} object 
     */
    setTransform(object)
    {
        let translation = new THREE.Vector3();
        let scale = new THREE.Vector3();
        let rotation = new THREE.Quaternion();
        this.transform.decompose(translation, rotation, scale);
        object.applyMatrix4(this.transform);
    }

    /**
     * @private
     * @param {THREE.Object3D} object 
     */
    setMaterials(object)
    {
        if(this.materials.length == 0) return;
        const defaultValue = this.materials.length > 0 ? this.materials[0] : "error";
        const materialObjects = this.materials.map(materialKey => getMaterialProvider().getLoadedConfig(materialKey));
        const defaultMaterialObject = getMaterialProvider().getLoadedConfig(defaultValue);
        return applyMaterialArray(object, materialObjects, defaultMaterialObject);
    }

    /**
     * @private
     * @param {THREE.Light} object 
     */
    setLightProperties(object)
    {
        if(!object.isLight) return;
        object.intensity = this.lightProperties.intensity;
        object.color = this.lightProperties.color;
    }
}