import {ParsedQs, Template, Parser} from "./type";
import {compose, couldBeDate, toDate} from "./dates";
import {DateLike, DateLikeReduce} from "./dates.type";
import {toDateString, toDatetimeString} from "./dateReduce";
import {booleanParser, integerParser, naturalParser, numberParser} from "./parser";

export class Parsers {

    static string(trim?: boolean): Parser {
        return function (value?: string | string[]): string | undefined {
            if (Array.isArray(value)) {
                return value.join();
            }
            if (!value) {
                return value;
            }

            const data = value || '';
            return trim ? data.trim() : data;
        };
    };

    static number(): Parser {
        return numberParser;
    };

    static boolean(): Parser {
        return booleanParser;
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
        return integerParser;
    };

    static date(...dateLikeReduces: Array<DateLikeReduce>): Parser {
        return function (value?: string | string[]): DateLike | undefined {
            if (Array.isArray(value)) {
                return undefined;
            }
            return value && couldBeDate(value) ? compose(...dateLikeReduces)(toDate(value.trim())) : undefined;
        }
    }

    static datePattern<T>(...dateLikeReduces: Array<DateLikeReduce>): Parser {
        const reduce = Parsers.date((dateLike: DateLike) => toDateString(dateLike), ...dateLikeReduces);
        return function (value?: string | string[]): string | undefined {
            if (Array.isArray(value)) {
                return undefined;
            }
            return reduce(value) as string | undefined;
        }
    };

    static datetimePattern(...dateLikeReduces: Array<DateLikeReduce>): Parser {
        const reduce = Parsers.date((dateLike: DateLike) => toDatetimeString(dateLike), ...dateLikeReduces);
        return function (value?: string | string[]): string | undefined {
            if (Array.isArray(value)) {
                return undefined;
            }
            return reduce(value) as string | undefined;
        }
    };

    static natural(): Parser {
        return function (value?: string | string[]): number | undefined {
            if (Array.isArray(value)) {
                return undefined;
            }
            return naturalParser(value);
        }
    };

    static enum(array: Array<any>): Parser {
        return function (value?: string | string[]): string | undefined {
            if (Array.isArray(value)) {
                return undefined;
            }
            if (value === undefined) {
                return value;
            }
            const valueTrim = value.trim();
            return array.find((data) => data == valueTrim);
        }
    }

    static regExp(regExp: RegExp): Parser {
        return function (value?: string | string[]): string | undefined {
            if (Array.isArray(value)) {
                return undefined;
            }
            if (value === undefined) {
                return value;
            }
            return regExp.test(value) ? value : undefined;
        }
    }

}


