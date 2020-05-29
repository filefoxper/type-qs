export type Parser = (value?: string|string[]) => any|void;

export type ParseTemplate = {
    [key: string]: ParseTemplate | Parser
} | Parser[];