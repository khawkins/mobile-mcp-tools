# Mobile Native App Generation - MCP Server Design

# Overview

This document outlines the specific requirements and technical design considerations for the **`@salesforce/mobile-native-mcp-server`** within the `mobile-mcp-tools` monorepo. This MCP server represents a revolutionary approach to native mobile app development, transforming natural language user intent directly into production-ready Salesforce Platform-based native mobile applications.

The Mobile Native App Generation server embodies the core vision of **prompt-to-app development**, eliminating the traditional complexity barriers that have historically forced customers to choose between optimal user experience and development feasibility. By leveraging existing Salesforce Mobile SDK tooling and comprehensive documentation grounding, this server enables anyone to create sophisticated native mobile applications through natural language interaction.

---

# High-Level Project Design

## Vision Alignment

This MCP server directly implements the vision outlined in **Mobile Apps with Agentic AI at Salesforce** and **Redefining the Salesforce Mobile Developer Experience**, specifically targeting the elimination of the "development skill tax" that has historically constrained mobile app creation. The server transforms the mobile development paradigm from "figure it out" to "build what you imagined."

### From Intent to Impact: The Four Core Shifts

This server embodies the four fundamental shifts that redefine mobile developer experience:

1. **Machine-Actionable Documentation**: Template metadata and extension guidance that LLMs can reason about and act upon
2. **Intent-Orchestrated CLIs**: Existing Force CLI tools become composable building blocks orchestrated by natural language intent
3. **IDE as Guide**: The development environment becomes an intelligent partner that transforms intent into working software
4. **Apps That Talk Back**: Generated applications provide live feedback for real-time debugging and iteration

## Core Design Principles

### Machine-Actionable Documentation and Metadata

**Philosophy**: "Don't build tools, tell the LLM how to use what we already have."

**From Human-Readable to Machine-Actionable**: Documentation isn't just for humans—it's structured, tagged, and context-rich so LLMs can reason about and act upon it.

- **Rich Template Metadata**: Each mobile SDK template includes comprehensive, structured documentation describing when to use it, its architecture, main files, and crucially, how to extend and build upon it
- **Actionable Extension Guidance**: Specific, step-by-step instructions for common scenarios (e.g., adding opportunity support requires updating `userStore.json` and `userSync.json`) that LLMs can directly execute
- **Embedded Complete Examples**: Verifiable code examples that demonstrate exact implementation patterns
- **Clear Requirements and Dependencies**: Structured information about platform, version, prerequisites, and dependencies that can be programmatically validated
- **Documentation Grounding**: All guidance stems from official Salesforce Mobile SDK documentation, ensuring accuracy and best practices while being machine-interpretable

### Preserve LLM Agency for Self-Healing

- **Guided Autonomy**: Provide comprehensive context and guidance while allowing the LLM to make implementation decisions
- **Error Recovery**: When issues arise, the LLM can adapt and self-correct rather than failing due to overly restrictive tool constraints
- **Adaptive Problem-Solving**: LLM maintains the ability to reason through unexpected scenarios using provided documentation context

### IDE as Intelligent Guide

**Principle**: The IDE should be where the real developer experience begins—not just editing, but understanding, suggesting, and adapting.

**From Editor to Partner**: The development environment becomes an intelligent guide that turns developer intent into working software by stitching together documentation, tools, and SDKs.

- **Contextual Guidance**: All necessary documentation, setup instructions, and troubleshooting guidance delivered directly in the IDE through MCP tools
- **Environment Orchestration**: Comprehensive validation and intelligent setup of required tools (Xcode, Force CLI, simulators) without requiring users to leave their development context
- **In-Context Configuration**: Step-by-step mobile-specific OAuth and connected app configuration guidance delivered exactly when and where needed
- **Next-Step Suggestions**: The assistant doesn't just autocomplete code—it suggests logical next steps based on current context and project state
- **Real-Time Adaptation**: The IDE adapts its guidance based on the specific template, features being implemented, and current project configuration

### Intent-Orchestrated CLIs

**Philosophy**: CLIs don't need more complexity—they need intelligent orchestration by AI assistants.

**From Manual Commands to Intelligent Composition**: Our CLIs stay simple and focused, while AI assistants become command planners that chain steps together, pre-fill parameters, resolve errors, and explain outputs.

- **CLI Tool Orchestration**: Utilize existing `forceios` and `forcedroid` CLI tools as composable building blocks, orchestrated by natural language intent
- **Intelligent Command Planning**: AI assistant acts as command planner, consulting documentation and intelligently invoking CLI commands in sequence to achieve user goals
- **Template-Based Bootstrapping**: Start with proven, tested app templates rather than generating from scratch, using deterministic CLI operations
- **Parameter Pre-filling**: Automatically determine and populate CLI parameters based on user intent and project context
- **Error Resolution**: Automatically diagnose and resolve common CLI errors using documentation guidance
- **Incremental LLM Enhancement**: LLM adds features on top of deterministically created, working foundations

## Four-Phase Workflow Architecture

### Workflow Overview

The four-phase workflow follows this pattern:

- **Plan phase** runs once during initial setup
- **Design/Iterate phase** can run multiple times across sequential user sessions
- **Build and Run phases** are incorporated within Design/Iterate for validation and iteration

### Phase Workflow and Checkpoints

