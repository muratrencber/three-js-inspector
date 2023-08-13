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
        if(type === "receiver") this.group.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), new THREE.MeshBasicMaterial({color: 0xff0000})));
        if(type === "plug") this.group.add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.15), new THREE.MeshBasicMaterial({color: 0x0000ff})));
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