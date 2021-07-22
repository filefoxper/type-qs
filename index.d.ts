import { IParseOptions, IStringifyOptions } from "qs";

export declare type Parser = (value?: (string | string[])) => any | void;

export interface ParsedQs {
    [key: string]: undefined | null | {} | string | string[] | ParsedQs | ParsedQs[];
}
export declare type Template = {
    [key: string]: Template | Parser;
} | Parser[];

export declare function parse<T>(search: string, opt: IParseOptions & {
    defaults?: any;
    template: Template;
}): T;
export declare function stringify(obj: any, opt?: IStringifyOptions): string;
