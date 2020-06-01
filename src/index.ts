import {IParseOptions, IStringifyOptions, parse as qsParse, ParsedQs, stringify as qsStringify} from "qs";
import {parse as parseQuery} from "type-query-parser";
import {Template} from "type-query-parser";

export {Parsers} from 'type-query-parser';

export const parseQueryByTemplate = parseQuery;

export function parse<T>(search: string, opt?: IParseOptions & { defaults?: any, template?: Template }): T | ParsedQs {
    const defaultOpt = {ignoreQueryPrefix: true};
    const {defaults, template, ...currentOpt} = opt || {};
    const query = qsParse(search, {...defaultOpt, ...currentOpt});
    return template ? parseQueryByTemplate(query, template, defaults) as T : query;
}

export function stringify(obj: any, opt?: IStringifyOptions): string {
    return qsStringify(obj, opt);
}
