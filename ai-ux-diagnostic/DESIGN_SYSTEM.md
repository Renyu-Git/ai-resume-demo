# AI 体验诊断台设计规范 V1.4

## 1. 规范基线

本项目以 **Ant Design 5** 为唯一组件与 Token 基线。Material Design 3 仅用于校验颜色角色是否清晰，IBM Carbon 仅用于校验状态表达与无障碍；不混用三套组件尺寸、圆角或排版比例。

执行原则：

1. 所有视觉值先映射到语义 Token，再由组件引用，禁止组件内临时增加近似色。
2. 品牌色、状态色、风险色和中性色各司其职；颜色必须表达明确含义。
3. 卡片依靠表面色与间距建立层级，默认无描边、无阴影。
4. 状态不能只靠颜色表达，必须同时提供文字或图标。

## 2. 颜色 Token

### 2.1 品牌与中性色

| Token | 色值 | Ant Design 角色 | 使用范围 |
| --- | --- | --- | --- |
| `--brand` | `#58C878` | 自定义 `colorPrimary` | Logo、主操作、选中项、活动证据、专家复核、分析完成 |
| `--surface-canvas` | `#EFEFEC` | `colorBgLayout` | 页面画布与卡片间隔 |
| `--surface-primary` | `#FBFBF9` | `colorBgContainer` | 主面板、字段内容块 |
| `--surface-secondary` | `#F1F2EE` | `colorFillAlter` | 普通卡片、次按钮、统计卡 |
| `--surface-tertiary` | `#E8E9E4` | `colorFillSecondary` | 图标底、Hover、反馈区 |
| `--text-strong` | `#151714` | `colorTextHeading` | 标题、关键数字 |
| `--text-default` | `#4F534D` | `colorText` | 正文、控件文字 |
| `--text-muted` | `#858A82` | `colorTextDescription` | 时间、说明、辅助信息 |
| `--text-disabled` | `#A2A69F` | `colorTextDisabled` | 禁用与占位信息 |

品牌色只保留一个实色 `#58C878`，不再创建浅绿、深绿或第二标准绿。需要弱层级时使用中性色表面，不以低透明度品牌色代替。

### 2.2 风险语义色

风险色采用 Ant Design 功能色的浅底/深字组合，只用于风险标记和风险标签。

| 风险 | 背景 | 前景 | 对应角色 |
| --- | --- | --- | --- |
| 低 / 安全 | `#F6FFED` | `#389E0D` | Success |
| 中 / 警告 | `#FFFBE6` | `#D48806` | Warning |
| 高 / 危险 | `#FFF1F0` | `#CF1322` | Error |

规则：

- “高 + 中”是混合风险数量汇总，不能用单一橙色代表，统计图标使用中性色。
- “分析完成”和“专家复核”使用唯一品牌绿，且必须带文字或完成/盾牌图标。
- 风险色不得用于 Logo、主按钮、选中项、普通统计或装饰图标。
- 普通图标继承周围文字颜色；只有表达明确状态时才使用状态色。

## 3. 排版 Token

字体栈遵循 Ant Design 的系统界面字体策略：

```css
-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
"Hiragino Sans GB", "Microsoft YaHei", sans-serif
```

| 层级 | 字号 / 行高 | 字重 | 使用范围 |
| --- | --- | --- | --- |
| 页面标题 | `22 / 30px` | 600 | 诊断结果、弹窗标题 |
| 模块标题 | `16 / 24px` | 600 | 品牌、模块名称 |
| 卡片标题 | `14 / 22px` | 600 | 问题、项目标题 |
| 正文 | `14 / 22px` | 400 | 描述、建议、判断依据 |
| 控件 | `12 / 20px` | 600 | 按钮、筛选、标签 |
| 辅助 | `12 / 20px` | 400 | 时间、说明、状态副文案 |

仅使用 `400 / 500 / 600 / 700` 四档字重。页面标题不使用负字距；正文不能通过缩小字号解决溢出。

## 4. 尺寸与间距

间距沿用 Ant Design 的 4px 基础步进：

| Token | 数值 | 用途 |
| --- | --- | --- |
| `--space-1` | 4px | 紧凑图标间距 |
| `--space-2` | 8px | 同组控件、卡片列表 |
| `--space-3` | 12px | 普通卡片内边距 |
| `--space-4` | 16px | 模块内边距 |
| `--space-5` | 24px | 主面板内边距 |
| `--space-6` | 32px | 页面级间距 |

组件高度采用 Ant Design Control Height：小型 24px、默认 32px、大型 40px。本项目主按钮与表单使用 40px，紧凑筛选使用 32px。任何可读文本距离所属色块边缘至少 12px。

## 5. 圆角与边界

