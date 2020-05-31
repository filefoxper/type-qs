export type Parser = (value?: string|string[]) => any|void;

export type Template = {
    [key: string]: Template | Parser
} | Parser[];