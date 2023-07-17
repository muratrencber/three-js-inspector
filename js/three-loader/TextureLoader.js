import { invokeCallback } from './CallbackManager.js';
import {ConfigLoader} from './ConfigLoader.js';
import {SchemaKeys} from './ConfigSchema.js';
import { TexturePack } from './TexturePack.js';
import {normalizePath, getFileNameWithoutExtension} from './path.js';
import * as THREE from 'three';


/**
 * @extends ConfigLoader<TexturePack>
 */
export class TexturePackLoader extends ConfigLoader
{
    constructor()
    {
        super(SchemaKeys.TEXTURE_PACK);
    }
    /**
     * 
     * @param {Object} config 
     * @returns {TexturePackLoader}
     */
    setConfig(config)
    {
        super.setConfig(config);
        return this;
    }

    /**
     * @returns {Promise<TexturePack>}
     */
    async load()
    {
        const loader = this.getLoader();
        const root = this.getValue("root", null);
        if(root) loader.setPath(normalizePath(root));
        const sources = this.getValue("sources");
        const isDict = !Array.isArray(sources);
        const iteratorSource = isDict ? Object.keys(sources) : sources;
        let resultPack = new TexturePack();
        let index = 0;
        for(const iteratorElement of iteratorSource)
        {
            index++;
            const sourceArray = isDict ? sources[iteratorElement] : iteratorElement;
            const sanitizedSources = this.sanitizeSource(sourceArray);
            const key = isDict ? iteratorElement : this.generateKeyFromSource(sourceArray, index);
            const texture = await loader.loadAsync(sanitizedSources);
            resultPack.addTexture(key, texture)
            invokeCallback(this.getValue("loadedOneCallback"), key, texture, resultPack);
        }
        const globalProperties = this.getValue("globalProperties");
        for(const key in globalProperties) {
            for(const texKey in resultPack.dict)
            {
                const texture = resultPack.getTexture(texKey);
                if(!texture) continue;
                texture[texKey] = globalProperties[key];
            }
        }
        const properties = this.getValue("properties");
        for(const targetTextureKey in properties) {
            const targetTexture = resultPack.getTexture(targetTextureKey);
            if(!targetTexture) continue;
            const targetProperties = properties[targetTextureKey];
            for(const key in targetProperties)
                targetTexture[key] = targetProperties[key];
        }
        invokeCallback(this.getValue("loadedAllCallback"), resultPack);
        return resultPack;
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
        return getFileNameWithoutExtension(this.sanitizeSource(source));
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