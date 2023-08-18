import {ConfigLoader} from './ConfigLoader.js';
import {SchemaKeys} from './ConfigSchema.js';
import { parseVector2 } from './THREEParsers.js';
import { TexturePack } from './TexturePack.js';
import {normalizePath, getFileNameWithoutExtension} from './path.js';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

const PROPERTY_PARSERS = {
    offset: parseVector2
}

const PROPERTY_APPLIERS = {
    offset: (texture, key, object) => {
        texture[key].setX(object.x);
        texture[key].setY(object.y);
    }
}

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
        const normalizedRoot = root ? normalizePath(root) : null;
        if(root) loader.setPath(normalizedRoot);
        console.log(normalizePath(root));
        const sources = this.getValue("sources");
        const isDict = !Array.isArray(sources);
        const iteratorSource = isDict ? Object.keys(sources) : sources;
        let resultPack = new TexturePack();
        let index = 0;
        const toEnvMap = this.getValue("convertToEnvMap", false);
        for(const iteratorElement of iteratorSource)
        {
            index++;
            const sourceArray = isDict ? sources[iteratorElement] : iteratorElement;
            const sanitizedSources = this.sanitizeSource(sourceArray);
            console.log(sanitizedSources)
            const key = isDict ? iteratorElement : this.generateKeyFromSource(sourceArray, index);
            console.log(key);
            let texture = null;
            try
            {
                texture = await loader.loadAsync(sanitizedSources, (event) => this.invokeCallbackFunction("progressCallback", key, event));
            }
            catch (e)
            {
                console.error("Error while loading texture "+normalizedRoot+sourceArray);
                console.error(e);
                continue;
            }
            if(toEnvMap) texture.mapping = THREE.EquirectangularReflectionMapping;
            resultPack.setTexture(key, texture)
            this.invokeCallbackFunction("loadedOneCallback", key, texture, resultPack);
        }
        const globalProperties = this.getValue("globalProperties", {});
        for(const key in globalProperties) {
            for(const texKey in resultPack.dict)
            {
                const texture = resultPack.getTexture(texKey);
                if(!texture) continue;
                this.applyTextureProperty(texture, key, globalProperties);
            }
        }
        const properties = this.getValue("properties");
        for(const targetTextureKey in properties) {
            const targetTexture = resultPack.getTexture(targetTextureKey);
            if(!targetTexture) continue;
            const targetProperties = properties[targetTextureKey];
            for(const key in targetProperties)
                this.applyTextureProperty(targetTexture, key, targetProperties);
        }
        this.invokeCallbackFunction("loadedAllCallback", resultPack);
        return resultPack;
    }

    applyTextureProperty(texture, key, propertyObject)
    {
        let val = propertyObject[key];
        if(PROPERTY_PARSERS[key])
        {
            val = PROPERTY_PARSERS[key](propertyObject[key]);
        }
        if(PROPERTY_APPLIERS[key])
        {
            PROPERTY_APPLIERS[key](texture, key, val);
        }
        else
        {
            texture[key] = val;
        }
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