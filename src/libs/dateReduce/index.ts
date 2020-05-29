import {DateLike} from "../dateUtil/type";
import {format, toDate} from "../dateUtil";

export function toDateString(date: DateLike): string {
    return format(toDate(date), 'YYYY-MM-DD');
}

export function toDatetimeString(date: DateLike): string {
    return format(toDate(date));
}

export function startOfDay(dateLike: DateLike): Date {
    let date = toDate(dateLike);
    date.setHours(0, 0, 0, 0);
    return date;
}

export function endOfDay(dateLike: DateLike): Date {
    let date = toDate(dateLike);
    date.setHours(23, 59, 59, 999);
    return date;
}

export function pattern(pat: string) {
    return function formatDateLike(dateLike: DateLike) {
        return format(dateLike, pat);
    }
}