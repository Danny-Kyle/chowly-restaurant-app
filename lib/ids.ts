import { randomUUID } from 'node:crypto'

// Opaque text IDs preserve the existing schema without reading a shared counter.
export async function nextId(prefix: string): Promise<string> {
  return `${prefix}${randomUUID().replaceAll('-', '')}`
}
