import type { ModuleDefinition, Field, DataRow } from '@/types/module'
const text = (key: string, label: string, required = true): Field => ({
  key,
  label,
  type: 'text',
  required,
  list: true,
  search: true,
})
const choice = (key: string, label: string, options: string[], dictType?: string): Field => ({
  key,
  label,
  type: 'select',
  options,
  dictType,
  list: true,
  search: true,
  required: true,
})
const status = choice('status', '状态', ['正常', '停用'])
export const systemModules: ModuleDefinition[] = [
  {
    key: 'users',
    title: '用户管理',
    description: '管理系统用户、所属部门和角色。',
    fields: [
      text('username', '用户名'),
      text('name', '姓名'),
      text('email', '邮箱'),
      choice('department', '部门', ['研发部', '运营部', '行政部'], 'sys_department'),
      choice('role', '角色', ['管理员', '普通成员', '只读成员'], 'sys_role'),
      status,
    ],
    seed: Array.from({ length: 24 }, (_, i) => ({
      id: String(i + 1),
      username: i ? 'member' + String(i).padStart(2, '0') : 'admin',
      name: i ? '演示成员 ' + String(i).padStart(2, '0') : '系统管理员',
      email: `demo${i}@example.com`,
      department: ['研发部', '运营部', '行政部'][i % 3]!,
      role: i ? '普通成员' : '管理员',
      status: i === 4 ? '停用' : '正常',
    })),
  },
  {
    key: 'roles',
    title: '角色管理',
    description: '配置角色标识与权限字段；示例登录内置管理员和只读成员两种身份。',
    fields: [
      text('name', '角色名称'),
      text('code', '角色标识'),
      { ...text('permissions', '权限标识'), type: 'textarea' },
      status,
    ],
    seed: [
      { id: '1', name: '管理员', code: 'admin', permissions: '*', status: '正常' },
      { id: '2', name: '只读成员', code: 'viewer', permissions: '*:read', status: '正常' },
    ],
  },
  {
    key: 'menus',
    title: '菜单管理',
    description: '维护导航菜单。侧栏按上级菜单分组，修改后立即生效；停用的菜单不再显示。',
    fields: [
      text('name', '菜单名称'),
      text('parent', '上级菜单', false),
      text('path', '路由地址'),
      text('icon', '图标', false),
      text('permission', '权限标识', false),
      { key: 'order', label: '排序', type: 'number', list: true },
      status,
    ],
    seed: [
      { id: '1', name: '工作台', parent: '概览', path: '/', icon: 'dashboard', order: 1, status: '正常' },
      { id: '2', name: '用户管理', parent: '系统管理', path: '/system/users', icon: 'users', permission: 'users:read', order: 1, status: '正常' },
      { id: '3', name: '角色管理', parent: '系统管理', path: '/system/roles', icon: 'roles', permission: 'roles:read', order: 2, status: '正常' },
      { id: '4', name: '菜单管理', parent: '系统管理', path: '/system/menus', icon: 'menus', permission: 'menus:read', order: 3, status: '正常' },
      { id: '5', name: '部门管理', parent: '系统管理', path: '/system/departments', icon: 'departments', permission: 'departments:read', order: 4, status: '正常' },
      { id: '6', name: '字典管理', parent: '系统管理', path: '/system/dictionaries', icon: 'dictionaries', permission: 'dictionaries:read', order: 5, status: '正常' },
      { id: '7', name: '操作日志', parent: '系统监控', path: '/system/operation-logs', icon: 'operation-logs', permission: 'operation-logs:read', order: 1, status: '正常' },
      { id: '8', name: '登录日志', parent: '系统监控', path: '/system/login-logs', icon: 'login-logs', permission: 'login-logs:read', order: 2, status: '正常' },
      { id: '9', name: '库存管理', parent: '业务模块', path: '/business/inventory', icon: 'box', permission: 'inventory:read', order: 1, status: '正常' },
      { id: '10', name: '页面生成器', parent: '开发工具', path: '/tools/generator', icon: 'generator', permission: 'generator:create', order: 1, status: '正常' },
      { id: '11', name: '个人设置', parent: '其他', path: '/settings', icon: 'settings', order: 1, status: '正常' },
    ],
  },
  {
    key: 'departments',
    title: '部门管理',
    description: '维护部门及上级关系。第一版以列表呈现层级字段。',
    fields: [
      text('name', '部门名称'),
      text('parent', '上级部门', false),
      text('leader', '负责人'),
      { key: 'order', label: '排序', type: 'number', list: true },
      status,
    ],
    seed: ['研发部', '运营部', '行政部'].map((name, i) => ({
      id: String(i + 1),
      name,
      parent: '总公司',
      leader: '演示负责人 ' + (i + 1),
      order: i + 1,
      status: '正常',
    })),
  },
  {
    key: 'dictionaries',
    title: '字典管理',
    description: '统一维护业务选项。用户的部门、角色下拉框读取这里的字典，修改后立即生效。',
    fields: [
      text('type', '字典类型'),
      text('label', '显示名称'),
      text('value', '字典值'),
      { key: 'order', label: '排序', type: 'number', list: true },
      status,
    ],
    seed: [
      { id: '1', type: 'sys_status', label: '正常', value: 'enabled', order: 1, status: '正常' },
      { id: '2', type: 'sys_status', label: '停用', value: 'disabled', order: 2, status: '正常' },
      { id: '3', type: 'sys_department', label: '研发部', value: 'rd', order: 1, status: '正常' },
      { id: '4', type: 'sys_department', label: '运营部', value: 'ops', order: 2, status: '正常' },
      { id: '5', type: 'sys_department', label: '行政部', value: 'admin', order: 3, status: '正常' },
      { id: '6', type: 'sys_role', label: '管理员', value: 'admin', order: 1, status: '正常' },
      { id: '7', type: 'sys_role', label: '普通成员', value: 'member', order: 2, status: '正常' },
      { id: '8', type: 'sys_role', label: '只读成员', value: 'viewer', order: 3, status: '正常' },
    ],
  },
  {
    key: 'operation-logs',
    title: '操作日志',
    description: '只读模拟审计数据。正式审计由后端记录，此页预留查询接口。',
    readOnly: true,
    fields: [
      text('operator', '操作人'),
      text('action', '操作内容'),
      text('ip', '来源 IP'),
      choice('result', '结果', ['成功', '失败']),
      { ...text('time', '操作时间'), type: 'date' },
    ],
    seed: Array.from({ length: 13 }, (_, i) => ({
      id: String(i),
      operator: 'admin',
      action: ['新增用户', '更新字典', '修改角色'][i % 3]!,
      ip: '127.0.0.1',
      result: '成功',
      time: `2026-11-${String(11 - (i % 10)).padStart(2, '0')}`,
    })),
  },
  {
    key: 'login-logs',
    title: '登录日志',
    description: '只读模拟登录记录，不代表真实安全审计。',
    readOnly: true,
    fields: [
      text('username', '用户'),
      text('ip', '来源 IP'),
      text('browser', '浏览器'),
      choice('result', '结果', ['成功', '失败']),
      { ...text('time', '登录时间'), type: 'date' },
    ],
    seed: [
      {
        id: '1',
        username: 'admin',
        ip: '127.0.0.1',
        browser: 'Chrome',
        result: '成功',
        time: '2026-11-11',
      },
    ],
  },
]
export const generatedModules = Object.values(
  import.meta.glob<{ default: ModuleDefinition }>('./generated/*/schema.ts', { eager: true }),
).map((m) => m.default)
export const allModules = [...systemModules, ...generatedModules]
export function modulePath(module: ModuleDefinition) {
  return module.route || `/system/${module.key}`
}
