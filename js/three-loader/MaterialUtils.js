
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
 * 
 * @param {THREE.Group} group 
 * @param {THREE.Material} defaultMaterial 
 * @param {Array<THREE.Material>} materials 
 */
export function applyMaterialArray(group, materials, defaultMaterial = undefined)
{
    const materialMap = createMaterialMap(group, defaultMaterial);
    for(let i = 0; i < materials.length; i++)
    {
        materialMap.setNewMaterialFromIndex(materials[i], i);
    }
    setFromMaterialMap(group, materialMap, defaultMaterial);
}

/**
 * 
 * @param {THREE.Group} group 
 * @param {THREE.Material} defaultMaterial 
 * @param {Object.<string, THREE.Material>} materialDict 
 */
export function applyMaterialDict(group, materialDict, defaultMaterial = undefined)
{
    const materialMap = createMaterialMap(group, defaultMaterial);
    for(const orgMaterial in materialDict)
    {
        const singleMap = materialMap.map.filter(map => map.original.name == orgMaterial);
        if(!singleMap || singleMap.length == 0) continue;
        singleMap.forEach(map => map.new = materialDict[orgMaterial]);
    }
    setFromMaterialMap(group, materialMap, defaultMaterial);
}

/**
 * 
 * @param {THREE.Group} group 
 * @param {THREE.Material} defaultMaterial 
 * @returns {MaterialMap}
 */
function createMaterialMap(group, defaultMaterial)
{
    const map = new MaterialMap(defaultMaterial);
    group.traverse((obj) => {
        if(!obj.isMesh) return;
        /**
         * @type {THREE.Material}
         */
        const material = obj.material;
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
function setFromMaterialMap(group, materialMap, defaultMaterial = undefined)
{
    group.traverse((obj) => {
        if(!obj.isMesh) return;
        let selectedMaterial = materialMap.getNewMaterial(obj.material);
        if(!selectedMaterial) selectedMaterial = defaultMaterial;
        if(!selectedMaterial) return;
        obj.material = selectedMaterial;
    })
}