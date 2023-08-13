import { MaterialModifier, MaterialModifierUI } from "./MaterialModifier.js";
import { SceneModifier, SceneModifierUI } from "./SceneModifier.js";

/**
 * @type {Object.<string, [typeof SceneModifier, typeof SceneModifierUI]>}
 */
const TYPE_MAP = {
    "material": [MaterialModifier, MaterialModifierUI]
}

/**
 * @param {Object} object
 * @returns { SceneModifierUI }
 */
export function parseModifierObject(object)
{
    if(!object.type || !TYPE_MAP[object.type])
        return null;
    const [modifierType, modifierUIType] = TYPE_MAP[object.type];
    const resultingModifier = new modifierType();
    const clonedObject = JSON.parse(JSON.stringify(object));
    for(const key in clonedObject)
        resultingModifier[key] = clonedObject[key];
    return new modifierUIType(resultingModifier);
}