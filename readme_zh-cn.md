[![npm][npm-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/type-qs.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/type-qs
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

#type-qs (稳定版) 1.2.3

# 问题
通常在解析location.<strong>search</strong>（?及后续由&符号链接的字符串）的时候，我们会搬出类似[qs](https://www.npmjs.com/package/qs)、
[query-string](https://www.npmjs.com/package/query-string)这些解析神器来把它们转成如下形式。
```
{[key:string]:string|string[]|undefined}
比如：
'?id=123456&name=jimmy&page=abc&active=true'
转成
{
    id:'123456',
    name:'jimmy',
    page:'abc', //可能会引起应用问题
    active:'true'
}
```
这些工具能把一段location.<strong>search</strong>转成这样一个object，这是一个很棒的功能。
但在上面这个例子中我们可能更希望这些解析出来的数据具备类型，以便我们可以直接用到渲染组件中去。
另外由于location对应的整个url在浏览器上是可以由用户随意修改的，
所以用户可能会修改<strong>search</strong>，并给你的应用输入一些错误（可能致命）的信息，比如上例中的<strong>page:'abc'</strong>。
当你直接带这page='abc'的数据状态去渲染分页器组件的时候，分页器能开心吗？如果你直接把这段数据发送给后端服务器，服务器能消化吗？

### 问题总结
1. 所有数据都是字符串，不方便渲染、请求以及数据处理。
2. 缺少校验，可能引入致命错误。

# 解决
针对以上问题，对qs进行一个简单的升级，让它的解析数据具备类型甚至错误矫正功能，这就是type-qs了。type-qs引用了以下包和技术：
1. [qs](https://www.npmjs.com/package/qs)
2. [type-query-parser](https://www.npmjs.com/package/type-query-parser)

并导出支持：
1. [typescript](https://www.npmjs.com/package/typescript)

虽然在[typescript](https://www.npmjs.com/package/typescript)环境下使用体验最好，但并不代表，离开typescript它就用不了了。

### 与[qs](https://www.npmjs.com/package/qs)的用法区别
1. type-qs在qs parse方法的第二个参数option中增加了template（解析器模版）和defaults（解析值为undefined时可取的默认值）字段

# 例子
校验及类型转化
```js
import {parse,Parsers} from 'type-qs';

...
const template={                    //解析模版
    id:Parsers.natural(),           //自然数解析器 0,1,2,3, ...... 当前字符串必须能解析成自然数，否则返回undefined
    name:Parsers.string(true),      //字符串解析器，如果传入参数true，最终结果中当前字段值为trim过的字符串
    active:Parsers.boolean(),       //布尔解析器，如果字符串数据是'true'或'false'，则被解析成对应的布尔值，否则为undefined
    role:Parsers.enum(['GUEST','USER','MASTER','ADMIN']),
                                    //枚举规范器，规定字符串在枚举数组中有值==（注意不是===），并返回枚举中==的值，如找不到，返回undefined
    page:Parsers.natural()          //自然数解析器, 注意，因为被解析字符串中的page=abc,并非自然数，所以自然数解析器返回undefined
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
校验失败使用默认数据
```js
import {parse,Parsers} from 'type-qs';

...
const template={
    id:Parsers.natural(),           
    name:Parsers.string(true),      
    active:Parsers.boolean(),       
    role:Parsers.enum(['GUEST','USER','MASTER','ADMIN']),
                                    
    page:Parsers.natural()          
};
const defaults={
    role:'GUEST',                   //注意：url中role=MASTERR（不是MASTER），在枚举数据中找不到，所以本该返回undefined 
                                    //但遇到了好心的默认数据，所以最终结果为默认数据GUEST
    page:1                          //page也遇到了默认数据，所以变成了1
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
截取关心数据（只有在parse option.template中出现过的key才能被解析至最终结果）
```js
import {parse,Parsers} from 'type-qs';

...
const template={
    ids:Parsers.array(),    //数组解析器，会把字符串split成字符串数组，或直接转接内部qs产生的字符串数组
}

const query=parse('ids=1%2C2%2C3&useless=123',{template,defaults:{useless:'123'}}); 
//ids=1,2,3&useless=123
...
console.log(query);

/*** result ***/
{
    ids:['1','2','3']
}                                   //key 'useless'并没有出现在最终结果中，因为我们没有在模版中描述它，所以，被忽略了
```
把字符串类型数组转成其他类型的数组（Parsers.array(mapper?:(value:string)=>any)）
```js
import {parse,Parsers} from 'type-qs';

...
const template={
    ids:Parsers.array(Parsers.natural()), //Parsers.natural()返回的是一个方法（返回方法描述：(value?:string)=>number），
                                          // 该方法的作用与array.map的入参方法作用相同（数据映射）
}

const query=parse('ids=1%2C2%2C3',{template}); //the url like ids=1,2,3
...
console.log(query);

/*** result ***/
{
    ids:[1,2,3]
}                 
```
自定义Parser:(value?:string|string[])=>any
```js
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
嵌套对象解析
```js
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
时间解析
```js
import {parse,Parsers} from 'type-qs';
import {startOfDay,pattern} from 'type-qs/libs';

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
# api
#### function parse<T>(search: string, opt?: IParseOptions & { defaults?: any, template?: Template }): T | ParsedQs

1. search：url参数，比如：window.location.search
2. option：配置项

option结构如下：

template:Template，可选项，如不配置，则失去类型转化功能
```js
type Parser = (value?: string|string[]) => any|void;    //解析方法，入参为当前解析得到的原字符串

type Template = {
    [key: string]: Template | Parser                    //解析模版，由解析方法或子解析模版构成，key为需要解析的字段名
} | Parser[];
```
defaults:any，可选项，如设置了template，在解析值某项为undefined时，解析器会尝试到defaults的同路径下获取默认值

其他:IParseOption，可参考[qs api](https://www.npmjs.com/package/qs)中parse方法的选项

#### function stringify(obj: any, opt?: IStringifyOptions): string

参考[qs api](https://www.npmjs.com/package/qs)中stringify方法

# Parsers默认解析器

系统默认提供了一套基础类型解析器，大家可以直接使用

#### Parsers.number():(value?:string)=>number|undefined
返回一个数字解析器，解析js中可以转换为number的类型，如：'1','1.2'......

如不能转为数字类型则返回undefined

#### Parsers.natural():(value?:string)=>number|undefined
返回一个自然数解析器，解析自然数形态，如：'0','1','2'......

如不能转为自然数则返回undefined

#### Parsers.integer():(value?:string)=>number|undefined
返回一个整数解析器，解析整数形态，如：'-1','0','1','2'......

如不能转为自然数则返回undefined

#### Parsers.string(trim?:boolean):(value?:string)=>string
返回一个字符串解析器

如value为undefined返回空字符串，否则根据trim的设置来决定是否去字符串的前后空格

#### Parsers.boolean():(value?:string)=>boolean|undefined
返回一个布尔解析器,'true'|'false'

如不能转为boolean则返回undefined

#### Parsers.enum((array:Array<any>):(value?:string)=>any|undefined
返回一个枚举解析器，必须以数组形式列举枚举范围，如
1. [1,'B']=>'1'，则解析为1，
2. [1,'B']=>'B'，则解析为'B'，
3. [1,'B']=>'2'，则解析为undefined

#### Parsers.array(mapper?: (data: string) => any):(value?: string | Array<string>)=>Array<any>|Array<string>
返回一个数组解析器，可通过mapper对解析出的字符串数组做map操作

如：'1,2,3'=>['1','2','3']，若使用mapper，如：Parsers.array(Parsers.natural())，则解析为[1,2,3]

#### Parsers.regExp(regExp: RegExp):(value?:string)=>string|undefined
返回一个正则表达式解析器，可通过配置regExp正则表达式来判断是否时原字符串还是undefined

#### Parsers.date(...dateLikeReduces: Array<DateLikeReduce>):(value?:string)=>DateLike|undefined
type DateLike = string | number | Date;

type DateLikeReduce = (dateLike: DateLike) => DateLike;

返回一个类Date类型解析器，可解析如：'YYYY-MM-DD'||'YYYY-MM-DD HH:mm:ss'||'1591258358051'这一类可转为Date类型的数据。

1. 若字符串不能转成<strong>Date</strong>类型数据，则返回undefined。
2. 若没有使用<strong>dateLikeReduces</strong>，则返回<strong>Date</strong>类型数据。
3. 若使用<strong>dateLikeReduces</strong>，则根据dateLikeReduces顺序执行得到最终的<strong>DateLike</strong>结果。

在type-qs/libs库中提供了一些默认DateLikeReduce：

1. startOfDay(dateLike: DateLike)=>Date; 每日开始时间，如：new Date('2020-03-12 00:00:00')[ms:000]
2. endOfDay(dateLike: DateLike)=>Date; 每日结束时间，如：new Date('2020-03-12 23:59:59')[ms:999]
3. toDateString(date: DateLike)=>string; 标准日期字符串，如：'2020-03-12'
4. toDatetimeString(date: DateLike)=>string; 标准日期时间字符串，如：'2020-03-12 12:11:08'
5. pattern(pat: string)=>formatDateLike(dateLike: DateLike)=>string; 
自定是时间格式字符串，<strong>注意：它调用返回的方法才是DateLikeReduce</strong>

```js
import {parse,Parsers} from 'type-qs';
import {startOfDay,pattern,endOfDay,toDatetimeString} from 'type-qs/libs';

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
#### Parsers.datePattern(...dateLikeReduces: Array<DateLikeReduce>):(value?:string)=>string|undefined
Parsers.date的扩展方法，返回的是标准日期格式化后的字符串数据'YYYY-MM-DD'或undefined

#### Parsers.datetimePattern(...dateLikeReduces: Array<DateLikeReduce>):(value?:string)=>string|undefined
Parsers.date的扩展方法，返回的是标准日期时间格式化后的字符串数据'YYYY-MM-DD HH:mm:ss'或undefined

#总结
如果觉得对您有帮助的话，请动动手，给个小星星呗。