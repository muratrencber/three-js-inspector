export class TexturePack
{
    constructor()
    {
        /**
         * @type {Object.<string, THREE.Texture>} 
         */
        this.dict = {};
    }

    /**
     * 
     * @param {string} key 
     * @param {THREE.Texture} texture 
     */
    addTexture(key, texture)
    {
        this.dict[key] = texture;
    }

    /**
     * 
     * @param {string} key 
     * @returns {THREE.Texture}
     */
    getTexture(key)
    {
        return this.dict[key];
    }

    /**
     * 
     * @param {string} key 
     * @returns {boolean} 
     */
    hasTexture(key)
    {
        return this.dict[key] !== undefined;
    }
}