```mermaid
sequenceDiagram
    participant User
    participant PlanPhase as Plan Phase
    participant DesignPhase as Design/Iterate Phase
    participant BuildPhase as Build Phase
    participant RunPhase as Run Phase

    User->>PlanPhase: Initial app request
    PlanPhase->>PlanPhase: Environment setup
    PlanPhase->>PlanPhase: Template selection
    PlanPhase->>PlanPhase: Connected app inputs
    PlanPhase->>BuildPhase: Create skeletal project
    BuildPhase->>RunPhase: Deploy & validate login
    RunPhase->>User: CHECKPOINT: Functioning skeletal app
    User->>DesignPhase: Feature requirements + feedback

    loop Design/Iterate Cycle
        DesignPhase->>DesignPhase: Implement features
        DesignPhase->>BuildPhase: Build updated project
        BuildPhase->>RunPhase: Deploy & validate features
        RunPhase->>User: CHECKPOINT: Feature validation
        alt User satisfied
            User->>User: End cycle
        else User needs refinement
            User->>DesignPhase: Refinement feedback
        end
    end
```

#### Checkpoint: Post-Plan Phase

By the end of the Plan phase, a functioning skeletal mobile app project must be in place. This checkpoint validates:

1. **Build Validation**: Execute Build phase to ensure project builds successfully
2. **Runtime Validation**: Execute Run phase to launch app in virtual device
3. **Login Verification**: Ensure user can successfully login to the functioning app
4. **User Feedback Collection**: Prompt user for feedback to carry into Design/Iterate phase

#### Checkpoint: Post-Design/Iterate Phase

By the end of each Design/Iterate phase, the user validates implemented features:

1. **Build Validation**: Execute Build phase for updated project
2. **Feature Deployment**: Execute Run phase to deploy app to virtual device
3. **Feature Validation**: User reviews implemented features in running app
4. **Satisfaction Check**: User determines if features meet requirements
   - **If satisfied**: End phase cycle
   - **If refinement needed**: Collect feedback and repeat Design/Iterate phase

### Phase 1: Plan

**Objective**: Establish environment and create functioning skeletal mobile app project.

#### Environment Setup

- Validate required development tools for chosen mobile platform using `@salesforce/lwc-dev-mobile-core` CLI plugin
- Leverage existing `sf force lightning local setup` command environment checks
- _Note: CLI plugin requires updates to support structured JSON output via `--json` flag_

#### Template Selection

- Determine optimal `forceios` or `forcedroid` project template based on user requirements
- Templates sourced from existing SalesforceMobileSDK-Templates repo or new template collection
- **CLI Enhancements Required**:
  - Support for template collection URIs in `forceios` and `forcedroid`
  - Collection-level metadata for template registry/directory
  - Template-specific metadata for self-describing projects

#### Template Metadata System

- **Collection Metadata**: Descriptive directory enabling LLM template selection
- **Template Metadata**: Rich project information including:
  - Nature of implemented features
  - Design and implementation considerations
- **Local Access**: All templates and metadata available locally per documentation repository approach
- _Note: Metadata system design details TBD_

#### Connected App Configuration

- Gather required Connected App Client ID and Callback URI
- Essential inputs for baseline mobile app project creation

### Phase 2: Design/Iterate

- **Specification Generation**: Create concrete design documents based on user requirements
- **User Checkpoint**: Present design for user review and feedback before implementation
- **Implementation Roadmap**: Generate detailed plan referencing design document for subsequent phases
- **Iterative Refinement**: Support multiple cycles based on user feedback

### Phase 3: Execute

- **Template Instantiation**: Use CLI tools to create working app foundation from selected template
- **Connected App Configuration**: Guide setup of Salesforce OAuth configuration for mobile applications
- **Feature Implementation**: Add requested features guided by design document and template extension instructions
- **Documentation-Grounded Development**: Reference official Mobile SDK documentation for all implementation decisions

### Phase 4: Run - Apps That Talk Back

- **Deployment**: Leverage existing tooling for app deployment to virtual devices and physical devices
- **Live Feedback Integration**: Generated applications provide structured runtime events back to the IDE/AI assistant including logs, errors, analytics, network requests, and configuration issues
- **Real-Time Debugging**: AI assistant uses live feedback for intelligent troubleshooting and immediate issue resolution
- **Validation with Context**: Verify login functionality and core app features while streaming diagnostic information for rapid iteration
- **Intelligent Error Resolution**: When deployment or runtime issues occur, automatically diagnose problems using live feedback and suggest specific fixes
- **User Handoff**: Provide working, deployable native mobile application with established feedback loop for ongoing development

---

# System Flow

The following sequence diagram illustrates the comprehensive workflow including checkpoints and iterative cycles:

