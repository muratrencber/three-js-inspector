import { ObjectDatabase } from './ObjectDatabase.js';
import { TexturePackLoader } from './TextureLoader.js';
import { register } from './DependencyManager.js';
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
        register("texturePacks", this);
    }

    /**
     * @private
     * @type {TextureDatabase}
     */
    static _instance;

    /**
     * @public
     * @returns {TextureDatabase}
     */
    static get instance() {
        if(TextureDatabase._instance === undefined) {
            TextureDatabase._instance = new TextureDatabase();
            TextureDatabase._instance.init();
        }
        return TextureDatabase._instance;
    }
}