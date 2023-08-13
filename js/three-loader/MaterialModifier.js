import { DependencyDictionary, getMaterialProvider, getUIManager } from "./DependencyManager.js";
import { applyMaterialArray, applyMaterialDict } from "./MaterialUtils.js";
import { SceneModifier, SceneModifierUI } from "./SceneModifier.js";
import { SceneUI } from "./SceneUI.js";

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
        if(!input || input < 0 || input >= this.materialOptions.length)
            return new DependencyDictionary();
        return new DependencyDictionary({materials: [this.materialOptions[input]]});
    }
} 

const MATERIAL_MODIFIER_UI_PARENT_CLASS = "material-modifier";
const MATERIAL_MODIFIER_TARGET_ATTRIBUTE = "modifies";
const MATERIAL_SELECT_BUTTON_CLASS = "material-select-button";
const MATERIAL_SELECT_BUTTON_ACTIVE_CLASS = "material-select-button active";
const MATERIAL_INDEX_ATTRIBUTE = "material-index";
const MATERIAL_KEY_ATTRIBUTE = "material-key";
/**
 * @extends SceneModifierUI<MaterialModifier>
 */
export class MaterialModifierUI extends SceneModifierUI {
    
    createElementInternal()
    {
        if(this.element) return this.element;
        
        const parent = document.createElement("div");
        parent.setAttribute("class", MATERIAL_MODIFIER_UI_PARENT_CLASS);
        parent.setAttribute(MATERIAL_MODIFIER_TARGET_ATTRIBUTE, this.modifier.targetPath);
        this.modifier.materialOptions.forEach((key, i) => {
            const child = this.createMaterialSelectButton(i, key);
            parent.appendChild(child);
        });
        this.element = parent;
        return parent;
    }
    /**
     * 
     * @param {number} index 
     * @param {string} materialKey 
     */
    createMaterialSelectButton(index, materialKey)
    {
        const imgSource = getUIManager().getMaterialImageSource(materialKey);
        const div = document.createElement("div");
        div.setAttribute("class", MATERIAL_SELECT_BUTTON_CLASS);
        div.setAttribute(MATERIAL_INDEX_ATTRIBUTE, index);
        div.setAttribute(MATERIAL_KEY_ATTRIBUTE, materialKey);
        const img = document.createElement("img");
        img.src = imgSource;
        div.appendChild(img);
        div.addEventListener("click", (e) => {
            this.modifier.applyInput(index);
        });
        return div;
    }

    refreshElementInternal()
    {
        if(!this.element) return;
        const children = this.element.querySelectorAll(`[class="${MATERIAL_SELECT_BUTTON_CLASS}"]`);
        for(const child of children)
        {
            const index = parseInt(child.getAttribute(MATERIAL_INDEX_ATTRIBUTE));
            const className = index === this.modifier.currentInput ? MATERIAL_SELECT_BUTTON_ACTIVE_CLASS : MATERIAL_SELECT_BUTTON_CLASS;
            child.className = className;
        }
    }

}