```mermaid
sequenceDiagram
    participant User
    participant MCPHost
    participant MCPClient
    participant PlanTools as Plan Tools
    participant DesignTools as Design/Iterate Tools
    participant ExecuteTools as Execute Tools
    participant RunTools as Run Tools
    participant CLI as Force CLI Tools
    participant Docs as Documentation Sources

    User->>MCPHost: "Build a field service app with barcode scanning"
    MCPHost->>MCPClient: Parse natural language intent

    Note over MCPClient,PlanTools: Phase 1: Plan (One-time)
    MCPClient->>PlanTools: Validate environment setup
    PlanTools->>CLI: Check lwc-dev-mobile-core
    CLI-->>PlanTools: Environment status
    MCPClient->>PlanTools: Discover appropriate templates
    PlanTools->>Docs: Reference template metadata
    Docs-->>PlanTools: Template descriptions and use cases
    PlanTools-->>MCPClient: Recommended template + rationale
    MCPClient->>PlanTools: Gather Connected App inputs
    PlanTools-->>MCPClient: Client ID + Callback URI

    Note over MCPClient,RunTools: Post-Plan Checkpoint
    MCPClient->>ExecuteTools: Create skeletal project
    ExecuteTools->>CLI: forceios/forcedroid create project
    CLI-->>ExecuteTools: Working skeletal app
    MCPClient->>RunTools: Deploy and validate login
    RunTools->>CLI: Deploy to virtual device
    CLI-->>RunTools: Deployment status
    RunTools-->>MCPClient: Login validation results
    MCPClient-->>MCPHost: Functioning skeletal app ready
    MCPHost-->>User: CHECKPOINT: Review skeletal app + provide feedback

    User->>MCPHost: Feature requirements + feedback

    loop Design/Iterate Cycle
        Note over MCPClient,DesignTools: Phase 2: Design/Iterate
        MCPClient->>DesignTools: Generate feature specification
        DesignTools->>Docs: Reference extension patterns
        Docs-->>DesignTools: Implementation guidance
        DesignTools-->>MCPClient: Feature implementation plan

        Note over MCPClient,ExecuteTools: Phase 3: Execute (within iteration)
        MCPClient->>ExecuteTools: Implement features
        ExecuteTools->>Docs: Reference API documentation
        Docs-->>ExecuteTools: Implementation patterns
        ExecuteTools-->>MCPClient: Enhanced application

        Note over MCPClient,RunTools: Phase 4: Run (within iteration)
        MCPClient->>RunTools: Deploy and validate features
        RunTools->>CLI: Deploy to virtual device
        CLI-->>RunTools: Deployment status
        RunTools-->>MCPClient: Feature validation results

        Note over MCPClient,User: Post-Design/Iterate Checkpoint
        MCPClient-->>MCPHost: Feature implementation ready
        MCPHost-->>User: CHECKPOINT: Review implemented features

        alt User satisfied with features
            User->>MCPHost: Approve implementation
            MCPHost-->>User: Complete native mobile app
        else User needs refinement
            User->>MCPHost: Refinement feedback
        end
    end
```

---

# MCP Client Integration and Transport

## Standard MCP Compatibility

The server follows established Model Context Protocol standards for maximum ecosystem compatibility:

- **npx Invocation**: Standardized launch mechanism for frictionless integration

```bash
npx -y @salesforce/mobile-native-mcp-server
```

- **StdioServerTransport Communication**: Uses standard input/output streams per MCP specifications, ensuring broad MCP client compatibility

## Integration Approach

- **Multi-Tool Orchestration**: Complex workflows spanning multiple MCP tools with built-in coordination
- **State Management**: Maintains workflow context across tool calls while remaining stateless at the protocol level
- **Error Handling**: Graceful degradation with comprehensive guidance when issues arise

---

# MCP Server Properties

## Server Metadata

**Name:** `sfdc-mobile-native-mcp-server`  
**Description:** The `sfdc-mobile-native-mcp-server` MCP server provides a comprehensive collection of tools that enable prompt-to-app development for Salesforce Platform-based native mobile applications. The server orchestrates a four-phase workflow (Plan, Design, Execute, Run) leveraging existing Mobile SDK tooling, templates, and documentation to transform natural language intent into production-ready native mobile applications.

## Tool Categories and Annotations

### Planning Tools

| Annotation        | Value   | Notes                                                                |
| :---------------- | :------ | :------------------------------------------------------------------- |
| `readOnlyHint`    | `false` | Environment validation may trigger installation guidance             |
| `destructiveHint` | `false` | No destructive operations, but may recommend software installation   |
| `idempotentHint`  | `true`  | Environment checks and template discovery produce consistent results |
| `openWorldHint`   | `true`  | May need to check local environment state and available templates    |

### Design Tools

| Annotation        | Value   | Notes                                                           |
| :---------------- | :------ | :-------------------------------------------------------------- |
| `readOnlyHint`    | `true`  | Generate specifications without modifying environment           |
| `destructiveHint` | `false` | Specification generation is non-destructive                     |
| `idempotentHint`  | `true`  | Same input produces consistent design specifications            |
| `openWorldHint`   | `false` | Operates on provided requirements without external dependencies |

### Execution Tools

| Annotation        | Value   | Notes                                                                |
| :---------------- | :------ | :------------------------------------------------------------------- |
| `readOnlyHint`    | `false` | Creates and modifies mobile application projects                     |
| `destructiveHint` | `false` | Creates new projects but doesn't modify existing unrelated files     |
| `idempotentHint`  | `false` | Project creation and feature implementation modify file system state |
| `openWorldHint`   | `true`  | Interacts with CLI tools, file system, and documentation sources     |

### Deployment Tools

| Annotation        | Value   | Notes                                                                   |
| :---------------- | :------ | :---------------------------------------------------------------------- |
| `readOnlyHint`    | `false` | Deploys applications to virtual devices                                 |
| `destructiveHint` | `false` | Deployment doesn't destroy existing applications                        |
| `idempotentHint`  | `false` | Deployment creates new application instances                            |
| `openWorldHint`   | `true`  | Requires interaction with deployment infrastructure and virtual devices |

---

# Technical Implementation

## Project Structure

Following the monorepo pattern established in `mobile-mcp-tools`:

