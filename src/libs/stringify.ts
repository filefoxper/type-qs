import {IStringifyOptions, stringify as qsStringify} from "qs";

export function stringify(obj: any, opt?: IStringifyOptions): string {
    return qsStringify(obj, opt);
}