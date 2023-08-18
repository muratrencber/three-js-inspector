import * as THREE from 'three';

/**
 * @param {Object} object
 * @returns {THREE.Vector2} 
 */
export function parseVector2(object)
{
    let result = new THREE.Vector2(0,0);
    if(!object) return result;
    const keys = ["x","y"];
    for(const key of keys)
    {
        const val = object[key];
        if(val === undefined || val === null)
            continue;
        if(typeof val !== 'number')
            continue;
        result[key] = val;
    }
    return result;
}

/**
 * @param {Object} object
 * @returns {THREE.Vector3} 
 */
export function parseVector3(object)
{
    let result = new THREE.Vector3(0,0,0);
    if(!object) return result;
    const keys = ["x","y","z"];
    for(const key of keys)
    {
        const val = object[key];
        if(val === undefined || val === null)
            continue;
        if(typeof val !== 'number')
            continue;
        result[key] = val;
    }
    return result;
}