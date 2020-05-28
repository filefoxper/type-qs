export type Parser = (value?: string|string[]) => any|void;

export type ParseConfig = {
    [key: string]: ParseConfig | Parser
} | Parser[]

export {ParsedQs} from 'qs';