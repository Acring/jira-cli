# JIRA CLI

[English](README.md) | 中文

一个现代化、可扩展的 Atlassian JIRA 命令行工具，基于 Factory 模式和 Commander.js 构建。直接在终端中管理您的 Issue、项目和 Sprint，提供美观、友好的用户界面。

## ✨ 功能特性

- 📋 **Issue 管理**：完整的 CRUD 操作，创建、查看、更新和删除 JIRA Issue
- 💬 **评论管理**：添加、列出、编辑和删除 Issue 评论，支持文件输入
- 📎 **附件管理**：上传、下载、列出和删除文件附件
- 🔧 **自定义字段支持**：查看任意自定义字段值，显示友好的字段名称
- 📝 **Markdown 支持**：将 Issue 导出为 Markdown 文件，从 Markdown 创建/更新 Issue
- 📊 **项目信息**：查看项目详情、统计数据和团队洞察
- 🏃 **Sprint 管理**：监控 Sprint 进度、燃尽图和团队速度
- ⚙️ **智能配置**：支持环境变量和 CLI 选项，灵活配置
- 📈 **高级分析**：获取项目健康度、用户工作量和性能指标洞察
- 🤖 **自动化友好**：完全可脚本化，非交互模式，适用于 CI/CD 流水线
- 🎨 **美观输出**：格式化表格、彩色输出和进度指示器
- 🔍 **强大搜索**：使用类 JQL 查询和高级搜索选项筛选 Issue
- 🏗️ **现代架构**：Factory 模式、依赖注入和可扩展的命令结构
- 🛡️ **安全可靠**：支持 API Token、环境变量和安全凭证存储

## 🚀 快速开始

### 安装

```bash
# 通过 npm 全局安装
npm install -g @pchuri/jira-cli

# 或使用 npx（无需安装）
npx @pchuri/jira-cli

# 或本地安装用于开发
git clone https://github.com/pchuri/jira-cli.git
cd jira-cli
npm install
npm link
```

### 配置

1. **使用 CLI 选项配置（Bearer 认证 - 推荐）：**
   ```bash
   jira config --server https://your-jira-instance.atlassian.net \
               --token your-api-token
   ```

2. **或使用用户名进行 Basic 认证：**
   ```bash
   jira config --server https://your-jira-instance.atlassian.net \
               --username your-email@company.com \
               --token your-api-token
   ```

3. **或使用环境变量：**
   ```bash
   # Bearer 认证（推荐）
   export JIRA_HOST=your-jira-instance.atlassian.net
   export JIRA_API_TOKEN=your-api-token
   export JIRA_API_VERSION=auto  # 可选: auto（默认）, 2, 3

   # Basic 认证（可选）
   export JIRA_HOST=your-jira-instance.atlassian.net
   export JIRA_API_TOKEN=your-api-token
   export JIRA_USERNAME=your-email@company.com
   export JIRA_API_VERSION=auto  # 可选: auto（默认）, 2, 3
   ```

4. **验证连接：**
   ```bash
   jira config --show
   jira issue view PROJ-123
   ```

5. **创建新 Issue：**
   ```bash
   jira issue create --project PROJ --type Bug --summary "登录失败"
   ```

6. **查看项目信息：**
   ```bash
   jira project list
   ```

## 配置说明

JIRA CLI 支持两种认证模式：

1. **Bearer Token 认证（推荐）** - 直接使用 API Token
2. **Basic 认证** - 使用用户名 + API Token（传统方式）

### 方式一：命令行配置

```bash
# Bearer 认证（仅需 server + token）
jira config --server https://yourcompany.atlassian.net \
            --token your-api-token

# Basic 认证（带用户名）
jira config --server https://yourcompany.atlassian.net \
            --username your-email@company.com \
            --token your-api-token

# 或单独设置各项值
jira config set server https://yourcompany.atlassian.net
jira config set token your-api-token
jira config set username your-email@company.com  # 可选
jira config set apiVersion auto  # 可选: auto（默认）, 2, 3

# 显示当前配置
jira config --show
```

### Jira REST API 版本

