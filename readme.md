[npm link](https://www.npmjs.com/package/type-qs)

[github link](https://github.com/filefoxper/type-qs)
# problem
When we parse a search from location, we often get an object with ```{[key: string]: string|string[]|undefined}```, 
but we really want an object like ```{[key:string]:number|boolean|Date|string|string[]...} ``` which can describe more 
types about the values. Also we want to validate these values, if they are invalid we can replace them from an default 
object by the key.

# resolve
Here is a tool ```type-qs``` which can do something like transforming value type and replacing value which is invalid.
 It use [qs](https://www.npmjs.com/package/qs) to parse your `search` to `query` first, 
 then parse query with your template.

# differs with qs
the only differs with [qs](https://www.npmjs.com/package/qs) is the parse function.

parse(search: string, opt?: IParseOptions & { defaults?: any, template?: Template })

we add the <strong>template and defaults</strong> into options. So you will work with template to recompute your query and use defaults to
 replace the invalid query params.
 
<strong>if you set nothing about template, it works what qs.parse works.</strong>
# example
check and transform
```
import {parse,Parsers} from 'type-qs';

...
const template={
    id:Parsers.natural(),           //get a natural number 0,1,2,3, ......
    name:Parsers.string(true),      //get a string data with trim option: boolean, if true then the name will be trimmed
    active:Parsers.boolean(),       //get a boolean data
    role:Parsers.enum(['GUEST','USER','MASTER','ADMIN']),
                                    //get a data which only can be one of 'GUEST'|'USER'|'MASTER'|'ADMIN'
    page:Parsers.natural()          //get a natural number, check out the source page is not a natural number, then get an undefined
};
const query=parse('id=123456&name= jimmy &active=true&role=MASTER&page=abc',{template});
...
console.log(query);

/*** result ***/
{
    id:123456,
    name:'jimmy',
    active:true,
    role:'MASTER',
    page:undefined
}
```
check and transform with default values
```
import {parse,Parsers} from 'type-qs';

...
const template={
    id:Parsers.natural(),           //get a natural number 0,1,2,3, ......
    name:Parsers.string(true),      //get a string data with trim option: boolean, if true then the name will be trimmed
    active:Parsers.boolean(),       //get a boolean data
    role:Parsers.enum(['GUEST','USER','MASTER','ADMIN']),
                                    //get a data which only can be one of 'GUEST'|'USER'|'MASTER'|'ADMIN'
    page:Parsers.natural()          //get a natural number, check out the source page is not a natural number, then get an undefined
};
const defaults={
    role:'GUEST',                   //notice now we change role=MASTERR in search, and it be undefined, 
                                    //but we give an defaults which contains a 'role' key
    page:1
};
const query=parse('id=123456&name= jimmy &active=true&role=MASTERR&page=abc',{template,defaults});
...
console.log(query);

/*** result ***/
{
    id:123456,
    name:'jimmy',
    active:true,
    role:'GUEST',
    page:1
}
```
omit entries which we do not care
```
import {parse,Parsers} from 'type-qs';

...
const template={
    ids:Parsers.array(),
}

const query=parse('ids=1%2C2%2C3&useless=123',{template,defaults:{useless:'123'}}); //the url like ids=1,2,3&useless=123
...
console.log(query);

/*** result ***/
{
    ids:['1','2','3']
}                                   //the 'useless' in url is omited, because the template has no key 'useless'
```
make array data type by numbers
```
import {parse,Parsers} from 'type-qs';

...
const template={
    ids:Parsers.array(Parsers.natural()), //the param to Parses.array can be another Parser which use map array data to you want
}

const query=parse('ids=1%2C2%2C3',{template}); //the url like ids=1,2,3
...
console.log(query);

/*** result ***/
{
    ids:[1,2,3]
}                 
```
make a custom Parser function
```
import {parse,Parsers} from 'type-qs';

const numberToBoolean=(value:string='')=>{
    if(value.trim()==='1'){
        return true;
    }
    if(value.trim()==='0'){
        return false
    }
}

const template={
    active:numberToBoolean
}

const query=parse('active=1',{template});
...
console.log(query);

/*** result ***/
{
    active:true
}
```
use qs abilities
```
import {parse,stringify,Parsers} from 'type-qs';

const source={
    id:1,
    more:{
        active:true,
        name:'Jimmy',
        size:'ab'
    }
};

const template={
    id:Parsers.natural(),
    more:{
        active:Parsers.boolean,
        name:Parsers.string(),
        size:Parsers.natural()
    }
};

const defaults={
    more:{
        size:10
    }
};

const search=stringify(source);                 //id=1&more%5Bactive%5D=true&more%5Bname%5D=Jimmy&more%5Bsize%5D=ab
const result=parse(search,{template,defaults});
...
console.log(result);

/*** result ***/
{
    id:1,
    more:{
        active:true,
        name:'Jimmy',
        size:10                                 //from defaults
    }
}                   
```
# api
<strong>parse</strong> `search` to an object you want by `template` and `defaults` in `opt`.

types:

type Parser = (value?: string|string[]) => any|void;
`any function matches Parser is used to transform value to you want`

type Template = {
    [key: string]: Template | Parser
} | Parser[];
`any object matches Template is used to structure result you want`

type IParseOption is from qs, you can learn it with [qs api](https://www.npmjs.com/package/qs)

type {defaults?:any} 
`the default value you provide, when the value is undefined, the value in defaults with same key will replace the undefined one.`
```
function parse(search:string,opt?: IParseOptions & { defaults?: any,template?:Template })
```
<strong>stringify</strong> is from qs, you can earn it with [qs api](https://www.npmjs.com/package/qs)

```
function stringify(obj: any, opt?: IStringifyOptions): string
```
<strong>Parsers</strong> provide some `Parser`, which is helpful, also you can write yourself Parsers.

<strong>Parsers.number:</strong>
```
function Parsers.number() return a Parser
 
Parser:(value?:string)=>number|undefined

if the value isNaN (can not be a number), it will return an undefined value, 
else it will provide a number value (typeof returnValue==='number').
```

<strong>Parsers.natural:</strong>
```
function Parsers.natural() return a Parser
 
Parser:(value?:string)=>number|undefined

if the value can not be a natural number, it will return an undefined value, 
else it will provide a natural number value (typeof returnValue==='number').
```

<strong>Parsers.integer:</strong>
```
function Parsers.natural() return a Parser
 
Parser:(value?:string)=>number|undefined

if the value can not be a integer, it will return an undefined value, 
else it will provide a integer value (typeof returnValue==='number').
```

<strong>Parsers.string:</strong>
```
function Parsers.string(trim:boolean) return a Parser
 
Parser:(value?:string)=>string

the value will be a string, if you set trim:true the string value will be trimmed.
```

<strong>Parsers.boolean:</strong>
```
function Parsers.boolean() return a Parser
 
Parser:(value?:string)=>boolean|undefined

if the value trimmed is not 'true' or 'false', it will return an undefined value, 
else it will provide a boolean value (typeof returnValue==='boolean').
```

<strong>Parsers.enum:</strong>
```
function Parsers.enum(array:Array<any>) return a Parser
 
Parser:(value?:string)=>any|undefined

if the value trimmed is not included in array, it will return an undefined value, 
else it will return the one in array which matches value by '==' not '==='.
```

<strong>Parsers.array:</strong>
```
function Parsers.array(mapper?: (data: string) => any) return a Parser
 
Parser: (value?: string | Array<string>)=>Array<any>|Array<string>

if the value is string, it will transform to array by string.split, then the array will map with mapper, 
at last the mapped array will filter out the datas to a new array which data is not undefined.
```

<strong>Parsers.regExp:</strong>
```
function Parsers.regExp(regExp: RegExp) return a Parser
 
Parser:(value?:string)=>string|undefined

if the value 'regExp.test(value)' is passed, it will return value, else it will undefined.
```

<strong>Parsers.date:</strong>
```
function Parsers.date(...dateLikeReduces: Array<DateLikeReduce>) return a Parser
 
Parser:(value?:string)=>DateLike|undefined

type DateLike = string | number | Date;

type DateLikeReduce = (dateLike: DateLike) => DateLike

if the value trimmed can be a Date value, it will return a DateLike value, 
which might be produced by dateLikeReduces, else it will return undefined.

here is some dateLikeReduces provided, they can help you use it more quickly:

startOfDay(dateLike: DateLike)=>Date                // DateLike[2020-05-23 12:11:34] => new Date(2020-05-23 00:00:00:000)
endOfDay(dateLike: DateLike)=>Date                  // DateLike[2020-05-23 12:11:34] => new Date(2020-05-23 23:59:59:999)
toDateString(date: DateLike)=>string                // DateLike[2020-05-23 12:11:34] => '2020-05-23'
toDatetimeString(date: DateLike)=>string            // DateLike[2020-05-23 12:11:34] => '2020-05-23 12:11:34'
pattern(pat: string)=>formatDateLike(dateLike: DateLike)=>string
                                                    // pattern('YYYY-MM-DD HH:mm')=>formatter
                                                    // formatter(DateLike[2020-05-23 12:11:34])
                                                    // =>'2020-05-23 12:11'
                                                    
we can use like this:
import {parse,Parsers,startOfDay,pattern} from 'type-qs/libs';

const template={
    start:Parsers.date(startOfDay,pattern('YYYY-MM-DD HH:mm:ss')),
    end:Parsers.date(endOfDay,toDatetimeString)
};

const data=parse('start=2020-01-01%2011%3A11%3A11&end=2020-12-13%2010%3A01%3A18',{template});

/*** result ***/
{
    start:'2020-01-01 00:00:00',
    end:'2020-12-13 23:59:59'
}
```

<strong>Parsers.datePattern:</strong>
```
function Parsers.datePattern(...dateLikeReduces: Array<DateLikeReduce>) return a Parser
 
Parser:(value?:string)=>string|undefined

it is just a wrap on Parsers.date, and returns a 'YYYY-MM-DD' formatted string value or undefined.
```

<strong>Parsers.datetimePattern:</strong>
```
function Parsers.datetimePattern(...dateLikeReduces: Array<DateLikeReduce>) return a Parser
 
Parser:(value?:string)=>string|undefined

it is just a wrap on Parsers.date, and returns a 'YYYY-MM-DD HH:mm:ss' formatted string value or undefined.
```

# summary
if you like this tool, give me a little start, thank you.
