# MCP Workflow Engine Extraction - Technical Design Document

## Executive Summary

This document specifies the extraction of the LangGraph-based workflow engine from the `mobile-native-mcp-server` package into a new reusable `mcp-workflow` package. This refactoring will enable external teams to leverage our deterministic MCP workflow orchestration capabilities for their own MCP server implementations, while maintaining the `mobile-native-mcp-server` as a reference implementation and active consumer of the extracted engine.

### Document Purpose

This Technical Design Document (TDD) provides comprehensive specifications for the extraction and refactoring work. Upon completion of this document and its associated User Story, developers (human or LLM) should have sufficient detail to implement the changes without additional specification.

### Key Deliverables

1. New `@salesforce/magen-mcp-workflow` package containing reusable workflow engine components
2. Refactored `mobile-native-mcp-server` package consuming the workflow engine as a dependency
3. Comprehensive test coverage (≥95%) for both packages
4. Updated documentation reflecting the new architecture
5. Zero breaking changes for end users of the mobile-native-mcp-server

---

## Consumer Model and Design Philosophy

### Target Audience

The `mcp-workflow` package is designed as **infrastructure for other teams building MCP servers**. Our primary consumers are:

- **Internal teams** building domain-specific MCP servers within the Salesforce ecosystem
- **External teams** (post-publishing) who want deterministic workflow orchestration for their MCP tool interactions
- **Any MCP server author** who needs to orchestrate complex, multi-step processes with LLM interaction

### The Workflow Engine as a Framework

`mcp-workflow` is a **framework, not an application**. It provides:

✅ **What We Provide** (Framework Infrastructure):

- Orchestrator tool for managing workflow execution
- Base classes for MCP tools and workflow nodes
- State persistence and checkpointing (`.magen/` directory)
- Logging infrastructure
- Dependency injection patterns for testability

❌ **What Consumers Provide** (Domain Logic):

- Their own `StateGraph` definitions (workflow structure)
- Their own state annotations (`Annotation.Root`)
- Their own workflow nodes (business logic)
- Their own MCP server tools (domain-specific operations)
- Their own MCP server instance

### Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│ Consumer's MCP Server (e.g., mobile-native-mcp-server)      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Domain-Specific Logic                                │   │
│  │ - StateGraph definition (workflow structure)         │   │
│  │ - State annotations (domain state)                   │   │
│  │ - Workflow nodes (business operations)               │   │
│  │ - MCP tools (domain capabilities)                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          │ depends on                       │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ @salesforce/magen-mcp-workflow                       │   │
│  │ - OrchestratorTool (workflow execution)              │   │
│  │ - Base classes (AbstractTool, BaseNode)              │   │
│  │ - Checkpointing infrastructure                       │   │
│  │ - Logging and storage conventions                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principle

**Every design decision in `mcp-workflow` must support the consumer model:**

1. **Configurability**: Consumers configure the workflow engine with their own workflows, not the other way around
2. **Genericity**: All components are generic over state types and workflow structures
3. **Encapsulation**: Implementation details (checkpointing, thread IDs) are hidden from consumers
4. **Convention over Configuration**: Sensible defaults (`.magen/` directory) with escape hatches (environment variables)
5. **Documentation**: API design assumes consumers are unfamiliar with our implementation

---

## Goals and Objectives

### Primary Goals

1. **Reusability**: Extract workflow engine components into a standalone package that can be consumed by any MCP server project
2. **Maintainability**: Establish clear separation of concerns between generic workflow orchestration and domain-specific mobile app generation logic
3. **Testability**: Achieve ≥95% code coverage through dependency injection and inversion of control patterns
4. **Integration**: Ensure mobile-native-mcp-server remains fully functional as a consumer of the extracted workflow engine
5. **Documentation**: Provide clear guidance for consumers on how to integrate and configure the workflow engine

### Non-Goals

- **Backward Compatibility**: This is pre-release software; breaking changes are acceptable in service of better design
- **Non-Standard Consumption Patterns**: External consumers will use standard npm package management exclusively. We will not support git submodules, direct repository references, or other quasi-internal consumption patterns
- **Additional Features**: This is a refactoring effort; no new workflow capabilities will be added

### Dependency Management Strategy

**Within the Monorepo**:

- `mobile-native-mcp-server` will use **Nx workspace references** to depend on `mcp-workflow`
- Both packages must remain compatible at HEAD at all times
- Breaking changes to `mcp-workflow` require coordinated updates to `mobile-native-mcp-server` in the same commit/PR
- Use `"@salesforce/magen-mcp-workflow": "*"` in `mobile-native-mcp-server/package.json` to ensure in-tree version is always used
- This ensures consistent support and compatibility across the monorepo codebase

**External Consumption** (post-publishing):

- `mcp-workflow` will be published to npmjs.com as a standalone package using the existing `@salesforce/project-maintenance-utilities` infrastructure and GitHub Actions workflows
- External projects will consume `mcp-workflow` through standard npm dependency management with semantic versioning
- External consumers are independent of `mobile-native-mcp-server` and other monorepo code
- Standard npm ecosystem practices apply: versioning, peer dependencies, semver compatibility

### Storage Convention: The `.magen` Directory

**Philosophy**: Convention over configuration for workflow artifacts.

The `mcp-workflow` package adopts an opinionated approach to storage, using a well-known directory (`.magen/`) for workflow state and logs. This provides:

- **Consistency**: All consumers use the same storage location, simplifying documentation and troubleshooting
- **Discoverability**: Developers know where to find workflow artifacts across different projects
- **Simplicity**: No configuration required for the common case
- **Flexibility**: Configurable via `PROJECT_PATH` environment variable for edge cases

**Default Behavior**:

- Workflow state: `~/.magen/workflow-state.json` (or `$PROJECT_PATH/.magen/workflow-state.json`)
- Workflow logs: `~/.magen/workflow_logs.json`
- Hidden directory (`.` prefix) keeps it out of the way during normal development

**Configuration**:

```bash
# Default: Uses home directory
# State stored in: ~/.magen/

# Custom location via environment variable
export PROJECT_PATH=/path/to/project
# State stored in: /path/to/project/.magen/
```

**Rationale**:

- The `.magen` (Magen) name is sufficiently agnostic to remove any specific
  implications of its naming, on the projects that consume it as a framework.
- Hiding the directory (`.` prefix) prevents clutter in project listings
- Environment-based override provides escape hatch without code changes
- Single storage location simplifies cleanup and troubleshooting

**For Consumers**:

- ✅ **Just works**: No configuration needed for most use cases
- ✅ **Testable**: Tests can set `PROJECT_PATH` to temporary directories
- ✅ **Portable**: Same structure works across all platforms (macOS, Linux, Windows)
- ✅ **Discoverable**: Clear documentation of where artifacts live

---

## Current State Assessment

### Architecture Overview

The current workflow engine is tightly integrated into the `mobile-native-mcp-server` package with the following key components:

```
mobile-native-mcp-server/
├── src/
│   ├── common/
│   │   ├── metadata.ts          # Workflow metadata interfaces and schemas
│   │   ├── propertyMetadata.ts  # Property extraction metadata types
│   │   └── schemas.ts            # Common schema definitions
│   ├── logging/
│   │   └── logger.ts             # Logging infrastructure
│   ├── tools/
│   │   ├── base/
│   │   │   ├── abstractTool.ts          # Base class for all MCP tools
│   │   │   └── abstractWorkflowTool.ts  # Base class for workflow tools
│   │   └── workflow/
│   │       └── sfmobile-native-project-manager/
│   │           ├── tool.ts      # Orchestrator implementation
│   │           └── metadata.ts  # Orchestrator metadata
│   └── workflow/
│       ├── graph.ts             # Mobile-specific StateGraph definition
│       ├── metadata.ts          # Mobile-specific state annotations
│       ├── jsonCheckpointer.ts  # Custom checkpoint persistence
│       ├── workflowStatePersistence.ts  # State file I/O
│       ├── nodes/
│       │   ├── abstractBaseNode.ts      # Base class for all nodes
│       │   ├── abstractToolNode.ts      # Base class for tool-invoking nodes
│       │   ├── toolExecutor.ts          # Tool execution abstraction
│       │   └── [mobile-specific nodes]  # Domain-specific implementations
│       ├── services/
│       │   ├── abstractService.ts       # Base class for services
│       │   └── [mobile-specific services]
│       └── utils/
│           └── toolExecutionUtils.ts    # Shared tool execution logic
└── tests/
    └── [corresponding test files]
```

### Dependencies

Current dependencies from `mobile-native-mcp-server/package.json`:

```json
{
  "dependencies": {
    "@langchain/langgraph": "^0.4.9",
    "@modelcontextprotocol/sdk": "^1.20.1",
    "dedent": "^1.7.0",
    "pino": "^9.9.5",
    "zod": "^3.25.67",
    "zod-to-json-schema": "^3.24.6"
  }
}
```

### Key Insights

1. **Hard-coded Orchestrator Name**: The orchestrator tool ID `'sfmobile-native-project-manager'` is hard-coded and referenced throughout the codebase
2. **Tightly Coupled State**: `MobileNativeWorkflowState` and `mobileNativeWorkflow` are specific to the mobile use case
3. **Mixed Concerns**: Generic workflow infrastructure and mobile-specific business logic are intermingled
4. **Shared Utilities**: Several utility modules are genuinely reusable across workflow implementations
5. **Test Patterns**: Existing tests use dependency injection well, providing a good foundation for refactoring

---

## Proposed Architecture

