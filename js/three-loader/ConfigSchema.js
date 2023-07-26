import { getYAMLObject } from "./request.js";

/**
 * 
 * @param {any} serializedProperty 
 * @returns {SchemaEntryValue}
 */
function parseSchemaEntryValue(serializedProperty)
{
    if(serializedProperty === undefined) return undefined;
    if(typeof serializedProperty === "object")
    {
        const parseResult= SchemaEntryValueMap.tryParse(serializedProperty);
        if(parseResult) return parseResult;
    }
    return new SchemaEntryValue(serializedProperty);
}

/**
 * 
 * @param {any} value 
 * @returns {string}
 */
function getValueType(value, deep = true)
{
    if(Array.isArray(value))
    {
        if(!deep) return "array";
        return `array[${getValueType(value[0], false)}]`;
    }
    let type = typeof value;
    if(type === "object")
    {
        const keys = Object.keys(value);
        if(keys.length === 0) return "object";
        return `object[${getValueType(value[keys[0]], false)}]`;
    }
    return type;
}

class SchemaEntryValue
{
    constructor(value)
    {
        this.value = value;
    }

    getValue(object)
    {
        return this.value;
    }
}

class SchemaEntryValueMap {
    /**
     * 
     * @param {String} targetKey 
     * @param {Object} values
     */
    constructor(targetKey, values) {
        this.targetKey = targetKey;
        this.values = values;
    }

    /**
     * 
     * @param {Object} serializedProperty 
     * @returns {SchemaEntryValueMap}
     */
    static tryParse(serializedProperty)
    {
        const target = serializedProperty.target;
        const values = serializedProperty.values;
        if(!target || !values)
            return undefined;
        return new SchemaEntryValueMap(target, values);
    }

    getValue(object) {
        console.log("Validating property: "+this.targetKey);
        console.log(this.values);
        let targetValue = this.targetKey ? object[this.targetKey] : undefined;
        if(targetValue === undefined) targetValue = "default";
        return this.values[targetValue];
    }
}

class ValidationResult
{
    constructor()
    {
        /**
         * @type {bool}
         */
        this.validated;
        /**
         * @type {string}
         */
        this.failureKey;
        /**
         * @type {string}
         */
        this.failureMessage;
        /**
         * @type {any}
         */
        this.foundValue;
        /**
         * @type {any}
         */
        this.necessaryValue;
    }

    /**
     * 
     * @param {string} key
     * @param {string} message 
     * @param {any} value 
     * @param {any} necessaryValue 
     * @returns {ValidationResult}
     */
    static failure(key, message, value = undefined, necessaryValue = undefined)
    {
        let res = new ValidationResult();
        Object.assign(res,
            {
                validated: false,
                failureKey: key,
                failureMessage: message,
                foundValue: value,
                necessaryValue: necessaryValue
            }
        );
        return res;
    }

    /**
     * 
     * @returns {ValidationResult}
     */
    static success()
    {
        let res = new ValidationResult();
        res.validated = true;
        return res;
    }

    assert()
    {
        if(this.validated) return;
        let errorMessage = this.failureMessage;
        errorMessage += "\nAt key: " + this.failureKey;
        if(this.foundValue) errorMessage += "\nGiven value: " + this.foundValue;
        if(this.necessaryValue) errorMessage += "\nRequired: "+ this.necessaryValue;
        throw new Error(errorMessage);
    }
}

class SchemaEntry
{
    constructor(targetKey, serializedValue)
    {
        /**
         * @type {string}
         * @private
         */
        this.targetKey = targetKey;
        /**
         * @type {SchemaEntryValue}
         */
        this.values = parseSchemaEntryValue(serializedValue.values);
        /**
         * @type {SchemaEntryValue}
         */
        this.value = parseSchemaEntryValue(serializedValue.value);
        /**
         * @type {SchemaEntryValue}
         */
        this.default = parseSchemaEntryValue(serializedValue.default);
        /**
         * @type {SchemaEntryValue}
         */
        this.valueType = parseSchemaEntryValue(serializedValue.valueType);
        /**
         * @type {SchemaEntryValue}
         */
        this.valueTypes = parseSchemaEntryValue(serializedValue.valueTypes);
        /**
         * @type {boolean|string}
         */
        this.optional = serializedValue.optional;
        /**
         * @type {boolean}
         */
        this.setDefault = serializedValue.setDefault;
    }