默认情况下，CLI 使用 `auto` 模式：首先尝试 Jira REST API v3，如果失败则自动回退到 v2。一旦回退发生，CLI 会在整个进程中继续使用可用的版本。

您可以覆盖此行为：
- 配置：`jira config set apiVersion auto|2|3`
- 环境变量：`JIRA_API_VERSION=auto|2|3`

### 方式二：环境变量

您可以使用新格式或旧格式的环境变量配置 CLI：

#### 新格式（JIRA_HOST）
```bash
# Bearer 认证
export JIRA_HOST="your-jira-instance.atlassian.net"
export JIRA_API_TOKEN="your-api-token"
export JIRA_API_VERSION="auto"  # 可选: auto（默认）, 2, 3

# Basic 认证（添加用户名）
export JIRA_HOST="your-jira-instance.atlassian.net"
export JIRA_API_TOKEN="your-api-token"
export JIRA_USERNAME="your-email@company.com"
export JIRA_API_VERSION="auto"  # 可选: auto（默认）, 2, 3
```

#### 旧格式（JIRA_DOMAIN）
```bash
export JIRA_DOMAIN="your-domain.atlassian.net"
export JIRA_USERNAME="your-email@company.com"
export JIRA_API_TOKEN="your-api-token"
export JIRA_API_VERSION="auto"  # 可选: auto（默认）, 2, 3
```

### 获取 API Token