### Package Structure

```
packages/
├── mcp-workflow/                    # NEW: Reusable workflow engine
│   ├── src/
│   │   ├── common/
│   │   │   ├── metadata.ts          # Workflow metadata interfaces and schemas
│   │   │   ├── propertyMetadata.ts  # Property extraction metadata types
│   │   │   └── types.ts             # Common type definitions
│   │   ├── storage/
│   │   │   ├── wellKnownDirectory.ts    # Well-known directory management (.magen/)
│   │   │   └── index.ts
│   │   ├── logging/
│   │   │   ├── logger.ts            # Logger interface and base impl
│   │   │   └── index.ts
│   │   ├── orchestrator/
│   │   │   ├── orchestratorTool.ts  # Generic orchestrator implementation
│   │   │   ├── metadata.ts          # Orchestrator metadata factory
│   │   │   ├── config.ts            # Orchestrator configuration interface
│   │   │   └── index.ts
│   │   ├── checkpointing/
│   │   │   ├── jsonCheckpointer.ts      # JSON-based checkpoint persistence
│   │   │   ├── statePersistence.ts      # State file I/O abstraction
│   │   │   ├── interfaces.ts            # Checkpointing interfaces
│   │   │   └── index.ts
│   │   ├── tools/
│   │   │   ├── abstractTool.ts          # Base class for all MCP tools
│   │   │   ├── abstractWorkflowTool.ts  # Base class for workflow tools
│   │   │   └── index.ts
│   │   ├── nodes/
│   │   │   ├── abstractBaseNode.ts      # Base class for all nodes
│   │   │   ├── abstractToolNode.ts      # Base class for tool-invoking nodes
│   │   │   ├── toolExecutor.ts          # Tool execution abstraction
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── abstractService.ts       # Base class for services
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── toolExecutionUtils.ts    # Shared tool execution logic
│   │   │   ├── threadIdGenerator.ts     # Thread ID generation
│   │   │   └── index.ts
│   │   └── index.ts                     # Main package exports
│   ├── tests/
│   │   └── [test files mirroring src structure]
│   ├── package.json
│   ├── tsconfig.json
│   ├── project.json
│   └── README.md
│
└── mobile-native-mcp-server/        # REFACTORED: Consumes mcp-workflow
    ├── src/
    │   ├── common/
    │   │   └── schemas.ts           # Mobile-specific schemas only
    │   ├── tools/
    │   │   ├── plan/               # Mobile-specific plan tools
    │   │   ├── run/                # Mobile-specific run tools
    │   │   └── utils/              # Mobile-specific utilities
    │   ├── workflow/
    │   │   ├── graph.ts            # Mobile-specific StateGraph
    │   │   ├── metadata.ts         # Mobile-specific state annotations
    │   │   ├── orchestrator.ts     # Mobile orchestrator configuration
    │   │   ├── nodes/              # Mobile-specific node implementations
    │   │   └── services/           # Mobile-specific services
    │   ├── utils/
    │   │   └── FileSystemProvider.ts  # Mobile-specific utilities only
    │   └── index.ts
    └── package.json               # Now depends on @salesforce/magen-mcp-workflow
```

### Core Abstractions

#### 1. Generic Orchestrator Tool

The orchestrator will be generalized to accept configuration:

````typescript
// mcp-workflow/src/orchestrator/config.ts
import { AnnotationRoot, StateDefinition } from '@langchain/langgraph';

/**
 * Workflow execution environment
 */
export type WorkflowEnvironment = 'production' | 'test';

/**
 * Context object for workflow execution configuration
 * Provides high-level environment information without exposing implementation details
 */
export interface WorkflowContext {
  /**
   * Execution environment - determines checkpointing strategy
   * - 'production': Uses JsonCheckpointSaver with .magen/ directory persistence
   * - 'test': Uses MemorySaver for isolated, in-memory state (no file I/O)
   */
  environment: WorkflowEnvironment;
}

/**
 * Orchestrator configuration interface
 *
 * @template TState - An AnnotationRoot type (e.g., typeof MyWorkflowState where MyWorkflowState = Annotation.Root({...}))
 *
 * Example usage:
 * ```
 * const MyWorkflowState = Annotation.Root({ messages: Annotation<string[]>() });
 * const myConfig: OrchestratorConfig<typeof MyWorkflowState> = {
 *   toolId: 'my-orchestrator',
 *   workflow: new StateGraph(MyWorkflowState)...,
 *   context: { environment: 'production' } // Optional, defaults to production
 * };
 * ```
 */
export interface OrchestratorConfig<TState extends AnnotationRoot<StateDefinition>> {
  /** Unique tool identifier for MCP registration */
  toolId: string;

  /** Extended tool title for display */
  title: string;

  /** Tool description for documentation */
  description: string;

  /**
   * The LangGraph StateGraph workflow definition (uncompiled)
   *
   * Note: StateGraph has 8 generic type parameters. The first is the AnnotationRoot itself (TState),
   * and the remaining 7 are set to 'any' because they're inferred during construction and
   * impractical to specify as input parameters.
   *
   * The state type (TState['State']) is automatically derived by StateGraph from the AnnotationRoot.
   */
  workflow: StateGraph<TState, any, any, any, any, any, any, any>;

  /**
   * Workflow execution context
   * Optional - defaults to { environment: 'production' }
   *
   * The environment determines the checkpointing strategy:
   * - 'production': JsonCheckpointSaver with .magen/ directory persistence
   * - 'test': MemorySaver for isolated, in-memory state (no file I/O)
   *
   * All checkpointing implementation details are encapsulated within the orchestrator.
   */
  context?: WorkflowContext;

  /**
   * Logger instance for workflow operations
   * Optional - defaults to logger using wellKnownDirectory for log files
   */
  logger?: Logger;
}

/**
 * Orchestrator input schema
 *
 * Note: The workflow state data is optional/defaulted because the orchestrator
 * can start new workflows (where it doesn't exist yet) or continue existing ones.
 */
export const ORCHESTRATOR_INPUT_SCHEMA = z.object({
  userInput: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      'User input - can be any data structure from initial request or previously executed MCP tool'
    ),
  [WORKFLOW_PROPERTY_NAMES.workflowStateData]: WORKFLOW_STATE_DATA_SCHEMA.default({
    thread_id: '',
  }).describe('Opaque workflow state data. Do not populate unless explicitly instructed to do so.'),
});

export type OrchestratorInput = z.infer<typeof ORCHESTRATOR_INPUT_SCHEMA>;

/**
 * Orchestrator output schema - natural language orchestration prompt
 */
export const ORCHESTRATOR_OUTPUT_SCHEMA = z.object({
  orchestrationInstructionsPrompt: z
    .string()
    .describe('The prompt describing the next workflow action for the LLM to execute.'),
});

export type OrchestratorOutput = z.infer<typeof ORCHESTRATOR_OUTPUT_SCHEMA>;

/**
 * Orchestrator tool metadata type
 * The metadata for the orchestrator tool (inputs/outputs)
 */
export type OrchestratorToolMetadata = ToolMetadata<
  typeof ORCHESTRATOR_INPUT_SCHEMA,
  typeof ORCHESTRATOR_OUTPUT_SCHEMA
>;

/**
 * Factory function to create orchestrator tool metadata from configuration
 * Takes the consumer-provided config and creates the tool metadata with
 * standardized input/output schemas.
 */
export function createOrchestratorToolMetadata<TState extends AnnotationRoot<StateDefinition>>(
  config: OrchestratorConfig<TState>
): OrchestratorToolMetadata {
  return {
    toolId: config.toolId,
    title: config.title,
    description: config.description,
    inputSchema: ORCHESTRATOR_INPUT_SCHEMA, // Standard orchestrator input schema
    outputSchema: ORCHESTRATOR_OUTPUT_SCHEMA, // Standard orchestrator output schema
  };
}

// mcp-workflow/src/orchestrator/orchestratorTool.ts
export class OrchestratorTool<
  TState extends AnnotationRoot<StateDefinition>,
> extends AbstractTool<OrchestratorToolMetadata> {
  private readonly compiledWorkflow: CompiledStateGraph<
    TState['State'], // S - The actual state type extracted from the AnnotationRoot
    any, // U - Update type (derived from state)
    any, // N - Node names (string union)
    any, // I - Input schema
    any, // O - Output schema
    any, // C - Context schema
    any // NodeReturnType
  >;
  private readonly checkpointer: BaseCheckpointSaver;
  private readonly logger: Logger;

  constructor(
    server: McpServer,
    private readonly config: OrchestratorConfig<TState>
  ) {
    super(server, createOrchestratorToolMetadata(config), config.logger);
    this.logger = config.logger || createWorkflowLogger('OrchestratorTool');

    // Initialize checkpointer based on context (encapsulated from consumer)
    const environment = config.context?.environment || 'production';
    if (environment === 'test') {
      // Test environment: Use in-memory checkpointer (no file I/O)
      this.checkpointer = new MemorySaver();
    } else {
      // Production environment: Use JsonCheckpointSaver with .magen/ directory persistence
      const workflowStateStorePath = getWorkflowStateStorePath();
      const statePersistence = new WorkflowStatePersistence(workflowStateStorePath);
      this.checkpointer = new JsonCheckpointSaver(statePersistence);
    }

    // Compile workflow with our checkpointer
    // This is why we accept StateGraph (uncompiled) - compilation requires the checkpointer,
    // which is an implementation detail consumers shouldn't need to manage
    this.compiledWorkflow = config.workflow.compile({
      checkpointer: this.checkpointer,
    });
  }

  // ... handleRequest method uses this.compiledWorkflow ...
}
````

