import { SceneModifier } from "./SceneModifier.js";
import { SceneNode } from "./SceneNode.js";
import * as THREE from 'three';
import { SceneNodeConnection } from "./SceneNodeConnection.js";
import { getNodeProvider } from "./DependencyManager.js";
import { CallbackList } from "./CallbackList.js";

/**
 * @typedef NodeEventData
 * @property {SceneNode} node
 * @property {SceneNodeGraph} graph
 * @property {boolean} isCentral
 */

/**
 * @typedef ConnectionEventData
 * @property {SceneNodeGraph} graph
 * @property {NodeConnection} connect
 */

/**
 * @typedef SceneNodeGraphCallbacks
 * @property {NodeEventData} nodeAdded
 * @property {NodeEventData} nodeRemoved
 * @property {NodeEventData} appliedPreConnects
 * @property {ConnectionEventData} connectionEstablished
 * @property {ConnectionEventData} connectionRemoved
 */

/**
 * @type {SceneNodeGraphCallbacks}
 */
const callbackTypes = {
    "nodeAdded": 0,
    "nodeRemoved": 0,
    "connectionEstablished": 0,
    "connectionRemoved": 0,
    "appliedPreConnects": 0
};

/**
 * @global
 * @typedef {keyof typeof callbackTypes} NodeGraphCallbackType
 * @typedef {{receiver: SceneNodeConnection, plug: SceneNodeConnection}} NodeConnection
 */
export class SceneNodeGraph
{
    /**
     * @param {THREE.Scene} scene 
     */
    constructor(scene)
    {
        /**
         * @type {Object.<string, SceneNode>}
         */
        this.nodes = {};
        /**
         * @type {Map<SceneNodeConnection, NodeConnection>}
         */
        this.receiverConnectionMap = new Map();
        /**
         * @type {Map<SceneNodeConnection, NodeConnection>}
         */
        this.plugConnectionMap = new Map();
        /**
         * @type {Array<SceneModifier>}
         */
        this.modifiers = [];
        /**
         * @type {SceneNode}
         */
        this.centralNode = undefined;
        /**
         * @type {THREE.Scene}
         */
        this.scene = scene;

        /**
         * @type {import("./CallbackList.js").CallbackList<SceneNodeGraphCallbacks>}
         */
        this.callbacks = new CallbackList(callbackTypes);
    }

    /**
     * 
     * @param {SceneNode} node 
     */
    addNode(node)
    {
        if(!node || this.nodes[node.key]) return;
        this.nodes[node.key] = node;
        this.scene.add(node.root);
        if(!this.centralNode)
        {
            this.centralNode = node;
        }
        this.callbacks.invoke("nodeAdded", {
            "graph": this,
            "isCentral": this.centralNode === node,
            "node": node
        });
        this.applyPreConnects(node);
    }

    /**
     * 
     * @param {SceneNode} node 
     * @returns 
     */
    removeNode(node)
    {
        if(!node || !this.nodes[node.key]) return;
        if(this.centralNode === node)
        {
            //TODO make it removable!
            console.error("Cannot remove central node!");
            return;
        }
        delete this.nodes[node.key];
        this.scene.remove(node.root);
        for(const connectionKey of node.connections)
        {
            const connection = node.connections[connectionKey];
            if(connection.connectionType === "plug")
                this.plugConnectionMap.delete(connection);
            else if(connection.connectionType === "receiver")
                this.receiverConnectionMap.delete(connection);
        }
        this.callbacks.invoke("nodeRemoved", {
            "graph": this,
            "node": node,
            "isCentral": false
        });
    }
    
    /**
     * @param {SceneNode} node 
     */
    applyPreConnects(node)
    {
        for(const preConnect of node.preConnects)
        {
            const thisReceiver = node.connections[preConnect.receiverKey];
            const otherNode = getNodeProvider().getLoadedConfig(preConnect.node);
            if(!otherNode) continue;
            const otherPlug = otherNode.connections[preConnect.plugKey];
            if(!thisReceiver || !otherPlug) continue;
            this.connect(thisReceiver, otherPlug);
        }
        this.callbacks.invoke("appliedPreConnects", ({graph: this, isCentral: node === this.centralNode, node: node}));
    }

    /**
     * @param {string} path
     * @param {string} startNodeKey
     * @returns {SceneNode|SceneNodeConnection|THREE.Object3D} 
     */
    findObject(path, startNodeKey = undefined)
    {
        path = path.trim();
        let currentNode = startNodeKey ? this.nodes[startNodeKey] : null;
        let currentResult = null;
        const parts = path.split("/");
        let isCurrentNode = true;
        for(const part of parts)
        {
            if(!part)
                continue;
            isCurrentNode = false;
            break;
        }
        if(isCurrentNode)
        {
            if(!currentNode) return null;
            return currentNode;
        }
        for(const part of parts)
        {
            let key = part;
            let functionOrder = [];
            const typeAndKey = key.split(":");
            const isTypeSpecified = typeAndKey.length > 1;
            let searchForNode = true;
            let searchForConnectionPlug = currentNode !== null;
            let searchForConnectionReceiver = currentNode !== null;
            let searchForObject = currentNode !== null;
            if(isTypeSpecified)
            {
                searchForNode = false;
                searchForConnectionPlug = false;
                searchForConnectionReceiver = false;
                searchForObject = false;
                key = typeAndKey[1];
                switch(typeAndKey[0])
                {
                    case "node":
                        searchForNode = true;
                        break;
                    case "plug":
                        searchForConnectionPlug = true;
                        break;
                    case "receiver":
                        searchForConnectionReceiver = true;
                        break;
                    case "object":
                        searchForObject = true;
                        break;
                }
            }
            if(searchForObject)
            {
                functionOrder.push(() => currentNode.objects[key]);
            }
            if(searchForConnectionReceiver)
            {
                const receiverObject = currentNode.connections[key];
                if(receiverObject)
                    functionOrder.push(() => {
                        return this.receiverConnectionMap.get(receiverObject)?.plug.ownerNode;
                });
            }
            if(searchForConnectionPlug)
            {
                const plugObject = currentNode.connections[key];
                if(plugObject)
                    functionOrder.push(() => {
                        return this.plugConnectionMap.get(plugObject)?.receiver.ownerNode;
                });
            }
            if(searchForNode)
                functionOrder.push(() => this.getNode(key));

            let finalResult = null;
            for(const func of functionOrder)
            {
                finalResult = func();
                if(finalResult)
                {
                    if(finalResult instanceof SceneNode)
                        currentNode = finalResult;
                    break;
                }
            }
            currentResult = finalResult;
            if(!currentResult) break;
        }
        return currentResult;
    }

