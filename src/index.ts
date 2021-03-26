import {IParseOptions, IStringifyOptions, parse as qsParse, ParsedQs, stringify as qsStringify} from "qs";
import {parse as parseQuery} from "type-query-parser";
import {Template} from "type-query-parser/core/index.type";

export {Parsers} from 'type-query-parser';

export function parse<T>(search: string, opt: IParseOptions & { defaults?: any, template: Template }): T {
    const defaultOpt = {ignoreQueryPrefix: true};
    const {defaults, template, ...currentOpt} = opt;
    if(!template){
        throw new Error('you need provide a template for parsing.');
    }
    const query = qsParse(search, {...defaultOpt, ...currentOpt});
    return parseQuery<T>(query, template, defaults) as T;
}

export function stringify(obj: any, opt?: IStringifyOptions): string {
    return qsStringify(obj, opt);
}

export {
    Template
}