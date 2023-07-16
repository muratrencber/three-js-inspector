/**
 * 
 * @param {string} path
 * @returns {{extension: string, fileName: string, isFile: boolean, parentDir: string}} 
 */
function getPathProperties(path)
{
    const dirs = path.split("/");
    let isFile = false;
    let extension = '';
    let fileName = '';
    let parentDir = undefined;
    for(let i = dirs.length - 1; i >= 0; i--)
    {
        const dir = dirs[i];
        if(i == dirs.length - 1)
        {
            if(dir.includes(".")){
                isFile = true;
                const dotIndex = dir.indexOf(".");
                extension = dir.substring(dotIndex + 1);
                fileName = dir.substring(0, dotIndex);
            }
            continue;
        }
        parentDir = dirs.slice(0, i + 1).join("/") + "/";
        break;
    }
    if(!isFile && !path.endsWith("/")) path += "/";
    return {
        extension: extension,
        fileName: fileName,
        isFile: isFile,
        parentDir: parentDir
    };
}

/**
 * 
 * @param {string} path 
 * @returns {string}
 */
export function normalizePath(path)
{
    const {isFile} = getPathProperties(path);
    if(!isFile && !path.endsWith("/")) return path + "/";
    return path;
}

/**
 * @param {string} path
 * @returns {string}
 */
export function getParentDir(path)
{
    const {parentDir} = getPathProperties(path);
    return parentDir;
}

/**
 * 
 * @param {string} path 
 * @returns {string}
 */
export function getExtension(path)
{
    const {extension} = getPathProperties(path);
    return extension;
}

/**
 * 
 * @param {string} path 
 * @returns {string}
 */
export function getFileName(path)
{
    const {fileName, extension} = getPathProperties(path);
    return `${fileName}.${extension}`;
}

/**
 * 
 * @param {string} path 
 * @returns {string}
 */
export function getFileNameWithoutExtension(path)
{
    const {fileName} = getPathProperties(path);
    return fileName;
}