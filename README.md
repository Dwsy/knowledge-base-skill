# Knowledge Base Skill

专业的知识库管理系统，旨在解决"知识诅咒"（Curse of Knowledge）和认知偏差问题。通过显式化隐性知识、扫描代码提取领域概念、整合行业最佳实践，构建结构化的 Markdown 知识库。

## 特性

- 🧠 **打破知识诅咒**: 强制显式化隐性知识，记录常见误区
- 📂 **多级分类**: 支持任意层级的目录结构，灵活组织知识
- 🔍 **代码扫描**: 自动识别代码中的领域概念，建议文档化
- 📖 **结构化模板**: Concept、Guide、Decision 三种文档类型
- 🔗 **智能索引**: 自动生成层级化的知识索引
- 🔎 **全文搜索**: 支持关键词搜索所有知识文档
- 💡 **认知对齐**: 决策记录包含"认知对齐"章节
- 📚 **行业共识**: 整合标准规范，避免重复定义

## 快速开始

### 1. 初始化项目知识库

```bash
cd /path/to/project
bun ~/.pi/agent/skills/knowledge-base/lib.ts init
```

这将创建以下结构：

```
docs/knowledge/
├── concepts/    # 领域概念与术语
├── guides/      # 操作指南与最佳实践
├── decisions/   # 架构决策记录
├── external/    # 行业共识与外部参考
└── index.md     # 自动生成的索引
```

### 2. 创建文档

```bash
# 创建概念文档
bun ~/.pi/agent/skills/knowledge-base/lib.ts create concept "UserAuthentication"

# 创建带分类的文档（多级支持）
bun ~/.pi/agent/skills/knowledge-base/lib.ts create concept "AceTool" core/tools
bun ~/.pi/agent/skills/knowledge-base/lib.ts create guide "ErrorHandling" backend/api
bun ~/.pi/agent/skills/knowledge-base/lib.ts create decision "WhyUsePostgres" database/cache
```

### 3. 扫描代码

```bash
bun ~/.pi/agent/skills/knowledge-base/lib.ts scan
```

自动分析代码库，识别需要文档化的概念。

### 4. 生成索引

```bash
bun ~/.pi/agent/skills/knowledge-base/lib.ts index
```

### 5. 搜索知识

```bash
bun ~/.pi/agent/skills/knowledge-base/lib.ts search "keyword"
```

## 文档类型

### Concept（概念）
定义领域术语和核心概念，包含：
- Definition（定义）
- Context（上下文）
- Implementation（实现位置）
- Common Misconceptions（常见误区）
- Relationships（关联）
- References（参考）

### Guide（指南）
操作指南和最佳实践，包含：
- Goal（目标）
- Prerequisites（前置知识）
- Steps（步骤）
- Best Practices（最佳实践）
- Examples（示例）

### Decision（决策）
架构决策记录，包含：
- Context（背景）
- Options Considered（考虑过的选项）
- The Decision（最终决策）
- Cognitive Alignment（认知对齐）
- Consequences（后果）

## 目录结构示例

```
docs/knowledge/
├── concepts/
│   ├── KnowledgeBase.md
│   ├── CurseOfKnowledge.md
│   └── core/
│       ├── tools/
│       │   └── AceTool.md
│       ├── workflow/
│       │   └── Workhub.md
│       └── architecture/
│           └── SkillSystem.md
├── guides/
│   ├── HowToUseKnowledgeBase.md
│   └── core/
│       ├── development/
│       │   └── HowToCreateSkill.md
│       └── management/
│           └── HowToOrganizeKnowledge.md
├── decisions/
│   ├── 20260107-WhyWeBuiltKnowledgeBase.md
│   └── core/
│       └── language/
│           └── 20260107-WhyUseTypeScript.md
└── external/
    └── RESTfulAPIConsensus.md
```

## 最佳实践

### 分类策略

**按模块分类**（推荐用于功能模块清晰的项目）
```
concepts/
├── auth/              # 认证模块
├── payment/           # 支付模块
└── common/            # 通用概念
```

**按层级分类**（推荐用于复杂系统）
```
concepts/
├── core/              # 核心概念
├── domain/            # 领域概念
└── infrastructure/    # 基础设施
```

### 使用建议

- ✅ 遇到不懂的术语时，立即创建概念文档
- ✅ 代码 Review 时，如果需要解释超过 3 句，创建指南
- ✅ 记录"为什么"而不仅仅是"怎么做"
- ✅ 分类层级不超过 3 层
- ✅ 定期更新索引和扫描代码
- ❌ 不要使用递归定义
- ❌ 不要忽略常见误区记录

## 核心原则

### 1. 显式化（Explicitness）
强制将默会知识（Tacit Knowledge）转化为显性知识（Explicit Knowledge）。

### 2. 上下文对齐（Context Alignment）
通过代码扫描提取领域术语，建立统一词汇表。

### 3. 认知共识（Cognitive Consensus）
记录"为什么这样做"而不仅仅是"怎么做"。

### 4. SSOT（Single Source of Truth）
每个知识领域只有一个权威文档。

## 依赖

- Node.js / Bun
- 无外部依赖（纯 TypeScript 实现）

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关资源

- [Curse of Knowledge - Wikipedia](https://en.wikipedia.org/wiki/Curse_of_knowledge)
- [ADR (Architecture Decision Records)](https://adr.github.io/)
- [Pi Agent Skills](https://github.com/dengwenyu/pi-agent-skills)

## 作者

Created for Pi Agent System

---

**状态**: ✅ 生产就绪