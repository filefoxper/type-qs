import {DateLike, DateLikeReduce} from "./type";

export function couldBeDate(string: string) {
    const time=Number(string);
    return !isNaN(time)||!isNaN(new Date(string.replace(/\-/g, '/')).getTime());
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

export function format(dateLike: DateLike, pattern: string = 'YYYY-MM-DD HH:mm:ss') {
    const d = toDate(dateLike);
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

export function toDate(dateLike: DateLike) {
    if (typeof dateLike === 'string' && !couldBeDate(dateLike)) {
        throw new Error('This is a string dateLike which can not be a Date object .');
    }
    if (typeof dateLike !== 'string') {
        return new Date(dateLike);
    }
    if(isNaN(Number(dateLike))){
        return new Date(dateLike.replace(/\-/g, '/'));
    }else{
        return new Date(Number(dateLike));
    }
}

export function compose(...dateLikeReduces: Array<DateLikeReduce>) {
    const reduces = [...dateLikeReduces];
    return function (dateLike: DateLike): DateLike {
        return reduces.reduce((current, reduce) => reduce(current), dateLike);
    }
}