```
mobile-native/
├── src/           # MCP server implementation
│   ├── tools/     # Phase-specific tool implementations
│   │   ├── plan/      # Environment validation, template discovery
│   │   ├── design/    # Specification generation, user checkpoints
│   │   ├── execute/   # App creation, feature implementation
│   │   └── run/       # Deployment, validation
│   ├── schemas/   # Zod schemas for tool inputs/outputs
│   └── utils/     # Shared utilities and CLI integrations
├── resources/     # Template metadata and documentation
│   ├── templates/     # Mobile SDK template descriptions and extension guides
│   ├── setup-guides/ # Environment setup instructions
│   └── api-docs/      # Mobile SDK API documentation excerpts
├── scripts/       # Project utilities and maintenance
├── tests/         # Comprehensive testing suite
└── package.json   # Project configuration and dependencies
```

## Tool Suite Organization

### Plan Phase Tools

- **Environment Validator**: Leverages `@salesforce/lwc-dev-mobile-core` CLI plugin to validate development tools for chosen mobile platform
- **Template Discoverer**: Analyzes user intent and recommends optimal `forceios` or `forcedroid` project templates using collection-level metadata
- **Template Metadata Manager**: Accesses self-describing template information including feature descriptions and implementation considerations
- **Connected App Configurator**: Gathers required Connected App Client ID and Callback URI for project creation
- **Skeletal Project Creator**: Creates functioning baseline mobile app project and validates through build/run cycle

### Design/Iterate Phase Tools

- **Feature Specification Generator**: Creates concrete design documents from user requirements and feedback
- **Iterative Design Manager**: Orchestrates multiple design cycles with user feedback integration
- **Implementation Planner**: Generates detailed roadmaps referencing design specifications
- **User Checkpoint Facilitator**: Manages feature validation and refinement approval workflow

### Execute Phase Tools

- **Foundation Creator**: Interfaces with Force CLI tools to instantiate app templates
- **Connected App Configurator**: Guides OAuth setup for mobile application authentication
- **Feature Implementer**: Adds requested functionality guided by design documents and documentation
- **Documentation Grounding Engine**: Provides real-time access to Mobile SDK documentation

### Run Phase Tools - Live Feedback Ecosystem

- **Deployment Orchestrator**: Manages application deployment to virtual devices and physical devices with live monitoring
- **Live Feedback Engine**: Captures and streams structured runtime events from running applications (logs, errors, analytics, network requests, auth issues, SDK misconfigurations)
- **Real-Time Diagnostic Assistant**: Uses live feedback to provide immediate troubleshooting and issue resolution suggestions
- **Validation Engine**: Verifies application functionality and user authentication while monitoring runtime health
- **Intelligent Error Recovery**: Automatically diagnoses common issues and provides specific fixes based on runtime feedback
- **Handoff Coordinator**: Prepares final application deliverables with established feedback loop for ongoing development

## Documentation Integration Strategy

### Template Metadata Management

- **Rich Descriptions**: Each template includes comprehensive metadata describing purpose, structure, and extension patterns
- **Extension Guidance**: Specific instructions for common scenarios (record type additions, feature integrations)
- **Best Practices**: Embedded guidance following official Mobile SDK documentation patterns

### Real-Time Documentation Access: Simple Document Store with Section Selectors

**Architecture Decision**: Implement a minimal documentation storage system where each MCP tool knows exactly which document and section it needs, eliminating complex lookup logic while maintaining local reliability.

#### Simple Documentation System Architecture

The documentation facility consists of two core components:

```typescript
// Minimal Documentation System
interface DocumentationSystem {
  documentStore: SimpleDocumentStore;
  updateManager: DocumentUpdateManager;
}
```

#### Document Configuration Schema

**Simple Document Storage**: Each MCP server lists the documents it needs, and each tool knows exactly which section to extract:

```typescript
interface DocumentationConfig {
  mcpServerName: string;
  documents: DocumentSource[];
  toolMappings: ToolDocumentMapping[];
  updateFrequency: UpdateFrequency;
}

interface DocumentSource {
  id: string; // Unique identifier for this document
  name: string; // Human-readable name
  url: string; // Source URL
  type: 'html' | 'markdown';
}

// Each tool maps to one or more document sections
interface ToolDocumentMapping {
  toolName: string; // e.g., "createiOSProject"
  documents: DocumentReference[]; // Can reference multiple documents/sections
  description: string; // What this documentation provides
}

interface DocumentReference {
  documentId: string; // References DocumentSource.id
  selector?: string; // CSS selector for HTML, simple path for Markdown. If omitted, returns whole document
  label?: string; // Optional label for this document section (e.g., "CLI Commands", "Authentication Setup")
}

// Example configuration for mobile-native MCP server (initial focus)
const mobileNativeDocsConfig: DocumentationConfig = {
  mcpServerName: 'sfdc-mobile-native-mcp-server',
  documents: [
    {
      id: 'forceios-cli-reference',
      name: 'Force iOS CLI Reference',
      url: 'https://developer.salesforce.com/docs/atlas.en-us.mobile_sdk.meta/mobile_sdk/native_ios_tools_forceios.htm',
      type: 'html',
    },
    {
      id: 'forcedroid-cli-reference',
      name: 'Force Android CLI Reference',
      url: 'https://developer.salesforce.com/docs/atlas.en-us.mobile_sdk.meta/mobile_sdk/native_android_tools_forcedroid.htm',
      type: 'html',
    },
    {
      id: 'mobile-auth-setup',
      name: 'Mobile SDK Authentication Setup',
      url: 'https://developer.salesforce.com/docs/atlas.en-us.mobile_sdk.meta/mobile_sdk/oauth_setup.htm',
      type: 'html',
    },
    {
      id: 'mobile-templates',
      name: 'Mobile SDK Template Overview',
      url: 'https://developer.salesforce.com/docs/atlas.en-us.mobile_sdk.meta/mobile_sdk/native_templates.htm',
      type: 'html',
    },
  ],
  toolMappings: [
    {
      toolName: 'createiOSProject',
      documents: [
        {
          documentId: 'forceios-cli-reference',
          selector: '.main .create-section',
          label: 'CLI Commands',
        },
        {
          documentId: 'mobile-templates',
          selector: '.ios-templates',
          label: 'iOS Templates',
        },
      ],
      description:
        'Instructions for creating iOS projects using forceios CLI and available templates',
    },
    {
      toolName: 'createAndroidProject',
      documents: [
        {
          documentId: 'forcedroid-cli-reference',
          selector: '.main .create-section',
          label: 'CLI Commands',
        },
        {
          documentId: 'mobile-templates',
          selector: '.android-templates',
          label: 'Android Templates',
        },
      ],
      description:
        'Instructions for creating Android projects using forcedroid CLI and available templates',
    },
    {
      toolName: 'configureAuthentication',
      documents: [
        {
          documentId: 'mobile-auth-setup',
          // No selector - returns whole document
          label: 'Complete Authentication Guide',
        },
      ],
      description: 'Complete OAuth and connected app configuration guide',
    },
    {
      toolName: 'selectProjectTemplate',
      documents: [
        {
          documentId: 'mobile-templates',
          selector: '.template-options',
          label: 'Template Options',
        },
      ],
      description: 'Available project templates and their use cases',
    },
  ],
  updateFrequency: 'weekly',
};
```

