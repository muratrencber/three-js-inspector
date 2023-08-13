import { registerCallback } from "./CallbackManager.js";
import { MaterialDatabase } from "./MaterialDatabase.js";
import { ModelDatabase } from "./ModelDatabase.js";
import { ModifierDatabase } from "./ModifierDatabase.js";
import { SceneNodeDatabase } from "./SceneNodeDatabase.js";
import { TextureDatabase } from "./TextureDatabase.js";


export async function setup()
{
    TextureDatabase.setup();
    MaterialDatabase.setup();
    ModelDatabase.setup();
    ModifierDatabase.setup("./configs/modifierstest.yaml");
    SceneNodeDatabase.setup();
}