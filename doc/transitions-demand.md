  需要实现的命令

  1. jira issue transitions <issue-key>

  列出指定 issue 当前可用的流转步骤。

  - API: GET /rest/api/2/issue/{issueKey}/tra
  nsitions?expand=transitions.fields
  - 输出: 每个 transition 的
  ID、名称、目标状态，以及关联的字段列表（标
  注是否必填、字段类型、可选值）

  示例输出：
  Available transitions for SPRING-9257:
  ─────────────────────────────────────
  [71] 提交审核人员审核修改 → 审核人员审核
    Required fields:
      - 影响版本 (versions): version[]
      - 问题产生原因 (customfield_11501):
  select [非问题, 设计遗漏, 开发遗漏, ...]
      - 问题根因 (customfield_10309):
  textarea
      - 解决方案 (customfield_10310):
  textarea
      - 修改影响分析 (customfield_12501):
  textarea

  [391] 问题单交接 → 进行中
  [411] 非问题 → 回归中

  2. jira issue transition <issue-key>
  <transition-id> [options]

  执行工作流流转并提交字段。

  - API: POST
  /rest/api/2/issue/{issueKey}/transitions
  - 参数:
    - --field <fieldId>=<value>
  (可重复使用，用于文本字段)
    - --field-json <json>
  (用于复杂字段，如版本数组、下拉选项)
    - --fields-file <path> (从 JSON
  文件读取字段，方便 AI agent 调用)

  示例用法：
  # 基本用法
  jira issue transition SPRING-9257 71 \
    --field customfield_10309="UI 文案错误" \
    --field customfield_10310="修改菜单文案"
  \
    --field
  customfield_12501="仅修改文案，无功能影响"

  # 复杂字段用 JSON
  jira issue transition SPRING-9257 71 \
    --fields-file ./transition-fields.json

  # transition-fields.json 格式：
  {
    "versions": [{ "name":
  "XFinity_4.2.000.0.260305" }],
    "customfield_11501": { "value":
  "开发遗漏" },
    "customfield_10309": "问题根因",
    "customfield_10310": "解决方案",
    "customfield_12501": "仅修改 UI
  文案，无功能影响"
  }

  要点提醒

  1. 字段必填判断：API 返回的 required
  不完全准确（Jira screen validator
  的限制），建议在 transitions 命令输出中标注
   API 报告的 required，并加个说明提示实际可
  能有更多必填字段
  2. 错误处理：transition 提交失败时，Jira
  会返回具体的校验错误信息（哪个字段缺失），
  需要清晰地展示给用户
  3. 认证方式：复用现有的 JIRA_API_TOKEN +
  Bearer Token 认证

  这两个命令实现后，SKILL 中就可以直接用 CLI
  完成流转了。