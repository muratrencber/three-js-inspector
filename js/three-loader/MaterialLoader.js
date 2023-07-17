import { ConfigLoader } from './ConfigLoader.js';
import { SchemaKeys } from './ConfigSchema.js';
import * as THREE from 'three';
import { getTexturePackProvider, getMaterialProvider, DependencyDictionary } from './DependencyManager.js';
import { TexturePack } from './TexturePack.js';

const MATERIAL_PROPERTIES_TYPE_MAP = {
    clippingPlanes: Array,
    color: THREE.Color,
    map: THREE.Texture,
    lightMap: THREE.Texture,
    aoMap: THREE.Texture,
    emissive: THREE.Color,
    emissiveMap: THREE.Texture,
    bumpMap: THREE.Texture,
    normalMap: THREE.Texture,
    normalScale: THREE.Vector2,
    displacementMap: THREE.Texture,
    roughnessMap: THREE.Texture,
    metalnessMap: THREE.Texture,
    alphaMap: THREE.Texture,
    envMap: THREE.Texture,
    clearcoatMap: THREE.Texture,
    clearcoatRoughnessMap: THREE.Texture,
    clearcoatNormalScale: THREE.Vector2,
    clearcoatNormalMap: THREE.Texture,
    sheenColor: THREE.Color,
    sheenColorMap: THREE.Texture,
    sheenRoughnessMap: THREE.Texture,
    transmissionMap: THREE.Texture,
    thicknessMap: THREE.Texture,
    attenuationColor: THREE.Color,
    specularColor: THREE.Color,
    specularIntensityMap: THREE.Texture,
    specularColorMap: THREE.Texture,
    iridescenceMap: THREE.Texture,
    anisotropyMap: THREE.Texture
}

const TYPE_PROCESSORS = [
    {
        type: THREE.Color,
        processor: defaultProcessor 
    },
    {
        type: THREE.Texture,
        processor: textureProcessor 
    },
    {
        type: THREE.Vector2,
        processor: defaultProcessor 
    },
    {
        type: Array,
        processor: defaultProcessor 
    }
];

const PROPERTY_PROCESSORS = {
    sheenColor: (value) => {
        console.warn("CHECK PROPERTY");
        return value;
    }
}

function defaultProcessor(value)
{
    return value;
}

function textureProcessor(value)
{
    return this.getTextureFromKey(value);
}

export class MaterialLoader extends ConfigLoader
{
    constructor()
    {
        super(SchemaKeys.MATERIAL);
        /**
         * @type {Array<TexturePack>}
         */
        this.packs = [];
    }
    
    /**
     * @returns {DependencyDictionary}
     */
    getDependencies()
    {
        return new DependencyDictionary(this.getReferencedTexturePackKeys(), this.getReferencedMaterialKeys());
    }

    setTexturePacks()
    {
        this.packs = [];
        const packKeys = this.getReferencedTexturePackKeys();
        for(const key of packKeys)
            this.packs.push(getTexturePackProvider().getLoadedConfig(key));
    }

    /**
     * 
     * @param {string} key 
     */
    getTextureFromKey(key)
    {
        const splitted = key.split("/");
        if(splitted.length > 1) {
            return getTexturePackProvider().getLoadedConfig(splitted[0]).getTexture(splitted[1]);
        }
        const selectedTexturePack = this.packs.find(pack => pack.hasTexture(key));
        if(!selectedTexturePack) return undefined;
        return selectedTexturePack.getTexture(key);
    }

    async load()
    {
        this.setTexturePacks();
        this.applyExtends();
        const properties = this.processProperties(this.getValue("properties", {}));
        const type = this.getValue("type");
        let result = undefined;
        switch (type) {
            case "physical":
                result = new THREE.MeshPhysicalMaterial(properties);
                break;
            case "standard":
            default:
                result = new THREE.MeshStandardMaterial(properties);
                break;
        }
        return result;
    }

    applyExtends()
    {
        const extendsValue = this.getValue("extends", undefined);
        if(!extendsValue) return;
        const matProvider = getMaterialProvider();
        if(!matProvider) throw new Error("Could not find a Material provider!");
        const configToMerge = matProvider.getConfig(extendsValue);
        this.config = {...configToMerge, ...this.config};
    }
    
    /**
     * @returns {Array<string>}
     */
    getReferencedTexturePackKeys()
    {
        let singularSource = this.getValue("texturePackSource", undefined);
        singularSource = singularSource ? [singularSource] : [];
        const multipleSources = this.getValue("texturePackSources", []);
        return [...singularSource, ...multipleSources];
    }

    /**
     * @returns {Array<string>}
     */
    getReferencedMaterialKeys()
    {
        let extendsMaterialKey = this.getValue("extends", undefined);
        return extendsMaterialKey ? [extendsMaterialKey] : [];
    }

    /**
     * 
     * @param {Object.<string, Object>} properties 
     * @returns {Object.<string, Object>}
     */
    processProperties(properties)
    {
        let result = {};
        for(const key in properties)
        {
            const value = properties[key];
            let [nameResult, nameResultValue] = this.tryProcessPropertyByName(key, value);
            if(nameResult)
            {
                if(nameResultValue !== undefined) result[key] = nameResultValue;
                continue;
            }
            let [typeResult, typeResultValue] = this.tryProcessPropertyByType(key, value);
            if(typeResult)
            {
                if(typeResultValue !== undefined) result[key] = typeResultValue;
                continue;
            }
            if(value !== undefined) result[key] = value;
        }
        return result;
    }

    /**
     * 
     * @param {string} key
     * @param {Object} value 
     * @returns {[boolean, Object]}
     */
    tryProcessPropertyByName(key, value)
    {
        let processor = PROPERTY_PROCESSORS[key];
        if(!processor) return [false, null];
        processor = processor.bind(this);
        return [true, processor(value)]; 
    }

    /**
     * 
     * @param {string} key
     * @param {Object} value 
     * @returns {[boolean, Object]}
     */
    tryProcessPropertyByType(key, value)
    {
        let processor = this.findTypeProcessor(MATERIAL_PROPERTIES_TYPE_MAP[key]);
        if(!processor) return [false, null];
        processor = processor.bind(this);
        return [true, processor(value)];
    }

    /**
     * 
     * @param {any} type 
     * @returns {(propertyValue: Object) => Object|undefined}
     */
    findTypeProcessor(type)
    {
        if(!type) return null;
        return TYPE_PROCESSORS.find(a => a.type === type).processor;
    }
}