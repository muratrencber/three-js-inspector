import { ObjectDatabase } from './ObjectDatabase.js';
import { TexturePackLoader } from './TextureLoader.js';
import { DependencyType, register } from './DependencyManager.js';
import * as THREE from 'three';
import { TexturePack } from './TexturePack.js';
/**
 * @class
 * @extends ObjectDatabase<TexturePack>
 */
export class TextureDatabase extends ObjectDatabase {
    
    /**
     * @param {string} configsPath 
     */
    constructor(configsPath)
    {
        super(configsPath, TexturePackLoader);
    }

    registerForDependencies()
    {
        register(DependencyType.texturePacks, this);
    }

    /**
     * @type {TextureDatabase}
     */
    static instance;
    /**
     * @param {string} configsPath 
     */
    static setup(configsPath) {
        if(TextureDatabase.instance === undefined) {
            TextureDatabase.instance = new TextureDatabase(configsPath);
            TextureDatabase.instance.init();
        }
    }
}