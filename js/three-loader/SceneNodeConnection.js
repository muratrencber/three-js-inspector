import * as THREE from 'three';
/**
 * @global
 * @typedef {"plug"|"receiver"} connectionType
 * @typedef {{hideOnConnect: boolean}} connectionProperties
 */
export class SceneNodeConnection extends THREE.Group
{
    /**
     * 
     * @param {connectionType} type 
     * @param {THREE.Group} group 
     */
    constructor(type, group)
    {
        super();
        /**
         * @type {connectionType}
         */
        this.connectionType = type;
        this.isConnection = true;
        this.hideOnConnect = false;
        /**
         * @type {THREE.Group}
         */
        this.group = group;
        /**
         * @type {SceneNode}
         */
        this.ownerNode = null;
    }

    /**
     * 
     * @param {connectionProperties} properties 
     */
    applyProperties(properties)
    {
        if(!properties) return;
        if(properties.hideOnConnect !== undefined) this.hideOnConnect = properties.hideOnConnect; 
    }
}