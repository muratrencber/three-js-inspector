import { CallbackList } from "./CallbackList.js";
import { register } from "./DependencyManager.js";

/**
 * @typedef RenderManagerCallbacks
 * @property {{renderManager: RenderManager}} onBeforeRender
 */

/**
 * @type {RenderManagerCallbacks}
 */
const CALLBACKS = {
    "onBeforeRender": 0
};

export class RenderManager
{   
    /**
     * 
     * @param {THREE.Scene} scene 
     * @param {THREE.Camera} camera
     * @param {THREE.Renderer} renderer
     */
    constructor(scene, camera, renderer)
    {
        /**
         * @type {THREE.Scene}
         */
        this.scene = scene;
        /**
         * @type {THREE.Camera}
         */
        this.camera = camera;
        /**
         * @type {THREE.Renderer}
         */
        this.renderer = renderer;
        /**
         * @type {CallbackList<RenderManagerCallbacks>}
         */
        this.callbacks = new CallbackList(CALLBACKS);

        register("renderManager", this);
    }

    render()
    {
        this.callbacks.invoke("onBeforeRender", {renderManager: this});
        this.renderer.render(this.scene, this.camera);
    }
}