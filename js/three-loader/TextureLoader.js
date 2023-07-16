import {ConfigLoader} from './ConfigLoader.js';
import {SchemaKeys} from './ConfigSchema.js';
import {normalizePath, getFileNameWithoutExtension} from './path.js';
import * as THREE from 'three';

export class TextureLoader extends ConfigLoader
{
    constructor()
    {
        super(SchemaKeys.TEXTURE);
    }
    /**
     * 
     * @param {Object} config 
     * @returns {TextureLoader}
     */
    setConfig(config)
    {
        super.setConfig(config);
        return this;
    }

    /**
     * @typedef {Object.<string, THREE.Texture>} resultMap
     * @typedef {function(number)} progressCallback
     * @typedef {(key: string, texture: THREE.Texture, resultMap: resultMap)} singleTextureLoadedCallback
     * @typedef {(resultMap: resultMap)} allTexturesLoadedCallback
     * @param {{onProgress: progressCallback, onTextureLoaded: singleTextureLoadedCallback, onAllLoaded: allTexturesLoadedCallback}} callbacks 
     * @returns {Promise<resultMap>}
     */
    async load(callbacks)
    {
        const loader = this.getLoader();
        const root = this.getValue("root", null);
        if(root) loader.setPath(normalizePath(root));
        const sources = this.getValue("sources");
        const isDict = !Array.isArray(sources);
        const iteratorSource = isDict ? Object.keys(sources) : sources;
        let resultMap = {}
        let index = 0;
        for(const iteratorElement of iteratorSource)
        {
            index++;
            const sourceArray = isDict ? sources[iteratorElement] : iteratorElement;
            const sanitizedSources = this.sanitizeSource(sourceArray);
            const key = isDict ? iteratorElement : this.generateKeyFromSource(sourceArray, index);
            const texture = await loader.loadAsync(sanitizedSources, callbacks?.onProgress);
            resultMap[key] = texture;
            callbacks?.onTextureLoaded(key, texture, resultMap);
        }
        const globalProperties = this.getValue("globalProperties");
        for(const key in globalProperties) {
            for(const texKey in resultMap)
            {
                const texture = resultMap[texKey];
                if(!texture) continue;
                texture[texKey] = globalProperties[key];
            }
        }
        const properties = this.getValue("properties");
        for(const targetTextureKey in properties) {
            const targetTexture = resultMap[targetTextureKey];
            if(!targetTexture) continue;
            const targetProperties = properties[targetTextureKey];
            for(const key in targetProperties)
                targetTexture[key] = targetProperties[key];
        }
        callbacks?.onAllLoaded(resultMap);
        return resultMap;
    }

    /**
     * @private
     * @param {String} extension 
     * @returns {String}
     */
    sanitizeExtension(extension) {
        if(!extension) return extension;
        if(!extension.startsWith(".")) return extension;
        return extension.substring(1);
    }

    /**
     * @private
     * @param {String} path 
     * @param {String} extension 
     * @returns {String}
     */
    sanitizePath(path, extension) {
        if(extension === undefined) return path;
        const sanitizedExtension = this.sanitizeExtension(extension);
        const splittedPath = path.split("/");
        const fileName = splittedPath[splittedPath.length - 1];
        const extensionSplit = fileName.split(".");
        if(extensionSplit.length > 1) return path;
        return `${path}.${sanitizedExtension}`;
    }

    /**
     * @private
     * @returns {(String|Array<String>)}
     */
    sanitizeSource(source) {
        const type = this.getValue("type");
        if(!Array.isArray(source))
            source = [source];
        const extension = this.getValue("defaultExtension");
        const sanitizedSource = source.map(s => this.sanitizePath(s, extension));
        if(type !== "cubemap") return sanitizedSource[0];
        return sanitizedSource;
    }

    /**
     * 
     */
    generateKeyFromSource(source, index = undefined)
    {
        if(Array.isArray(source))
        {
            if(!index)
                throw new Error("You must use an index when creating a key for cubemap sources!");
            return `group${index}`;
        }
        return getFileNameWithoutExtension(source);
    }

    /**
     * @private
     * @returns {THREE.Loader} 
     */
    getLoader() {
        const type = this.getValue("type");
        switch (type) {
            case "hdri":
                return new RGBELoader();
            case "cubemap":
                return new THREE.CubeTextureLoader();
            case "texture":
            default:
                return new THREE.TextureLoader();
        }
    }
}