**Design Rationale: Why Accept Uncompiled `StateGraph` and Use Context-Based Configuration?**

The `OrchestratorConfig` accepts an uncompiled `StateGraph` and a simple `context` object for several reasons:

1. **Circular Dependency Prevention**: Compiling a StateGraph requires a checkpointer instance:

   ```typescript
   const compiled = workflow.compile({ checkpointer: someCheckpointer });
   ```

   If consumers had to provide a `CompiledStateGraph`, they would need to create a checkpointer first, which would expose implementation details. By accepting an uncompiled `StateGraph`, the orchestrator can create the checkpointer and compile the workflow internally.

2. **Complete Encapsulation**: Consumers don't need to know about:
   - `MemorySaver` vs `JsonCheckpointSaver` classes
   - `WorkflowStatePersistence` implementation
   - `.magen/` directory structure
   - Checkpointer creation APIs

   They simply specify `context: { environment: 'test' }` or `context: { environment: 'production' }`, and the orchestrator handles all implementation details.

3. **Simple, Intent-Driven API**: The `context.environment` property expresses the _intent_ ('test' or 'production') rather than the _mechanism_ (specific checkpointer classes). This aligns with high-level configuration principles.

4. **Separation of Concerns**: Consumers define _what_ the workflow does (`StateGraph` structure) and _what environment_ it runs in (`context.environment`), while the orchestrator determines _how_ to implement checkpointing, persistence, and thread management.

#### 2. Configurable Base Node

The base node class will be generic over the AnnotationRoot type, with the actual state type derived from `TState["State"]`:

````typescript
// mcp-workflow/src/nodes/abstractBaseNode.ts
import { StateType, StateDefinition } from '@langchain/langgraph';

/**
 * Base class for all workflow nodes
 *
 * @template TState - The state type for the workflow (defaults to StateType<StateDefinition>)
 *
 * Design Note: BaseNode works directly with state types (StateType<SD>) rather than AnnotationRoot types.
 * This simplifies the API for node authors, as nodes operate on state objects and don't need
 * to understand LangGraph's AnnotationRoot metadata. The AnnotationRoot constraint is kept
 * at the OrchestratorConfig level where it's needed for LangGraph compilation.
 *
 * The default type (StateType<StateDefinition>) is LangGraph's own type for workflow state.
 *
 * Example:
 * ```
 * const MyWorkflowState = Annotation.Root({ count: Annotation<number>() });
 * type State = typeof MyWorkflowState.State; // This is StateType<typeof MyWorkflowState.spec>
 *
 * class IncrementNode extends BaseNode<State> {
 *   constructor() {
 *     super('increment');
 *   }
 *
 *   execute = (state: State) => {
 *     return { count: state.count + 1 };
 *   };
 * }
 * ```
 */
export abstract class BaseNode<TState = StateType<StateDefinition>> {
  public readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  abstract execute: (state: TState) => Partial<TState>;
}
````

#### 3. Workflow-Aware Tool Base Class

The `AbstractWorkflowTool` class provides a base for tools that participate in workflow orchestration:

```typescript
// mcp-workflow/src/tools/abstractWorkflowTool.ts
import z from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { AbstractTool } from './abstractTool.js';
import {
  MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
  MCPWorkflowToolOutput,
  WORKFLOW_PROPERTY_NAMES,
  WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
  WorkflowStateData,
  WorkflowToolMetadata,
} from '../common/metadata.js';
import { Logger } from '../logging/logger.js';

/**
 * Abstract base class for all workflow-participating tools.
 *
 * Workflow tools return guidance prompts that instruct the LLM to invoke the
 * orchestrator tool next, along with the necessary workflow state data.
 *
 * The orchestrator tool itself extends AbstractTool directly, as it controls
 * the workflow rather than participating in it.
 */
export abstract class AbstractWorkflowTool<
  TMetadata extends WorkflowToolMetadata<
    typeof WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
    z.ZodObject<z.ZodRawShape>,
    typeof MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA
  >,
> extends AbstractTool<TMetadata> {
  protected readonly orchestratorToolId: string;

  constructor(
    server: McpServer,
    toolMetadata: TMetadata,
    orchestratorToolId: string, // ID of the orchestrator managing this workflow
    loggerComponentName?: string,
    logger?: Logger
  ) {
    super(server, toolMetadata, loggerComponentName, logger);
    this.orchestratorToolId = orchestratorToolId;
  }

  /**
   * Utility method for tools to add post-invocation instructions
   * that guide the LLM back to the orchestrator for workflow continuation.
   *
   * This does NOT invoke the orchestrator - it creates guidance prompts that
   * instruct the LLM to invoke the orchestrator tool next.
   *
   * @param prompt The main tool response prompt
   * @param workflowStateData Workflow state data to round-trip back to orchestrator
   * @param resultSchema The optional result schema to format the LLM's output.
   *                     If not provided, uses the tool's default result schema.
   * @returns Complete prompt with post-invocation instructions
   */
  protected finalizeWorkflowToolOutput(
    prompt: string,
    workflowStateData: WorkflowStateData,
    resultSchema?: TMetadata['resultSchema'] | string
  ): CallToolResult {
    let resultSchemaToUse = resultSchema ?? this.toolMetadata.resultSchema;
    if (!(typeof resultSchemaToUse === 'string')) {
      resultSchemaToUse = JSON.stringify(zodToJsonSchema(resultSchemaToUse));
    }

    // Create guidance instructions that tell the LLM to invoke the orchestrator next
    const postInstructions = `

# Post-Tool-Invocation Instructions

## 1. Format the results from the execution of your task

The output of your task should conform to the following JSON schema:

\`\`\`json
${resultSchemaToUse}
\`\`\`

## 2. Invoke the next tool to continue the workflow

You MUST initiate the following actions to proceed with the in-progress workflow.

### 2.1. Invoke the \`${this.orchestratorToolId}\` tool

Invoke the \`${this.orchestratorToolId}\` tool to continue the workflow.

### 2.2 Provide input values to the tool

Provide the following input values to the \`${this.orchestratorToolId}\` tool:

- \`${WORKFLOW_PROPERTY_NAMES.userInput}\`: The structured results from step 1.
- \`${WORKFLOW_PROPERTY_NAMES.workflowStateData}\`: ${JSON.stringify(workflowStateData)}

This will continue the workflow orchestration process.
`;

    const promptForLLM = prompt + postInstructions;
    const result: MCPWorkflowToolOutput = {
      promptForLLM,
      resultSchema: resultSchemaToUse,
    };
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
      structuredContent: result,
    };
  }
}
```

**Key Design Points:**

- **Orchestrator Tool ID**: Passed as constructor parameter (not hard-coded from mobile-specific metadata)
- **Already generic**: The current implementation is workflow-agnostic; only the orchestrator tool ID needs to be configurable

#### 4. Metadata Interfaces

Core workflow metadata interfaces remain largely unchanged but are exported from the new package:

```typescript
// mcp-workflow/src/common/metadata.ts
import z from 'zod';

/**
 * Workflow state data schema for round-tripping session identity
 * This lightweight object maintains workflow session continuity across stateless MCP tool invocations
 */
export const WORKFLOW_STATE_DATA_SCHEMA = z.object({
  thread_id: z.string().describe('Unique identifier for the workflow session'),
});

export type WorkflowStateData = z.infer<typeof WORKFLOW_STATE_DATA_SCHEMA>;

/**
 * Workflow property names - single source of truth for property naming
 */
export const WORKFLOW_PROPERTY_NAMES = {
  workflowStateData: 'workflowStateData',
  userInput: 'userInput',
} as const;

/**
 * Base input schema for workflow-aware tools
 * All tools participating in workflow orchestration should extend this schema
 */
export const WORKFLOW_TOOL_BASE_INPUT_SCHEMA = z.object({
  [WORKFLOW_PROPERTY_NAMES.workflowStateData]: WORKFLOW_STATE_DATA_SCHEMA.describe(
    'Workflow session state for continuation. Required for all workflow-aware tools.'
  ),
});

/**
 * Base output schema for workflow-aware tools
 * Contains the workflow state data for session continuity
 */
export const MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA = z.object({
  [WORKFLOW_PROPERTY_NAMES.workflowStateData]: WORKFLOW_STATE_DATA_SCHEMA.describe(
    'Workflow session state for continuation'
  ),
});

/** Base tool metadata interface */
export interface ToolMetadata<
  TInputSchema extends z.ZodObject<z.ZodRawShape>,
  TOutputSchema extends z.ZodObject<z.ZodRawShape>,
> {
  readonly toolId: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: TInputSchema;
  readonly outputSchema: TOutputSchema;
}

/** Workflow tool metadata interface */
export interface WorkflowToolMetadata<
  TInputSchema extends typeof WORKFLOW_TOOL_BASE_INPUT_SCHEMA,
  TResultSchema extends z.ZodObject<z.ZodRawShape>,
  TOutputSchema extends
    typeof MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA = typeof MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA,
> extends ToolMetadata<TInputSchema, TOutputSchema> {
  readonly resultSchema: TResultSchema;
}

