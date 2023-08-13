export class CallbackList<callbackDict>
{
    addListener<T extends keyof callbackDict>(eventType: T, handler: (eventData: callbackDict[T]) => void) {}
    removeListener<T extends keyof callbackDict>(eventType: T, handler: (eventData: callbackDict[T]) => void) {}
    invoke<T extends keyof callbackDict>(eventType: T, eventData: callbackDict[T]) {}
}