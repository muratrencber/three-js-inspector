import { ObjectDatabase } from './ObjectDatabase.js';
import { TexturePackLoader } from './TextureLoader.js';
import { DependencyType, register } from './DependencyManager.js';
import * as THREE from 'three';
import { TexturePack } from './TexturePack.js';

const CONFIGS_PATH = "./configs/texturetest.yaml";

/**
 * @class
 * @extends ObjectDatabase<TexturePack>
 */
export class TextureDatabase extends ObjectDatabase
{
    /**
     * @private
     */
    constructor()
    {
        super(CONFIGS_PATH, TexturePackLoader);
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
     * @public
     * @returns {TextureDatabase}
     */
    static setup() {
        if(TextureDatabase.instance === undefined) {
            TextureDatabase.instance = new TextureDatabase();
            TextureDatabase.instance.init();
        }
    }
}