/** MCP tool invocation data for LangGraph interrupts */
export interface MCPToolInvocationData<TWorkflowInputSchema extends z.ZodObject<z.ZodRawShape>> {
  llmMetadata: {
    name: string;
    description: string;
    inputSchema: TWorkflowInputSchema;
  };
  input: Omit<z.infer<TWorkflowInputSchema>, 'workflowStateData'>;
}
```

---

## Migration Plan

### Phase 1: Package Scaffolding

**Objective**: Create the new `mcp-workflow` package structure with proper Nx configuration

**Tasks**:

1. Create `packages/mcp-workflow/` directory structure
2. Create `package.json` with appropriate dependencies
3. Create `tsconfig.json` extending workspace base config
4. Create `project.json` for Nx configuration
5. Create initial `README.md` with package purpose and usage overview
6. Configure Nx to recognize the package
7. Add `mcp-workflow` as a dependency in `mobile-native-mcp-server/package.json`

**Acceptance Criteria**:

- `nx build @salesforce/magen-mcp-workflow` succeeds
- `nx test @salesforce/magen-mcp-workflow` runs (even with no tests yet)
- Nx dependency graph shows mobile-native-mcp-server depends on mcp-workflow

### Phase 2: Extract Core Infrastructure

**Objective**: Move foundational components that have no dependencies on mobile-specific logic

**Components to Extract** (in dependency order):

1. **Well-Known Directory Management**
   - Source: `mobile-native-mcp-server/src/utils/wellKnownDirectory.ts`
   - Target: `mcp-workflow/src/storage/wellKnownDirectory.ts`
   - Changes: None - this is already generic and provides convention-over-configuration for workflow artifacts
   - Rationale: Provides consistent storage location (`.magen/`) for workflow state and logs across all consumers. Configurable via `PROJECT_PATH` environment variable for edge cases.
   - Tests: Move `tests/utils/wellKnownDirectory.test.ts` to `tests/storage/wellKnownDirectory.test.ts`

2. **Logging Infrastructure**
   - Source: `mobile-native-mcp-server/src/logging/logger.ts`
   - Target: `mcp-workflow/src/logging/logger.ts`
   - Changes: None - already uses `wellKnownDirectory.ts` which is now part of mcp-workflow
   - Tests: Move and update `tests/logging/logger.test.ts`

3. **Common Metadata**
   - Source: `mobile-native-mcp-server/src/common/metadata.ts`
   - Target: `mcp-workflow/src/common/metadata.ts`
   - Changes: Remove mobile-specific references
   - Tests: Move and update `tests/common/metadata.test.ts`

4. **Property Metadata**
   - Source: `mobile-native-mcp-server/src/common/propertyMetadata.ts`
   - Target: `mcp-workflow/src/common/propertyMetadata.ts`
   - Changes: None (already generic)
   - Tests: Move and update `tests/common/propertyMetadata.test.ts`

5. **Tool Execution Infrastructure**
   - Source: `mobile-native-mcp-server/src/workflow/nodes/toolExecutor.ts`
   - Target: `mcp-workflow/src/nodes/toolExecutor.ts`
   - Changes: None (already generic)
   - Tests: Move `tests/workflow/nodes/toolExecutor.test.ts` to `tests/nodes/toolExecutor.test.ts`

6. **Tool Execution Utils**
   - Source: `mobile-native-mcp-server/src/workflow/utils/toolExecutionUtils.ts`
   - Target: `mcp-workflow/src/utils/toolExecutionUtils.ts`
   - Changes: Update imports
   - Tests: Move `tests/workflow/utils/toolExecutionUtils.test.ts` to `tests/utils/toolExecutionUtils.test.ts`

**Acceptance Criteria**:

- All extracted modules build without errors
- All extracted tests pass with ≥95% coverage
- No circular dependencies exist

### Phase 3: Extract Base Classes

**Objective**: Move abstract base classes used by tools and nodes

**Components to Extract**:

1. **AbstractTool**
   - Source: `mobile-native-mcp-server/src/tools/base/abstractTool.ts`
   - Target: `mcp-workflow/src/tools/abstractTool.ts`
   - Changes: Update imports; remove mobile-specific references
   - Tests: Move `tests/tools/base/abstractTool.test.ts` to `tests/tools/abstractTool.test.ts`

2. **AbstractWorkflowTool**
   - Source: `mobile-native-mcp-server/src/tools/base/abstractWorkflowTool.ts`
   - Target: `mcp-workflow/src/tools/abstractWorkflowTool.ts`
   - Changes: Accept orchestrator tool ID as config parameter instead of hard-coded reference
   - Tests: Move `tests/tools/base/abstractWorkflowTool.test.ts` to `tests/tools/abstractWorkflowTool.test.ts`

3. **AbstractBaseNode**
   - Source: `mobile-native-mcp-server/src/workflow/nodes/abstractBaseNode.ts`
   - Target: `mcp-workflow/src/nodes/abstractBaseNode.ts`
   - Changes: Simplify to work directly with state types (not AnnotationRoot); use `StateType<StateDefinition>` as default generic parameter; update imports to use `StateType` and `StateDefinition` from LangGraph
   - Tests: Create `tests/nodes/abstractBaseNode.test.ts` with comprehensive type safety tests

4. **AbstractToolNode**
   - Source: `mobile-native-mcp-server/src/workflow/nodes/abstractToolNode.ts`
   - Target: `mcp-workflow/src/nodes/abstractToolNode.ts`
   - Changes: Extends BaseNode (inherits default state type generic); update imports
   - Tests: Move `tests/workflow/nodes/abstractToolNode.test.ts` to `tests/nodes/abstractToolNode.test.ts`

5. **AbstractService**
   - Source: `mobile-native-mcp-server/src/workflow/services/abstractService.ts`
   - Target: `mcp-workflow/src/services/abstractService.ts`
   - Changes: Update imports
   - Tests: Move `tests/workflow/services/abstractService.test.ts` to `tests/services/abstractService.test.ts`

**Acceptance Criteria**:

- All base classes build without errors
- All base class tests pass with ≥95% coverage
- Type safety is verified for generic implementations

### Phase 4: Extract Checkpointing Infrastructure

**Objective**: Move state persistence and checkpointing logic

**Components to Extract**:

1. **JsonCheckpointSaver**
   - Source: `mobile-native-mcp-server/src/workflow/jsonCheckpointer.ts`
   - Target: `mcp-workflow/src/checkpointing/jsonCheckpointer.ts`
   - Changes: None (already generic)
   - Tests: Move `tests/workflow/jsonCheckpointer.test.ts` to `tests/checkpointing/jsonCheckpointer.test.ts`

2. **WorkflowStatePersistence**
   - Source: `mobile-native-mcp-server/src/workflow/workflowStatePersistence.ts`
   - Target: `mcp-workflow/src/checkpointing/statePersistence.ts`
   - Changes: None - already uses `wellKnownDirectory.ts` which is now part of mcp-workflow
   - Note: Uses `.magen/workflow-state.json` by default via well-known directory convention
   - Tests: Move `tests/workflow/workflowStatePersistence.test.ts` to `tests/checkpointing/statePersistence.test.ts`

**Acceptance Criteria**:

- Checkpointing infrastructure builds without errors
- All checkpointing tests pass with ≥95% coverage
- State persistence uses `.magen/` directory by default
- `PROJECT_PATH` environment variable allows override for custom storage location

### Phase 5: Extract and Generalize Orchestrator

**Objective**: Create a configurable generic orchestrator that consumers can instantiate

**Components to Extract**:

1. **Orchestrator Configuration Interface**
   - Target: `mcp-workflow/src/orchestrator/config.ts`
   - Changes: New file defining `OrchestratorConfig<TState>` interface

2. **Orchestrator Metadata Factory**
   - Source: Extracted from `mobile-native-mcp-server/src/tools/workflow/sfmobile-native-project-manager/metadata.ts`
   - Target: `mcp-workflow/src/orchestrator/metadata.ts`
   - Changes: Create factory functions that accept toolId, title, description parameters

3. **Generic Orchestrator Tool**
   - Source: `mobile-native-mcp-server/src/tools/workflow/sfmobile-native-project-manager/tool.ts`
   - Target: `mcp-workflow/src/orchestrator/orchestratorTool.ts`
   - Changes:
     - Accept `OrchestratorConfig<TState>` in constructor where `TState extends AnnotationRoot<StateDefinition>`
     - Make generic over AnnotationRoot type (state type is extracted via `TState["State"]`)
     - Remove hard-coded references to mobile-specific elements
     - Accept workflow as configuration instead of importing it
     - **Implement context-based checkpointer creation**:
       - Check `config.context?.environment` (default: 'production')
       - If 'test': Create `MemorySaver` for in-memory checkpointing
       - If 'production': Create `JsonCheckpointSaver` with `WorkflowStatePersistence` using `.magen/` directory
       - Compile workflow with the created checkpointer: `config.workflow.compile({ checkpointer })`
     - **Make thread ID generation generic**: Remove "mobile" prefix from thread ID template, use generic format (e.g., `workflow-${timestamp}` or similar)
   - Tests: Move and generalize `tests/tools/workflow/sfmobile-native-project-manager/tool.test.ts` to `tests/orchestrator/orchestratorTool.test.ts`
     - Update tests to provide `context: { environment: 'test' }`

**Refactoring Orchestrator Prompts**:

The orchestrator creates LLM prompts that reference the orchestrator tool ID. These will need to be dynamic:

```typescript
// Before (hard-coded)
`Invoke the \`${ORCHESTRATOR_TOOL.toolId}\` tool...`
// After (from config)
`Invoke the \`${this.config.toolId}\` tool...`;
```

**Acceptance Criteria**:

- `OrchestratorTool` accepts configuration and works with any StateGraph
- Orchestrator tests pass with ≥95% coverage
- No hard-coded references to mobile-specific concepts remain
- Multiple test scenarios verify orchestrator works with different configurations

### Phase 6: Refactor Mobile Native MCP Server

**Objective**: Update mobile-native-mcp-server to consume the extracted workflow engine

**Changes Required**:

1. **Update Imports**
   - Replace all imports from local `common/`, `tools/base/`, `workflow/nodes/`, etc. with imports from `@salesforce/magen-mcp-workflow`
   - Update relative imports throughout mobile-specific code

2. **Create Mobile Orchestrator Configuration**
   - File: `mobile-native-mcp-server/src/workflow/orchestrator.ts`
   - Content: Factory function that creates `OrchestratorConfig` for mobile workflow

3. **Update Mobile Orchestrator Instantiation**
   - File: `mobile-native-mcp-server/src/index.ts`
   - Change: Use `OrchestratorTool` with mobile configuration instead of `MobileNativeOrchestrator`

4. **Update Node Implementations**
   - Change all mobile-specific nodes to extend generic base classes from mcp-workflow
   - Update state type references to use mobile-specific `State` type

5. **Update Tool Implementations**
   - Change all mobile-specific workflow tools to extend generic base classes from mcp-workflow
   - Pass orchestrator tool ID through configuration

6. **Update Tests**
   - Update all test imports
   - Verify all tests still pass
   - Maintain ≥95% coverage

**Example: Mobile Orchestrator Configuration**

```typescript
// mobile-native-mcp-server/src/workflow/orchestrator.ts
import { OrchestratorConfig, OrchestratorTool } from '@salesforce/magen-mcp-workflow';
import { mobileNativeWorkflow } from './graph.js';
import { State } from './metadata.js';

