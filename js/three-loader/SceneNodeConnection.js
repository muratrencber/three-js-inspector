/**
 * @global
 * @typedef {"plug"|"socket"} connectionType
 * @typedef {{hideOnConnect: boolean}} connectionProperties
 */
export class SceneNodeConnection
{
    /**
     * 
     * @param {connectionType} type 
     * @param {THREE.Group} group 
     */
    constructor(type, group)
    {
        /**
         * @type {connectionType}
         */
        this.type = type;
        /**
         * @type {THREE.Group}
         */
        this.group = group;
        this.isConnection = true;
        this.hideOnConnect = false;
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