import { DOMConnection } from "../three-loader/DOMConnection.js";
import { MaterialModifier } from "../three-loader/MaterialModifier.js";
import { SceneModifier } from "../three-loader/SceneModifier.js";
import { SceneModifierUI } from "../three-loader/SceneModifierUI.js";
import { getYAMLObject } from "../three-loader/request.js";
import { DemoMaterialModifierUI } from "./DemoModifierUIs.js";

const DISABLED_CSS_CLASS = "disabled";
/**
* @type {Object.<string, [typeof SceneModifier, typeof SceneModifierUI]>}
*/
const TYPE_MAP = {
   "material": [MaterialModifier, DemoMaterialModifierUI]
}

const MATERIAL_MAP_PATH = "./configs/mmaptest.yaml";
const DEFAULT_MATERIAL_KEY = "default";

export class DemoDOMConnection extends DOMConnection {
    constructor() {
        super();
        /**
         * @type {Element}
         */
        this.loadingPanel = document.getElementById("loading"); 
        /**
         * @type {Element}
         */
        this.THREEContainer = document.getElementById("three-container");
        /**
         * @type {Element}
         */
        this.modifierRoot = document.getElementById("modifiers"); 
        /**
         * @type {Object.<string, string>}
         */
        this.materialMap = getYAMLObject(MATERIAL_MAP_PATH);
    }

    addTHREEtoDOM(threeElement)
    {
        this.THREEContainer.appendChild(threeElement);
    }

    /**
     * @returns {Element}
     */
    getModifierRoot()
    {
        return this.modifierRoot;
    }

    /**
     * @returns {Element}
     */
    getTHREEContainerElement() {
        return this.THREEContainer;
    }

    /**
     * @abstract
     * @param {boolean} isVisible 
     */
    setTHREEContainerVisibility(isVisible) {
        let classList = this.THREEContainer.classList;
        if(isVisible)
            classList.remove(DISABLED_CSS_CLASS);
        else
            classList.add(DISABLED_CSS_CLASS);
    }

    /**
     * @abstract
     * @param {boolean} isVisible 
     */
    setLoadingPanelVisibility(isVisible) {
        let classList = this.loadingPanel.classList;
        if(isVisible)
            classList.remove(DISABLED_CSS_CLASS);
        else
            classList.add(DISABLED_CSS_CLASS);
    }

    /**
     * @abstract
     * @param {Object} object
     * @returns {SceneModifierUI} 
     */
    getModifierUIObjectFor(object) {
        if(!object.type || !TYPE_MAP[object.type])
            return null;
        const [modifierType, modifierUIType] = TYPE_MAP[object.type];
        const resultingModifier = new modifierType();
        const clonedObject = JSON.parse(JSON.stringify(object));
        for(const key in clonedObject)
            resultingModifier[key] = clonedObject[key];
        return new modifierUIType(resultingModifier, this);
    }

    /**
     * @param {string} materialKey
     * @returns {string}
     */
    getMaterialImageSource(materialKey)
    {
        const map = this.materialMap;
        return map[materialKey] ?? map[DEFAULT_MATERIAL_KEY];
    }
}