#### Simple Document Storage

**Minimal Processing**: Store whole documents in their native format and parse sections at runtime:

```typescript
interface SimpleDocumentStore {
  storeDocument(document: StoredDocument): Promise<void>;
  getDocument(documentId: string): Promise<StoredDocument | null>;
  getDocumentSection(documentId: string, selector?: string): Promise<string>;
  updateDocument(documentId: string, content: string): Promise<void>;
  listDocuments(): Promise<StoredDocument[]>;
}

interface StoredDocument {
  id: string;
  name: string;
  url: string;
  type: 'html' | 'markdown';
  content: string; // Raw HTML or Markdown content
  lastUpdated: Date;
}

// Built-in parsers for extracting sections
interface DocumentParser {
  extractSection(content: string, selector?: string): string;
}

class HtmlParser implements DocumentParser {
  extractSection(htmlContent: string, cssSelector?: string): string {
    if (!cssSelector) {
      return htmlContent; // Return whole document if no selector
    }
    // Use standard HTML parsing (e.g., jsdom) with CSS selectors
    // Returns the matched section as text/HTML
  }
}

class MarkdownParser implements DocumentParser {
  extractSection(markdownContent: string, pathSelector?: string): string {
    if (!pathSelector) {
      return markdownContent; // Return whole document if no selector
    }
    // Simple path-based selection for Markdown
    // e.g., "## Getting Started > ### Installation"
    // Returns the matched section as Markdown/text
  }
}
```

**Key Principles**:

- **Whole Document Storage**: Each document stored as a single database row in native format
- **Runtime Parsing**: Tools parse and extract sections when needed, not during ingestion
- **Built-in Parsers**: HTML and Markdown parsers included in the MCP server package
- **Flexible Tool Access**: Each tool can access one or more documents, with optional section selectors
- **Optional Selectors**: Tools can get whole documents (no selector) or specific sections (with selector)

#### Tool Interface for Documentation Access

**Direct Document Access**: Each tool accesses exactly the documentation section it needs:

```typescript
// Simple service that tools use to get their documentation
class DocumentationService {
  constructor(
    private documentStore: SimpleDocumentStore,
    private config: DocumentationConfig
  ) {}

  async getDocumentationForTool(toolName: string): Promise<ToolDocumentation> {
    // Find the mapping for this tool
    const mapping = this.config.toolMappings.find(m => m.toolName === toolName);
    if (!mapping) {
      throw new Error(`No documentation mapping found for tool: ${toolName}`);
    }

    // Get all document sections for this tool
    const sections = await Promise.all(
      mapping.documents.map(async docRef => {
        const content = await this.documentStore.getDocumentSection(
          docRef.documentId,
          docRef.selector
        );
        return {
          content,
          label: docRef.label || docRef.documentId,
          documentId: docRef.documentId,
        };
      })
    );

    return {
      sections,
      description: mapping.description,
    };
  }
}

interface ToolDocumentation {
  sections: DocumentationSection[];
  description: string;
}

interface DocumentationSection {
  content: string;
  label: string;
  documentId: string;
}
```

**Storage Implementation**:

- **SQLite Database**: Local, file-based storage for simplicity and reliability
- **Single Table**: Documents stored as rows with `id`, `content`, `type`, `url`, `lastUpdated`
- **Shared Database**: Single database shared across all MCP tools in the server
- **Local Deployment**: Self-contained storage within MCP server installations
- **No External Dependencies**: Standard Node.js libraries (SQLite, jsdom for HTML parsing)

#### Example Tool Implementation

**Simple Tool Usage**: Each tool directly gets its required documentation section:

