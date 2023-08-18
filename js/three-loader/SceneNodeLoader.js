import { ConfigLoader } from "./ConfigLoader.js";
import { SchemaKeys } from "./ConfigSchema.js";
import { DependencyDictionary } from "./DependencyManager.js";
import { SceneNode } from "./SceneNode.js";
import { SceneNodeSource } from "./SceneNodeSource.js";

/**
 * @extends ConfigLoader<SceneNode>
 */
export class SceneNodeLoader extends ConfigLoader
{
    constructor()
    {
        super(SchemaKeys.NODE);
        /**
         * @type {SceneNodeSource}
         */
        this.source = undefined;
    }

    /**
     * @private
     */
    tryLoadSource(force = false)
    {
        if(this.source && !force) return;
        this.source = new SceneNodeSource(this.getValue("materialMapIgnore", [])).load(this.getValue("source"));
    }


    /**
     * @override
     * @returns {DependencyDictionary}
     */
    getDependencies()
    {
        this.tryLoadSource(true);
        const materials = Object.values(this.source.getMaterialDict());
        const models = this.source.getModelKeys();
        const nodes = this.getConnectionNodeReferences();
        const modifiers = this.getValue("modifiers", []);
        return new DependencyDictionary(
            {
                materials: materials,
                models: models,
                nodes: nodes,
                modifiers: modifiers
            }
        );
    }
    
    /**
     * @returns {Promise<SceneNode>}
     */
    async load()
    {
        this.tryLoadSource(true);
        let result = new SceneNode(this.config.configKey);
        const specs = this.source.tryLoadSpecifications(true).sceneNodeObjects;
        for(const key in specs)
        {
            const nodeObject = specs[key].getObject();
            if(nodeObject.isConnection)
            {
                nodeObject.applyProperties(this.getConnectionProperties(key));
                result.addConnection(key, nodeObject);
            }
            else
            {
                result.addObject(key, nodeObject);
            }
        }
        result.preConnects = this.getValue("preConnects", []);
        this.getValue("modifiers", []).forEach((val, _) => result.addModifier(this.getModifier(val)));
        this.getValue("localModifiers", []).forEach((val, _) => result.addModifier(val));
        this.invokeCallbackFunction("onNodeLoaded", result);
        return Promise.resolve(result);
    }

    /**
     * 
     * @param {string} connectionKey 
     * @returns {{hideOnConnect: boolean|undefined}}
     */
    getConnectionProperties(connectionKey)
    {
        const props = this.getValue("connectionProperties", {});
        return props[connectionKey] ?? {};
    }

    /**
     * @typedef {{node: string, plugKey: string, receiverKey: string}} connectionType
     * @returns {Array<string>}
     */
    getConnectionNodeReferences()
    {
        /**
         * @type {Array<connectionType>}
         */
        const connections = this.getValue("preConnects", []);
        let resultSet = new Set();
        for(const connection of connections)
            resultSet.add(connection.node);
        return Array.from(resultSet);
    }
    
}