export const MOBILE_ORCHESTRATOR_TOOL_ID = 'sfmobile-native-project-manager';

export function createMobileOrchestratorConfig(): OrchestratorConfig<typeof State> {
  return {
    toolId: MOBILE_ORCHESTRATOR_TOOL_ID,
    title: 'Salesforce Mobile Native Project Manager',
    description:
      'Orchestrates the end-to-end workflow for generating Salesforce native mobile apps.',
    workflow: mobileNativeWorkflow, // Pass uncompiled StateGraph - orchestrator compiles with checkpointer
    // context defaults to { environment: 'production' } - uses JsonCheckpointSaver with .magen/
  };
}

// mobile-native-mcp-server/src/index.ts
import { OrchestratorTool } from '@salesforce/magen-mcp-workflow';
import { createMobileOrchestratorConfig } from './workflow/orchestrator.js';

const orchestratorConfig = createMobileOrchestratorConfig();
const orchestrator = new OrchestratorTool(server, orchestratorConfig);
orchestrator.register(orchestratorAnnotations);
```

**Acceptance Criteria**:

- mobile-native-mcp-server builds successfully with mcp-workflow as dependency
- All mobile-native-mcp-server tests pass
- Test coverage remains ≥95%
- End-to-end workflow execution works identically to pre-refactoring
- No functionality regressions in mobile app generation

### Phase 7: Documentation and Polish

**Objective**: Provide comprehensive documentation for both packages

**Documentation Tasks**:

1. **mcp-workflow Package Documentation**
   - Create comprehensive `README.md`:
     - Package overview and purpose
     - Installation instructions
     - Quick start guide
     - Architecture overview
     - API reference
     - Configuration guide
     - Extension guide for creating custom workflows
     - Examples section
   - Create TypeDoc comments for all exported APIs
   - Create example workflow implementations (simple and complex)

2. **mobile-native-mcp-server Documentation**
   - Update existing docs to reference mcp-workflow extraction
   - Document the relationship between packages

3. **Monorepo Documentation**
   - Update `docs/README.md` to include mcp-workflow package
   - Update project overview documentation
   - Add new documentation file for the workflow engine (this file!)

4. **Code Comments and JSDoc**
   - Ensure all exported functions have comprehensive JSDoc
   - Add inline comments explaining complex logic
   - Document design decisions in code comments

**Acceptance Criteria**:

- Both packages have comprehensive README.md files
- All exported APIs have JSDoc comments
- Architecture diagrams are updated
- Example workflows are provided and tested
- Documentation builds without errors

---

## Implementation Guidelines

### Dependency Injection and Inversion of Control

**Requirement**: All mocking functionality must be enabled through Dependency Injection (DI) and Inversion of Control (IoC) design patterns in the code under test. Test framework utility classes for swapping runtime implementations represent a code smell and are forbidden.

**Best Practices**:

1. **Constructor Injection**

   ```typescript
   // Good: Dependencies injected through constructor
   export class MyService {
     constructor(
       private readonly toolExecutor: ToolExecutor,
       private readonly logger: Logger
     ) {}
   }

   // Bad: Hard-coded dependencies
   export class MyService {
     private readonly toolExecutor = new LangGraphToolExecutor();
     private readonly logger = createLogger();
   }
   ```

2. **Interface-Based Design**

   ```typescript
   // Define interface
   export interface ToolExecutor {
     execute(data: MCPToolInvocationData): unknown;
   }

   // Production implementation
   export class LangGraphToolExecutor implements ToolExecutor {
     execute(data: MCPToolInvocationData): unknown {
       return interrupt(data);
     }
   }

   // Test implementation
   export class MockToolExecutor implements ToolExecutor {
     execute(data: MCPToolInvocationData): unknown {
       return { mockResult: true };
     }
   }
   ```

3. **Default Parameters with Override Support**

   ```typescript
   export class AbstractToolNode extends BaseNode {
     constructor(
       name: string,
       toolExecutor?: ToolExecutor, // Optional with default
       logger?: Logger // Optional with default
     ) {
       super(name);
       this.toolExecutor = toolExecutor ?? new LangGraphToolExecutor();
       this.logger = logger ?? createComponentLogger(name);
     }
   }
   ```

4. **Context-Based Configuration**

```typescript
export class OrchestratorTool {
  constructor(server: McpServer, config: OrchestratorConfig) {
    // Checkpointer creation handled internally based on config.context.environment
    // Consumers specify intent (production vs test), not implementation details
    // This encapsulates checkpointing complexity away from the consumer API
  }
}
```

### Code Coverage Requirements

**Target**: Minimum 95% code coverage for both packages

**Strategy**:

1. **Unit Tests**: Test individual functions and classes in isolation
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test complete workflow execution paths
4. **Edge Case Tests**: Test error handling, boundary conditions, and failure scenarios

**Coverage Enforcement**:

- Configure vitest to fail builds below 95% coverage
- Generate coverage reports for both packages
- Track coverage in CI/CD pipeline

### Breaking Change Philosophy

**Principle**: Since this is pre-release software, we prioritize optimal design over backward compatibility.

**Guidelines**:

1. Make breaking changes that improve the design
2. Document all breaking changes in migration guide (for internal reference)
3. Update all consumers (mobile-native-mcp-server) in same PR
4. Do not maintain deprecated code paths

### Type Safety

**Requirements**:

1. Use TypeScript strict mode
2. Avoid `any` types except where absolutely necessary
3. Use generics for reusable components
4. Ensure proper type inference for consumer code
5. Export all public types from package index

### Code Quality

**Standards**:

1. Follow existing ESLint configuration
2. Use Prettier for consistent formatting
3. Maintain comprehensive JSDoc comments
4. Keep functions focused and single-purpose
5. Prefer composition over inheritance where appropriate

---

## Testing Strategy

### Test Organization

```
mcp-workflow/
└── tests/
    ├── common/
    │   ├── metadata.test.ts
    │   └── propertyMetadata.test.ts
    ├── logging/
    │   └── logger.test.ts
    ├── orchestrator/
    │   ├── orchestratorTool.test.ts
    │   └── metadata.test.ts
    ├── checkpointing/
    │   ├── jsonCheckpointer.test.ts
    │   └── statePersistence.test.ts
    ├── tools/
    │   ├── abstractTool.test.ts
    │   └── abstractWorkflowTool.test.ts
    ├── nodes/
    │   ├── abstractBaseNode.test.ts
    │   ├── abstractToolNode.test.ts
    │   └── toolExecutor.test.ts
    ├── services/
    │   └── abstractService.test.ts
    ├── utils/
    │   ├── toolExecutionUtils.test.ts
    │   └── threadIdGenerator.test.ts
    └── integration/
        ├── simpleWorkflow.test.ts
        └── complexWorkflow.test.ts
