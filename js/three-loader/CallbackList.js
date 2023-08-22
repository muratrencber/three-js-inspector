/**
 * @type {CallbackList}
 */
export class CallbackList
{
    /**
     * @typedef {Object.<string, Array<Function>>} CallbackDict
     * @param {CallbackDict} callbackDict 
     * @param {CallbackList|undefined} extendedList 
     */
    constructor(callbackDict, extendedList)
    {
        let adjustedCallbackDict = {...callbackDict};
        if(extendedList)
        {
            for(const key in extendedList.callbacks)
            {
                if(callbackDict[key]) continue;
                adjustedCallbackDict[key] = 0;
                extendedList.addListener(key, (data) => {
                    this.invoke(key, data);
                });
            }
        }
        /**
         * @type {CallbackDict}
         */
        this.callbacks = adjustedCallbackDict;
        for(const callbackKey in this.callbacks)
        {
            this.callbacks[callbackKey] = [];
        }
    }

    addListener(key, func)
    {
        const arr = this.callbacks[key];
        if(!arr) return;
        arr.push(func);
    }

    removeListener(key, func)
    {
        const arr = this.callbacks[key];
        if(!arr) return;
        const index = arr.findIndex(f => f === func);
        if(index === -1) return;
        arr.splice(index);
    }

    invoke(key, eventData)
    {
        const arr = this.callbacks[key];
        if(!arr) return;
        arr.forEach(fn => fn(eventData));
    }
}