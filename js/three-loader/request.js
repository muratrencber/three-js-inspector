/**
 * 
 * @param {string} path
 * @returns {string} 
 */
export function getYAMLString(path)
{
    const request = new XMLHttpRequest();
    request.open("GET", path, false);
    request.send();
    return request.responseText;
}

/**
 * 
 * @param {string} path
 * @returns {Object} 
 */
export function getYAMLObject(path)
{
    const content = getYAMLString(path);
    try {
        return jsyaml.load(content);
    } catch {}
    return null;
}