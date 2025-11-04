# @salesforce/magen-mcp-workflow

A reusable workflow orchestration framework for building deterministic, multi-step workflows with LangGraph and the Model Context Protocol (MCP).

## Overview

`mcp-workflow` is a **framework for MCP server authors** who need to orchestrate complex, multi-step processes involving LLM interactions. It provides the infrastructure for workflow execution, state management, and MCP tool coordination, while allowing consumers to define their own domain-specific logic.

### What This Framework Provides

✅ **Infrastructure**:

- `OrchestratorTool`: Manages workflow execution and coordinates MCP tool invocations
- Base classes for MCP tools (`AbstractTool`, `AbstractWorkflowTool`)
- Base classes for workflow nodes (`BaseNode`, `AbstractToolNode`)
- State persistence and checkpointing (via `.magen/` directory)
- Logging infrastructure
- Dependency injection patterns for testability

### What Consumers Provide

❌ **Domain Logic**:

- Your own `StateGraph` definition (workflow structure)
- Your own state annotations (`Annotation.Root`)
- Your own workflow nodes (business operations)
- Your own MCP server tools (domain capabilities)
- Your own MCP server instance

## Installation

```bash
npm install @salesforce/magen-mcp-workflow
```

## Quick Start

```typescript
import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { OrchestratorTool, OrchestratorConfig, BaseNode } from '@salesforce/magen-mcp-workflow';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// 1. Define your state
const MyWorkflowState = Annotation.Root({
  userMessage: Annotation<string>,
  response: Annotation<string>,
});

type State = typeof MyWorkflowState.State;

// 2. Create workflow nodes
class ProcessMessageNode extends BaseNode<State> {
  constructor() {
    super('ProcessMessage');
  }

  execute = (state: State): Partial<State> => {
    return {
      response: `Processed: ${state.userMessage}`,
    };
  };
}

// 3. Build the workflow (uncompiled StateGraph)
const processNode = new ProcessMessageNode();
const workflow = new StateGraph(MyWorkflowState)
  .addNode(processNode.name, processNode.execute)
  .addEdge(START, processNode.name)
  .addEdge(processNode.name, END);

// 4. Configure the orchestrator
const orchestratorConfig: OrchestratorConfig<typeof MyWorkflowState> = {
  toolId: 'my-orchestrator',
  title: 'My Orchestrator',
  description: 'Orchestrates my workflow',
  workflow, // Pass uncompiled StateGraph
  // context defaults to { environment: 'production' }
};

// 5. Create and register the orchestrator
const server = new McpServer({ name: 'my-server', version: '1.0.0' });
const orchestrator = new OrchestratorTool(server, orchestratorConfig);
orchestrator.register({ readOnlyHint: false });
```

## Core Concepts

### The `.magen` Directory

By convention, workflow state and logs are stored in a well-known directory (`.magen/`):

- **Workflow state**: `~/.magen/workflow-state.json`
- **Workflow logs**: `~/.magen/workflow_logs.json`

This can be overridden via the `PROJECT_PATH` environment variable:

```bash
export PROJECT_PATH=/path/to/project
# State stored in: /path/to/project/.magen/
```

### Environment Contexts

The orchestrator supports two execution environments:

- **`production`** (default): Uses `JsonCheckpointSaver` with `.magen/` directory persistence
- **`test`**: Uses `MemorySaver` for in-memory checkpointing (no file I/O)

```typescript
const config: OrchestratorConfig<typeof MyWorkflowState> = {
  // ...
  context: { environment: 'test' }, // For testing
};
```

### Workflow State Management

Workflows maintain session continuity across stateless MCP tool invocations using lightweight state data (`thread_id`). The orchestrator handles:

- Starting new workflow sessions
- Resuming in-progress workflows
- Persisting state between invocations
- Managing LangGraph checkpoints

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Your MCP Server                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Domain Logic                                         │   │
│  │ - StateGraph (workflow structure)                    │   │
│  │ - Nodes (business operations)                        │   │
│  │ - Tools (domain capabilities)                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          │ depends on                       │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ @salesforce/magen-mcp-workflow                       │   │
│  │ - OrchestratorTool                                   │   │
│  │ - Base Classes                                       │   │
│  │ - Checkpointing                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Design Philosophy

This is a **framework, not a library**. Every API is designed with consumers in mind:

1. **Configurability**: Consumers configure the workflow engine with their workflows
2. **Genericity**: All components are generic over state types
3. **Encapsulation**: Implementation details are hidden
4. **Convention over Configuration**: Sensible defaults with escape hatches
5. **Testability**: Dependency injection patterns throughout

## Documentation

For comprehensive documentation, examples, and API references, see the [documentation directory](../../docs/README.md).

## Contributing

This package is part of the `mobile-mcp-tools` monorepo. See the [main README](../../README.md) for contribution guidelines.

## License

MIT
