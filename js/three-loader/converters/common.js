

/**
 * Validates the given texture configuration dictionary
 * @param {Object} configObject 
 * @returns {Array}
 */
function validateSchema(configObject, schemaObject) {
    for(const key in schemaObject) {
        const schema = schemaObject[key];
        const isOptional = schema.optional !== undefined;
        const validateTypes = (schema.valueTypes && schema.valueTypes.length > 0) | false;
        const checkValues = schema.values !== undefined;

        let configPropertyObject = configObject[key];
        if(configPropertyObject === undefined) {
            if(isOptional) continue;
            if(schema.default !== undefined) {
                configPropertyObject = schema.default.getValue(configObject);
            } else {
                return [false, key, "Not found!"];
            }
        }

        if(validateTypes) {
            const type = Array.isArray(configPropertyObject) ? "array" : typeof(configPropertyObject);
            const validTypes = schema.valueTypes;
            const isValid = validTypes.includes(type);
            if(!isValid) return [false, key, "Type is invalid!", type, validTypes];
        }
        if(checkValues && !schema.values.includes(configPropertyObject)) {
            return [false, key, "Invalid value!", configPropertyObject, schema.values];
        }
    }
    return [true];
}


/**
 * 
 * @param {Object} configObject 
 * @param {String} key 
 * @param {Object} defaultValue 
 * @returns 
 */
export function getValue(configObject, key, schema, defaultValue = null) {
    let value = defaultValue;
    if(configObject[key] !== undefined)
        value = configObject[key];
    else if(schema[key] !== undefined && schema[key].default)
        value = schema[key].default.getValue(configObject);
    return value;
}

export function assertValidate(configObject, schema) {
    const validationResult = validateSchema(configObject, schema);
    if(!validationResult[0]) {
        let errorMessage = `Validation Error! (${validationResult[1]})\n${validationResult[2]}\n`;
        if(validationResult.length > 3) {
            errorMessage += "Supplied value: " + validationResult[3] + "\n";
            errorMessage += "Valid values: " + validationResult[4];
        }
        throw new Error(errorMessage);
    }
}