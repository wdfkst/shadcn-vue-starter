import { getRepository } from '@/lib/repository'
import module from './schema'
// Customize HTTP behavior here; mock/API switching is centralized.
export const api = getRepository(module)
