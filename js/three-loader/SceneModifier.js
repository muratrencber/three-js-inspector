import { CallbackList } from "./CallbackList.js";
import { DependencyDictionary } from "./DependencyManager.js";
import { SceneNode } from "./SceneNode.js";
import { SceneNodeConnection } from "./SceneNodeConnection.js";

/**
 * @typedef {import("./SceneNodeGraph.js").SceneNodeGraph} GraphType
 */

/**
 * @template inputType
 * @typedef SceneModifierEventData
 * @property {SceneModifier<inputType>} modifier
 */

/**
 * @template inputType
 * @typedef SceneModifierInputEventData
 * @property {SceneModifier<inputType>} modifier
 * @property {inputType} input
 */

/**
 * @template inputType
 * @typedef SceneModifierInitializeEventData
 * @property {SceneModifier<inputType>} modifier
 * @property {GraphType} graph
 */

/**
 * @template inputType
 * @typedef SceneModifierLoadEventData
 * @property {SceneModifier<inputType>} modifier
 * @property {DependencyDictionary} dependencies
 */

/**
 * @private
 * @template inputType
 * @typedef SceneModifierCallbacksBase
 * @property {SceneModifierLoadEventData<inputType>} lazyPrepareStarted
 * @property {SceneModifierLoadEventData<inputType>} lazyPrepareFinished
 * @property {SceneModifierInitializeEventData<inputType>} initializeStarted
 * @property {SceneModifierInitializeEventData<inputType>} initializeFinished
 * @property {SceneModifierLoadEventData<inputType>} prepareStarted
 * @property {SceneModifierLoadEventData<inputType>} prepareFinished
 * @property {SceneModifierInputEventData<inputType>} appliedInput
 */

/**
 * @template inputType
 * @typedef {SceneModifierCallbacksBase<inputType>} SceneModifierCallbacks


/**
 * @template inputType
 * @type {SceneModifierCallbacks<inputType>}
 */
export const CALLBACKS = {
    "appliedInput": 0,
    "initializeFinished": 0,
    "initializeStarted": 0,
    "lazyPrepareFinished": 0,
    "lazyPrepareStarted": 0,
    "prepareFinished": 0,
    "prepareStarted": 0
} 

/**
 * @template inputType
 */
export class SceneModifier
{
    constructor()
    {
        /**
         * @type {string}
         */
        this.targetPath = "";
        /**
         * @type {boolean}
         */
        this.lazyLoad = true;
        /**
         * @type {inputType}
         */
        this.defaultInput = undefined;
        /**
         * @type {SceneNode}
         */
        this.ownerNode = undefined;
        /**
         * @type {THREE.Object3D|SceneNode|SceneNodeConnection}
         */
        this.target = undefined;
        /**
         * @type {inputType}
         */
        this.currentInput = undefined;
        /**
         * @type {SceneNodeGraph}
         */
        this.graph = undefined;
        /**
         * @type {CallbackList<SceneModifierCallbacks<inputType>>}
         */
        this.callbacks = new CallbackList(CALLBACKS);
    }

    /**
     * @returns {SceneModifierEventData}
     */
    getDefaultEventData()
    {
        return {modifier: this, input: this.currentInput};
    }

    /**
     * @param {SceneNodeGraph} graph 
     * @returns {Promise<void>}
     */
    async init(graph)
    {
        this.callbacks.invoke("initializeStarted", {modifier: this, graph: graph});
        this.graph = graph;
        if(!this.lazyLoad) await this.prepare();
        this.initTarget(graph);
        if(this.defaultInput !== undefined) await this.applyInput(this.defaultInput);
        this.callbacks.invoke("initializeFinished", {modifier: this, graph: graph});
    }

    /**
     * @protected
     * @returns {Promise<void>}
     */
    async prepare() {
        const dependencies = this.getDependencies();
        this.callbacks.invoke("prepareStarted", {modifier: this, dependencies: dependencies});
        await dependencies.loadAll();
        this.callbacks.invoke("prepareFinished", {modifier: this, dependencies: dependencies});
    }
    /**
     * @protected
     * @param {inputType} input 
     * @returns {Promise<void>}
     */
    async prepareLazy(input) {
        const dependencies = this.getLazyDependencies(input);
        this.callbacks.invoke("lazyPrepareStarted", {modifier: this, dependencies: dependencies});
        await dependencies.loadAll();
        this.callbacks.invoke("lazyPrepareFinished", {modifier: this, dependencies: dependencies});
    }
    /**
     * @protected
     * @abstract
     * @returns {DependencyDictionary}
     */
    getDependencies() { }
    /**
     * @protected
     * @abstract
     * @param {any} input 
     * @returns {DependencyDictionary}
     */
    getLazyDependencies(input) { }
    /**
     * @param {inputType} input 
     * @return {Promise<void>}
     */
    async applyInput(input) {
        this.initTarget();
        if(this.lazyLoad) await this.prepareLazy(input);
        await this.applyInputInternal(input);
        this.currentInput = input;
        this.callbacks.invoke("appliedInput", {modifier: this, input: input});
    }
    /**
     * @abstract
     * @protected
     * @param {inputType} input 
     * @return {Promise<void>}
     */
    async applyInputInternal(input) { }

    initTarget()
    {
        if(!this.targetPath) return undefined;
        let nodeKey = this.ownerNode?.key;
        this.target = this.graph.findObject(this.targetPath, nodeKey);
        return this.target;
    }
}