| Token | 数值 | Ant Design 对应 | 使用范围 |
| --- | --- | --- | --- |
| `--radius-inner` | 6px | `borderRadius` | 内嵌字段、Tab 子项、缩略图 |
| `--radius-control` | 8px | `borderRadiusLG` | 按钮、输入、筛选、Tab 容器 |
| `--radius-card` | 8px | `borderRadiusLG` | 主面板、统计卡、问题卡、项目卡 |
| `--radius-modal` | 8px | `borderRadiusLG` | 弹窗 |
| `--radius-pill` | 999px | 胶囊特例 | 状态标签、风险标签、圆形序号 |

默认卡片无描边、无阴影。边界只允许用于键盘焦点、当前时间轴缩略图、输入错误，或浅色媒体与背景无法区分时的 1px 中性线。

## 6. 组件规范

### 6.1 状态徽标

- `分析完成`：品牌绿底、深色文字、CheckCircle 图标，胶囊圆角。
- `专家复核案例`：与分析完成使用相同品牌色、文字色、高度和内边距。
- `已完成`列表状态：正文使用中性色，CheckCircle 图标使用品牌绿，避免低对比度绿色正文。

### 6.2 统计卡

- 统计区只保留“问题总数”和“高/中风险总数”两张卡，使用 `surface-secondary`、8px 圆角和 12px 内边距。
- 问题总数与混合风险数量的图标统一使用 `surface-tertiary + text-default`。
- 不设置“完成 / 分析完成”统计卡；完成状态只在顶部状态徽标表达一次。
- 统计卡外不再增加容器描边。

### 6.3 风险标签与问题卡

- 高/中/低的序号与标签分别使用 Error、Warning、Success 色。
- 问题卡始终使用中性底，选中和展开不改变整卡颜色。
- 标题区 12px 内边距；展开字段间距 8px；字段块 6px 圆角、12px 内边距。
- 展开/收起依靠箭头方向和内容显隐表达，不新增颜色。

### 6.4 按钮、筛选和选择器

- 主按钮：40px 高、8px 圆角、品牌绿底、深色文字。
- 次按钮：40px 高、8px 圆角、`surface-secondary`；Hover 使用 `surface-tertiary`。
- 筛选：32px 高、8px 圆角；选中项可使用品牌绿。
- Focus：2px 品牌绿焦点环，外偏移 2px。
- Disabled：中性背景和禁用文字，保持可读性且不依赖透明度。

### 6.5 卡片与证据面板

- 工作台列间距 12px；主面板 24px 内边距；卡片列表间距 8px。
- 证据面板、时间轴、结果面板统一为 8px 外圆角。
- Tab 容器 8px、内部选项 6px，顶部和左侧各留 12px。
- 时间轴活动节点和当前缩略图只使用品牌绿，不引入第二强调色。
- 时间轴节点必须按 `timestamp / duration` 的真实比例定位，不能用等分网格伪造时间间隔。
- 缩略图中心必须与对应节点共享同一横坐标；相邻缩略图发生碰撞时仅向下一层避让，不修改真实横坐标。
- 时间轴标题使用 `14/22px`，说明与时间使用 `12/20px`，缩略图时间不得小于 11px。
- 时间轴容器高度必须由实际避让层数撑开，禁止固定高度裁切缩略图；整个证据序列必须在卡片内完整可见，不依赖横向滚动。

### 6.6 诊断详情排版与对齐

- 问题标题、问题描述、证据、建议、判断理由与理论依据统一使用 `14/22px`。
- 字段标签、风险标签和筛选控件统一使用 `12/20px`，不允许遗留 9–11px 的说明文字。
- 置信度字段最小高度 56px，标签与数值在同一 Flex 行内上下居中；数值使用 `20/24px`、700 字重。

### 6.7 项目与规则统计

- 侧栏项目和诊断记录中的项目组均支持点击标题展开/收起，默认展开；折叠后保留项目名称、诊断数量和方向箭头。
- 项目标题按钮必须提供 `aria-expanded` 和明确的展开/收起名称。
- 规则总数使用中性色统计卡，数字使用 `24/32px`、600 字重，禁止使用低对比度浅色文字。

## 7. 动效规范

本项目使用 Ant Design 5 的 `100 / 200 / 300ms` 时长层级，并采用 IBM Carbon Productive Motion 的标准、进入和退出缓动曲线。动效只用于解释状态变化、维持空间连续性和提供即时反馈，不使用弹跳、回弹或装饰性循环。

| Token | 数值 | 用途 |
| --- | --- | --- |
| `--motion-duration-fast` | `100ms` | Hover、按压、颜色和轻微透明度反馈 |
| `--motion-duration-mid` | `200ms` | 展开/收起、下拉菜单、页面内容进入、弹窗 |
| `--motion-duration-slow` | `300ms` | 大面积或重要层级变化，谨慎使用 |
| `--motion-ease-standard` | `cubic-bezier(0.2, 0, 0.38, 0.9)` | 始终可见元素的尺寸与位置变化 |
| `--motion-ease-enter` | `cubic-bezier(0, 0, 0.38, 0.9)` | 新元素进入或用户触发的展开 |
| `--motion-ease-exit` | `cubic-bezier(0.2, 0, 1, 0.9)` | 元素离场或收起 |

