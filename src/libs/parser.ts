import {IParseOptions, parse as qsParse, ParsedQs} from 'qs';
import {Parser, Template} from "./parser.type";
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

export class Parsers {

    static string(trim?: boolean): Parser {
        return function (value?: string): string {
            const data = value || '';
            return trim ? data.trim() : data;
        };
    };

    static number(): Parser {
        return function (value?: string): Number | undefined {
            const data = Number(value || undefined);
            return isNaN(data) ? undefined : data;
        }
    };

    static boolean(): Parser {
        return function (value?: string): boolean | undefined {
            if (value === undefined) {
                return undefined;
            }
            if (value.trim() === 'true') {
                return true;
            }
            if (value.trim() === 'false') {
                return false;
            }
        }
    };

    static array<T>(mapper?: (data: string) => T): Parser {
        return function (value?: string | Array<string>): Array<T> | Array<string> | undefined {
            if (!Array.isArray(value) && typeof value !== 'string') {
                return undefined;
            }
            const array = typeof value === 'string' ? value.split(',') : value;
            if (mapper) {
                return array.map(mapper).filter((d) => d !== undefined);
            }
            return array.filter((d) => d !== undefined);
        }
    }

    static integer(): Parser {
        return function (value?: string): number | undefined {
            return safeIntegerParser(value);
        }
    };

    static date(...dateLikeReduces: Array<DateLikeReduce>):Parser {
        return function (value?: string): DateLike | undefined {
            return value && couldBeDate(value) ? compose(...dateLikeReduces)(toDate(value.trim())) : undefined;
        }
    }

    static datePattern<T>(...dateLikeReduces: Array<DateLikeReduce>): Parser {
        const reduce = Parsers.date((dateLike: DateLike) => toDateString(dateLike), ...dateLikeReduces);
        return function (value?: string): string | undefined {
            return reduce(value) as string | undefined;
        }
    };

    static datetimePattern(...dateLikeReduces: Array<DateLikeReduce>): Parser {
        const reduce = Parsers.date((dateLike: DateLike) => toDatetimeString(dateLike), ...dateLikeReduces);
        return function (value?: string): string | undefined {
            return reduce(value) as string | undefined;
        }
    };

    static natural(): Parser {
        return function (value?: string): number | undefined {
            return safeNaturalParser(value);
        }
    };

    static enum(array: Array<any>): Parser {
        return function (value?: string): string | undefined {
            if (value === undefined) {
                return value;
            }
            const valueTrim = value.trim();
            return array.find((data) => data == valueTrim);
        }
    }

    static regExp(regExp: RegExp): Parser {
        return function (value?: string): string | undefined {
            if (value === undefined) {
                return value;
            }
            return regExp.test(value) ? value : undefined;
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

function parseArrayOrObject(value: undefined | string | string[] | ParsedQs | ParsedQs[], parser: Template, defaults?: any) {
    if (value === undefined || typeof value === 'string') {
        throw new Error('A string or undefined object can not be processed by a parse config');
    }
    return parseQueryByTemplate(value, parser, defaults);
}

function parseAny(query: string[] | ParsedQs | ParsedQs[], key: string | number, parser: Parser | Template, defaults?: any) {
    const value = query[key];
    const nextDefaults = defaults !== undefined ? defaults[key] : defaults;
    return typeof parser === 'function' ? parseString(value, parser, nextDefaults) : parseArrayOrObject(value, parser, nextDefaults);
}

export function parseQueryByTemplate(query: string[] | ParsedQs | ParsedQs[], parseConfig: Template, defaults?: any): any {
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

export function parse<T>(search: string, opt?: IParseOptions & { defaults?: any, template?: Template }):T|ParsedQs {
    const defaultOpt = {ignoreQueryPrefix: true};
    const {defaults, template, ...currentOpt} = opt || {};
    const query = qsParse(search, {...defaultOpt, ...currentOpt});
    return template ? parseQueryByTemplate(query, template, defaults) as T : query;
}
