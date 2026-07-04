# MAP - 项目地图

> 这个文件回答：项目长什么样、模块在哪、从哪开始看。

## 1. 快速入口

**启动移动端**：
```bash
pnpm dev:mobile
```

**启动 API**：
```bash
pnpm dev:api
```

**类型检查**：
```bash
pnpm typecheck
```

**测试**：
```bash
pnpm test
```

## 2. 模块列表

| 模块 | 职责 | 状态 | 主要位置 |
|---|---|---|---|
| `apps/mobile` | Expo / React Native 主应用，负责首页、计划、训练、更多、onboarding 等页面 | 开发中 | `apps/mobile/app/`、`apps/mobile/components/`、`apps/mobile/features/`、`apps/mobile/store/` |
| `shared` | 共享数据、营养/计划引擎、类型与通用逻辑 | 核心稳定层 | `shared/` |
| `apps/api` | 后端 API 服务 | 开发中 | `apps/api/` |

## 3. 关键依赖关系

`apps/mobile` 读取 `shared` 的计划、营养和训练逻辑，作为页面渲染与交互的基础。
`apps/api` 主要承载服务端能力，尽量不把业务规则散落到前端。
`shared` 是饮食/训练联动规则的中心，不应该被 mobile 里写死的逻辑替代。

## 4. 核心连续层文件

| 文件 | 作用 | 何时查看 |
|---|---|---|
| `PROJECT.md` | 项目定义、边界、非目标 | 新会话第一次进入时 |
| `MAP.md` | 模块地图、入口、文档索引 | 每次会话都先看 |
| `STATUS.md` | 当前在做什么、下一步 | 每次会话都先看 |
| `HANDOFF.md` | 上次切窗前的未落盘线索 | 需要接着做时看 |
| `DECISIONS.md` | 方案取舍与拒绝的替代方案 | 追溯原因时看 |

`handoffs/` 用于归档历史交接。

## 5. 主题文档

### systems/
| 文件 | 内容 | 何时查看 |
|---|---|---|
| `brain/topics/systems/` | 计划引擎、饮食训练联动、AI 识别、动态调整等系统性设计 | 修改核心规则前 |

### operations/
| 文件 | 内容 | 何时查看 |
|---|---|---|
| `brain/topics/operations/` | 启动、检查、验证、发布等操作流程 | 需要跑环境时 |

### planning/
| 文件 | 内容 | 何时查看 |
|---|---|---|
| `brain/topics/planning/` | 里程碑、阶段目标、待办拆分 | 做路线规划时 |

### feedback/
| 文件 | 内容 | 何时查看 |
|---|---|---|
| `brain/topics/feedback/` | 审查结论、用户反馈、待修复问题 | 处理审查意见时 |

## 6. 当前状态约定

这个项目默认按单工作流管理，不拆多工作流脑。
如果以后出现明显并行主线，再考虑把状态拆成 `STATUS_<workstream>.md`。