```

### Test Categories

#### 1. Unit Tests

**Purpose**: Test individual components in isolation

**Requirements**:

- Test all public methods
- Test error handling
- Test edge cases
- Use dependency injection for all external dependencies
- Mock all I/O operations

**Example**:

```typescript
// tests/orchestrator/orchestratorTool.test.ts
describe('OrchestratorTool', () => {
  let mockServer: McpServer;
  let mockCheckpointer: BaseCheckpointSaver;
  let mockLogger: Logger;

  beforeEach(() => {
    mockServer = createMockMcpServer();
    mockCheckpointer = new MemorySaver();
    mockLogger = createMockLogger();
  });

  describe('constructor', () => {
    it('should initialize with provided configuration', () => {
      const config: OrchestratorConfig<typeof SimpleState> = {
        toolId: 'test-orchestrator',
        title: 'Test Orchestrator',
        description: 'Test Description',
        workflow: createTestWorkflow(),
        context: { environment: 'test' }, // Test uses MemorySaver internally
      };

      const orchestrator = new OrchestratorTool(mockServer, config, mockLogger);

      expect(orchestrator.toolMetadata.toolId).toBe('test-orchestrator');
    });
  });

  describe('handleRequest', () => {
    it('should start new workflow when no thread_id provided', async () => {
      // Test implementation
    });

    it('should resume workflow when thread_id provided', async () => {
      // Test implementation
    });

    it('should handle workflow completion', async () => {
      // Test implementation
    });

    it('should handle workflow errors gracefully', async () => {
      // Test implementation
    });
  });
});
```

#### 2. Integration Tests

**Purpose**: Test component interactions

**Requirements**:

- Test realistic component combinations
- Use production implementations where possible
- Test state transitions
- Verify data flow between components

**Example**:

```typescript
// tests/integration/simpleWorkflow.test.ts
describe('Simple Workflow Integration', () => {
  it('should execute a simple two-node workflow end-to-end', async () => {
    // Create a simple workflow with two nodes
    const workflow = createSimpleWorkflow();

    // Create orchestrator (defaults to production environment with JsonCheckpointSaver)
    const orchestrator = new OrchestratorTool(mockServer, {
      toolId: 'test-orchestrator',
      title: 'Test',
      description: 'Test',
      workflow,
      context: { environment: 'test' }, // Use test environment for in-memory checkpointing
    });

    // Execute workflow
    const result = await orchestrator.handleRequest({ userInput: { value: 'test' } });

    // Verify complete execution
    expect(result).toBeDefined();
    expect(workflow.isComplete).toBe(true);
  });
});
```

#### 3. E2E Tests

**Purpose**: Test complete workflow scenarios

**Requirements**:

- Test real-world workflow patterns
- Include both synchronous and agentic nodes
- Test state persistence and recovery
- Verify MCP tool invocations

**Example**:

```typescript
// tests/integration/complexWorkflow.test.ts
describe('Complex Agentic Workflow E2E', () => {
  it('should execute workflow with interrupts and resumptions', async () => {
    // Test full workflow lifecycle including interrupts
  });

  it('should recover from checkpoint after process restart', async () => {
    // Test state persistence and recovery
  });
});
```

### Test Utilities

Create shared test utilities using **Dependency Injection and Inversion of Control** patterns. All mock implementations are concrete classes that implement interfaces—**no test framework mocking utilities** (vi.fn(), vi.mock(), jest.mock(), etc.) are used.

**Key Principle: Use Real Implementations When Practical**

Not every dependency needs a mock implementation. When the real implementation is:

- Lightweight and has no external dependencies
- Easy to instantiate in tests
- Deterministic and controllable

**Use the real implementation instead of creating a mock.** This reduces test maintenance burden and ensures tests exercise actual production code paths.

```typescript
// tests/utils/testUtilities.ts

/**
 * Factory function to create a real MCP Server for testing
 *
 * McpServer is complex enough that mocking it is counterproductive.
 * Instead, instantiate a real server instance in tests.
 */
export function createTestMcpServer(): McpServer {
  return new McpServer({
    name: 'test-server',
    version: '1.0.0-test',
  });
}

/**
 * Example: To verify tool registration in tests, you can query the server
 * or use the tool directly through test invocations rather than trying
 * to spy on registration calls.
 */

/**
 * Mock Logger implementation for testing
 * Captures log calls in arrays for verification
 */
export class MockLogger implements Logger {
  public infoLogs: Array<{ message: string; data?: unknown }> = [];
  public debugLogs: Array<{ message: string; data?: unknown }> = [];
  public errorLogs: Array<{ message: string; error?: Error }> = [];
  public warnLogs: Array<{ message: string; data?: unknown }> = [];
  private childLoggers: MockLogger[] = [];

  info(message: string, data?: unknown): void {
    this.infoLogs.push({ message, data });
  }

  debug(message: string, data?: unknown): void {
    this.debugLogs.push({ message, data });
  }

  error(message: string, error?: Error): void {
    this.errorLogs.push({ message, error });
  }

  warn(message: string, data?: unknown): void {
    this.warnLogs.push({ message, data });
  }

  child(bindings: Record<string, unknown>): Logger {
    const childLogger = new MockLogger();
    this.childLoggers.push(childLogger);
    return childLogger;
  }

  /** Test helper: Get all logs of all types */
  getAllLogs(): Array<{ level: string; message: string; data?: unknown }> {
    return [
      ...this.infoLogs.map(l => ({ level: 'info', ...l })),
      ...this.debugLogs.map(l => ({ level: 'debug', ...l })),
      ...this.errorLogs.map(l => ({ level: 'error', ...l })),
      ...this.warnLogs.map(l => ({ level: 'warn', ...l })),
    ];
  }
}

/**
 * Mock Tool Executor for testing agentic nodes
 * Records execution history and returns configurable responses
 */
export class MockToolExecutor implements ToolExecutor {
  public executionHistory: MCPToolInvocationData<z.ZodObject<z.ZodRawShape>>[] = [];
  private responseQueue: unknown[] = [];
  private currentResponseIndex = 0;

  constructor(responses?: unknown | unknown[]) {
    // Support single response or array of responses for multiple calls
    if (responses !== undefined) {
      this.responseQueue = Array.isArray(responses) ? responses : [responses];
    }
  }

  execute(data: MCPToolInvocationData<z.ZodObject<z.ZodRawShape>>): unknown {
    this.executionHistory.push(data);

    if (this.responseQueue.length === 0) {
      return undefined;
    }

    const response = this.responseQueue[this.currentResponseIndex];
    // Loop through responses for multiple calls
    this.currentResponseIndex = (this.currentResponseIndex + 1) % this.responseQueue.length;
    return response;
  }

  /** Test helper: Check if tool was executed with specific data */
  wasExecutedWith(toolName: string): boolean {
    return this.executionHistory.some(call => call.llmMetadata.name === toolName);
  }

  /** Test helper: Get execution count for a specific tool */
  getExecutionCount(toolName?: string): number {
    if (toolName === undefined) {
      return this.executionHistory.length;
    }
    return this.executionHistory.filter(call => call.llmMetadata.name === toolName).length;
  }

  /** Test helper: Reset execution history */
  reset(): void {
    this.executionHistory = [];
    this.currentResponseIndex = 0;
  }
}

/**
 * Factory function to create a simple test workflow
 */
export function createSimpleTestWorkflow(): CompiledStateGraph<SimpleState> {
  const StateAnnotation = Annotation.Root({
    value: Annotation<string>,
  });

  const workflow = new StateGraph(StateAnnotation)
    .addNode('start', state => ({ value: `processed-${state.value}` }))
    .addEdge(START, 'start')
    .addEdge('start', END);

  return workflow.compile();
}

/**
 * Factory function to create a test workflow with interrupt (for testing agentic nodes)
 */
