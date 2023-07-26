import { SceneNodeObjectSpecification, SceneNodeObjectTypes } from "./SceneNodeObjectSpecification.js";
import { getStringContent } from "./request.js";
import * as THREE from 'three';

const MATERIAL_LIBRARY_TAG = "library_materials";
const MATERIAL_TAG = "material";
const MATERIAL_ID_ATTRIBUTE = "id";
const MATERIAL_NAME_ATTRIBUTE = "name";

const LIGHT_LIBRARY_TAG = "library_lights";
const LIGHT_TAG = "light";
const LIGHT_COLOR_TAG = "color";
const LIGHT_INTENSITY_TAG = "constant_attenuation";

const SCENE_LIBRARY_TAG = "library_visual_scenes";
const SCENE_NODE_TAG = "node";

const NODE_NAME_ATTRIBUTE = "name";

const NODE_TRANSFORM_TAG = "matrix";

const NODE_MATERIAL_TAG = "instance_material";
const NODE_MATERIAL_ID_ATTRIBUTE = "symbol";

const NODE_LIGHT_TAG = "instance_light";
const NODE_LIGHT_ID_ATTRIBUTE = "url";

/**
 * @global
 * @typedef {[number, number, number, number]} matrixRow
 * @typedef {[matrixRow, matrixRow, matrixRow, matrixRow]} matrix4
 */
export class SceneNodeSource
{
    constructor()
    {
        /**
         * @type {Document}
         */
        this.document = undefined;
        /**
         * @type {Object.<string,SceneNodeObjectSpecification>}
         */
        this.sceneNodeObjects = undefined;
    }

    /**
     * 
     * @param {string} path 
     * @returns {SceneNodeSource}
     */
    load(path)
    {
        const content = getStringContent(path);
        if(!content || content.length === 0) return;
        this.document = new DOMParser().parseFromString(content, "text/xml");
        return this;
    }

    /**
     * @returns {SceneNodeSource}
     */
    tryLoadSpecifications(force = false)
    {
        if(this.sceneNodeObjects && !force) return;
        this.sceneNodeObjects = {};
        const nodes = this.document.querySelectorAll(`${SCENE_LIBRARY_TAG} ${SCENE_NODE_TAG}`);
        for(const node of nodes)
        {
            const specification = this.getSceneObjectSpecification(node);
            if(!specification) continue;
            this.sceneNodeObjects[specification.key] = specification;
        }
        return this;
    }

    /**
     * @returns {Object.<string, string>}
     */
    getMaterialDict()
    {
        let result = {};
        const materials = this.document.querySelectorAll(`${MATERIAL_LIBRARY_TAG} ${MATERIAL_TAG}`);
        for(const material of materials)
        {
            const id = material.getAttribute(MATERIAL_ID_ATTRIBUTE);
            const name = material.getAttribute(MATERIAL_NAME_ATTRIBUTE);
            result[id] = name;
        }
        return result;
    }

    /**
     * @returns {Array<string>}
     */
    getModelKeys()
    {
        const result = this.getNodesOfType(SceneNodeObjectTypes.model).map(spec => spec.key);
        return result;
    }

    /**
     * @private
     * @typedef {keyof typeof SceneNodeObjectTypes} specType
     * @param {specType|Array<specType>} type
     * @returns {Array<SceneNodeObjectSpecification>}
     */
    getNodesOfType(type)
    {
        if(!Array.isArray(type))
        {
            type = [type];
        }
        this.tryLoadSpecifications();
        const nodeObjects = Object.values(this.sceneNodeObjects);
        return nodeObjects.filter(spec => type.includes(spec.type));
    }

    /**
     * @param {Element} nodeElement
     * @returns {SceneNodeObjectSpecification}
     * @private
     */
    getSceneObjectSpecification(nodeElement)
    {
        const nodeName = nodeElement.getAttribute(NODE_NAME_ATTRIBUTE);
        const [nodeType, nodeKey] = nodeName.split(":");
        if(!nodeType || !nodeKey || !SceneNodeObjectTypes[nodeType]) return null;
        let result = new SceneNodeObjectSpecification(nodeType.trim(), nodeKey.trim());
        result.transform = this.getTransform(nodeElement);
        result.materials = this.getReferredMaterials(nodeElement);
        const newLightProperties = this.getLightProperties(nodeElement);
        result.lightProperties = {...result.lightProperties, ...newLightProperties};
        return result;
    }

    /**
     * 
     * @param {Element} nodeElement 
     * @return {{intensity: number, color: THREE:Color}}
     * @private
     */
    getLightProperties(nodeElement)
    {
        let result = {};
        const lightTag = nodeElement.querySelector(NODE_LIGHT_TAG);
        if(!lightTag) return result;
        return this.getLightPropertiesFromLibrary(lightTag.getAttribute(NODE_LIGHT_ID_ATTRIBUTE));
    }
    /**
     * 
     * @param {string} lightId
     * @return {{intensity: number, color: THREE:Color}} 
     * @private
     */
    getLightPropertiesFromLibrary(lightId)
    {
        let result = {}; 
        const node = this.document.querySelector(lightId);
        if(!node) return result;
        const intensity = node.querySelector(LIGHT_INTENSITY_TAG);
        if(intensity) result.intensity = parseFloat(intensity.innerHTML);
        //TODO add color
        return result;
    }

    /**
     * @private
     * @param {Element} nodeElement
     * @returns {Array<string>}
     */
    getReferredMaterials(nodeElement)
    {
        const matDict = this.getMaterialDict();
        let result = [];
        const materialTags = nodeElement.querySelectorAll(NODE_MATERIAL_TAG);
        for(const materialTag of materialTags)
        {
            const materialId = materialTag.getAttribute(NODE_MATERIAL_ID_ATTRIBUTE);
            if(materialId && matDict[materialId])
                result.push(matDict[materialId]);
        }
        return result;
    }

    /**
     * @private
     * @param {Element} nodeElement
     * @returns {THREE.Matrix4}
     */
    getTransform(nodeElement)
    {
        let result = new THREE.Matrix4();
        const transformTag = nodeElement.querySelector(NODE_TRANSFORM_TAG);
        if(!transformTag) return result;
        const nums = this.convertToNumberArray(transformTag.innerHTML);
        const iterationLength = nums.length < 16 ? nums.length : 16;
        for(let i = 0; i < iterationLength; i++)
        {
            const rowCount = parseInt(i / 4);
            const columnCount = i % 4;
            result.elements[columnCount * 4 + rowCount] = nums[i];
        }
        return result;
    }

    /**
     * @private
     * @param {string} sequenceString
     * @returns {Array<number>}
     */
    convertToNumberArray(sequenceString)
    {
        const numberStrs = sequenceString.trim().split(" ");
        return numberStrs.map(numStr => parseFloat(numStr));
    }
}