import { ConfigLoader } from './ConfigLoader.js';
import { DependencyDictionary, getMaterialProvider, getTexturePackProvider } from './DependencyManager.js';

/**
 * @class
 * @template ObjectType
 */
export class ObjectDatabase
{
    /**
     * 
     * @param {string} CONFIGS_PATH 
     * @param {() => ConfigLoader} loaderConstructor
     */
    constructor(CONFIGS_PATH, loaderConstructor, loadParameters)
    {
        /**
         * @type {string}
         * @protected
         */
        this.CONFIGS_PATH = CONFIGS_PATH;
        /**
         * @type {{string: Object}}
         * @protected
         */
        this.configMap = undefined;
        /**
         * @type {() => ConfigLoader}
         * @protected
         */
        this.loaderConstructor = loaderConstructor;
        /**
         * @type {ConfigLoader}
         * @protected
         */
        this.loader = undefined;
        /**
         * @type {{string: ObjectType}}
         * @protected
         */
        this.loadedConfigMap = {};
        /**
         * @type {[string]}
         * @protected
         */
        this.loadList = [];
        /**
         * @protected
         */
        this.loadParameters = loadParameters;
        /**
         * @type {bool}
         * @protected
         */
        this.changingList = false;
        this.registerForDependencies();
    }

    /**
     * @protected
     */
    init()
    {
        this.configMap = this.getConfigs();
    }

    /**
     * @protected
     * @abstract
     * @returns {ConfigLoader}
     */
    initLoader()
    {
        return new this.loaderConstructor();
    }

    /**
     * @abstract
     */
    registerForDependencies() {}

    /**
     * @returns {string}
     * @private
     */
    getConfigsContent()
    {
        const request = new XMLHttpRequest();
        request.open("GET", this.CONFIGS_PATH, false);
        request.send();
        return request.responseText;
    }

    /** 
     * @returns {{string: Object}}
     * @private
     */
    getConfigs()
    {
        const stringContent = this.getConfigsContent();
        return jsyaml.load(stringContent);
    }
    
    /**
     * 
     * @param {string} key 
     */
    getConfig(key, loadedOnly = false)
    {
        if(!this.configMap) return undefined;
        if(loadedOnly && !this.loadedConfigMap[key]) return undefined;
        return this.configMap[key];
    }

    /**
     * @param {string} key
     * @returns {boolean} 
     */
    isConfigLoaded(key)
    {
        return this.getConfig(key, true) !== undefined;
    }

    /**
     * @param {string} key 
     * @returns {ObjectType}
     */
    getLoadedConfig(key)
    {
        if(!this.isConfigLoaded(key)) return undefined;
        return this.loadedConfigMap[key];
    }

    /**
     * @param {string} key
     * @returns {Promise<ObjectType>}
     */
    async load(key, checkDependencies = true)
    {
        if(this.isConfigLoaded(key)) return Promise.resolve(this.getLoadedConfig(key));
        const config = this.getConfig(key);
        if(!config) return Promise.reject("Config does not exist!");
        const loader = this.initLoader();
        loader.setConfig(config);
        if(checkDependencies) await this.loadDependencies(loader.getDependencies());
        let result = await loader.load(this.loadParameters);
        this.loadedConfigMap[key] = result;
        return result;
    }

    /**
     * 
     * @param {DependencyDictionary} dependencyDictionary 
     */
    async loadDependencies(dependencyDictionary)
    {
        const texturePacks = dependencyDictionary.textures;
        for(const packKey of texturePacks)
        {
            await getTexturePackProvider().load(packKey);
        }
        const materials = dependencyDictionary.materials;
        for(const materialKey of materials)
        {
            await getMaterialProvider().load(materialKey);
        }
    }

    /**
     * @returns {Promise<{string: ObjectType}>}
     */
    async loadAllList()
    {
        this.changingList = true;
        this.resultingMap = {};
        for(const key of this.loadList)
        {
            this.resultingMap[key] = await this.load(key);
        }
        this.loadList = [];
        this.changingList = false;
        return this.resultingMap;
    }

    /**
     * @returns {Promise<{string: ObjectType}>}
     */
    async loadAll()
    {
        for(const key in this.configMap)
        {
            await this.load(key);
        }
        return this.loadedConfigMap;
    }

    /**
     * 
     * @param {string} key 
     */
    pushToLoadList(key)
    {
        while(this.changingList) continue;
        this.changingList = true;
        if(this.isConfigLoaded(key) || this.loadList.includes(key)) {
            this.changingList = false;
            return;
        }
        this.loadList.push(key);
        this.changingList = false;
    }
    
    /**
     * 
     * @param {string} key 
     * @returns 
     */
    removeFromLoadList(key)
    {
        while(this.changingList) continue;
        this.changingList = true;
        const index = this.loadList.indexOf(key);
        if(index < 0 || index >= this.loadList.length) {
            this.changingList = false;
            return;
        }
        this.loadList.splice(index, 1);
        this.changingList = false;
    }
}