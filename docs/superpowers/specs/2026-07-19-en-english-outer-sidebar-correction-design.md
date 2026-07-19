# EN English 最外层侧栏纠偏设计

## 目标

修正 `/en/english` 的导航层级：六个英语模块必须出现在页面最左侧的 ProLayout 菜单中，内容区不再出现第二层侧栏；同时消除 ProLayout、PageContainer 和内容区的浅色白板。

## 设计

- `Root` 在 `/english` 路径下向 ProLayout 提供六个菜单项：用户、单词、词库、词根、词缀、日常用语。
- 模块选择通过 `/english?module=<key>` 保存，默认 `users`。浏览器前进、后退及刷新保持当前模块。
- `English` 读取 `module` 查询参数并只渲染标题与当前模块内容，不再渲染内部 `aside` 或 Drawer。
- ProLayout 的暗色 token、头部、侧栏、PageContainer 与内容画布样式仅在 `/english` 生效；`/store` 继续使用原布局配置。
- 移动端复用 ProLayout 自带的折叠菜单，不增加第二套导航。

## 验收

- 最左侧菜单严格按“用户、单词、词库、词根、词缀、日常用语”排序。
- 默认模块为用户，选中项与 `module` 查询参数一致。
- 内容区不存在名为“英语学习模块”的第二层导航。
- `/english` 页面不存在大面积白色布局背景。
- `/store` 路由配置和业务组件不改。
- EN 测试、TypeScript 和 Vite 生产构建通过。