    /**
     * @param {string} key
     * @returns {SceneNode} 
     */
    getNode(key)
    {
        if(!key || key == "") return undefined;
        return this.nodes[key];
    }

    /**
     * @private
     * @param {SceneNode} source 
     * @param {Array<string>} checkedKeys 
     */
    propagateFromNode(source, checkedKeys)
    {
        if(!source || checkedKeys.includes(source.key)) return;
        checkedKeys.push(source.key);
        for(const connectionKey in source.connections)
        {
            const connection = source.connections[connectionKey];
            if(connection.connectionType !== "receiver") continue;
            const graphConnection = this.receiverConnectionMap.get(connection);
            if(!graphConnection) continue;
            this.populateConnectionMap(graphConnection.plug.ownerNode, checkedKeys);
        }
    }
    
    cleanupNodes()
    {
        let validKeys = [];
        this.propagateFromNode(this.centralNode, validKeys);
        let invalidKeys = Object.keys(this.nodes).filter(node => !validKeys.includes(node.key));
        for(const invalidKey of invalidKeys)
        {
            this.removeNode(this.nodes[invalidKey]);
        }
    }

    /**
     * @param {SceneNodeConnection} receiver 
     * @param {SceneNodeConnection} plug
     * @returns {NodeConnection}
     */
    addConnection(receiver, plug)
    {
        const object = {receiver: receiver, plug: plug};
        this.plugConnectionMap.set(plug, object);
        this.receiverConnectionMap.set(receiver, object);
        return object;
    }

    /**
     * @param {SceneNodeConnection} receiver 
     * @param {SceneNodeConnection} plug 
     * @returns {NodeConnection}
     */
    removeConnection(receiver, plug)
    {
        let removedConnection = this.plugConnectionMap.get(plug);
        this.plugConnectionMap.delete(plug);
        if(!removedConnection)
            removedConnection = this.receiverConnectionMap.get(receiver);
        this.receiverConnectionMap.delete(receiver);
        return removedConnection;
    }

    /**
     * 
     * @param {SceneNodeConnection} receiver 
     * @param {SceneNodeConnection} plug
     * @returns {boolean} 
     */
    hasConnection(receiver, plug)
    {
        return this.plugConnectionMap.has(plug) && this.receiverConnectionMap.has(receiver);
    }

    /**
     * @param {SceneNodeConnection} receiver 
     * @param {SceneNodeConnection} plug 
     */
    connect(receiver, plug)
    {
        if(this.receiverConnectionMap.has(receiver) || this.plugConnectionMap.has(plug))
        {
            console.warn("Can't connect! Some plug or receiver already connected!", receiver, plug);
            return;
        }
        const plugNode = plug.ownerNode
        const receiverNode = receiver.ownerNode;
        this.addNode(receiverNode);
        this.addNode(plugNode);
        const connectionInstance = this.addConnection(receiver, plug);
        let plugQuat = new THREE.Quaternion();
        let receiverQuat = new THREE.Quaternion();
        plug.group.getWorldQuaternion(plugQuat);
        receiver.group.rotateZ(THREE.MathUtils.degToRad(180));
        receiver.group.getWorldQuaternion(receiverQuat);
        receiver.group.rotateZ(THREE.MathUtils.degToRad(180));
        const deltaQuaternion = receiverQuat.clone().multiply(plugQuat.clone().invert());
        if(plugNode)
        {
            const resultQuaternion = deltaQuaternion.multiply(plugNode?.root.quaternion);
            plugNode?.root.quaternion.set(resultQuaternion.x, resultQuaternion.y, resultQuaternion.z, resultQuaternion.w);
        }
        let plugPos = new THREE.Vector3();
        let receiverPos = new THREE.Vector3();
        plug.group.getWorldPosition(plugPos);
        receiver.group.getWorldPosition(receiverPos);
        let deltaPosition = receiverPos.sub(plugPos);
        if(plugNode)
        {
            plugNode.root.position.add(deltaPosition);
        }
        this.callbacks.invoke("connectionEstablished", {
            "connection": connectionInstance,
            "graph": this
        });
    }

    /**
     * @param {SceneNodeConnection} receiver 
     * @param {SceneNodeConnection} plug 
     */
    disconnect(receiver, plug)
    {
        if(!this.hasConnection(receiver, plug))
        {
            console.warn("Can't disconnect! Connection does not exist!", receiver, plug);
            return;
        }
        const removedConnection = this.removeConnection(receiver, plug);
        this.callbacks.invoke("connectionRemoved", {
            "connection": removedConnection,
            "graph": this
        });
        this.cleanupNodes();
    }
}