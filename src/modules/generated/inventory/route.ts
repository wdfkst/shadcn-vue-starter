export default {
  path: '/business/inventory',
  name: 'generated-inventory',
  component: () => import('./index.vue'),
  meta: { title: '库存管理', permission: 'inventory:read' },
}
