# AI 体验诊断台设计系统 V1.5

本规范以 Apple Human Interface Guidelines 为主要依据，吸收其清晰层级、语义色、系统字体、44px 交互目标、嵌套圆角和连续动效原则。它不是对 iOS 视觉的表面复制：产品保留现有信息架构、无描边卡片布局和唯一品牌绿 `#58C878`。

## 1. 设计原则

1. **清晰优先**：内容和任务高于装饰；正文不得通过缩小字号解决溢出。
2. **层级靠表面与间距**：卡片默认无描边、无阴影，以画布、容器和内容块三层颜色区分。
3. **连续而非炫技**：动效解释状态变化，保持方向和空间关系；禁止无意义弹跳。
4. **语义一致**：品牌色、风险色、中性色各司其职，状态同时使用文字或图标表达。
5. **材质克制**：半透明材质只用于导航、悬浮控件、菜单和模态遮罩；内容卡保持不透明。

## 2. 颜色

| Token | 色值 | 用途 |
| --- | --- | --- |
| `--brand` | `#58C878` | Logo、主操作、选中项、当前证据、专家复核、完成状态 |
| `--surface-canvas` | `#F2F2F7` | 页面画布与卡片间隔 |
| `--surface-primary` | `#FFFFFF` | 主面板、内容卡、展开详情 |
| `--surface-secondary` | `#F2F2F7` | 普通卡片、统计卡、次按钮 |
| `--surface-tertiary` | `#E5E5EA` | 图标底、分组层、强 Hover |
| `--surface-hover` | `#EBEBF0` | 可交互项 Hover |
| `--surface-selected` | `#E5F6EA` | 轻量选中背景，仅与品牌绿前景组合 |
| `--separator` | `rgba(60,60,67,.12)` | 结构分隔，不用于卡片描边 |
| `--text-strong` | `#1C1C1E` | 标题、关键数字 |
| `--text-default` | `#48484A` | 正文、控件文字 |
| `--text-muted` | `#8E8E93` | 时间、说明、辅助信息 |
| `--text-disabled` | `#AEAEB2` | 禁用、占位 |

唯一标准绿为 `#58C878`。不创建第二主绿，不把风险绿当品牌绿，也不使用低透明度绿色制造新的“近似品牌色”。

### 风险色

| 风险 | 背景 | 前景 | 语义 |
| --- | --- | --- | --- |
| 低 | `#F6FFED` | `#389E0D` | 安全 / Success |
| 中 | `#FFFBE6` | `#D48806` | 警示 / Warning |
| 高 | `#FFF1F0` | `#CF1322` | 危险 / Error |

风险色只用于高、中、低标签和序号；混合风险汇总使用中性色，不允许多出一个橙色统计体系。

## 3. 字体与排版

字体栈：

```css
-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display",
"PingFang SC", "Hiragino Sans GB", "Segoe UI", "Microsoft YaHei", sans-serif
```

| 层级 | 字号 / 行高 | 字重 | 用途 |
| --- | --- | --- | --- |
| 页面大标题 | `34 / 41px` | 600 | 诊断记录、规则库 |
| 结果标题 | `22 / 28px` | 600 | 诊断结果、弹窗标题 |
| 顶栏标题 | `20 / 25px` | 600 | 当前案例 |
| 模块标题 | `17 / 22px` | 600 | 品牌、模块名 |
| 卡片标题 | `14 / 22px` | 600 | 问题、项目标题 |
| 正文 | `14 / 22px` | 400 | 证据、描述、建议、判断依据 |
| 控件 | `13 / 18px` | 500–600 | 按钮、筛选、字段标签 |
| 辅助 | `12 / 18px` | 400 | 时间、说明、状态副文案 |

只使用 400、500、600、700 四档字重。核心诊断正文固定 `14/22px`；可读文本原则上不低于 12px。

## 4. 间距与尺寸

间距采用 4px 基础栅格：`4 / 8 / 12 / 16 / 24 / 32px`。

| 场景 | 规范 |
| --- | --- |
| 页面内边距 | 32px；工作台密集布局最小 12px |
| 主面板内边距 | 24px |
| 普通卡片内边距 | 12–16px |
| 卡片列表间距 | 8px |
| 字段间距 | 8–12px |
| 主按钮、表单、导航 | 最小 44px 高 |
| 图标按钮热区 | 44×44px |
| 紧凑筛选 | 36px 高；点击热区不得被相邻项侵占 |

## 5. 圆角

| Token | 数值 | 用途 |
| --- | --- | --- |
| `--radius-inner` | 8px | 卡片内部字段、Tab 子项、缩略图 |
| `--radius-control` | 10px | 按钮、输入、筛选、悬浮控件 |
| `--radius-card` | 12px | 主面板、问题卡、项目卡、统计卡 |
| `--radius-modal` | 14px | 弹窗、重要浮层 |
| `--radius-pill` | 999px | 状态徽标、风险标签、圆形序号 |

嵌套圆角必须由外向内递减：14 → 12 → 10 → 8。卡片默认无描边、无阴影；边界只用于焦点、错误或媒体与背景确实无法区分时。

## 6. 表面与材质

