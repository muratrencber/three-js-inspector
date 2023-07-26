import { SceneNodeConnection } from "./SceneNodeConnection.js";
import * as THREE from 'three';

export class SceneNode
{
    constructor()
    {
        this.root = new THREE.Group();
        /**
         * @type {Object.<string, THREE.Object3D>}
         */
        this.objects = {};
        /**
         * @type {Object.<string, SceneNodeConnection>}
         */
        this.connections = {};
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
        this.root.add(connection.group);
    }

}