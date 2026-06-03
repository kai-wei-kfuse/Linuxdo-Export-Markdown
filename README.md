# Linuxdo Export Markdown

一个用于将 [Linux.do](https://linux.do/) 论坛帖子导出为 Markdown 文件的 Tampermonkey/Violentmonkey 用户脚本。

脚本支持自动识别 Linux.do 的两种帖子链接模式：

- `https://linux.do/t/topic/{id}`：按 flat 模式导出，楼层线性排列。
- `https://linux.do/n/topic/{id}`：按 nest 模式导出，根据回复关系生成嵌套结构。

## 功能

- 一键导出当前帖子为 `.md` 文件
- 自动携带浏览器登录态访问帖子 JSON 数据
- 支持长帖补齐未加载楼层
- 支持 flat / nest 自动识别
- 支持只导出主帖
- 支持按楼层范围导出
- 内置轻量 HTML 转 Markdown，不依赖外部 CDN
- 保留常见内容格式：
  - 链接
  - 图片
  - 引用
  - 代码块
  - 列表
  - 标题
  - 粗体 / 斜体

## 安装

1. 安装浏览器扩展：
   - [Tampermonkey](https://www.tampermonkey.net/)
   - 或 [Violentmonkey](https://violentmonkey.github.io/)
2. 打开本仓库中的脚本文件：
   - [`linuxdo-md-export.user.js`](./linuxdo-md-export.user.js)
3. 将脚本内容复制到油猴中新建脚本并保存。
4. 打开 Linux.do 帖子页面，右下角会出现 `导出 MD` 按钮。

## 使用

进入 Linux.do 帖子页面后，点击右下角的 `导出 MD`。

弹窗中可以选择导出范围：

- `全部回复`：导出整个帖子。
- `只导出主帖`：只导出 1 楼主帖。
- `自定义楼层`：输入楼层范围，例如：
  - `1-50`
  - `1,3,8-12`

导出的文件名格式：

```text
linuxdo-{topicId}-{flat|nest|post}-{title}.md
```

## 导出模式

### Flat 模式

当链接为 `/t/topic/{id}` 时，脚本按楼层顺序导出：

```markdown
## #1 作者
正文

## #2 作者
正文
```

### Nest 模式

当链接为 `/n/topic/{id}` 时，脚本会根据 `reply_to_post_number` 生成回复树：

```markdown
## #1 楼主
正文

### #2 回复者
回复正文
```

### Post 模式

选择 `只导出主帖` 时，只导出 1 楼内容，不导出回复。即使当前页面是 `/n/topic/`，也会按主帖导出。

## 注意事项

- 需要在浏览器中登录 Linux.do，才能导出登录后可见的内容。
- 如果帖子内容无权限访问、被删除或隐藏，对应楼层可能会被跳过。
- Markdown 转换器是内置轻量实现，目标是可读和便携，不保证 100% 复刻论坛页面渲染。

## License

MIT
