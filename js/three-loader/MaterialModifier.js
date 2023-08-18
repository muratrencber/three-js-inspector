import { DependencyDictionary, getMaterialProvider, getUIManager } from "./DependencyManager.js";
import { applyMaterialArray, applyMaterialDict } from "./MaterialUtils.js";
import { SceneModifier } from "./SceneModifier.js";

/**
 * @typedef {number} materialInput
 * @extends SceneModifier<materialInput>
 */
export class MaterialModifier extends SceneModifier {
    constructor()
    {
        super();
        this.targetMaterialKey = undefined;
        this.materialOptions = [];
    }
    /**
     * @override
     * @param {materialInput} input 
     */
    async applyInputInternal(input)
    {
        if(input === undefined || this.materialOptions.length <= input || input < 0)
            return Promise.resolve();
        const materialKey = this.materialOptions[input];
        const materialToApply = getMaterialProvider().getLoadedConfig(materialKey);
        if(this.targetMaterialKey)
        {
            const map = {};
            map[this.targetMaterialKey] = materialToApply;
            applyMaterialDict(this.target, map);
        }
        else {
            applyMaterialArray(this.target, [materialToApply], materialToApply)
        }
        return Promise.resolve();
    }

    getDependencies()
    {
        return new DependencyDictionary({materials: this.materialOptions});
    }

    getLazyDependencies(input)
    {
        if(input == undefined || input == null || input < 0 || input >= this.materialOptions.length)
            return new DependencyDictionary();
        return new DependencyDictionary({materials: [this.materialOptions[input]]});
    }
} 