export class CallbackList<callbackDict>
{
    /**
     * @typedef {Object.<string, Array<Function>>} CallbackDict
     * @param {CallbackDict} callbackDict 
     * @param {CallbackList|undefined} extendedList 
     */
    constructor(callbackDict, extendedList) {}
    addListener<T extends keyof callbackDict>(eventType: T, handler: (eventData: callbackDict[T]) => void) {}
    removeListener<T extends keyof callbackDict>(eventType: T, handler: (eventData: callbackDict[T]) => void) {}
    invoke<T extends keyof callbackDict>(eventType: T, eventData: callbackDict[T]) {}
}