class MaterialMap
{   
    /**
     * 
     * @param {boolean} skipIfExists 
     */
    constructor(skipIfExists)
    {
        /**
         * @type {Map<string, THREE.Material>}
         */
        this.map = new Map();
        /**
         * @type {boolean}
         */
        this.skipIfExists = skipIfExists;
        /**
         * @type {Array<string>}
         */
        this.keys = [];
        /**
         * @type {THREE.Material}
         */
        this.defaultMaterial = undefined;
    }

    /**
     * 
     * @param {THREE.Material} material 
     */
    add(material)
    {
        if(!material)
        {
            console.warn("MaterialMap: Material is null or undefined!", material);
            return;
        }
        if(!material.name)
        {
            console.warn("MaterialMap: Material name not found!", material);
            return;
        }
        const key = material.referencedName ?? material.name;
        if(this.skipIfExists && this.map.has(key))
        {
            return;
        }
        const willAddToKeys = !this.map.has(key);
        this.map.set(key, material);
        if(willAddToKeys)
        {
            this.keys.push(key);
        }
    }

    /**
     * @param {number} index
     * @param {THREE.Material} material  
     */
    setNewMaterialFromIndex(index, material)
    {
        if(index < 0 || index >= this.keys.length)
            return;
        const key = this.keys[index];
        this.setNewMaterial(key, material);
    }

    /**
     * @param {string} key
     * @param {THREE.Material} material  
     */
    setNewMaterial(key, material)
    {
        this.map.set(key, material);
    }

    /**
     * 
     * @param {THREE.Material} material
     * @returns {THREE.Material} 
     */
    getNewOf(material)
    {
        if(!material || (!material.referencedName && !material.name))
            return null;
        const key = material.referencedName ?? material.name;
        const selectedMaterial = this.map.get(key) ?? this.defaultMaterial;
        if(!selectedMaterial)
            return null;
        let newMaterial = selectedMaterial.clone();
        newMaterial.referencedName = key;
        return newMaterial;
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
        materialMap.setNewMaterialFromIndex(i, materials[i]);
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
    for(const orgMaterialKey in materialDict)
    {
        const newMaterial = materialDict[orgMaterialKey];
        materialMap.setNewMaterial(orgMaterialKey, newMaterial);
    }
    setFromMaterialMap(group, materialMap, defaultMaterial);
}

/**
 * 
 * @param {THREE.Group} group
 * @returns {MaterialMap>}
 */
export function createMaterialMap(group)
{
    let result = new MaterialMap();
    group.traverse((obj) => {
        if(!obj.isMesh) return;
        /**
         * @type {THREE.Material}
         */
        const material = obj.material;
        if(Array.isArray(material))
        {
            for(const mat of material)
            {
                result.add(mat);
            }
        }
        else
        {
            result.add(material);
        }
    });
    return result;
}

/**
 * 
 * @param {THREE.Group} group 
 * @param {MaterialMap} materialMap
 */
function setFromMaterialMap(group, materialMap)
{
    group.traverse((obj) => {
        if(!obj.isMesh) return;
        if(Array.isArray(obj.material))
        {
            let materials = obj.material;
            for(let i = 0; i < materials.length; i++)
            {
                const mat = materials[i];
                const newMat = materialMap.getNewOf(mat);
                if(!newMat) continue;
                materials[i] = newMat;
                if(newMat.onAddedToMesh)
                    newMat.onAddedToMesh(obj);
                if(mat.onRemovedFromMesh)
                    mat.onRemovedFromMesh(obj);
            }
        }
        else
        {
            const mat = obj.material;
            const newMat = materialMap.getNewOf(obj.material);
            if(!newMat) return;
            obj.material = newMat;
            if(newMat.onAddedToMesh)
                newMat.onAddedToMesh(obj);
            if(mat.onRemovedFromMesh)
                mat.onRemovedFromMesh(obj);
        }
    })
}