import { getUIManager } from "../three-loader/DependencyManager.js";
import { SceneModifierUI } from "../three-loader/SceneModifierUI.js";

const MATERIAL_MODIFIER_UI_PARENT_CLASS = "material-modifier";
const MATERIAL_MODIFIER_TARGET_ATTRIBUTE = "modifies";
const MATERIAL_SELECT_BUTTON_CLASS = "material-select-button";
const MATERIAL_SELECT_BUTTON_ACTIVE_CLASS = "material-select-button active";
const MATERIAL_INDEX_ATTRIBUTE = "material-index";
const MATERIAL_KEY_ATTRIBUTE = "material-key";
/**
 * @extends SceneModifierUI<MaterialModifier>
 * @property {DemoDOMConnection} DOMConnection
 */
export class DemoMaterialModifierUI extends SceneModifierUI {

    constructor(modifier, connection)
    {
        super(modifier, connection);
        /**
         * @type {DemoDOMConnection}
         */
        this.DOMConnection;
    }

    establishElementConnectionInternal()
    {
        if(this.element) return;

        const parent = document.createElement("div");
        parent.setAttribute("class", MATERIAL_MODIFIER_UI_PARENT_CLASS);
        parent.setAttribute(MATERIAL_MODIFIER_TARGET_ATTRIBUTE, this.modifier.targetPath);
        this.modifier.materialOptions.forEach((key, i) => {
            const child = this.createMaterialSelectButton(i, key);
            parent.appendChild(child);
        });
        this.element = parent;
        this.DOMConnection.getModifierRoot().appendChild(parent);
    }

    removeElementConnectionInternal()
    {
        if(!this.element) return;
        this.DOMConnection.getModifierRoot().removeChild(this.element);
        this.element = undefined;
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