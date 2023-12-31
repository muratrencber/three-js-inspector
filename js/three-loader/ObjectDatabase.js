import { ConfigLoader } from './ConfigLoader.js';
import { getStringContent } from './request.js';

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
    constructor(CONFIGS_PATH, loaderConstructor)
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
         * @type {bool}
         * @protected
         */
        this.changingList = false;
        /**
         * @type {Object.<string, Promise<ObjectType>>}
         */
        this.currentlyLoading = {};
        this.registerForDependencies();
    }

    /**
     * @protected
     */
    init()
    {
        this.configMap = this.getConfigs();
        for(const key in this.configMap)
        {
            this.configMap[key].configKey = key;
        }
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
     * @param {string} key 
     * @param {ObjectType} object
     * @param {boolean} [replace=false] 
     */
    addLoadedObject(key, object, replace = false)
    {
        if(this.loadedConfigMap[key] && !replace) return;
        this.configMap[key] = {};
        this.loadedConfigMap[key] = object;
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
        return getStringContent(this.CONFIGS_PATH);
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
        console.log(this.loaderConstructor.name, "Checking for key:",key);
        if(!this.configMap) return undefined;
        if(loadedOnly && !this.loadedConfigMap[key]) return undefined;
        if(!this.configMap[key]) return undefined;
        return {...this.configMap[key]};
    }

    copyLoadedObject(key)
    {
        return {...this.configMap[key]};
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
     * 
     * @param {string} key 
     * @returns {boolean}
     */
    isConfigLoading(key)
    {
        return this.currentlyLoading[key] !== undefined;
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
        if(this.isConfigLoading(key)) return this.currentlyLoading[key];
        if(!this.configMap[key])
        {
            console.warn("Config not found!", key);
            return Promise.resolve(undefined);
        }
        const promise = this.loadInternal(key, checkDependencies).catch((err) => console.error(err, key));
        this.currentlyLoading[key] = promise;
        const result = await promise;
        delete this.currentlyLoading[key];
        return result;
    }

    async loadInternal(key, checkDependencies = true)
    {
        const config = this.getConfig(key);
        if(!config) return Promise.reject("Config does not exist!");
        const loader = this.initLoader();
        loader.setConfig(config);
        if(checkDependencies) await loader.loadDependencies();
        let result = await loader.load();
        this.loadedConfigMap[key] = result;
        return result;
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

    /**
     * @type {ObjectDatabase}
     */
    static instance;
    static setup()
    {
        return;
    }
}