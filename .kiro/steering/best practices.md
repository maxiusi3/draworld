---
type: "always_apply"
---

# 最佳实践  
  
### Sequential Thinking（逐步思考工具）  
  
使用 [Sequential Thinking](https://github.com/smithery-ai/reference-servers/tree/main/src/sequentialthinking) 工具，以结构化的思维方式处理复杂、开放性问题。  
  
- 将任务拆解为若干 **思维步骤（thought steps）**。  
- 每一步应包括：  
  1.**明确当前目标或假设**（如：“分析登录方案”，“优化状态管理结构”）。  
  2.**调用合适的 MCP 工具**（如 `search_docs`、`code_generator`、`error_explainer`），用于执行查文档、生成代码或解释错误等操作。Sequential Thinking 本身不产出代码，而是协调过程。  
  3.**清晰记录本步骤的结果与输出**。  
  4.**确定下一步目标或是否分支**，并继续流程。  
  
- 在面对不确定或模糊任务时：  
  - 使用“分支思考”探索多种方案。  
  - 比较不同路径的优劣，必要时回滚或修改已完成的步骤。  
  
- 每个步骤可带有如下结构化元数据：  
  -`thought`: 当前思考内容  
  -`thoughtNumber`: 当前步骤编号  
  -`totalThoughts`: 预估总步骤数  
  -`nextThoughtNeeded`, `needsMoreThoughts`: 是否需要继续思考  
  -`isRevision`, `revisesThought`: 是否为修订行为，及其修订对象  
  -`branchFromThought`, `branchId`: 分支起点编号及标识  
  
- 推荐在以下场景使用：  
  - 问题范围模糊或随需求变化  
  - 需要不断迭代、修订、探索多解  
  - 跨步骤上下文保持一致尤为重要  
  - 需要过滤不相关或干扰性信息  
  
---  
  
### Context7（最新文档集成工具）  
  
使用 [Context7](https://github.com/upstash/context7) 工具获取特定版本的最新官方文档与代码示例，用于提升生成代码的准确性与当前性。  
  
-**目的**：解决模型知识过时问题，避免生成已废弃或错误的 API 用法。  
  
-**使用方式**：  
  1.**调用方式**：在提示词中加入 `use context7` 触发文档检索。  
  2.**获取文档**：Context7 会拉取当前使用框架/库的相关文档片段。  
  3.**集成内容**：将获取的示例与说明合理集成到你的代码生成或分析中。