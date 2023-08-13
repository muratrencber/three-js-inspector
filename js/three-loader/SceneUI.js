import { CallbackList } from "./CallbackList.js";
import { DOMConnection } from "./DOMConnection.js";
import { register } from "./DependencyManager.js";
import { SceneModifier } from "./SceneModifier.js";
import { SceneModifierUI } from "./SceneModifierUI.js";
import { getYAMLObject } from "./request.js";

const MATERIAL_MAP_PATH = "./configs/mmaptest.yaml";
const DEFAULT_MATERIAL_KEY = "default";
/**
 * @typedef ModifierEventData
 * @property {SceneUI} ui
 * @property {SceneModifierUI} modifierUI
 */

/**
 * @typedef SceneUICallbacks
 * @property {ModifierEventData} modifierAdded
 * @property {ModifierEventData} modifierRemoved
 */

/**
 * @type {SceneUICallbacks}
 */
const CALLBACKS = {
    modifierAdded: 0,
    modifierRemoved: 0
}

/**
 * @typedef SceneUIConfig
 * @property {NodeGraph} graph
 * @property {DOMConnection} DOMConnection
 */

/**
 * @typedef {import("./SceneNodeGraph.js").SceneNodeGraph} NodeGraph
 * @typedef {import("./SceneNodeGraph.js").NodeEventData} NodeEventData
 */
export class SceneUI {
    /**
     * @param {SceneUIConfig} config
     * @returns {SceneUI}
     */
    init(config)
    {
        /**
         * @type {Array<SceneModifierUI<SceneModifier>>}
         */
        this.modifierUIs = [];
        /**
         * @type {Array<Promise<void>>}
         */
        this.initingModifiers = [];
        /**
         * @type {Object.<string, string>}
         */
        this.materialMap = getYAMLObject(MATERIAL_MAP_PATH);
        /**
         * @type {NodeGraph}
         */
        this.graph = config.graph;
        /**
         * @type {DOMConnection}
         */
        this.DOMConnection = config.DOMConnection;
        /**
         * @type {CallbackList<SceneUICallbacks>}
         */
        this.callbacks = new CallbackList(CALLBACKS);

        this.subscribeToEvents();
        register("uiManager", this);
        SceneUI.instance = this;

        return this;
    }
    
    /**
     * @param {boolean} isLoading 
     */
    setLoading(isLoading)
    {
        this.DOMConnection.setTHREEContainerVisibility(!isLoading);
        this.DOMConnection.setLoadingPanelVisibility(isLoading);
    }

    redraw()
    {
        this.modifierUIs.forEach(ui => ui.refreshElement());
    }

    subscribeToEvents()
    {
        this.graph.callbacks.addListener("appliedPreConnects", this.addModifierOnPreConnectApply.bind(this));
        this.graph.callbacks.addListener("nodeRemoved", this.onNodeRemoved.bind(this));
    }

    /**
     * @param {NodeEventData} event 
     */
    addModifierOnPreConnectApply(event)
    {
        for(const mod of event.node.modifiers)
        {
            const uiObject = this.DOMConnection.getModifierUIObjectFor(mod);
            if(!uiObject) continue;
            uiObject.modifier.ownerNode = event.node;
            this.addModifierUI(uiObject);
        }
    }

    /**
     * @param {NodeEventData} event 
     */
    onNodeRemoved(event)
    {
        const modifiersToRemove = this.modifierUIs.filter(m => m.modifier.ownerNode === event.node);
        modifiersToRemove.forEach(m => this.removeModifier(m.modifier));
    }

    /**
     * @param {SceneModifierUI} modifierUI
     */
    addModifierUI(modifierUI)
    {
        this.modifierUIs.push(modifierUI);
        modifierUI.callbacks.addListener("appliedInput", () => this.redraw());
        this.initModifierUIElement(modifierUI);
        this.initModifier(modifierUI);
        this.callbacks.invoke("modifierAdded", {
            "modifierUI": modifierUI,
            "ui": this
        });
    }

    /**
     * @param {SceneModifierUI} modifierUI
     */
    removeModifierUI(modifierUI)
    {
        const index = this.modifierUIs.findIndex(m => m === modifierUI);
        const hasModifier = index !== -1;
        if(!hasModifier) return;
        this.removeModifierUIElement(modifierUI);
        this.modifierUIs.splice(index);
        this.callbacks.invoke("modifierRemoved", {
            "modifierUI": modifierUI,
            "ui": this
        });
    }

    /**
     * @param {SceneModifierUI<SceneModifier>} modifierUI 
     */
    initModifier(modifierUI)
    {
        this.setLoading(true);
        const promise = modifierUI.modifier.init(this.graph);
        this.initingModifiers.push(promise);
        promise.then(() => this.onInitFinished(promise));
    }

    onInitFinished(promise)
    {
        const index = this.initingModifiers.findIndex(p => p === promise);
        const hasModifierPromise = index !== -1;
        if(!hasModifierPromise) return;
        this.initingModifiers.splice(index);
        const hasRemaniningInits = this.initingModifiers.length > 0;
        if(hasRemaniningInits) return;
        this.setLoading(false);
    }

    /**
     * @param {SceneModifierUI} uiObject 
     */
    initModifierUIElement(uiObject)
    {
        uiObject.establishElementConnection();
    }

    /**
     * @param {SceneModifierUI} uiObject
     */
    removeModifierUIElement(uiObject)
    {
        uiObject.removeElementConnection();
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