- 页面画布：`surface-canvas`。
- 主内容卡：`surface-primary`，完全不透明。
- 卡内分组：`surface-secondary`；展开字段回到 `surface-primary`。
- 顶栏与侧栏：白色 82% + `saturate(180%) blur(24px)`，作为导航层。
- Tab、缩放器、菜单：白色 84% + `blur(18px)`，允许轻微环境阴影。
- 模态遮罩：深灰 38% + `blur(12px)`。
- 禁止把所有内容卡做成玻璃；半透明只属于导航和悬浮功能层。

## 7. 组件

### 按钮与导航

- 主按钮：44px 高、10px 圆角、品牌绿底、深色文字。
- 次按钮：44px 高、10px 圆角、`surface-secondary`。
- 按压反馈：140ms 内缩放到 0.98 并降低少量透明度；禁止机械式下移 1px。
- 图标与文字字重匹配；图标按钮必须有可访问名称。

### 卡片与统计

- 统计区只保留问题数和高/中风险总数；不重复“分析完成”。
- 问题卡始终为中性表面；选中、展开不改变整卡颜色。
- 卡片靠 8–12px 间距区分，不增加外描边。
- 置信度字段最小 56px，标签和 `20/24px` 数值上下居中。

### 项目、记录与空状态

- 项目组默认展开，点击标题可展开/收起；项目名、数量和方向箭头始终保留。
- 新建诊断未上传媒体时显示空状态、格式说明和明确上传入口。
- 已归档诊断不出现在最近诊断，记录页区分归档与未归档并支持恢复。

### 证据时间轴

- 节点位置严格使用 `timestamp / duration`，不能等分伪造。
- 缩略图中心与对应节点共享横坐标；相邻节点过近时仅纵向避让。
- 时间轴容器由避让层数自然撑高，禁止裁切、贴边或依赖横向滚动。
- 点击证据帧从节点前 2 秒播放，并展开对应问题。

## 8. 动效

Apple 风格的核心是状态连续、方向明确、可被下一次输入自然接管，而不是“动画更慢”。本项目使用低回弹、快速收敛的 spring-like 曲线。

| Token | 时长 / 曲线 | 用途 |
| --- | --- | --- |
| `feedback` | `140ms / ease-out` | Hover、按压、颜色反馈 |
| `compact` | `280ms / cubic-bezier(.16,1,.3,1)` | 菜单、小浮层 |
| `spatial` | `420ms / cubic-bezier(.22,1,.36,1)` | 页面、方向、位置变化 |
| `collapse-enter` | `440ms / cubic-bezier(.16,1,.3,1)` | 项目和问题展开 |
| `collapse-exit` | `320ms / cubic-bezier(.22,1,.36,1)` | 项目和问题收起 |
| `modal` | `520ms / cubic-bezier(.16,1,.3,1)` | 大型模态进入 |

- 展开/收起同步过渡高度与透明度；同一箭头连续旋转，不能切换两个图标。
- 页面进入位移不超过 6px；菜单不超过 4px；弹窗不超过 8px、起始缩放不低于 97.5%。
- 关闭比打开略快，避免界面显得迟钝。
- Hover 不改变布局，时间轴缩略图不能改变真实横坐标。
- 只有加载旋转允许 Linear；其他位置变化禁止 Linear。
- `prefers-reduced-motion: reduce` 下把非必要动画压缩到 1ms，并关闭平滑滚动。

## 9. 状态与无障碍

| 状态 | 规则 |
| --- | --- |
| Default | 中性表面，无描边 |
| Hover | 切换到 `surface-hover` |
| Pressed | 0.98 缩放 + 少量透明度 |
| Selected | 品牌色前景或轻选中表面 + 文字/图标 |
| Focus | 2px 品牌色焦点环，外偏移 2px |
| Disabled | 禁用文字 + 中性表面，不只降低透明度 |
| Warning / Error | 对应语义色 + 图标/文字 |

正文对比度目标不低于 4.5:1，大文字和关键 UI 图形不低于 3:1。所有核心交互目标最小 44×44px。

## 10. 发布前自查

- [ ] Logo、主操作、选中项、当前证据、专家复核、完成状态只使用 `#58C878`。
- [ ] 风险色只用于高/中/低标签与序号，混合统计为中性色。
- [ ] 内容卡无描边无阴影，导航/悬浮层才使用半透明材质。
- [ ] 字体只使用规范字号与 400/500/600/700 字重；正文为 14/22px。
- [ ] 间距只使用 4px 栅格；核心交互目标不小于 44px。
- [ ] 圆角遵循 14 → 12 → 10 → 8 的嵌套关系。
- [ ] 置信度标签与数值上下居中。
- [ ] 时间轴按真实时间定位、缩略图居中、近邻只纵向避让且不裁切。
- [ ] 项目和问题展开/收起连续，方向箭头不瞬切。
- [ ] 页面、菜单、弹窗位移不超过 4–8px，关闭快于打开。
- [ ] 减少动态效果开启后，所有任务仍可完成。
- [ ] 1280px 与 1440px 下无贴边、遮挡、文字截断或布局跳动。

## 11. 官方来源

- [Apple HIG — Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- [Apple HIG — Color](https://developer.apple.com/design/human-interface-guidelines/color)
- [Apple HIG — Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Apple HIG — Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Apple UI Design Dos and Don’ts](https://developer.apple.com/design/tips/)
- [Apple SwiftUI Animation](https://developer.apple.com/documentation/swiftui/animation)
- [Apple SwiftUI Spring](https://developer.apple.com/documentation/swiftui/animation/spring%28duration%3Abounce%3Ablendduration%3A%29)
