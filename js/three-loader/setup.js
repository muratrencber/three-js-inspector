import { registerCallback } from "./CallbackManager.js";
import { MaterialDatabase } from "./MaterialDatabase.js";
import { TextureDatabase } from "./TextureDatabase.js";

export async function setup()
{
    TextureDatabase.setup();
    MaterialDatabase.setup();
}