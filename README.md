# Linuxdo Export Markdown

一个用于将 [Linux.do](https://linux.do/) 论坛帖子导出为 HTML 或 Markdown 文件的 Tampermonkey/Violentmonkey 用户脚本。

导出评论/回复时推荐使用 HTML，因为它会保留论坛渲染后的结构和图片显示；只导出主帖时，Markdown 也适合使用。

脚本支持自动识别 Linux.do 的两种帖子链接模式：

- `https://linux.do/t/topic/{id}`：按 flat 模式导出，楼层线性排列。
- `https://linux.do/n/topic/{id}`：按 nest 模式导出，根据回复关系生成嵌套结构。

## 功能

- 一键导出当前帖子为 `.html` 或 `.md` 文件
- 默认导出完整 HTML 文件，可直接在浏览器中打开
- HTML 导出支持评论下方的 boost / 直接回复摘要
- 保留 Markdown 导出选项；导出评论/回复时会提示 `Markdown（导出评论不推荐）`
- 自动携带浏览器登录态访问帖子 JSON 数据
- 支持长帖补齐未加载楼层
- 支持 flat / nest 自动识别
- 支持只导出主帖
- 支持按楼层范围导出
- 修复 Linux.do 图片附件导出时的异常 Markdown 括号格式
- 内置轻量 HTML 转 Markdown，不依赖外部 CDN
- HTML 导出保留论坛渲染后的正文；Markdown 导出尽量保留常见内容格式：
  - 链接
  - 图片
  - 引用
  - 代码块
  - 列表
  - 标题
  - 粗体 / 斜体

## 安装
1. 安装 Tampermonkey、Violentmonkey 或其他用户脚本管理器。
    - Tampermonkey:
  
      [<img alt="Available in the Chrome Web Store" src="https://developer.chrome.com/static/docs/webstore/branding/image/iNEddTyWiMfLSwFD6qGq.png" height="48">](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) 
      [<img alt="Get it from Microsoft Edge Add-ons" src="https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/add-ons-badge-images/microsoft-edge-add-ons-badge.png" height="48">](https://microsoftedge.microsoft.com/addons/detail/%E7%AF%A1%E6%94%B9%E7%8C%B4/iikmkjmpaadaobahmlepeloendndfphd)
    - ScriptCat:
  
       [<img alt="Available in the Chrome Web Store" src="https://developer.chrome.com/static/docs/webstore/branding/image/iNEddTyWiMfLSwFD6qGq.png" height="48">](https://chrome.google.com/webstore/detail/scriptcat/ndcooeababalnlpkfedmmbbbgkljhpjf)
      [<img alt="Get it from Microsoft Edge Add-ons" src="https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/add-ons-badge-images/microsoft-edge-add-ons-badge.png" height="48">](https://microsoftedge.microsoft.com/addons/detail/scriptcat/liilgpjgabokdklappibcjfablkpcekh)
2. 点击安装本仓库源码 [Linuxdo-Export-Markdown.user.js](https://github.com/kai-wei-kfuse/Linuxdo-Export-Markdown/raw/refs/heads/master/linuxdo-md-export.user.js)，或直接前往[Greasy Fork](https://greasyfork.org/zh-CN/scripts/580935-linux-do-export-markdown)安装

## 使用

进入 Linux.do 帖子页面后，点击右下角的 `导出`。

弹窗中可以选择导出格式：

- `HTML`：推荐，导出完整 HTML 文件。
- `Markdown`：导出 Markdown 文件。

当导出范围为 `全部回复` 或 `自定义楼层` 时，Markdown 选项会显示为 `Markdown（导出评论不推荐）`；当选择 `只导出主帖` 时，只显示 `Markdown`。

弹窗中可以选择导出范围：

- `全部回复`：导出整个帖子。
- `只导出主帖`：只导出 1 楼主帖。
- `自定义楼层`：输入楼层范围，例如：
  - `1-50`
  - `1,3,8-12`

导出的文件名格式：

```text
linuxdo-{topicId}-{flat|nest|post}-{title}.{html|md}
```

## 导出模式

### Flat 模式

当链接为 `/t/topic/{id}` 时，脚本按楼层顺序导出：

```markdown
**#1 作者**
正文

**#2 作者**
正文
```

### Nest 模式

当链接为 `/n/topic/{id}` 时，脚本会根据 `reply_to_post_number` 生成回复树：

```markdown
**#1 楼主**
正文

**#2 回复者**
回复正文
```

### Post 模式

选择 `只导出主帖` 时，只导出 1 楼内容，不导出回复。即使当前页面是 `/n/topic/`，也会按主帖导出。

## 注意事项

- 需要在浏览器中登录 Linux.do，才能导出登录后可见的内容。
- 如果帖子内容无权限访问、被删除或隐藏，对应楼层可能会被跳过。
- HTML 导出会直接使用论坛返回的渲染后正文，通常比 Markdown 更适合保存评论内容。
- Markdown 转换器是内置轻量实现，目标是可读和便携，不保证 100% 复刻论坛页面渲染。

## License

MIT