```typescript
// Example MCP tool implementation
class CreateiOSProjectTool {
  constructor(private documentationService: DocumentationService) {}

  async execute(requirements: ProjectRequirements): Promise<ToolResult> {
    // Tool gets all its configured documentation sections
    const docs = await this.documentationService.getDocumentationForTool('createiOSProject');

    // Format multiple sections into response
    const formattedDocs = docs.sections
      .map(section => `## ${section.label}\n\n${section.content}`)
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `To create your iOS project, follow these steps:

${formattedDocs}

Based on your requirements:
- Project name: ${requirements.name}
- Template: ${requirements.template}
- Platform: iOS

Run the following command:
\`\`\`bash
forceios create --name ${requirements.name} --template ${requirements.template}
\`\`\`

Next steps: ${this.generateNextSteps(requirements)}`,
        },
      ],
    };
  }
}

class ConfigureAuthenticationTool {
  constructor(private documentationService: DocumentationService) {}

  async execute(): Promise<ToolResult> {
    // Gets the whole authentication document (no selector configured)
    const docs = await this.documentationService.getDocumentationForTool('configureAuthentication');

    return {
      content: [
        {
          type: 'text',
          text: `To configure authentication for your mobile app:

${docs.sections[0].content}

Make sure to save your Connected App consumer key and callback URL for the next steps.`,
        },
      ],
    };
  }
}
```

#### Document Update Manager

**Simple Update Process**: Periodically fetch fresh documentation from sources:

```typescript
interface DocumentUpdateManager {
  updateDocument(documentId: string, url: string): Promise<void>;
  updateAllDocuments(config: DocumentationConfig): Promise<void>;
}

class SimpleUpdateManager implements DocumentUpdateManager {
  constructor(private documentStore: SimpleDocumentStore) {}

  async updateDocument(documentId: string, url: string): Promise<void> {
    // Fetch fresh content from URL
    const response = await fetch(url);
    const content = await response.text();

    // Store updated document
    await this.documentStore.updateDocument(documentId, content);
  }

  async updateAllDocuments(config: DocumentationConfig): Promise<void> {
    for (const doc of config.documents) {
      await this.updateDocument(doc.id, doc.url);
    }
  }
}
```

#### GitHub Integration via Project Maintenance Utilities

**Simple Automated Updates**: Weekly documentation refresh via GitHub Actions:

```typescript
// Add to project-maintenance-utilities
export class DocumentationUpdateService {
  async updateMobileNativeDocumentation(): Promise<void> {
    const updateManager = new SimpleUpdateManager(documentStore);
    await updateManager.updateAllDocuments(mobileNativeDocsConfig);
  }
}
```

**GitHub Action Workflow**:

```yaml
# .github/workflows/update-documentation.yml
name: Update Documentation
on:
  schedule:
    - cron: '0 2 * * 1' # Weekly Monday 2AM
  workflow_dispatch:

jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Update documentation
        run: npm run update-docs:mobile-native
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add .
          git diff --staged --quiet || git commit -m "chore: update documentation"
          git push
