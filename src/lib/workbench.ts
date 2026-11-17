import type { NavItem } from './system-data'

type Can = (permission: string) => boolean

export interface WorkbenchModule {
  key: string
  title: string
  description?: string
  route: string
  fieldCount: number
  source: 'generated' | 'published'
}

// Shortcuts are the visible navigation entries minus the workbench itself and
// paths listed elsewhere on the page, so a disabled menu row or a missing
// permission hides the card as it hides the menu.
export function workbenchShortcuts(
  navigation: NavItem[],
  can: Can,
  exclude: string[] = [],
  limit = 6,
): NavItem[] {
  return navigation
    .filter(
      (item) =>
        item.path !== '/' &&
        !exclude.includes(item.path) &&
        (!item.permission || can(item.permission)),
    )
    .slice(0, limit)
}

// Business modules come from generated source and AI-published configs. A
// published config overriding a generated key is listed once, as published.
export function workbenchModules(
  generated: { key: string; title: string; description?: string; route?: string; fields: unknown[] }[],
  published: { key: string; title: string; description?: string; route: string; fields: unknown[] }[],
  can: Can,
): WorkbenchModule[] {
  const rows = new Map<string, WorkbenchModule>()
  for (const m of generated)
    if (m.route)
      rows.set(m.key, { ...pick(m), route: m.route, source: 'generated' })
  for (const m of published) rows.set(m.key, { ...pick(m), route: m.route, source: 'published' })
  return [...rows.values()].filter((m) => can(m.key + ':read'))
}

function pick(m: { key: string; title: string; description?: string; fields: unknown[] }) {
  return { key: m.key, title: m.title, description: m.description, fieldCount: m.fields.length }
}
