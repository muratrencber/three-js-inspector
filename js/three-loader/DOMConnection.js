/**
 * @interface
 */
export class DOMConnection
{
    /**
     * @param {Element} threeElement 
     */
    addTHREEtoDOM(threeElement) {}

    /**
     * @returns {Element}
     */
    getTHREEContainerElement() { }

    /**
     * @abstract
     * @param {boolean} isVisible 
     */
    setTHREEContainerVisibility(isVisible) { }

    /**
     * @abstract
     * @param {boolean} isVisible 
     */
    setLoadingPanelVisibility(isVisible) { }

    /**
     * @abstract
     * @param {Object} modifier
     * @returns {SceneModifierUI} 
     */
    getModifierUIObjectFor(modifier) { }
}