```

#### Implementation Timeline and Phases

**Phase 1: Core Documentation Storage**

- Simple SQLite document store
- HTML and Markdown parsers (jsdom, marked)
- Basic DocumentationService for tools to access sections
- Initial mobile-native tool integration

**Phase 2: Mobile SDK Documentation**

- Ingest Force iOS/Android CLI documentation
- Configure tool mappings for createiOSProject, createAndroidProject, configureAuthentication
- Test section extraction with CSS selectors
- Implement automated GitHub Actions updates

**Phase 3: Polish and Reliability**

- Error handling for missing documents/selectors
- Markdown path selector implementation
- Performance optimization for document parsing
- Comprehensive testing

#### Simplified Package Structure

```
mobile-mcp-tools/
├── packages/
│   ├── mobile-native/                  # Enhanced with simple documentation
│   │   ├── src/
│   │   │   ├── tools/
│   │   │   │   ├── createiOSProject.ts
│   │   │   │   ├── createAndroidProject.ts
│   │   │   │   └── configureAuthentication.ts
│   │   │   ├── documentation/
│   │   │   │   ├── DocumentationService.ts
│   │   │   │   ├── SimpleDocumentStore.ts
│   │   │   │   ├── HtmlParser.ts
│   │   │   │   ├── MarkdownParser.ts
│   │   │   │   └── config.ts           # Tool mappings configuration
│   │   │   └── database/
│   │   │       └── docs.sqlite         # Local document storage
│   │   └── package.json
│   └── project-maintenance-utilities/   # Enhanced with simple doc updates
│       ├── src/services/implementations/
│       │   └── DocumentationUpdateService.ts
│       └── package.json
```

#### Benefits of Simple Document Store Approach

**vs. URL-Based Documentation Access:**

- **Reliability**: Local documentation eliminates network dependency failures
- **Performance**: Instant document access from local SQLite database
- **Offline**: Works in air-gapped or restricted network environments
- **Consistency**: Guaranteed documentation availability across all user environments

**vs. Complex RAG/Vector Database Systems:**

- **Deployment Simplicity**: No embedding models, vector databases, or complex dependencies
- **Startup Performance**: Instant initialization - just SQLite and standard parsers
- **Predictable Results**: Each tool knows exactly which document section it gets
- **Minimal Resource Usage**: Standard Node.js libraries only
- **Maintenance**: Simple document updates, no complex reindexing or embeddings

**Core Advantages:**

- **Tool-Driven Context**: Each tool knows exactly what documentation it needs (single or multiple documents)
- **Direct Mapping**: No complex lookup logic - tools directly access their configured sections
- **Runtime Parsing**: Parse document sections only when needed, not pre-processed
- **Standard Technologies**: HTML/CSS selectors and simple Markdown paths
- **Flexible Granularity**: Tools can access whole documents or specific sections as needed
- **No Black Box**: Clear, debuggable document → selector → content flow

**Implementation Benefits:**

- **Fast Development**: No need to build complex search/ranking systems
- **Easy Debugging**: Can inspect exact document content and selector results
- **Simple Configuration**: Just document URLs and CSS/path selectors per tool
- **Familiar Technologies**: Developers already know HTML selectors and Markdown structure

_Priority_: Critical for preventing API hallucination and ensuring generated code follows Mobile SDK best practices while maintaining maximum deployment simplicity and developer familiarity.

## CLI Tool Integration

### Force iOS Integration

- **Project Creation**: `forceios create` with template specification
- **Configuration Management**: Automated info.plist and configuration updates
- **Dependency Management**: CocoaPods and Swift Package Manager integration

### Force Android Integration

- **Project Creation**: `forcedroid create` with template specification
- **Gradle Configuration**: Automated build configuration and dependency management
- **Manifest Updates**: AndroidManifest.xml configuration for mobile features

## Workflow Orchestration

### State Management Between Phases

- **Design Document Persistence**: Maintain design specifications across Execute phase tool calls
- **Template Context**: Preserve template metadata and extension guidance throughout implementation
- **Error Context**: Maintain error state and recovery guidance across workflow phases

### User Interaction Patterns

- **Checkpoint Approvals**: Clear handoff points for user review and approval
- **Progress Reporting**: Transparent communication of workflow progress and next steps
- **Error Recovery**: Graceful failure handling with clear guidance for resolution

---

# Security Requirements and Considerations

This project adheres to security best practices established for MCP servers in the AI-assisted development ecosystem.

## Security Profile

| **Security Consideration**  | **Status** | **Notes**                                                        |
| :-------------------------- | :--------- | :--------------------------------------------------------------- |
| **Local Development Focus** | Secure     | All operations target local development environment only         |
| **CLI Tool Interaction**    | Controlled | Uses established Salesforce CLI tools with validated parameters  |
| **Documentation Sources**   | Public     | All documentation sources are public Mobile SDK materials        |
| **User Data**               | None       | No user-specific data stored or transmitted                      |
| **Code Generation**         | Validated  | Generated code follows established Mobile SDK patterns           |
| **External Dependencies**   | Minimal    | Limited to Salesforce CLI tools and established Node.js packages |

## Security Considerations

- **CLI Execution Safety**: All CLI tool invocations use validated parameters and established patterns
- **Template Security**: Mobile SDK templates are sourced from official Salesforce repositories
- **Documentation Integrity**: Documentation sources verified against official Salesforce Mobile SDK materials
- **Local Environment**: All operations contained within user's local development environment

---

# MCP Host Compatibility

## Engineering Standard: Broad MCP Host Compatibility

| **MCP Specification Compliance** | ✅  | Strict adherence to official Model Context Protocol specifications        |
| :------------------------------- | :-: | :------------------------------------------------------------------------ |
| **Open Source Node.js Package**  | ✅  | Published to NPM for broad ecosystem access                               |
| **Domain-Specific Tool Naming**  | ✅  | All tools prefixed with `sfmobile-native` for clear identification        |
| **npx Invocation Support**       | ✅  | Standard `npx -y @salesforce/mobile-native-mcp-server` invocation pattern |
| **stdio Transport**              | ✅  | Standard input/output communication per MCP specifications                |
| **Cross-Host Testing**           | ✅  | Validated against multiple MCP hosts for broad compatibility              |

## Product Priority: Salesforce Platform Integration

### Primary Integration Targets

**Agentforce for Developers (A4D)**:

- Optimized for A4D's MCP Host and Client infrastructure
- Enhanced tool discovery for VSCode development workflows
- Comprehensive testing within A4D environments
- Support for A4D development patterns and enterprise integration

**Salesforce Studio Integration**:

- Strategic alignment with Salesforce Studio roadmap
- Foundation for prompt-to-app capabilities within Salesforce's primary development platform
- Stepping stone toward comprehensive Salesforce development experience

---

# Future Expansion and Roadmap

## Template Ecosystem Evolution

### From App Templates to Feature Templates

**Long-term Vision**: Transition from monolithic app templates to composable feature templates enabling mix-and-match functionality.

- **Current State**: App-focused templates (Field Service App, Sales App, etc.)
- **Future State**: Feature-focused templates (Authentication, Sync, Object Explorer, etc.)
- **Benefits**: Reduced template proliferation, increased customization flexibility, improved LLM comprehension

### Template Metadata Enhancement

- **Interactive Guidance**: Templates with embedded decision trees for extension scenarios
- **Dependency Mapping**: Clear relationships between features and required configurations
- **Version Management**: Template versioning aligned with Mobile SDK releases

## Documentation Integration Advancement

### Real-Time Documentation Access

**Priority**: Resolve documentation integration challenges identified in research phase.

**Investigation Areas**:

- **Salesforce Documentation API**: Direct integration with official documentation systems
- **Semantic Documentation Search**: Advanced vectorization and retrieval for context-specific guidance
- **Dynamic Documentation Updates**: Automatic synchronization with Mobile SDK documentation changes

### LLM Grounding Enhancement

- **Type System Integration**: Direct access to Mobile SDK TypeScript definitions
- **API Validation**: Real-time validation of generated code against current Mobile SDK APIs
- **Best Practice Enforcement**: Automated adherence to Mobile SDK coding standards and patterns

## Advanced Workflow Capabilities

### Live Feedback and Real-Time Debugging

**Priority**: Implement comprehensive "Apps That Talk Back" capability for revolutionary debugging experience.

- **Structured Runtime Events**: Generated applications stream comprehensive runtime data including logs, errors, analytics, network requests, auth issues, and SDK misconfigurations
- **Intelligent Error Diagnosis**: AI assistant analyzes live feedback in real-time to provide immediate troubleshooting and specific resolution guidance
- **Conversational Debugging**: Transform trial-and-error debugging into intelligent iteration through live app feedback
- **Performance Monitoring**: Real-time analysis of app performance with AI-driven optimization suggestions
- **Feature Flag Integration**: Live feedback about feature states and configuration issues with automatic resolution suggestions

### Multi-Platform Support

- **Cross-Platform Templates**: Templates supporting both iOS and Android from single specification
- **Platform-Specific Optimization**: Automatic platform-specific feature implementation
- **Unified Development Experience**: Consistent workflow across mobile platforms

### Integration Ecosystem Expansion

- **Experience Cloud Integration**: Native app templates with Experience Cloud connectivity
- **Agentforce Integration**: Templates with embedded Agentforce agent capabilities
- **Salesforce Data Cloud**: Advanced sync and analytics integration templates

## Quality and Reliability Enhancement

### Automated Testing Integration

- **Generated Code Validation**: Automatic testing of generated mobile applications
- **Template Regression Testing**: Continuous validation of template metadata and extension guidance
- **End-to-End Workflow Testing**: Comprehensive testing of Plan → Design → Execute → Run workflows

### Error Recovery and Self-Healing

- **Intelligent Error Analysis**: Advanced diagnosis of common development issues
- **Automated Resolution**: Self-healing capabilities for common configuration and build problems
- **Learning from Failures**: Continuous improvement based on user interaction patterns

---

# Success Metrics and Evaluation

## Core Success Criteria

### User Experience Metrics

- **Time to Working App**: Measure from initial prompt to deployable application
- **User Intervention Required**: Track instances requiring manual user action outside MCP workflow
- **Success Rate**: Percentage of prompts resulting in working, deployable applications

### Technical Quality Metrics

- **Generated Code Quality**: Adherence to Mobile SDK best practices and coding standards
- **Template Coverage**: Percentage of user intents successfully matched to appropriate templates
- **Documentation Grounding Effectiveness**: Reduction in API hallucination and incorrect implementations

### Ecosystem Integration Metrics

- **MCP Host Compatibility**: Successful operation across target MCP client environments
- **CLI Tool Integration**: Reliability of Force iOS/Android CLI interactions
- **Template Extension Success**: Effectiveness of template metadata in guiding feature additions

## Evaluation Framework

### Automated Evaluation Pipeline

- **Component Testing**: Individual tool validation against known inputs/outputs
- **Integration Testing**: End-to-end workflow testing with realistic user scenarios
- **Regression Testing**: Continuous validation against Mobile SDK updates and changes

### User Study Validation

- **Developer Experience Studies**: Comparative analysis against traditional mobile development workflows
- **Learning Curve Assessment**: Time to productivity for developers new to Mobile SDK
- **Feature Completion Analysis**: Success rates for complex, multi-feature application requirements

---

# TODO: Implementation Specification Details

The following areas require detailed specification before implementation begins:

## Template Metadata Schema Definition

- **Formal Schema**: Zod-based schema for template metadata structure
- **Extension Pattern Specification**: Standardized format for describing template extension scenarios
- **Validation Rules**: Automated validation of template metadata completeness and accuracy

## CLI Tool Integration Specification

- **Parameter Mapping**: Detailed mapping of user requirements to CLI tool parameters
- **Error Handling**: Comprehensive error scenarios and recovery strategies for CLI tool failures
- **Version Compatibility**: Strategy for handling different versions of Force CLI tools

## Documentation Integration Architecture

- **Documentation Source Management**: Automated processes for maintaining current Mobile SDK documentation
- **Context Retrieval Strategy**: Algorithms for selecting relevant documentation based on user intent and implementation context
- **API Evolution Handling**: Processes for adapting to Mobile SDK API changes and deprecations

## Workflow Orchestration Implementation

- **State Management**: Technical specification for maintaining context across workflow phases
- **Checkpoint Implementation**: User interaction patterns and approval workflows
- **Error Recovery Workflows**: Detailed specifications for handling failures at each workflow phase

## Live Feedback and Runtime Integration Implementation

- **Runtime Event Schema**: Structured data formats for streaming logs, errors, analytics, and configuration issues from running applications
- **Feedback Transport Layer**: Secure communication channels between running applications and IDE/AI assistant
- **Real-Time Analysis Engine**: AI capabilities for immediate diagnosis and resolution of runtime issues based on live feedback
- **Device Integration**: Support for both virtual devices (simulators/emulators) and physical devices with consistent feedback streams
- **Privacy and Security**: Ensure live feedback mechanisms maintain user privacy and data security standards

## Quality Assurance Framework

- **Testing Strategy**: Comprehensive testing approach covering unit, integration, and end-to-end scenarios
- **Evaluation Metrics**: Specific, measurable criteria for assessing tool effectiveness and user experience
- **Continuous Improvement**: Feedback loops and improvement processes based on user interactions and outcomes

---

_This document represents the foundational requirements for the Mobile Native App Generation MCP server. Implementation should proceed iteratively, validating core assumptions through prototyping and user feedback while maintaining alignment with the broader vision of democratizing native mobile app development._
