import { getNodeProvider } from "./DependencyManager.js";
import { SceneModifier } from "./SceneModifier.js";
import { SceneNodeConnection } from "./SceneNodeConnection.js";
import * as THREE from 'three';

/**
 * @typedef {{node: string, plugKey: string, receiverKey: string}} preConnect
 */
export class SceneNode
{
    /**
     * 
     * @param {string} key 
     */
    constructor(key)
    {
        /**
         * @type {SceneNodeGraph}
         */
        this.graph = undefined;
        /**
         * @type {string}
         */
        this.key = key;
        this.root = new THREE.Group();
        /**
         * @type {Object.<string, THREE.Object3D>}
         */
        this.objects = {};
        /**
         * @type {Object.<string, SceneNodeConnection>}
         */
        this.connections = {};
        /**
         * @type {Array<preConnect>}
         */
        this.preConnects = [];
        /**
         * @type {Array<SceneModifier>}
         */
        this.modifiers = [];
    }

    /**
     * 
     * @param {string} key 
     * @param {THREE.Object3D} object
     * @returns {SceneNode} 
     */
    addObject(key, object)
    {
        this.objects[key] = object;
        this.root.add(object);
    }

    /**
     * 
     * @param {string} key 
     * @param {SceneNodeConnection} connection 
     */
    addConnection(key, connection)
    {
        this.connections[key] = connection;
        connection.ownerNode = this;
        this.root.add(connection.group);
    }

    /**
     * @param {SceneModifier} modifierObject 
     */
    addModifier(modifierObject)
    {
        this.modifiers.push(modifierObject);
    }

}