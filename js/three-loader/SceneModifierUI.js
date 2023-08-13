import { CallbackList } from "./CallbackList.js";
import { DOMConnection } from "./DOMConnection.js";
import { CALLBACKS } from "./SceneModifier.js";

/**
 * @template modifierType
 * @typedef SceneModifierUIEventData
 * @property {SceneModifierUI<modifierType>} modifierUI
 */

/**
 * @private
 * @template modifierType
 * @typedef SceneModifierUICallbacksBase
 * @property {SceneModifierUIEventData<modifierType>} refreshedElement
 * @property {SceneModifierUIEventData<modifierType>} establishedConnection
 * @property {SceneModifierUIEventData<modifierType>} removedConnection
 */

/**
 * @template inputType
 * @typedef {import("./SceneModifier.js").SceneModifierCallbacksBase<inputType>} SceneModifierCallbacksBase
 */

/**
 * @template inputType
 * @template modifierType
 * @typedef {SceneModifierCallbacksBase<inputType> & SceneModifierUICallbacksBase<modifierType>} SceneModifierUICallbacks
 */


/**
 * @template inputType
 * @template modifierType
 * @type {SceneModifierUICallbacks<inputType, modifierType>}
 */
const UI_CALLBACKS = {
    ...CALLBACKS,
    "establishedConnection": 0,
    "removedConnection": 0,
    "refreshedElement": 0
};

/**
 * @template {SceneModifier} ModifierType
 */
export class SceneModifierUI
{
    /**
     * @param {ModifierType} modifier
     * @param {DOMConnection} DOMConnection 
     */
    constructor(modifier, DOMConnection)
    {
        
        /**
         * @type {ModifierType}
         */
        this.modifier = modifier;
        /**
         * @type {Element}
         */
        this.element = null;
        /**
         * @type {CallbackList<SceneModifierUICallbacks<ModifierType.inputType, ModifierType>>}
         */
        this.callbacks = new CallbackList(UI_CALLBACKS, modifier.callbacks);
        /**
         * @type {DOMConnection}
         */
        this.DOMConnection = DOMConnection;
    }

    refreshElement()
    {
        this.refreshElementInternal();
        this.callbacks.invoke("refreshedElement", {modifierUI: this});
    }

    /**
     * @returns {Element}
     */
    establishElementConnection()
    {
        let result = this.establishElementConnectionInternal();
        this.callbacks.invoke("establishedConnection", {modifierUI: this});
        return result;
    }
    /**
     * @returns {Element}
     */
    removeElementConnection()
    {
        let result = this.removeElementConnectionInternal();
        this.callbacks.invoke("removedConnection", {modifierUI: this});
        return result;
    }

    /**
     * @protected
     * @abstract
     */
    refreshElementInternal() { }

    /**
     * @protected
     * @abstract
     */
    establishElementConnectionInternal() { }

    /**
     * @protected
     * @abstract
     */
    removeElementConnectionInternal() { }
}