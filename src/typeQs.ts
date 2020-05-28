import {IParseOptions, parse as qsParse, ParsedQs} from 'qs';
import {ParseConfig, Parser} from "./typeQs.type";

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

function couldBeDate(string: string) {
    let matched = /^(\d{4})\-(\d{2})\-(\d{2})$/.test(string)
        || /^(\d{4})\／(\d{2})\／(\d{2})$/.test(string)
        || /^(\d{4})\-(\d{2})\-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.test(string)
        || /^(\d{4})\／(\d{2})\／(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.test(string);
    return matched && !isNaN(new Date(string.replace(/\-/g, '/')).getTime());
}

function padStart(value: string, maxLength: number, startUnit: string) {
    const padLength = maxLength - value.length;
    if (padLength <= 0) {
        return value;
    }
    let start = '';
    while (start.length < padLength) {
        start += startUnit;
    }
    return start.slice(start.length - padLength) + value;
}

function formatTimeUnit(value: number, unit: string, maxLength: number, pattern: string) {
    const valueString = value.toString();
    const reg = new RegExp(unit + '{' + maxLength / 2 + ',' + maxLength + '}', 'g');
    return (pattern).replace(reg, function (w) {
        return maxLength > 2
            ? padStart(valueString, maxLength, '0').slice(maxLength - w.length)
            : padStart(valueString, w.length, '0');
    });
}

function format(d: Date, pattern: string = 'YYYY-MM-DD HH:mm:ss') {
    const hour = d.getHours();
    const params = [
        {value: d.getFullYear(), unit: 'Y', maxLength: 4},
        {value: d.getFullYear(), unit: 'y', maxLength: 4},
        {value: d.getMonth() + 1, unit: 'M'},
        {value: d.getDate(), unit: 'D'},
        {value: d.getDate(), unit: 'd'},
        {value: hour, unit: 'H'},
        {value: hour > 12 ? (hour - 12) : hour, unit: 'h'},
        {value: d.getMinutes(), unit: 'm'},
        {value: d.getSeconds(), unit: 's'}
    ];
    let result = pattern;
    params.forEach(({value, unit, maxLength}) => {
        result = formatTimeUnit(value, unit, maxLength || 2, result);
    });
    return result;
}

function stringToDate(date: string) {
    return new Date(date.replace(/\-/g, '/'));
}

function toDateString(date: string) {
    return format(stringToDate(date), 'YYYY-MM-DD');
}

function toDatetimeString(date: string) {
    return format(stringToDate(date));
}

function through(data: any) {
    return data;
}

export class DateProduce {

    static startOfDay(dateString: string): string {
        let date = stringToDate(dateString);
        date.setHours(0, 0, 0, 0);
        return format(date);
    }

    static endOfDay(dateString: string): string {
        let date = stringToDate(dateString);
        date.setHours(23, 59, 59, 999);
        return format(date);
    }

}

/**
 * url中query的类型解析器，需配合pickQueryParams使用
 * 如：
 * const query=location.query;
 * const queryConfig={
 *     name:QueryType.string(),
 *     role:QueryType.enum(['','BOSS','SELLER_AFTER']),
 *     page:QueryType.page()
 * }
 *
 * pickQueryParams(query,queryConfig,defaultQuery);
 */
export class SearchType {

    /**
     * 转成string类型，默认 ''
     * @param trim 默认开启，可关闭
     */
    static string(trim: boolean = true):Parser {
        return function (value?: string): string {
            const data = value || '';
            return trim ? data.trim() : data;
        };
    };

    /**
     * 转成number类型，默认 undefined
     */
    static number():Parser {
        return function (value?: string): Number | void {
            const data = Number(value || undefined);
            return isNaN(data) ? undefined : data;
        }
    };

    /**
     * 转成boolean类型，默认 undefined
     */
    static boolean():Parser {
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

    /**
     * 检查并转换数组类型数据，默认 undefined
     *
     * @param queryType 指定array每个元素类型的方法
     * 如：
     * QueryType.array(QueryType.boolean()) => 数组元素转换成 boolean类型
     */
    static array<T>(queryType?: (data: string) => T):Parser {
        return function (value?: Array<string>): Array<T> | Array<string> | void {
            if (!Array.isArray(value)) {
                return undefined;
            }
            if (queryType) {
                return value.map(queryType);
            }
            return value;
        }
    }

    /**
     * 转成integer类型，默认 undefined
     */
    static integer() {
        return function (value?: string): number | void {
            return safeIntegerParser(value);
        }
    };

    /**
     * 抓取date类型的字符串，默认 undefined
     *
     * @param dateProduce 时间加工方法，入参数为 dateString 如:'2019-05-26'，默认 (date:string)=>date
     */
    static date(dateProduce: (string: string) => string = through) {
        return function (value?: string): string | void {
            return value && couldBeDate(value) ? dateProduce(toDateString(value)) : undefined;
        }
    };

    /**
     * 抓取datetime类型的字符串，默认 undefined
     *
     * @param dateProduce 时间加工方法，入参数为 dateString 如:'2019-05-26 12:11:21'，默认 (date:string)=>date
     * 可选 DateProduce.startOfDay 或 DateProduce.endOfDay
     */
    static datetime(dateProduce: (string: string) => string = through) {
        return function (value?: string): string | void {
            return value && couldBeDate(value) ? dateProduce(toDatetimeString(value)) : undefined;
        }
    };

    /**
     * 转成自然数类型，默认 undefined
     */
    static natural() {
        return function (value?: string): number | void {
            return safeNaturalParser(value);
        }
    };

    /**
     * 描述并抓取枚举，默认 undefined
     * @param array 枚举描述数组
     */
    static enum(array: Array<string>) {
        return function (value?: string): string | void {
            if (value === undefined) {
                return value;
            }
            const valueTrim = value.trim();
            return array.find((data) => data === valueTrim);
        }
    }

    /**
     * 抓取符合正则表达式的，默认undefined
     * @param regExp
     */
    static regExp(regExp: RegExp) {
        return function (value?: string): string | void {
            if (value === undefined) {
                return value;
            }
            return regExp.test(value) ? value : undefined;
        }
    }

    /**
     * 指定无需转换的数据类型
     */
    static any<T>(queryType: (data?: string) => T | undefined) {
        return function (value?: string): T | undefined {
            return queryType(value);
        }
    }

}

function parseString(value: undefined | string | string[] | ParsedQs | ParsedQs[], parse: (value?: string) => any) {
    if (value === undefined) {
        return parse();
    }
    if (typeof value === 'string') {
        return parse(value);
    }
    throw new Error('A ParsedQs object can not be processed by a parse function');
}

function parseArrayOrObject(value: undefined | string | string[] | ParsedQs | ParsedQs[], parser: ParseConfig) {
    if (value === undefined || typeof value === 'string') {
        throw new Error('A string or undefined object can not be processed by a parse config');
    }
    return parseObject(value, parser);
}

export function parseObject(query: string[] | ParsedQs | ParsedQs[], parseConfig: ParseConfig): any {
    const it = Object.entries(parseConfig);
    const array = [...it];
    if (Array.isArray(query)) {
        return array.map(([key, parser]) => {
            const value = query[key];
            return typeof parser === 'function' ? parseString(value, parser) : parseArrayOrObject(value, parser);
        });
    }
    return array.reduce((params, [key, parser]) => {
        const value = query[key];
        const data = typeof parser === 'function' ? parseString(value, parser) : parseArrayOrObject(value, parser);
        return {...params, [key]: data};
    }, {});
}

export function parse<T = any>(search: string, parseConfig: ParseConfig, opt?: IParseOptions): T {
    const query = qsParse(search, opt);
    return parseObject(query, parseConfig) as T;
}