    getDefaultValue(targetObject)
    {
        return this.default?.getValue(targetObject);
    }

    /**
     * 
     * @param {any} targetObject
     * @returns {ValidationResult}
     */
    validate(targetObject)
    {
        /**
         * @type {Array<(targetValue: any) => ValidationResult>}
         */
        const validators = [this.validateUndefined, this.validateValue, this.validateTypes];
        for(const validator of validators)
        {
            const result = validator.bind(this)(targetObject);
            if(!result.validated) return result;
        }
        return ValidationResult.success();
    }

    /**
     * 
     * @param {any} targetObject 
     * @private
     * @returns {ValidationResult} 
     */
    validateUndefined(targetObject)
    {
        const targetValue = targetObject[this.targetKey];
        if(targetValue !== undefined) return ValidationResult.success();
        if(this.optional === "useDefault") {
            const defaultValue = this.default.getValue(targetObject);
            if(defaultValue === undefined){
                return ValidationResult.failure(this.targetKey, "Property must be set, no default found!", targetValue);
            }
            targetObject[this.targetKey] = defaultValue;
            return ValidationResult.success();
        }
        if(this.optional) return ValidationResult.success();
        return ValidationResult.failure(this.targetKey, "Property must be set!");
    }

    /**
     * 
     * @param {any} targetObject 
     * @private
     * @returns {ValidationResult} 
     */
    validateValue(targetObject)
    {
        const validValue = this.value?.getValue(targetObject);
        const validValues = this.values?.getValue(targetObject);
        const targetValue = targetObject[this.targetKey];
        const isValue = validValue === undefined || validValue === targetValue;
        const isValues = validValues === undefined || validValues.includes(targetValue);
        if(isValue || isValues) return ValidationResult.success()
        return ValidationResult.failure(this.targetKey, "Invalid value!", targetValue, validValues ?? validValue);
    }


    /**
     * 
     * @param {any} targetObject 
     * @private
     * @returns {ValidationResult} 
     */
    validateTypes(targetObject)
    {
        const validValueType = this.valueType?.getValue(targetObject);
        const validValueTypes = this.valueTypes?.getValue(targetObject);
        const targetValue = targetObject[this.targetKey];
        const type = getValueType(targetValue);
        const validSingular = validValueType === undefined || validValueType === type;
        const validMultiple = validValueTypes === undefined || validValueTypes.includes(type);
        if(validSingular || validMultiple) return ValidationResult.success();
        return ValidationResult.failure(this.targetKey, "Invalid type!", targetValue, validValueTypes ?? validValueType);
    }
}


export class Schema 
{
    constructor(schemaObject)
    {
        /**
         * @type {Object.<string, SchemaEntry>}
         * @private
         */
        this.dict = {};
        for(const key in schemaObject)
        {
            const schemaValue = new SchemaEntry(key, schemaObject[key]);
            this.dict[key] = schemaValue;
        }
    }

    assertValidate(targetObject) 
    {
        console.log("Validationg object: ",targetObject);
        for(const key in this.dict)
        {
            const valueValidationResult = this.dict[key].validate(targetObject);
            valueValidationResult.assert();
        }
    }

    tryGetValue(targetObject, key)
    {
        if(!this.dict[key]) return undefined;
        return this.dict[key].getDefaultValue(targetObject);
    }
}

export const SchemaKeys = {
    TEXTURE_PACK: "TEXTURE_PACK",
    MATERIAL: "MATERIAL",
    MODEL: "MODEL",
    NODE: "NODE"
};
/**
 * @type {Object.<string, Schema>}
 */
const SCHEMAS = {};

/**
 * 
 * @param {SchemaKeys} key 
 */
function TryLoadSchema(key) {
    if(SCHEMAS[key]) return;
    const path = `./schemas/${SchemaKeys[key]}.yaml`;
    const schemaObject = getYAMLObject(path);
    SCHEMAS[key] = new Schema(schemaObject);
}

/**
 * 
 * @param {SchemaKeys} key 
 * @returns {Schema}
 */
export function GetSchema(key) {
    TryLoadSchema(key);
    return SCHEMAS[key];
}