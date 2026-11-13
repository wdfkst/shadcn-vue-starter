# AI 对话生成模块并发布 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在页面生成器里通过 AI 对话生成模块配置，预览后发布到本地即可使用；所有模块共用 Excel 导入导出。

**Architecture:** AI 只产出 `GeneratorConfig` JSON，由现有 zod schema 校验；Vite 开发服务器插件转发 OpenAI 格式请求，API key 不进浏览器。已发布配置存在 localStorage 的一个响应式 ref 中，一条共用路由 `/business/:slug` 按完整路径查配置并用 `CrudPage` 渲染。Excel 能力放在 `src/lib/excel.ts`，只依赖 `ModuleDefinition`。

**Tech Stack:** Vue 3、vue-router 4、Pinia 3、zod 3、Vite 6、vitest 3、exceljs 4.4.0（MIT）。

**Spec:** `docs/superpowers/specs/2026-11-13-ai-module-publish-design.md`

## Global Constraints

- 工作目录 `D:\zw\shadcn-admin-vue\shadcn-vue-starter`，分支 `feat/system-linkage`。
- 不引入 npm 上的 `xlsx`；Excel 只用 `exceljs@4.4.0`。
- AI 配置读 `.env.local` 的 `AI_BASE_URL`、`AI_MODEL`、`AI_API_KEY`（无 `VITE_` 前缀）；`.env.example` 只写空占位。
- 转发接口路径 `POST /__ai/chat`，入参 `{ messages: {role, content}[] }`，返回 `{ content: string }`；只接受 `127.0.0.1` / `::1`；请求体上限 100KB；上游超时 60 秒；不记录内容。
- AI 校验失败自动重试最多 2 次（共 3 次请求）。
- localStorage 键：已发布配置 `admin-published-modules`；模块数据仍为 `admin-data:<key>`。
- 发布菜单行：`id` = `published-<key>`，`parent` = `业务模块`，`permission` = `<key>:read`，`status` = `正常`。
- 发布、下线和 `/business/:slug` 只在 mock 模式（`import.meta.env.VITE_USE_MOCK !== 'false'`）启用；非 mock 显示"发布需要后端支持，当前为接口模式"。
- 导入上限 5000 行、文件 5MB；布尔列接受 是/否/true/false/1/0/空，其他报"只能填写是或否"。
- 每个任务结束前 `npx vitest run` 与 `npx vue-tsc -b` 都必须通过。
- 用户可见文案用中文；提交信息末尾加 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。

## Review Focus

