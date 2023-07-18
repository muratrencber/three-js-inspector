import { MaterialDatabase } from "./MaterialDatabase";
import { TextureDatabase } from "./TextureDatabase";

/**
 * 
 * @param {function()} onSetupFinished 
 */
export function setup(onSetupFinished)
{
    TextureDatabase.setup();
    MaterialDatabase.setup();
    onSetupFinished();
}