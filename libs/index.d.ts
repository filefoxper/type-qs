export declare type DateLike = string | number | Date;

export declare type DateLikeReduce = (dateLike: DateLike) => DateLike;

export declare type Parser = (value?: (string | string[])) => any | void;

export declare class Parsers {
    static string(trim?: boolean): Parser;
    static number(): Parser;
    static boolean(): Parser;
    static array<T>(mapper?: (data: string) => T): Parser;
    static integer(): Parser;
    static date(...dateLikeReduces: Array<DateLikeReduce>): Parser;
    static datePattern<T>(...dateLikeReduces: Array<DateLikeReduce>): Parser;
    static datetimePattern(...dateLikeReduces: Array<DateLikeReduce>): Parser;
    static natural(): Parser;
    static enum(array: Array<any>): Parser;
    static regExp(regExp: RegExp): Parser;
}

export declare function toDate(dateLike: DateLike): Date;

export declare function toDateString(date: DateLike): string;
export declare function toDatetimeString(date: DateLike): string;
export declare function getTime(date: DateLike): number;
export declare function startOfDay(dateLike: DateLike): Date;
export declare function endOfDay(dateLike: DateLike): Date;
export declare function pattern(pat: string): (dateLike: DateLike) => string;
