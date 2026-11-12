import type { Field } from '@/types/module'
export interface GeneratorConfig {key:string;title:string;description?:string;route:string;fields:Field[]}
export function validateConfig(input:unknown):GeneratorConfig
export function generateFiles(input:unknown):Record<string,string>
