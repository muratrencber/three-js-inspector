const CALLBACKS = {

}

export function registerCallback(key, callback)
{
    CALLBACKS[key] = callback;
}

export function invokeCallback(key, ...values)
{
    if(!key || !CALLBACKS[key]) return;
    CALLBACKS[key](values);
}