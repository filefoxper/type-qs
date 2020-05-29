import {IParseOptions, parse as qsParse, ParsedQs} from 'qs';
import {Parser, ParseTemplate} from "./parser.type";
import {compose, couldBeDate, toDate} from "./dateUtil";
import {DateLike, DateLikeReduce} from "./dateUtil/type";
import {toDateString, toDatetimeString} from "./dateReduce";

const isSafeInteger = Number.isSafeInteger || function (value: number) {
    return Number.isInteger(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER;
};

const matchInteger = (value?: string) => /^(-)?[0-9][0-9]*$/.test(value || '');

const safeIntegerParser = (value?: string, defaultValue?: number) => {
    return matchInteger(value) && isSafeInteger(Number(value)) ? Number(value) : defaultValue;
};

const matchNatural = (value?: string) => /^[0-9][0-9]*$/.test(value || '');

const safeNaturalParser = (value?: string, defaultValue?: number) => {
    return matchNatural(value) && isSafeInteger(Number(value)) ? Number(value) : defaultValue;
};

export class ParseType {

    static string(trim: boolean = true): Parser {
        return function (value?: string): string {
            const data = value || '';
            return trim ? data.trim() : data;
        };
    };

    static number(): Parser {
        return function (value?: string): Number | void {
            const data = Number(value || undefined);
            return isNaN(data) ? undefined : data;
        }
    };

    static boolean(): Parser {
        return function (value?: string): boolean | undefined {
            if (value === undefined) {
                return undefined;
            }
            if (value === 'true') {
                return true;
            }
            if (value === 'false') {
                return false;
            }
        }
    };

    static array<T>(mapper?: (data: string) => T): Parser {
        return function (value?: string | Array<string>): Array<T> | Array<string> | void {
            if (!Array.isArray(value) && typeof value !== 'string') {
                return undefined;
            }
            const array = typeof value === 'string' ? value.split(',') : value;
            if (mapper) {
                return array.map(mapper);
            }
            return array;
        }
    }

    static integer(): Parser {
        return function (value?: string): number | void {
            return safeIntegerParser(value);
        }
    };

    static date(...dateLikeReduces: Array<DateLikeReduce>) {
        return function (value?: string): DateLike | void {
            return value && couldBeDate(value) ? compose(...dateLikeReduces)(toDate(value)) : undefined;
        }
    }

    static datePattern<T>(): Parser {
        const reduce = ParseType.date((dateLike: DateLike) => toDateString(dateLike));
        return function (value?: string): string {
            return reduce(value) as string;
        }
    };

    static datetimePattern(): Parser {
        const reduce = ParseType.date((dateLike: DateLike) => toDatetimeString(dateLike));
        return function (value?: string): string {
            return reduce(value) as string;
        }
    };

    static natural(): Parser {
        return function (value?: string): number | void {
            return safeNaturalParser(value);
        }
    };

    static enum(array: Array<string>): Parser {
        return function (value?: string): string | void {
            if (value === undefined) {
                return value;
            }
            const valueTrim = value.trim();
            return array.find((data) => data === valueTrim);
        }
    }

    static regExp(regExp: RegExp): Parser {
        return function (value?: string): string | void {
            if (value === undefined) {
                return value;
            }
            return regExp.test(value) ? value : undefined;
        }
    }

    static any<T>(queryType: (data?: string) => T | undefined): Parser {
        return function (value?: string): T | undefined {
            return queryType(value);
        }
    }

}

function isStringArray(value: any): value is string[] {
    if (!Array.isArray(value)) {
        return false;
    }
    return value.every((e) => typeof e === 'string');
}

function parseString(value: undefined | string | string[] | ParsedQs | ParsedQs[], parse: Parser, defaults?: any) {
    if (value === undefined) {
        return parse();
    }
    if (typeof value === 'string' || isStringArray(value)) {
        const result = parse(value);
        return result === undefined && defaults !== undefined ? defaults : result;
    }
    throw new Error('A ParsedQs object can not be processed by a parse function');
}

function parseArrayOrObject(value: undefined | string | string[] | ParsedQs | ParsedQs[], parser: ParseTemplate, defaults?: any) {
    if (value === undefined || typeof value === 'string') {
        throw new Error('A string or undefined object can not be processed by a parse config');
    }
    return parseQueryByTemplate(value, parser, defaults);
}

function parseAny(query: string[] | ParsedQs | ParsedQs[], key: string | number, parser: Parser | ParseTemplate, defaults?: any) {
    const value = query[key];
    const nextDefaults = defaults !== undefined ? defaults[key] : defaults;
    return typeof parser === 'function' ? parseString(value, parser, nextDefaults) : parseArrayOrObject(value, parser, nextDefaults);
}

export function parseQueryByTemplate(query: string[] | ParsedQs | ParsedQs[], parseConfig: ParseTemplate, defaults?: any): any {
    const it = Object.entries(parseConfig);
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

export function parse<T>(search: string, template: ParseTemplate, opt?: IParseOptions & { defaults?: any }) {
    const defaultOpt = {ignoreQueryPrefix: true};
    const {defaults, ...currentOpt} = opt;
    const query = qsParse(search, {...defaultOpt, ...currentOpt});
    return parseQueryByTemplate(query, template, defaults) as T;
}
