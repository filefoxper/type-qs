export type Parser = (value?: (string|string[])) => any|void;

export interface ParsedQs { [key: string]: undefined |null|{}| string | string[] | ParsedQs | ParsedQs[] }

export type Template = {
    [key: string]: Template | Parser
} | Parser[];