1. 访问 [Atlassian 账户设置](https://id.atlassian.com/manage-profile/security/api-tokens)
2. 点击"创建 API token"
3. 输入标签（例如 "jira-cli"）
4. 复制生成的 token

## 使用指南

### 查看 Issue

```bash
# 在终端中查看
jira issue view PROJ-123

# 以 markdown 格式查看
jira issue view PROJ-123 --format markdown

# 导出到 markdown 文件
jira issue view PROJ-123 --output ./issue.md

# 显式指定 markdown 格式并导出
jira issue view PROJ-123 --format markdown --output ./issue.md
```

### 列出 Issue

```bash
# 列出所有最近的 Issue
jira issue --list

# 按项目筛选
jira issue --list --project PROJ

# 按经办人筛选
jira issue --list --assignee john.doe

# 按状态筛选
jira issue --list --status "In Progress"

# 组合筛选
jira issue --list --project PROJ --assignee john.doe --status "To Do"
```

### 创建 Issue

```bash
# 使用必需参数创建
jira issue create --project PROJ --type Bug --summary "登录按钮无响应"

# 带描述
jira issue create --project PROJ --type Bug --summary "登录失败" --description "用户无法登录系统"

# 从文件读取描述
jira issue create --project PROJ --type Story --summary "添加新功能" --description-file ./feature-spec.md

# 使用所有选项
jira issue create --project PROJ --type Bug --summary "严重 Bug" \
                  --description "详细描述" \
                  --assignee john.doe --priority High
```

### 更新 Issue

```bash
# 更新摘要
jira issue edit PROJ-123 --summary "更新后的摘要"

# 更新特定字段
jira issue edit PROJ-123 --assignee john.doe --priority High

# 更新描述
jira issue edit PROJ-123 --description "更新后的描述"

# 从文件更新描述
jira issue edit PROJ-123 --description-file ./updated-spec.md
```

### 搜索 Issue

```bash
# 使用 JQL 筛选搜索 Issue
jira issue list --jql "login bug"

jira issue list --jql "project = PROJ AND status = 'In Progress'"

# 限制结果数量
jira issue list --jql "bug" --limit 5
```

### 管理评论

```bash
# 添加评论
jira issue comment add PROJ-123 "审核完成"

# 添加多行评论
jira issue comment add PROJ-123 "构建状态:
- 单元测试: ✓
- 集成测试: ✓
- 部署: 待处理"

# 从文件添加评论
jira issue comment add PROJ-123 --file ./review-notes.md

# 添加内部评论（仅团队可见）
jira issue comment add PROJ-123 "内部备注" --internal

# 列出所有评论
jira issue comment list PROJ-123

# 以 JSON 格式列出评论
jira issue comment list PROJ-123 --format json

# 编辑评论
jira issue comment edit 12345 "更新后的评论"

# 从文件编辑评论
jira issue comment edit 12345 --file ./updated-notes.md

# 删除评论（需要确认）
jira issue comment delete 12345 --force

# 使用命令别名
jira issue c add PROJ-123 "快速评论"
jira issue c list PROJ-123
```

### 管理附件

```bash
# 列出 Issue 的所有附件
jira issue attachment list PROJ-123

# 以 JSON 格式列出附件
jira issue attachment list PROJ-123 --format json

# 下载 Issue 的所有附件
jira issue attachment download PROJ-123

# 下载到指定目录
jira issue attachment download PROJ-123 --output ./downloads

# 按 ID 下载特定附件
jira issue attachment download PROJ-123 12345

# 下载匹配模式的附件
jira issue attachment download PROJ-123 --name "*.png"

# 上传文件到 Issue
jira issue attachment upload PROJ-123 ./screenshot.png

# 上传多个文件
jira issue attachment upload PROJ-123 ./doc1.pdf ./doc2.pdf ./image.png

# 删除附件（需要 --force）
jira issue attachment delete 12345 --force

# 使用命令别名
jira issue a list PROJ-123
jira issue attach upload PROJ-123 ./file.pdf
```

### 查看自定义字段

```bash
# 查看特定自定义字段值
jira issue field PROJ-123 customfield_11103

# 查看标准字段
jira issue field PROJ-123 description
jira issue field PROJ-123 priority

# 查看 Issue 时，自定义字段会显示友好的字段名称
jira issue view PROJ-123
```

### 项目管理

```bash
# 列出所有项目
jira project list

# 查看项目详情
jira project view PROJ
```

### Sprint 管理

```bash
# 首先列出可用的看板
jira sprint boards

# 列出特定看板的 Sprint（多个看板时必需）
jira sprint list --board 123

# 仅显示活跃的 Sprint
jira sprint active --board 123

# 按状态筛选
jira sprint list --board 123 --state active
```

## 命令参考

| 命令 | 描述 | 选项 |
|------|------|------|
| `config --server <url> --token <token>` | 配置 CLI（Bearer 认证） | 用户名可选；使用 `--username <email>` 进行 Basic 认证 |
| `config --show` | 显示当前配置 | - |
| `config set <key> <value>` | 设置单个配置值 | - |
| `issue view <key>` | 查看 Issue 详情（别名: show） | `--format <terminal\|markdown>`, `--output <path>` |
| `issue list` | 列出 Issue | `--project <key>`, `--assignee <user>`, `--status <status>`, `--jql <query>`, `--limit <number>` |
| `issue create` | 创建新 Issue | **必需：** `--project <key>`, `--type <type>`, `--summary <text>`<br>**可选：** `--description <text>`, `--description-file <path>`, `--assignee <user>`, `--priority <level>` |
| `issue edit <key>` | 编辑 Issue（别名: update） | **至少需要一个：**<br>`--summary <text>`, `--description <text>`, `--description-file <path>`, `--assignee <user>`, `--priority <level>` |
| `issue delete <key>` | 删除 Issue | **必需：** `--force` |
| `issue comment add <key> [text]` | 添加评论（别名: c） | `[text]` 或 `--file <path>`<br>**可选：** `--internal` |
| `issue comment list <key>` | 列出评论 | `--format <table\|json>`（默认: table） |
| `issue comment edit <id> [text]` | 编辑评论 | `[text]` 或 `--file <path>` |
| `issue comment delete <id>` | 删除评论 | **必需：** `--force` |
| `issue field <key> <fieldId>` | 查看特定字段值 | - |
| `issue attachment list <key>` | 列出附件（别名: a, attach） | `--format <table\|json>` |
| `issue attachment download <key> [id]` | 下载附件 | `--output <dir>`, `--name <pattern>`, `--overwrite` |
| `issue attachment upload <key> <files...>` | 上传文件 | 支持多个文件 |
| `issue attachment delete <id>` | 删除附件 | **必需：** `--force` |
| `project list` | 列出所有项目 | `--type <type>`, `--category <category>` |
| `project view <key>` | 查看项目详情 | - |
| `project components <key>` | 列出项目组件 | - |
| `project versions <key>` | 列出项目版本 | - |
| `sprint list` | 列出 Sprint | `--board <id>`（多看板时必需）, `--state <state>`, `--active` |
| `sprint active` | 列出活跃的 Sprint | `--board <id>`（多看板时必需） |
| `sprint boards` | 列出可用的看板 | - |

## 配置文件

配置使用 `conf` 包存储在系统配置目录中：

- **macOS**: `~/Library/Preferences/jira-cli/config.json`
- **Linux**: `~/.config/jira-cli/config.json`
- **Windows**: `%APPDATA%\jira-cli\config.json`

## 示例

```bash
# 配置（Bearer 认证 - 推荐）
jira config --server https://jira.company.com \
            --token your-api-token

# 配置（带用户名的 Basic 认证）
jira config --server https://jira.company.com \
            --username user@company.com \
            --token your-api-token

# 在终端中查看 Issue
jira issue view PROJ-123

# 以 markdown 格式查看
jira issue view PROJ-123 --format markdown

# 导出到 markdown 文件
jira issue view PROJ-123 --output ./issue.md

# 带筛选条件列出 Issue
jira issue list --project PROJ --status "In Progress" --limit 10

# 创建新 Issue
jira issue create --project PROJ --type Bug --summary "登录失败"

# 使用描述文件创建 Issue
jira issue create --project PROJ --type Story \
                  --summary "添加功能" \
                  --description-file ./feature-spec.md

# 更新 Issue
jira issue edit PROJ-123 --summary "更新后的摘要"

# 删除 Issue（需要 --force）
jira issue delete PROJ-123 --force

# 添加评论
jira issue comment add PROJ-123 "审核完成"

# 从文件添加评论
jira issue comment add PROJ-123 --file ./review-notes.md

# 列出所有评论
jira issue comment list PROJ-123

# 编辑评论
jira issue comment edit 12345 "更新的评论"

# 删除评论
jira issue comment delete 12345 --force

# 列出附件
jira issue attachment list PROJ-123

# 上传附件
jira issue attachment upload PROJ-123 ./screenshot.png

# 下载所有附件
jira issue attachment download PROJ-123 --output ./downloads

# 查看自定义字段
jira issue field PROJ-123 customfield_11103

# 列出所有项目
jira project list

# 显示可用看板
jira sprint boards

# 显示活跃的 Sprint
jira sprint active --board 123
```

## 开发

```bash
# 克隆仓库
git clone https://github.com/pchuri/jira-cli.git
cd jira-cli

# 安装依赖
npm install

# 本地运行
npm start -- --help

# 运行测试
npm test

# 代码检查
npm run lint
```

### 项目结构

```
jira-cli/
├── bin/
│   ├── index.js              # CLI 主入口
│   └── commands/             # 命令实现
│       ├── config.js         # 配置管理
│       ├── issue.js          # Issue 操作
│       ├── project.js        # 项目操作
│       └── sprint.js         # Sprint 操作
├── lib/
│   ├── jira-client.js        # JIRA API 客户端
│   ├── config.js             # 配置管理
│   ├── utils.js              # 工具函数
│   └── analytics.js          # 分析和报告
├── tests/
│   └── jira-client.test.js   # 单元测试
├── docs/                     # 文档
├── examples/                 # 使用示例
└── package.json
```

## 错误处理

CLI 为常见问题提供清晰的错误消息：

- **认证失败**：使用 `jira config --show` 检查您的凭证
- **网络错误**：验证您的服务器 URL 和连接
- **权限错误**：确保您的账户具有必要的权限
- **无效的 Issue Key**：仔细检查 Issue Key 格式（PROJ-123）

## 故障排除

### 常见问题

1. **"JIRA CLI is not configured"**
   - 运行 `jira config --server <url> --token <token>` 设置连接
   - 可选添加 `--username <email>` 进行 Basic 认证
   - 或设置环境变量（JIRA_HOST + JIRA_API_TOKEN 必需，JIRA_USERNAME 可选）

2. **"Authentication failed"**
   - 使用 `jira config --show` 验证您的用户名和 API Token
   - 确保使用的是 API Token，而不是密码
   - 检查 Token 是否已过期

3. **"Network error"**
   - 检查服务器 URL 格式：`https://yourcompany.atlassian.net`
   - 确保您可以从网络访问 JIRA
   - 尝试使用 `curl` 测试连接

4. **"Resource not found"**
   - 验证 Issue Key 或项目 Key 是否存在
   - 检查您是否有权限访问该资源
   - 使用 `jira search` 查找正确的 Issue Key

### 调试模式

设置 `DEBUG` 环境变量获取更详细的输出：

```bash
DEBUG=jira-cli* jira issue --list
```

或禁用分析：

```bash
export JIRA_CLI_ANALYTICS=false
```

## 贡献指南

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 和 [Semantic Release](https://semantic-release.gitbook.io/) 进行自动版本控制和变更日志生成。

### 开始贡献

1. Fork 仓库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 按照编码标准进行更改
4. 为新功能编写测试
5. 使用规范化提交格式提交更改：
   ```bash
   # 示例：
   git commit -m "feat: add issue filtering by labels"
   git commit -m "fix: resolve authentication timeout issue"
   git commit -m "docs: update installation instructions"
   ```
6. 推送到分支（`git push origin feature/amazing-feature`）
7. 创建 Pull Request

### 提交消息格式

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**类型**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`

**示例**:
- `feat(auth): add OAuth2 support`
- `fix(cli): handle empty project names correctly`
- `docs: update README with new examples`
- `test: add unit tests for issue creation`

### 自动发布

- **推送到 `main`**：根据提交类型触发自动发布
- **破坏性更改**：在 footer 中使用 `feat!:` 或 `BREAKING CHANGE:`
- **版本控制**：由 semantic-release 自动确定
- **变更日志**：从规范化提交生成
- **NPM 发布**：通过 GitHub Actions 自动化

阅读完整的 [贡献指南](CONTRIBUTING.md) 了解详细说明。

## 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](https://github.com/pchuri/jira-cli/blob/main/LICENSE) 文件了解详情。

## 路线图

- [x] 基础 Issue 管理（创建、查看、更新、删除）
- [x] 评论管理（添加、列出、编辑、删除）
- [x] 项目和 Sprint 管理
- [x] 配置管理
- [x] 非交互式、自动化友好的 CLI
- [x] 分析和报告
- [x] 导出 Issue 为 Markdown 格式
- [x] 从 Markdown 文件创建/更新 Issue
- [x] Issue 附件管理
- [x] 自定义字段支持
- [ ] Issue 模板
- [ ] 批量操作
- [ ] 与其他 Atlassian 工具集成
- [ ] 工作流和状态转换
- [ ] 时间跟踪

## 支持与反馈

### 💬 我们期待您的反馈！

您的反馈帮助 jira-cli 变得更好。以下是分享您想法的方式：

#### 🐛 发现 Bug？

1. 查看 [Issues](https://github.com/pchuri/jira-cli/issues) 页面
2. 创建新的 [Bug 报告](https://github.com/pchuri/jira-cli/issues/new?template=bug_report.md)

#### 💡 有功能想法？

1. 创建 [功能请求](https://github.com/pchuri/jira-cli/issues/new?template=feature_request.md)
2. 加入我们的 [讨论区](https://github.com/pchuri/jira-cli/discussions) 与社区交流

#### 📝 一般反馈？

- 通过 [反馈 Issue](https://github.com/pchuri/jira-cli/issues/new?template=feedback.md) 分享您的体验
- 在 [NPM](https://www.npmjs.com/package/@pchuri/jira-cli) 上给我们评分
- 如果觉得有用，请给仓库点个 Star！⭐

#### 🤝 想要贡献？

查看我们的 [贡献指南](https://github.com/pchuri/jira-cli/blob/main/CONTRIBUTING.md) - 欢迎所有贡献！

### 📈 使用分析

为了帮助我们了解 jira-cli 的使用情况并改进它，我们收集匿名使用统计信息。包括：

- 命令使用频率（无个人数据）
- 错误模式（更快修复 Bug）
- 功能采用指标

您可以随时通过设置以下环境变量退出：`export JIRA_CLI_ANALYTICS=false`

---

为 JIRA 社区用 ❤️ 打造
