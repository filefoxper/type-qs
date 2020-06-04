import {stringify,parse} from '../src';
import {Parsers} from '../src';
import {endOfDay, getTime, startOfDay, toDatetimeString} from "../src/libs";

describe('parse', () => {

    type Data = {
        id: number,
        name: string,
        active: boolean,
        role: 'GUEST' | 'USER' | 'MASTER' | 'ADMIN'
    }

    const source: Data = {
        id: 123456,
        name: 'jimmy ',
        active: true,
        role: 'MASTER'
    };

    const search = stringify(source);

    test('stringify before equals parse after', () => {

        const template = {
            id: Parsers.natural(),
            name: Parsers.string(),
            active: Parsers.boolean(),
            role: Parsers.enum(['GUEST', 'USER', 'MASTER', 'ADMIN'])
        };

        const target = parse<Data>(search, {template});

        expect(target).toEqual(source);
    });

    test('omit property "role"', () => {
        const template = {
            id: Parsers.natural(),
            name: Parsers.string(true),
            active: Parsers.boolean()
        };

        const target = <Data>parse(search, {template});

        expect(target.role).toBeUndefined();
    });

    test('with defaults', () => {

        const template = {
            id: Parsers.natural(),
            name: Parsers.string(true),
            active: Parsers.boolean(),
            role: Parsers.enum(['GUEST', 'USER'])
        };

        const defaults = {
            role: 'GUEST'
        };

        const target = <Data>parse(search, {template, defaults});

        expect(target.role).toBe(defaults.role);
    });

    test('deep matches', () => {
        type DataGroup = Data & {
            group: {
                id: number,
                name: string,
                active: boolean,
                type: string
            }
        };
        const group = {
            id: 654321,
            name: 'crm',
            active: true,
            type: 'DEVELOPER'
        };
        const s: DataGroup = {...source, group};
        const search = stringify(s);
        const template = {
            id: Parsers.natural(),
            name: Parsers.string(),
            active: Parsers.boolean(),
            role: Parsers.enum(['GUEST', 'USER', 'MASTER', 'ADMIN']),
            group: {
                id: Parsers.natural(),
                name: Parsers.string(),
                active: Parsers.boolean(),
                type: Parsers.enum(['DEVELOP', 'PRODUCE'])
            }
        };
        const defaults = {
            group: {
                type: 'DEVELOP'
            }
        };
        const target = parse<DataGroup>(search, {template, defaults});
        const wantTo = {...source, group: {...group, type: defaults.group.type}};
        expect(target).toEqual(wantTo);
    });

});

describe("Parsers", () => {

    test('Parsers.string', () => {

        type NameQuery = { name: string };

        const query: NameQuery = {
            name: ' jimmy '
        };

        const search = stringify(query);
        //with out trim
        expect(parse<NameQuery>(search, {template: {name: Parsers.string()}}).name).toBe(query.name);
        //with trim
        expect(parse<NameQuery>(search, {template: {name: Parsers.string(true)}}).name).toBe(query.name.trim());
    });

    test('Parsers.number', () => {

        type PriceQuery = { price: number };

        const query: PriceQuery = {
            price: 12.34
        };

        const search = stringify(query);
        expect(parse<PriceQuery>(search, {template: {price: Parsers.number()}}).price).toBe(12.34);
    });

    test('Parsers.natural', () => {
        type IdPriceQuery = { id: number, price: number };

        const query: IdPriceQuery = {
            id: 123456,
            price: 12.34
        };

        const search = stringify(query);
        //price is not a natural number
        expect(parse<IdPriceQuery>(search, {template: {price: Parsers.natural()}}).price).toBeUndefined();
        //id is a natural number
        expect(parse<IdPriceQuery>(search, {template: {id: Parsers.natural()}}).id).toBe(query.id);
    });

    test('Parsers.integer', () => {
        type Integer = { count: number };

        const query: Integer = {
            count: -2
        };

        const search = stringify(query);

        const naturalTemplate = {
            count: Parsers.natural()
        };
        //count is not a natural number
        expect(parse<Integer>(search, {template: naturalTemplate}).count).toBeUndefined();

        const integerTemplate = {
            count: Parsers.integer()
        };
        //count is a integer number
        expect(parse<Integer>(search, {template: integerTemplate}).count).toBe(-2);
    });

    test('Parsers.boolean', () => {
        type Boolean = { active: boolean };

        const query: Boolean = {
            active: false
        };

        const search = stringify(query);

        const template = {
            active: Parsers.boolean()
        };
        expect(parse<Boolean>(search, {template}).active).toBe(false);
    });

    test('Parsers.enum', () => {
        type Role = { role: string };

        const query: Role = {
            role: 'MASTER'
        };

        const search = stringify(query);

        const template = {
            role: Parsers.enum(['GUEST', 'USER', 'MASTER', 'ADMIN'])
        };
        expect(parse<Role>(search, {template}).role).toBe('MASTER');

        type SourcePageSize = { pageSize: string };

        type PageSize={pageSize:number};

        const pageSizeQuery: SourcePageSize = {pageSize: '10'};

        const pageSizeSearch = stringify(pageSizeQuery);

        const pageSizeTemplate={
            pageSize: Parsers.enum([10,20,30])
        };

        expect(parse<PageSize>(pageSizeSearch,{template:pageSizeTemplate}).pageSize).toBe(10);
    });

    test('Parses.array',()=>{
        type Query={array:Array<number>};
        const array:Array<string>=['1','2','3'];
        const query={
            array
        };
        const search=stringify(query);
        const template={
            array:Parsers.array(Parsers.natural())
        };
        expect(parse<Query>(search,{template}).array).toEqual([1,2,3]);
        expect(parse<Query>('array=1,2,3',{template}).array).toEqual([1,2,3]);
    });

    test('Parsers.date',()=>{
        type Query={start:string,end:string};
        const query={
            start:'2020/01/11 11:11:11',
            end:new Date('2020/12/11 11:11:11').getTime()
        };
        const search=stringify(query);
        const template={
            start:Parsers.date(startOfDay,toDatetimeString),
            end:Parsers.date(endOfDay,toDatetimeString)
        };
        expect(parse<Query>(search,{template}).start).toBe('2020-01-11 00:00:00');
        expect(parse<Query>(search,{template}).end).toBe('2020-12-11 23:59:59');
    });

    test('Parsers.regExp',()=>{
        type Query={reg:string};
        const query={
            reg:'<abc>'
        };
        const search=stringify(query);
        const template={
            reg:Parsers.regExp(/\<.*\>/)
        };
        expect(parse<Query>(search,{template}).reg).toBe('<abc>');
    });

});