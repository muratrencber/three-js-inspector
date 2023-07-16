import {ConfigLoader} from './ConfigLoader.js';
import {SchemaKeys} from './ConfigSchema.js';
import {normalizePath} from './path.js';
import * as THREE from 'three';

export class TextureLoader extends ConfigLoader
{
    constructor()
    {
        super(SchemaKeys.TEXTURE);
    }

    async load(progressCallback)
    {
        const loader = this.getLoader();
        const root = this.getValue("root", null);
        if(root) loader.setPath(normalizePath(root));
        const sources = this.getSources();
        const texture = await loader.loadAsync(sources, progressCallback);
        for(const key in this.getValue("properties")) {
            texture[key] = this.config.properties[key];
        }
        return texture; 
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
    getSources() {
        const type = this.getValue("type");
        let sources = this.getValue("sources");
        if(!Array.isArray(sources))
            sources = [sources];
        const extension = this.getValue("defaultExtension");
        const sanitizedSources = sources.map(s => this.sanitizePath(s, extension));
        if(type !== "cubemap") return sanitizedSources[0];
        return sanitizedSources;
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