- Excel 表头带首尾空格或列顺序被调整：按去空格后的中文名匹配，与顺序无关（Task 2 测试）。
- 导入文件末尾有空行（内容被删但行仍存在）：完全为空的行跳过，不计入行数也不报错（Task 2 测试）。
- 单元格是公式、富文本或超链接对象（exceljs 返回对象而非字符串）：取其结果文本，不出现 `[object Object]`（Task 2 测试）。
- 文本列填了以 0 开头的号码：模板把文本列设为文本格式；读到 number 时转字符串（Task 2 测试）。
- 重新发布时字段被删或改类型，已有数据行出现多余字段或类型不匹配：数据保留不迁移，编辑保存时多余字段丢弃、类型不匹配要求修正；发布确认框提示"修改字段可能影响已有数据"（Task 5）。
- 导入中途某一行写入失败（权限变化或存储满）：停止并提示"已导入 X 行，第 Y 行失败：原因"，已写入的行保留（Task 3）。
- AI 回复把 JSON 包在说明文字或 ```json 代码块里：能提取出第一个完整 JSON 对象（Task 6 测试）。

---

### Task 1: 校验改为收集全部错误

**Files:**
- Modify: `src/lib/repository.ts`（`validateRecord` 附近）
- Test: `tests/core.test.ts`

**Interfaces:**
- Consumes: `ModuleDefinition`、`systemRows.dictionaries`（select 的 `dictType` 仍由 `validateRecord` 内部读取）
- Produces: `collectRecordErrors(module: ModuleDefinition, input: Record<string, unknown>): { values: Omit<DataRow, 'id'>; errors: string[] }`，从 `src/lib/repository.ts` 导出。`validateRecord` 改为调用它，`errors` 非空时抛出 `errors[0]`，返回 `values`。错误文案保持现有：`不能为空`、`必须是有效数字`、`选项无效`、`必须是有效日期`。

- [ ] **Step 1: 写失败测试**

在 `tests/core.test.ts` 增加：

```ts
it('collects every field error instead of the first', async () => {
  const { collectRecordErrors } = await import('../src/lib/repository')
  const result = collectRecordErrors(
    {
      ...module,
      fields: [
        ...module.fields,
        { key: 'day', label: '日期', type: 'date' as const, list: true },
      ],
    },
    { name: '  ', price: 'abc', day: '2026-13-40' },
  )
  expect(result.errors).toEqual(['名称不能为空', '价格必须是有效数字', '日期必须是有效日期'])
  expect(() => validateRecord(module, { name: '', price: 1 })).toThrow('名称不能为空')
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/core.test.ts -t "collects every"`
Expected: FAIL，`collectRecordErrors` 未导出。

- [ ] **Step 3: 实现**

把 `validateRecord` 的循环体抽到 `collectRecordErrors`：字段错误 `push` 进 `errors` 而不是 `throw`，其余逻辑不变；`validateRecord` 调用它并在有错误时抛第一条。

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run tests/core.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/repository.ts tests/core.test.ts
git commit -m "refactor: collect all record validation errors"
```

### Task 2: Excel 导入导出纯逻辑

**Files:**
- Create: `src/lib/excel.ts`
- Test: `tests/excel.test.ts`
- Modify: `package.json`（安装 `exceljs@4.4.0`）

**Interfaces:**
- Consumes: `collectRecordErrors`（Task 1）、`ModuleDefinition`
- Produces:
  - `exportRows(module: ModuleDefinition, rows: DataRow[], extra?: { header: string; values: string[] }): Promise<Blob>`
  - `templateWorkbook(module: ModuleDefinition): Promise<Blob>`
  - `parseWorkbook(module: ModuleDefinition, file: ArrayBuffer): Promise<{ rows: { values: Record<string, unknown>; errors: string[] }[]; error?: string }>`
  - 导出列只含 `list !== false` 的字段，顺序与 `module.fields` 一致；表头为字段 `label`。
  - 布尔值导出为"是/否"；日期导出为文本。
  - `parseWorkbook` 整体错误时 `error` 有值、`rows` 为空；行级错误放 `rows[i].errors`。

- [ ] **Step 1: 安装依赖**

Run: `npm install exceljs@4.4.0`

- [ ] **Step 2: 写失败测试**

`tests/excel.test.ts` 用 `exceljs` 的 `Workbook` 构造输入，断言：

- 导出再解析往返：含文本、数字、布尔、日期、select 的一行，`values` 与原值一致，`errors` 为空。
- 表头缺失一个字段：`error` 包含"表头"。
- 表头列顺序打乱、带首尾空格：仍正确映射。
- 一行同时缺必填、数字非法、日期非法：`errors` 含三条。
- 布尔列填"abc"：`errors` 含"只能填写是或否"；"是/否/true/false/1/0/空"都通过。
- 末尾空行：不出现在 `rows` 里。
- 5001 行：`error` 包含"5000"。
- 文本列单元格为 number `1`（模拟前导零丢失）：`values` 里是字符串 `"1"`。
- 单元格为 `{ result: '计算值' }` 与 `{ text: '链接' }`：取值"计算值"/"链接"。
- 日期单元格为 `Date`（本地 2026-11-13）：值为 `'2026-11-13'`。

- [ ] **Step 3: 运行确认失败**

Run: `npx vitest run tests/excel.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 4: 实现 `src/lib/excel.ts`**

用 exceljs 读写。`templateWorkbook` 另建"填写说明"工作表，每字段一行：名称、类型、是否必填、可选值（`dictType` 字段的可选值由调用方传入：`templateWorkbook` 增加第二个参数 `optionsOf: (field: Field) => string[]`，调用方决定来源）。文本列整列 `numFmt = '@'`。`exportRows` 的 `extra` 存在时在末尾追加一列，表头 `extra.header`，第 i 行取值 `extra.values[i] ?? ''`。单元格取值：`Date` 转本地 `YYYY-MM-DD`；对象取 `result` 或 `text` 或 `richText` 拼接；其余 `String`。空行（所有单元格空）跳过。行数在跳过空行后判断 5000 上限。每行先做布尔转换再调用 `collectRecordErrors`。

- [ ] **Step 5: 运行确认通过**

Run: `npx vitest run tests/excel.test.ts`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add src/lib/excel.ts tests/excel.test.ts package.json package-lock.json
git commit -m "feat: excel import and export for modules"
```

### Task 3: 全量查询与 CrudPage 导入导出

**Files:**
- Modify: `src/lib/repository.ts`（`createMemoryRepository.list`）
- Modify: `src/components/crud/CrudPage.vue`
- Test: `tests/core.test.ts`

**Interfaces:**
- Consumes: `exportRows`、`templateWorkbook`、`parseWorkbook`（Task 2）
- Produces: `createMemoryRepository` 的 `list` 在 `pageSize` 为 0 时返回全部匹配行。

- [ ] **Step 1: 写失败测试**

```ts
it('returns every match when pageSize is 0', async () => {
  const repo = createMemoryRepository(module, [
    { id: '1', name: 'a', price: 1 },
    { id: '2', name: 'b', price: 2 },
  ])
  expect((await repo.list({ pageSize: 0 })).items).toHaveLength(2)
  expect((await repo.list({ pageSize: 1 })).items).toHaveLength(1)
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/core.test.ts -t "pageSize is 0"`
Expected: FAIL（当前 `Math.max(1, ...)` 把它变成 1）

- [ ] **Step 3: 实现 list 改动**

`pageSize` 为 0 时不分页，其余逻辑不变。

- [ ] **Step 4: 改 CrudPage 界面**

头部按钮区：删除 `csv()` 与"导出当前页"按钮，换成 `DropdownMenu`（`src/components/ui/dropdown-menu` 已有），菜单项：导出全部、导出筛选结果、下载导入模板、导入数据。

- 导出全部 / 导出筛选结果：`repo.list({ query, filters, pageSize: 0 })` 取行，`exportRows` 生成 Blob 后触发下载，文件名 `<key>.xlsx`。非 mock 模式（`import.meta.env.VITE_USE_MOCK === 'false'`）这两项 `disabled`，title 为"接口模式暂不支持全量导出"。
- 下载导入模板：`templateWorkbook(module, (f) => system.options(f.dictType ?? '') 或 f.options)`。
- 导入数据：仅 `can('create')` 时渲染。`<input type="file" accept=".xlsx">`，文件超过 5MB 直接提示。解析后打开一个 `Dialog`：顶部"共 N 行，M 行有误"；表格每行显示值，错误行加 `text-destructive` 并在末列显示 `errors.join('；')`；按钮"导入 N 行有效数据"（无有效行时禁用）、"导出错误行"、"取消"。确认后按顺序 `repo.create`，中途失败则停止并提示"已导入 X 行，第 Y 行失败：原因"，已写入的行保留不回滚。"导出错误行"调用 `exportRows` 并传第三参 `extra`，末尾追加"错误原因"列，值为 `errors.join('；')`。
- 整体解析错误（`error` 有值）不打开表格，直接在页面 `error` 区显示。

- [ ] **Step 5: 验证**

Run: `npx vitest run && npx vue-tsc -b`
Expected: 全部通过。然后用浏览器打开一个内置模块（如 `/system/dictionaries`），确认下拉菜单四项存在、模板能下载、导入一个错误行能标红。

- [ ] **Step 6: 提交**

```bash
git add src/lib/repository.ts src/components/crud/CrudPage.vue tests/core.test.ts
git commit -m "feat: excel import and export on every module page"
```

### Task 4: 已发布模块的存储

**Files:**
- Create: `src/lib/published.ts`
- Test: `tests/published.test.ts`

**Interfaces:**
- Consumes: `validateConfig`（`src/generator/core.mjs`）、`systemRows.menus`、`readLocal`/`writeLocal`
- Produces（全部从 `src/lib/published.ts` 导出）:
  - `PUBLISHED_KEY = 'admin-published-modules'`
  - `publishedModules: Ref<GeneratorConfig[]>`，初始值经 `validateConfig` 逐条过滤（坏数据丢弃）。
  - `menuRowFor(config: GeneratorConfig): DataRow`，返回 `{ id: 'published-' + config.key, name: config.title, parent: '业务模块', path: config.route, permission: config.key + ':read', order: 100, status: '正常', icon: 'box' }`。
  - `publishModule(config: GeneratorConfig, ctx: PublishContext): PublishResult`
  - `unpublishModule(key: string): void`
  - 类型：`PublishContext = { menus: DataRow[]; reservedKeys: string[]; reservedRoutes: string[] }`；`PublishResult = { ok: true } | { ok: false; reason: string }`。

`publishModule` 规则：key 命中 `reservedKeys` 或（非自身重新发布时）已发布列表 → `reason` "模块标识已被占用"；route 命中 `reservedRoutes` 或已发布模块的 route（自身除外）→ "路由地址已被占用"。通过则写入 `publishedModules`（同 key 覆盖）并调用 `writeLocal`，返回 `false` 时 `reason` 为"本地存储已满，发布失败"且不改内存状态。菜单行的增删由调用方做（保持此模块不依赖 Pinia）。

`unpublishModule` 只从 `publishedModules` 删除并持久化，不碰 `admin-data:<key>`。

- [ ] **Step 1: 写失败测试**

覆盖：坏数据被过滤；`menuRowFor` 的字段值；key 冲突、route 冲突、重新发布同一 key 成功、存储失败时内存不变；下线后配置消失。`writeLocal` 用 mock（`vi.mock`）控制返回值。

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/published.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现 `src/lib/published.ts`**

按接口实现。ref 的变更 `watch` 深度持久化，与 `useSystemRows` 相同的写法。

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run tests/published.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/published.ts tests/published.test.ts
git commit -m "feat: storage for published module configs"
```

### Task 5: 路由与菜单接入

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/pages/GeneratorPage.vue`（发布/下线区，对话面板在 Task 7）
- Test: `tests/published.test.ts`（追加守卫规则的纯函数测试）

**Interfaces:**
- Consumes: `publishedModules`、`publishModule`、`unpublishModule`、`menuRowFor`（Task 4）
- Produces: 路由 `/business/:slug`；守卫对已发布路径按 `<key>:read` 兜底。

- [ ] **Step 1: 抽守卫决策为纯函数并写测试**

在 `src/lib/published.ts` 增加 `publishedPermission(path: string, configs: { key: string; route: string }[]): string`，命中返回 `<key>:read`，否则返回空串。测试：命中、不命中、route 大小写不一致时不命中。

把 `src/router/index.ts` 里守卫的权限计算改为：菜单行权限 ?? `publishedPermission(to.path, publishedModules.value)` ?? `meta.permission`。

- [ ] **Step 2: 加路由**

`/business/:slug` 放在 `...generated` 之后、`/tools/generator` 之前，组件 `CrudPage`，`props` 返回 `{ module }` 或在找不到时渲染 404：找不到配置时 `props` 给一个标记，路由组件用一个薄包装 `src/pages/PublishedPage.vue`：找到则渲染 `CrudPage`，否则渲染 `ErrorPage`（code 404）。只在 `VITE_USE_MOCK !== 'false'` 时注册该路由。

- [ ] **Step 3: 生成器发布区**

`GeneratorPage.vue` 在字段标签页下方加"发布"卡片，仅 mock 模式渲染，否则显示"发布需要后端支持，当前为接口模式"。

- 发布按钮：`publishModule(validation.data, { menus: systemRows.menus.value, reservedKeys, reservedRoutes })`。`reservedKeys` = 内置模块 key 加 `import.meta.glob` 读到的 `src/modules/generated/*/route.ts` 的目录名；`reservedRoutes` = 全部菜单 `path` 加已生成模块路由（读 route.ts 不现实，改为：保留路由清单写死 `/ /login /settings /tools/generator /403` 再加内置模块路径，已生成模块通过 glob 取 route 字段——`route.ts` 是简单对象，可以 `import.meta.glob` eager 读取 `default.path`）。失败把 `reason` 显示在卡片内。
- 成功后：`systemRows.menus.value` 里同 id 行替换为 `menuRowFor(config)`，没有则追加。重新发布（同 key 已存在）时先弹确认框，文案"修改字段可能影响已有数据，已有记录会保留，但被删除或变更类型的字段需要重新编辑"。确认后提示"已发布，侧栏可直接打开"。
- 已发布列表：遍历 `publishedModules`，每行一个"下线"按钮，确认对话框后 `unpublishModule` 并删除对应菜单行。

- [ ] **Step 4: 验证**

Run: `npx vitest run && npx vue-tsc -b`
Expected: 通过。浏览器：在生成器发布示例配置，侧栏出现菜单，打开可增删改查，刷新后仍在；停用该菜单后直接访问 URL 返回 403；下线后菜单消失、再次发布数据仍在。

- [ ] **Step 5: 提交**

```bash
git add src/router/index.ts src/pages/PublishedPage.vue src/pages/GeneratorPage.vue src/lib/published.ts tests/published.test.ts
git commit -m "feat: publish modules to the sidebar without redeploying"
```

### Task 6: AI 配置提取纯逻辑

**Files:**
- Create: `src/lib/ai-config.ts`
- Test: `tests/ai-config.test.ts`

**Interfaces:**
- Consumes: `validateConfig`
- Produces:
  - `extractConfig(text: string): { config: GeneratorConfig } | { error: string }`：去掉 ```json 代码块标记，取第一个花括号配对的 JSON 片段，`JSON.parse` 后 `validateConfig`。失败返回中文 `error`。
  - `retryMessage(error: string): string`，固定文案：`上次输出校验失败：${error}。请只输出修正后的完整 JSON，不要解释。`
  - `buildPrompt(dictTypes: string[]): { role: 'system'; content: string }`：要求只输出一个 JSON，字段格式与 schema 一致（给出一个最小示例），并列出可用字典类型。

- [ ] **Step 1: 写失败测试**

断言：纯 JSON、```json 包裹、前后带说明文字三种输入都能提取；不合法 JSON 返回 `error`；schema 不通过（如缺字段）返回含 zod 信息的 `error`；`retryMessage` 文案包含错误；`buildPrompt` 内容包含传入的字典类型。

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/ai-config.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现 `src/lib/ai-config.ts`**

花括号配对按字符串与转义处理，不误切字符串内的括号。

- [ ] **Step 4: 运行确认通过**

Run: `npx vitest run tests/ai-config.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/ai-config.ts tests/ai-config.test.ts
git commit -m "feat: extract module config from AI replies"
```

### Task 7: AI 转发接口与对话面板

**Files:**
- Create: `dev/ai-proxy.mjs`
- Modify: `vite.config.ts`（挂插件）
- Modify: `.env.example`（三个空占位）
- Modify: `src/pages/GeneratorPage.vue`（对话面板）
- Test: `tests/ai-proxy.test.ts`

**Interfaces:**
- Consumes: `extractConfig`、`retryMessage`、`buildPrompt`（Task 6）
- Produces: `aiProxyPlugin(options?: { env?: Record<string, string> })`，Vite 插件，`configureServer` 注册中间件。

- [ ] **Step 1: 写失败测试**

`tests/ai-proxy.test.ts` 不经 Vite，直接导出中间件处理函数 `handleAiChat(req, res, env, fetchImpl)` 便于测试：

- `remoteAddress` 不是 `127.0.0.1`/`::1`：403。
- 缺少 `AI_API_KEY`：503，正文含"未配置"。
- 请求体超过 100KB：413。
- 正常：断言发给上游的 URL 是 `<AI_BASE_URL>/chat/completions`、body 含 `model` 与 `messages`、`Authorization: Bearer <key>`，返回 `{ content }`。用注入的 `fetchImpl` 替身。
- 上游超时（替身永不返回）：60 秒边界用假计时器断言中止。

- [ ] **Step 2: 运行确认失败**

Run: `npx vitest run tests/ai-proxy.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现 `dev/ai-proxy.mjs` 并挂载**

`vite.config.ts` 引入插件。`.env.example` 追加三行占位与一行注释。

- [ ] **Step 4: 对话面板**

`GeneratorPage.vue` 新增标签"AI 生成"：消息列表、输入框、发送按钮。发送时带 `buildPrompt(dictTypes)` 作为首条 system 消息，POST `/__ai/chat`。回复经 `extractConfig`：成功则展示摘要（模块名、字段列表）和"应用到字段表格"按钮，点击后 `Object.assign(config, extracted)`；失败则自动追加 `retryMessage` 再请求，最多 2 次，其后把错误显示出来。未配置（503）时提示"请在 .env.local 配置 AI_BASE_URL、AI_MODEL、AI_API_KEY 后重启开发服务器"。

- [ ] **Step 5: 验证**

Run: `npx vitest run && npx vue-tsc -b`
Expected: 通过。有可用 key 时在浏览器走一遍：对话生成、应用、预览、发布、导入一行。没有 key 时确认 503 提示正确。

- [ ] **Step 6: 提交**

```bash
git add dev/ai-proxy.mjs vite.config.ts .env.example src/pages/GeneratorPage.vue tests/ai-proxy.test.ts
git commit -m "feat: generate module config through an AI chat"
```

### Task 8: 收尾验证

- [ ] **Step 1: 全量检查**

Run: `npx vitest run && npx vue-tsc -b`
Expected: 全部通过。

- [ ] **Step 2: 浏览器走查**

按顺序确认：AI 生成（或手动配置）→ 发布 → 侧栏出现 → 增删改查 → 导入含错误行的 xlsx 标红 → 导出全部 → 下线 → 重新发布数据仍在 → 停用菜单后 URL 直达被拒。

- [ ] **Step 3: 更新记忆**

把完成状态写入 `C:\Users\SEMI\.claude\projects\D--zw-shadcn-admin-vue-shadcn-admin\memory\starter-progress-2026-11-12.md`。