组件规则：

- 项目组和问题详情展开/收起必须同时过渡高度与透明度，箭头在 200ms 内连续旋转，禁止在上下箭头两个图标之间瞬切。
- 页面切换只允许 `4px + opacity` 的轻量进入，避免大幅横移导致用户丢失上下文。
- 下拉菜单从触发器方向向下进入，位移不超过 4px；弹窗位移不超过 8px、缩放不低于 98.5%。
- Hover 使用 100ms，按压只允许 1px 位移；证据缩略图 Hover 不改变真实时间轴横坐标。
- Toast 和错误通知使用 8px 以内的垂直进入；加载旋转可使用 Linear，其余位移动效禁止 Linear。
- 必须支持 `prefers-reduced-motion: reduce`，将所有非必要动画压缩为 1ms，并关闭平滑滚动。

## 8. 交互与无障碍

| 状态 | 规则 |
| --- | --- |
| Default | 中性表面，无描边 |
| Hover | `surface-secondary` 切换为 `surface-tertiary` |
| Selected | 品牌色 + 明确文字/图标，不只依赖颜色 |
| Focus | 2px 品牌色焦点环，2px offset |
| Disabled | 中性背景 + 禁用文字，保留可读性 |
| Warning / Error | 对应语义色 + 图标/文字标签 |

正文文字对比度目标不低于 4.5:1；大号文字和关键 UI 图形不低于 3:1。所有图标按钮必须提供可访问名称或 `title`。

## 9. 发布前自查

- [ ] Logo、主操作、选中项、活动证据、专家复核和分析完成仅使用 `#58C878`。
- [ ] “高 + 中”统计图标为中性色，没有额外橙色。
- [ ] 高/中/低风险色只出现在风险序号与标签。
- [ ] 所有卡片默认无描边、无阴影，层级通过表面色与间距表达。
- [ ] 外层卡片 8px、内嵌字段 6px，弹窗 8px。
- [ ] 字重只使用 400/500/600/700；正文不小于 12px，核心正文为 14px。
- [ ] 间距只使用 4/8/12/16/24/32px。
- [ ] Hover、Focus、Selected、Disabled 状态完整。
- [ ] 状态同时具备颜色和文字/图标，不依赖颜色单独传达。
- [ ] 1280px 与 1440px 视口没有贴边、遮挡、溢出或布局跳动。
- [ ] 诊断正文为 14px，辅助说明为 12px；置信度标签与数值上下居中。
- [ ] 时间轴节点按真实时间比例定位，缩略图与节点中心对齐，近邻缩略图只做纵向避让。
- [ ] 时间轴所有避让层完整可见；项目组可展开/收起；规则总数对比清晰。
- [ ] 统计区只有问题数与风险数，没有重复的“分析完成”卡。
- [ ] Hover 使用 100ms，展开/弹窗使用 200ms；进入、退出与持续变化使用对应缓动。
- [ ] 项目、问题详情和方向箭头连续过渡，没有瞬时跳变；开启减少动态效果后仍可完成全部任务。

## 10. 官方来源

- [Ant Design 色彩规范](https://ant.design/docs/spec/colors/)：功能色应表达清晰状态，并在同一产品内保持一致。
- [Ant Design 主题 Token](https://ant.design/docs/react/customize-theme/)：以全局 Seed/Map/Alias Token 管理主题，不在组件内散落颜色值。
- [Ant Design Badge](https://ant.design/components/badge/)：状态色使用 Success、Warning、Error 等明确语义 Token。
- [Ant Design Icon](https://ant.design/docs/spec/icon/)：普通图标与周围文字同色，仅表达状态时使用状态色。
- [Material Design 3 Color Roles](https://m3.material.io/styles/color/roles)：按 Primary、Surface、Error 等角色分配颜色。
- [IBM Carbon Status Indicator](https://carbondesignsystem.com/patterns/status-indicator-pattern/)：状态需同时使用颜色、形状与文字，提高扫描和无障碍表现。
- [IBM Carbon Accessibility](https://carbondesignsystem.com/guidelines/accessibility/color/)：正文 4.5:1，大文字和 UI 组件 3:1。
- [Ant Design 5 主题 Token](https://ant.design/docs/react/customize-theme/)：动效时长 Token 为 Fast 0.1s、Mid 0.2s、Slow 0.3s。
- [Ant Design 动效原则](https://3x.ant.design/docs/spec/motion-cn)：企业界面动效应自然、高效、简洁，并以明确目的服务交互。
- [IBM Carbon Motion](https://carbondesignsystem.com/elements/motion/overview/)：按 Standard / Entrance / Exit 区分缓动，生产型动效强调快速、克制与一致。
