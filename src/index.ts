import {IParseOptions, IStringifyOptions, parse as qsParse, ParsedQs, stringify as qsStringify} from "qs";
import {Parser, Template} from './libs/type';

function isStringArray(value: any): value is string[] {
    if (!Array.isArray(value)) {
        return false;
    }
    return value.every((e) => typeof e === 'string');
}

function parseString(value: undefined | null | string | string[] | ParsedQs | ParsedQs[], parse: Parser, defaults?: any) {
    if (value === undefined) {
        return defaults !== undefined ? defaults : undefined;
    }
    if (typeof value === 'string' || isStringArray(value)) {
        const result = parse(value);
        return result === undefined && defaults !== undefined ? defaults : result;
    }
    throw new Error('A ParsedQs object can not be processed by a parse function');
}

function parseArrayOrObject(value: undefined | null | string | string[] | ParsedQs | ParsedQs[], parser: Template, defaults?: any) {
    if (typeof value === 'string') {
        throw new Error('A string data can not be processed by a parse config');
    }
    if (value === undefined || value === null) {
        return defaults;
    }
    return parseQuery(value, parser, defaults);
}

function parseAny(query: string[] | ParsedQs | ParsedQs[], key: string | number, parser: Parser | Template, defaults?: any) {
    const value = Array.isArray(query) ? query[Number(key)] : query[key];
    const nextDefaults = defaults !== undefined ? defaults[key] : defaults;
    return typeof parser === 'function' ? parseString(value, parser, nextDefaults) : parseArrayOrObject(value, parser, nextDefaults);
}

function parseQuery(query: string[] | ParsedQs | ParsedQs[], template: Template, defaults?: any): any {
    const it = Object.entries(template);
    const array = [...it];
    if (Array.isArray(query)) {
        return array.map(([key, parser]) => {
            return parseAny(query, key, parser, defaults);
        });
    }
    return array.reduce((params, [key, parser]) => {
        const data = parseAny(query, key, parser, defaults);
        return {...params, [key]: data};
    }, {});
}

export function enhancedParse<T>(query: ParsedQs, template: Template, defaults?: any): T {
    return parseQuery(query, template, defaults);
}

export function parse<T>(search: string, opt: IParseOptions & { defaults?: any, template: Template }): T {
    const defaultOpt = {ignoreQueryPrefix: true};
    const {defaults, template, ...currentOpt} = opt;
    if(!template){
        throw new Error('you need provide a template for parsing.');
    }
    const query = qsParse(search, {...defaultOpt, ...currentOpt});
    return enhancedParse<T>(query as ParsedQs, template, defaults) as T;
}

export function stringify(obj: any, opt?: IStringifyOptions): string {
    return qsStringify(obj, opt);
}
