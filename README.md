# Shadcn Vue Admin Starter

独立的 Vue 3 + Vite + TypeScript 后台模板，参考 shadcn-admin 的 slate 主题、16rem 侧栏、64px 顶栏、组件尺寸和内容区布局。中文界面，默认无多页签。

> 这是可运行的前端首版，不是若依后端的替代品。基础 UI 采用 shadcn-vue 的源码组件组织方式和 Reka UI primitives；不是把 React 组件装进 Vue，也不声称所有组件都由官方 CLI 原样生成。

## 启动

Node.js 22+，本项目已使用 npm 锁文件安装依赖（避免本机 pnpm 11 的自动安装策略冲突）。

```sh
npm install
npm run dev -- --host 127.0.0.1
```

默认 http://localhost:5175

- 管理员：`admin` / `admin123`
- 只读成员：`viewer` / `admin123`

这些账号只在 Mock 模式有效，不可用于生产。退出按钮位于侧栏底部。

```sh
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

## 已实现

- 登录/退出、会话保存、路由和操作按钮权限；只读成员不能调用 Mock 仓储写入方法。
- 响应式侧栏、折叠、深浅主题、内嵌布局偏好、Ctrl/⌘ K 菜单搜索。
- 用户、角色、菜单、部门、字典：列表、关键词/选项查询、分页、列显隐、新增、编辑、详情、删除、当前页/选中行 CSV 导出。
- 只读操作日志/登录日志、个人资料本地保存。
- 可视化模块/字段配置、即时页面预览、代码预览、JSON 导入/导出。
- CLI 真正生成 Vue 模块源码，自动注册路由和侧栏；已附一个实际生成的库存模块。
- Mock 数据保存在 `localStorage`，存储受限时退化到内存；不是跨设备持久化数据库。

## 生成一个页面

1. 在页面生成器配置模块与字段，下载 JSON。
2. 把 JSON 保存到项目外，或者放到 `examples/`。
3. 在项目根目录执行：

```sh
npm run gen -- --config /absolute/path/to/products.json
npm run build
```

支持文本、多行文本、数字、下拉、布尔、日期，以及必填/列表/查询属性。

生成结果：

```text
src/modules/generated/products/
  index.vue   # 页面入口，可以替换成专用业务组件
  schema.ts   # 字段、校验属性、路由/接口元数据
  types.ts    # 字段类型
  api.ts      # 仓储入口，可自定义请求
  mock.ts     # 模拟初始数据
  route.ts    # 路由、权限信息
 generator/products.json # 原始配置存档
```

页面复用 `components/crud/CrudPage.vue`，不是为每个字段复制一整套 CRUD 实现。若要定制复杂交互，可直接改 `index.vue`、schema 和 API。当前版本不生成独立 form/detail 文件，表单/详情由通用组件渲染。重复生成会报错；不会合并、覆盖、删除手写代码。路径穿越、已存在目标和符号链接父目录会被拒绝。仅在可信本地项目目录运行 CLI，不支持多人并发写入同一目录。

库存示例已经生成，再运行 `examples/inventory.json` 会明确拒绝，而不是覆盖。

## 接入后端

复制 `.env.example` 为 `.env.local`，设置：

```dotenv
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://your-api.example/api
```

重启 Vite。API 模式请求失败时不会回退到 Mock。

接口约定：
- `POST /auth/login`，body `{username,password}`；返回 `{token,user:{username,role:'admin'|'viewer'}}`。
- `GET /users` 等集合接口；params `{query,filters,page,pageSize}`（Axios 对 filters 使用嵌套 query 参数）。返回 `{items:[{id,...fields}],total}`。
- `POST /users` 返回创建后的记录。
- `PUT /users/:id` 返回更新后的记录。
- `DELETE /users/:id` 返回 2xx。
- 错误返回 `{message}`；token 通过 `Authorization: Bearer ...` 发送。

生产需要由后端授权、校验、审计和管理会话；本地 token 存储仅是接入示例，真实项目应按安全架构选用 HttpOnly Cookie/BFF 等机制。当前没有刷新 token/自动续期，401 会显示错误。

## 已知边界（不要把示例当成完整若依）

- 角色/菜单/部门/字典是可编辑 CRUD 示例：修改角色权限字段不会改变内置 admin/viewer 权限；编辑菜单不会改写导航。导航由模块注册生成，后端动态 RBAC/菜单树尚未实现。
- 部门当前为带上级字段的平面列表，没有树形编辑/循环关系校验。
- 字典模块与生成器下拉选项尚未动态绑定；生成字段使用独立选项。
- 日志是明确标注的模拟数据，不记录或声称具有生产级可信审计。
- CSV 导出仅当前页或当前页勾选行；暂不支持服务器全量导出、批量删除、排序、文件上传。
- 布局视觉基于原项目，业务页面/首页内容为新实现，并非每个 React 页面逐像素复制；没有原项目全部主题/字体/RTL配置。
- 没有后端、数据库解析、数据库代码生成、多租户、工作流或生产认证服务。

## 目录

`layouts/` 布局；`pages/` 页面；`components/ui/` 基础组件；`components/crud/` 通用增删改查；`modules/` 内置和生成模块；`lib/repository.ts` 仓储/HTTP 切换；`stores/` 会话/偏好；`generator/` 浏览器与CLI共用校验/模板；`cli/` 安全写入。

## 验证

`npm test` 验证权限、存储异常、CRUD 校验、生成配置/源代码转义、SFC编译、路径逃逸/符号链接/覆盖保护。实际浏览器已验证登录、用户增删改查、生成预览与配置下载、生成库存路由、viewer操作限制/403、主题与移动侧栏。

原项目参考及版权见 `LICENSE`。没有修改原 React 项目的业务代码。