export function createInterruptingTestWorkflow(): CompiledStateGraph<SimpleState> {
  const StateAnnotation = Annotation.Root({
    value: Annotation<string>,
    interruptData: Annotation<unknown>,
  });

  const workflow = new StateGraph(StateAnnotation)
    .addNode('interruptNode', state => {
      const data = interrupt({ test: 'interrupt data' });
      return { interruptData: data };
    })
    .addNode('processNode', state => ({
      value: `processed-${state.value}`,
    }))
    .addEdge(START, 'interruptNode')
    .addEdge('interruptNode', 'processNode')
    .addEdge('processNode', END);

  return workflow.compile();
}
```

**Usage Example in Tests:**

```typescript
// Example test using DI/IoC patterns
describe('OrchestratorTool', () => {
  let server: McpServer; // Real server instance
  let mockLogger: MockLogger;
  let mockToolExecutor: MockToolExecutor;

  beforeEach(() => {
    // Create instances - use real McpServer, mock only what needs mocking
    server = createTestMcpServer();
    mockLogger = new MockLogger();
    mockToolExecutor = new MockToolExecutor({ result: 'test' });
  });

  it('should register orchestrator tool', () => {
    const config: OrchestratorConfig<typeof SimpleState> = {
      toolId: 'test-orchestrator',
      title: 'Test',
      description: 'Test orchestrator',
      workflow: createSimpleTestWorkflow(),
      context: { environment: 'test' }, // Use in-memory checkpointing
    };

    const orchestrator = new OrchestratorTool(server, config, mockLogger);
    orchestrator.register({ readOnlyHint: false });

    // Verify using mock logger's captured logs
    expect(mockLogger.infoLogs.length).toBeGreaterThan(0);
    const registrationLog = mockLogger.infoLogs.find(log =>
      log.message.includes('Registering MCP tool')
    );
    expect(registrationLog).toBeDefined();
  });

  it('should execute workflow with real server', async () => {
    const config: OrchestratorConfig<typeof SimpleState> = {
      toolId: 'test-orchestrator',
      title: 'Test',
      description: 'Test',
      workflow: createSimpleTestWorkflow(),
      context: { environment: 'test' }, // Use in-memory checkpointing
    };

    const orchestrator = new OrchestratorTool(server, config, mockLogger);
    orchestrator.register({ readOnlyHint: false });

    // Test tool invocation through the real server
    const result = await orchestrator.handleRequest({
      userInput: { value: 'test' },
    });

    expect(result).toBeDefined();
  });
});
```

**Key Principles:**

- ✅ **Prefer real implementations** when practical (lightweight, no external dependencies, deterministic)
- ✅ All mocks are concrete classes implementing interfaces
- ✅ Mock behavior is controlled through constructor parameters and public methods
- ✅ Test verification uses public properties (arrays, counters) not framework spies
- ✅ Mock implementations are reusable across tests
- ✅ No runtime patching or monkey-patching
- ✅ Production code remains testable through dependency injection

**When to Mock vs. Use Real Implementations:**

| Dependency Type                     | Strategy                        | Rationale                                                                |
| ----------------------------------- | ------------------------------- | ------------------------------------------------------------------------ |
| `McpServer`                         | ✅ Use real instance            | Complex interface; real implementation is lightweight for tests          |
| `Logger`                            | ✅ Mock with `MockLogger`       | Need to verify logging behavior; real logger has file I/O side effects   |
| `ToolExecutor` (for workflow nodes) | ✅ Mock with `MockToolExecutor` | Production version uses LangGraph interrupt; need controllable responses |
| `MemorySaver` (checkpointer)        | ✅ Use real instance            | Perfect for tests; in-memory, no persistence side effects                |
| `JsonCheckpointSaver`               | ⚠️ Mock or use MemorySaver      | Has file I/O side effects; use MemorySaver in tests instead              |
| Simple workflow `StateGraph`        | ✅ Use real instance            | Deterministic; tests exercise real LangGraph behavior                    |

---

## Nx Monorepo Configuration

### Package Dependencies

Configure Nx to ensure proper build ordering:

```json
// packages/mcp-workflow/project.json
{
  "name": "@salesforce/magen-mcp-workflow",
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{projectRoot}/dist"],
      "options": {
        "main": "{projectRoot}/src/index.ts",
        "outputPath": "packages/mcp-workflow/dist",
        "tsConfig": "{projectRoot}/tsconfig.json"
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "options": {
        "config": "{projectRoot}/vitest.config.mts"
      }
    },
    "test:coverage": {
      "executor": "@nx/vite:test",
      "options": {
        "config": "{projectRoot}/vitest.config.mts",
        "coverage": true
      }
    }
  }
}
```

```json
// packages/mobile-native-mcp-server/project.json
{
  "name": "@salesforce/mobile-native-mcp-server",
  "implicitDependencies": ["@salesforce/magen-mcp-workflow"],
  "targets": {
    "build": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Workspace Configuration

Update workspace package references:

```json
// packages/mobile-native-mcp-server/package.json
{
  "dependencies": {
    "@salesforce/magen-mcp-workflow": "*",
    "@langchain/langgraph": "^0.4.9",
    "@modelcontextprotocol/sdk": "^1.20.1",
    "dedent": "^1.7.0",
    "pino": "^9.9.5",
    "zod": "^3.25.67",
    "zod-to-json-schema": "^3.24.6"
  }
}
```

```json
// packages/mcp-workflow/package.json
{
  "name": "@salesforce/magen-mcp-workflow",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "dependencies": {
    "@langchain/langgraph": "^0.4.9",
    "@langchain/langgraph-checkpoint": "^0.0.11",
    "@langchain/core": "^0.3.28",
    "@modelcontextprotocol/sdk": "^1.20.1",
    "pino": "^9.9.5",
    "zod": "^3.25.67",
    "zod-to-json-schema": "^3.24.6"
  },
  "devDependencies": {
    "@types/node": "^24.8.1",
    "@vitest/coverage-v8": "^3.2.4",
    "typescript": "^5.9.3",
    "vitest": "^3.2.3"
  }
}
```

### Verifying Nx Configuration

Throughout implementation, use these commands to verify Nx correctly recognizes the dependencies:

**1. View Interactive Dependency Graph**

```bash
nx graph
```

This opens a browser window with an interactive visualization of all project dependencies. You should see:

- Both `mcp-workflow` and `mobile-native-mcp-server` as nodes
- A directed edge from `mobile-native-mcp-server` → `mcp-workflow`
- The edge is labeled with the dependency type (usually "implicit" or "npm")

**2. List Project Dependencies**

```bash
nx show project mobile-native-mcp-server --web
```

Opens a browser showing detailed project information including:

- Dependencies array should list `mcp-workflow`
- Build target should show `dependsOn: ["^build"]` ensuring dependencies build first

**3. Check Dependency Resolution**

```bash
# Verify workspace reference resolves to local package
npm ls @salesforce/magen-mcp-workflow

# Expected output should show:
# mobile-mcp-tools@ /path/to/mobile-mcp-tools
# └─┬ @salesforce/mobile-native-mcp-server@0.0.1-alpha.2
#   └── @salesforce/magen-mcp-workflow@0.1.0 -> ./packages/mcp-workflow
```

**4. Test Dependency Build Order**

```bash
# Clean builds to test from scratch
rm -rf packages/*/dist

# Build mobile-native-mcp-server - should trigger mcp-workflow build first
nx build @salesforce/mobile-native-mcp-server --verbose
```

The verbose output should show:

1. `mcp-workflow` build starting
2. `mcp-workflow` build completing
3. `mobile-native-mcp-server` build starting
4. `mobile-native-mcp-server` build completing

**5. Verify No Circular Dependencies**

```bash
nx graph --focus=mcp-workflow
nx graph --focus=mobile-native-mcp-server
```

These focused views help identify any circular dependencies. Neither package should depend on the other (only mobile-native → mcp-workflow).

**Common Issues and Solutions**:

| Issue                             | Symptoms                                                | Solution                                                                                 |
| --------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Nx doesn't recognize new package  | `nx show project mcp-workflow` fails                    | Run `nx reset` to clear cache, then `npm install`                                        |
| Workspace reference not resolving | Import errors in IDE                                    | Ensure `"@salesforce/magen-mcp-workflow": "*"` in package.json, then run `npm install`   |
| Build order incorrect             | `mobile-native-mcp-server` builds before `mcp-workflow` | Add `"dependsOn": ["^build"]` to mobile-native-mcp-server's build target in project.json |
| Dependency not showing in graph   | Graph shows no connection                               | Check both package.json dependency AND project.json implicitDependencies                 |

---

## Acceptance Criteria

### Functional Requirements

- [ ] New `@salesforce/magen-mcp-workflow` package builds successfully
- [ ] `mobile-native-mcp-server` builds successfully with mcp-workflow as dependency
- [ ] All workflow functionality works identically to pre-refactoring state
- [ ] `OrchestratorTool` accepts custom StateGraph configurations
- [ ] `OrchestratorTool` accepts custom tool IDs
- [ ] Checkpointing works with configurable storage locations
- [ ] All base classes are generic over state types
- [ ] No hard-coded references to mobile-specific concepts in mcp-workflow package

### Code Quality Requirements

- [ ] Both packages achieve ≥95% test coverage
- [ ] All tests pass in both packages
- [ ] No circular dependencies exist
- [ ] All exported APIs have comprehensive JSDoc comments
- [ ] TypeScript strict mode enabled with no `any` types (except where necessary)
- [ ] ESLint passes with zero warnings
- [ ] Prettier formatting applied consistently

### Dependency Injection Requirements

- [ ] No test framework mocking utilities used (e.g., no vi.mock, jest.mock)
- [ ] All dependencies injected through constructors
- [ ] All external dependencies have interface abstractions
- [ ] Mock implementations provided for testing
- [ ] Production and test implementations coexist without runtime switching

### Documentation Requirements

- [ ] `mcp-workflow/README.md` provides comprehensive usage guide
- [ ] `mobile-native-mcp-server/README.md` updated to reference extraction
- [ ] All public APIs have JSDoc comments
- [ ] Architecture diagrams updated in docs/
- [ ] Example workflows provided and tested
- [ ] This TDD added to docs/ directory

### Integration Requirements

- [ ] Nx dependency graph correctly shows mobile-native-mcp-server depends on mcp-workflow
  - **Verification**: Run `nx graph` to open the interactive dependency graph viewer
  - **Expected**: Visual graph shows an arrow from `mobile-native-mcp-server` → `mcp-workflow`
  - **CLI Alternative**: Run `nx show project mobile-native-mcp-server --web` and verify `mcp-workflow` appears in the dependencies list
  - **Package.json Check**: Verify `mobile-native-mcp-server/package.json` contains `"@salesforce/magen-mcp-workflow": "*"` in dependencies
  - **project.json Check**: Verify `mobile-native-mcp-server/project.json` includes `"implicitDependencies": ["@salesforce/magen-mcp-workflow"]` (optional but recommended)

- [ ] `nx build --all` succeeds
  - **Verification**: Run `nx run-many --target=build --all` and confirm both packages build without errors
  - **Expected Output**: Build logs show `mcp-workflow` builds before `mobile-native-mcp-server`

- [ ] `nx test --all` succeeds with ≥95% coverage
  - **Verification**: Run `nx run-many --target=test:coverage --all`
  - **Expected**: Both packages show ≥95% coverage in their respective coverage reports

- [ ] `nx build @salesforce/mobile-native-mcp-server` automatically builds mcp-workflow first
  - **Verification**: Run `nx build @salesforce/mobile-native-mcp-server --verbose`
  - **Expected Output**: Build logs show `mcp-workflow` is built as a dependency before `mobile-native-mcp-server` starts building
  - **Dependency Cache**: If `mcp-workflow` is already built and cached, Nx will skip rebuilding it (this is correct behavior)

- [ ] No version conflicts in dependency tree
  - **Verification**: Run `npm ls` from workspace root and check for any warnings about conflicting versions
  - **Shared Dependencies**: Verify both packages use the same versions of shared dependencies like `@langchain/langgraph`, `zod`, etc.
  - **Package Resolution**: Confirm workspace reference resolves correctly: `npm ls @salesforce/magen-mcp-workflow` should show the local workspace package

### Verification Requirements

- [ ] End-to-end mobile app generation workflow executes successfully
- [ ] State persistence and recovery works correctly
- [ ] Agentic node interrupts and resumptions work correctly
- [ ] No functionality regressions in mobile-native-mcp-server
- [ ] Example workflows in mcp-workflow package execute successfully

---

## Outstanding Questions and Considerations

### Resolved During Design

1. **Q**: Should we publish mcp-workflow to npm initially?
   **A**: No. Start with monorepo-only consumption. External publishing is a future consideration.

2. **Q**: How do we handle the hard-coded orchestrator tool ID in AbstractWorkflowTool?
   **A**: Pass orchestrator tool ID as a configuration parameter to AbstractWorkflowTool constructor. Subclasses provide their orchestrator's tool ID.

3. **Q**: Should the logging infrastructure be extracted or remain mobile-specific?
   **A**: Extract the Logger interface and basic implementations. File path configuration allows consumers to specify their logging location.

4. **Q**: How do we maintain the close coupling between mcp-workflow and mobile-native-mcp-server during development?
   **A**: Use Nx workspace references (`"@salesforce/magen-mcp-workflow": "*"`) to ensure packages always use in-tree versions.

### Open Questions for Implementation

1. **Q**: Should we provide a default implementation of StateGraph, or require all consumers to define their own?
   **A**: **RESOLVED**: Require consumers to define their own, as state structure is inherently domain-specific. We can revisit if this adds too much complexity in practice.

2. **Q**: Do we need versioning strategy for the mcp-workflow package, even for internal use?
   **A**: **RESOLVED**: Two-tier versioning strategy:
   - **Internal monorepo consumers**: Depend on the monorepo-local version of the package. All monorepo-hosted projects will be kept in sync with `mcp-workflow` changes (HEAD compatibility).
   - **External consumers**: Strict adherence to semantic versioning. `mcp-workflow` is a first-class, productionized Node.js package hosted at npmjs.com. As a framework consumed by other code, breaking changes must follow semver conventions.

3. **Q**: Should we extract the prompts infrastructure (AbstractPrompt) as well?
   **A**: **RESOLVED**: No, prompts are not part of the core workflow engine. Keep in mobile-native-mcp-server for now. This can be reconsidered in future iterations.

4. **Q**: How should we handle platform-specific utilities like FileSystemProvider?
   **A**: **RESOLVED**: Apply this philosophy: If a utility is generic enough to be meaningfully consumed by `mcp-workflow` and is intertwined with its core functions, extract it into `mcp-workflow`. If the utility is domain-specific or not particularly intertwined with workflow engine functionality, keep it in `mobile-native-mcp-server`.

### Future Publishing Considerations

When the `mcp-workflow` package is ready for external publishing (post-initial extraction), the monorepo already provides comprehensive infrastructure for this purpose:

**Existing Publishing Infrastructure**:

- **`@salesforce/project-maintenance-utilities`**: Provides release orchestration, npm publishing utilities, and GitHub API operations
- **GitHub Actions Workflows**: Automated release and publishing workflows that integrate with project-maintenance-utilities
- **Release Orchestrator**: High-level workflow orchestration (`ReleaseOrchestrator` class) used by GitHub Actions

**Publishing Preparation Checklist** (for future work):

1. Update `mcp-workflow/package.json` to set `"private": false`
2. Ensure comprehensive README.md is complete with usage examples
3. Verify all public APIs are documented with JSDoc
4. Tag a release version following semantic versioning
5. Leverage existing GitHub Actions workflows with project-maintenance-utilities
6. Publish to npm using the established release orchestrator

**Package Configuration Considerations**:

- Package scope: `@salesforce/magen-mcp-workflow`
- Versioning: Follow semantic versioning (major.minor.patch)
- License: MIT (consistent with monorepo)
- Entry point: `dist/index.js` with full TypeScript declarations
- Peer dependencies: Document required versions of `@langchain/langgraph`, `@modelcontextprotocol/sdk`, etc.

This future work is **not part of the current scope** but is noted here to ensure the package structure and configuration are compatible with eventual publishing via the established infrastructure.

---

## Timeline Considerations

### Estimated Effort

**Phase-by-Phase Estimates** (in ideal development time):

- Phase 1: Package Scaffolding - 0.5 days
- Phase 2: Extract Core Infrastructure - 1 day
- Phase 3: Extract Base Classes - 1.5 days
- Phase 4: Extract Checkpointing Infrastructure - 1 day
- Phase 5: Extract and Generalize Orchestrator - 2 days
- Phase 6: Refactor Mobile Native MCP Server - 2 days
- Phase 7: Documentation and Polish - 1 day

**Total Estimated Effort**: 9-10 days

**Actual Timeline**: Depends on team availability, review cycles, and unforeseen issues. Plan for 2-3 weeks to account for reviews and iteration.

### Milestones

1. **Week 1**: Complete Phases 1-3 (scaffolding and infrastructure)
2. **Week 2**: Complete Phases 4-5 (checkpointing and orchestrator)
3. **Week 3**: Complete Phases 6-7 (refactoring and documentation)

### Risk Mitigation

**Risk**: Type system complexity with generic state types

- **Mitigation**: Start with simpler type constraints, iterate based on actual usage

**Risk**: Circular dependencies during extraction

- **Mitigation**: Extract in dependency order (Phase 2 before Phase 3, etc.)

**Risk**: Test coverage drops during refactoring

- **Mitigation**: Move and update tests immediately after moving each component

**Risk**: Mobile native server breaks during refactoring

- **Mitigation**: Keep both packages building at each phase; comprehensive integration tests

---

## References

### Related Documentation

- [Mobile Native App Generation](./5_mobile_native_app_generation.md) - Mobile-specific workflow implementation
- [Project Overview](./1_project_overview.md) - Overall project context

### External Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/) - LangGraph state graph concepts
- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/) - MCP protocol details
- [Nx Monorepo Documentation](https://nx.dev/) - Nx workspace configuration

---

## Appendix A: Package Export Structure

### mcp-workflow Package Exports

```typescript
// packages/mcp-workflow/src/index.ts

// Common types and metadata
export * from './common/metadata.js';
export * from './common/propertyMetadata.js';
export * from './common/types.js';

// Storage (well-known directory)
export * from './storage/index.js';

// Logging
export * from './logging/index.js';

// Orchestrator
export * from './orchestrator/index.js';

// Checkpointing
export * from './checkpointing/index.js';

// Base tool classes
export * from './tools/index.js';

// Base node classes
export * from './nodes/index.js';

// Services
export * from './services/index.js';

// Utilities
export * from './utils/index.js';
```

### Consumer Import Examples

```typescript
// In mobile-native-mcp-server

// Import base classes
import {
  AbstractTool,
  AbstractWorkflowTool,
  BaseNode,
  AbstractToolNode,
} from '@salesforce/magen-mcp-workflow';

// Import orchestrator
import { OrchestratorTool, OrchestratorConfig } from '@salesforce/magen-mcp-workflow';

// Import storage utilities
import {
  getWellKnownDirectoryPath,
  getWorkflowStateStorePath,
  getWorkflowLogsPath,
  WELL_KNOWN_DIR_NAME,
} from '@salesforce/magen-mcp-workflow';

// Import types
import {
  WorkflowToolMetadata,
  MCPToolInvocationData,
  Logger,
} from '@salesforce/magen-mcp-workflow';
```

---

## Appendix B: Example Consumer Implementation

### Simple Workflow Example

```typescript
// example-consumer-server/src/workflow/simpleWorkflow.ts

import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { OrchestratorTool, OrchestratorConfig, BaseNode } from '@salesforce/magen-mcp-workflow';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// 1. Define your state
const SimpleState = Annotation.Root({
  userMessage: Annotation<string>,
  response: Annotation<string>,
});

type State = typeof SimpleState.State;

// 2. Create workflow nodes
class ProcessMessageNode extends BaseNode<State> {
  constructor() {
    super('ProcessMessage');
  }

  execute = (state: State): Partial<State> => {
    return {
      response: `You said: ${state.userMessage}`,
    };
  };
}

// 3. Build the workflow (uncompiled StateGraph)
const processNode = new ProcessMessageNode();

const workflow = new StateGraph(SimpleState)
  .addNode(processNode.name, processNode.execute)
  .addEdge(START, processNode.name)
  .addEdge(processNode.name, END);
// Note: Do NOT call .compile() - OrchestratorTool handles compilation internally

// 4. Configure the orchestrator
const orchestratorConfig: OrchestratorConfig<typeof SimpleState> = {
  toolId: 'simple-orchestrator',
  title: 'Simple Orchestrator',
  description: 'A simple workflow orchestrator',
  workflow, // Pass the uncompiled StateGraph
  // context defaults to { environment: 'production' }
  // Production uses JsonCheckpointSaver with .magen/ directory
  // For tests, pass: context: { environment: 'test' } to use MemorySaver
};

// 5. Create and register the orchestrator
const server = new McpServer({ name: 'simple-server', version: '1.0.0' });
const orchestrator = new OrchestratorTool(server, orchestratorConfig);
orchestrator.register({
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
});
```

---

## Document History

| Version | Date       | Author       | Changes              |
| ------- | ---------- | ------------ | -------------------- |
| 1.0     | 2025-10-22 | AI Assistant | Initial TDD creation |

---

## Approval

This document is ready for review and implementation upon approval.

**Reviewer Sign-off**: _[To be completed]_

**Implementation Start Date**: _[To be determined]_
