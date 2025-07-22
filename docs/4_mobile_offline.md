# Mobile Offline \- Tool Suite Design

# Overview

This tab outlines the specific requirements and technical design considerations for the Mobile Offline tool suite within the `@salesforce/mobile-web-mcp-server` MCP server.

The Mobile Offline suite provides grounding context and reviews to help LWC developers create components that adhere to Mobile Offline design patterns, by focusing on design patterns that will allow their LWCs to be primed for offline usage by the Komaci offline static analysis engine. This ensures compatibility with offline-supported apps like Salesforce Mobile App Plus and the Field Service Mobile App, which rely on Komaci for offline data priming.

---

# Tool Suite Design

The Mobile Offline tool suite consists of two orchestrated MCP server tools designed to provide comprehensive offline compatibility analysis for Lightning web components.

## Core Design Principles

* **Violation-Focused Analysis:** The primary goal is to identify design patterns that violate offline requirements for data priming and suggest alternative patterns that accomplish the developer's original intent in an offline-friendly manner.

* **Complete Violation Coverage:** Since any offline violation will result in an LWC that cannot be primed, the goal is to equally address every discovered offline violation, to ensure the highest confidence of compatibility with Komaci offline priming of LWCs.

* **Automated Orchestration Architecture:** Two complementary MCP server tools work together with built-in orchestration instructions, ensuring comprehensive offline analysis regardless of which tool is called first. Both tools include explicit LLM guidance for workflow coordination.

* **Expert-Driven Analysis:** Each tool is internally composed of multiple expert analyzers, each specializing in specific offline violation categories. The guidance tool contains expert instructors (providing review instructions), while the analysis tool contains expert reviewers (conducting static analysis).

* **Schema-Driven Consistency:** All tools use Zod-based TypeScript schemas to ensure runtime validation, consistent data formats, and seamless orchestration between tools and results.

* **Transformation Guidance:** Rather than modifying code directly, tools provide detailed instructions for the MCP client to transform LWCs away from offline violations toward offline-compatible design patterns.

## Tool Architecture

### Tool 1: `sfmobile-web-offline-guidance`

**Purpose:** Expert instruction delivery for agentic offline violation analysis

**Internal Architecture:**
The tool contains multiple expert instructors, each specializing in specific offline violation categories that require intelligent pattern recognition and contextual analysis.

**Operation:**
When called, the tool returns structured expert review instructions (`ExpertsReviewInstructionsSchema`) containing:

- **Expert Instructions Array:** Each expert instructor provides specialized review guidance for their violation category
- **Orchestration Guidance:** Built-in instructions for MCP client workflow coordination
- **Expected Response Format:** Complete schema structure and input values that LLM responses must follow, providing both the JSON schema definition and specific values to use when constructing responses

**Key Capabilities:**

- **No Input Required:** Provides comprehensive expert review instructions without requiring component code
- **Violation-Specific Expertise:** Each expert instructor delivers targeted guidance for specific offline compatibility issues
- **Agentic Analysis Focus:** Handles violation categories requiring intelligent pattern recognition rather than simple rule-based detection
- **Format Consistency:** All expert instructions specify the same response format structure and input values for unified result processing

**Supported Violation Categories:**

1. **Unsupported Conditional Rendering:** Detection and conversion of modern conditional directives (`lwc:if`, `lwc:elseif`, `lwc:else`) to legacy directives (`if:true`, `if:false`) required by Komaci offline static analysis engine
2. **Inline GraphQL Queries in @wire Adapters:** Detection and refactoring of literal GraphQL query strings within `@wire` adapter calls to separate getter methods

_[Additional violation categories to be added as agentic analysis capabilities expand]_

### Tool 2: `sfmobile-web-offline-analysis`

**Purpose:** Expert static analysis for discrete offline violation detection and remediation

**Internal Architecture:**
The tool contains multiple expert reviewers, each specializing in specific offline violation categories that can be reliably detected through automated ESLint rule-based analysis.

**Operation:**
When called with an LWC component bundle (`LwcCodeSchema`), the tool performs automated expert analysis and returns structured results (`ExpertsCodeAnalysisIssuesSchema`) containing:

- **Expert Analysis Results:** Each expert reviewer provides specialized violation analysis for their category
- **Orchestration Guidance:** Built-in instructions for MCP client workflow coordination
- **Detailed Issue Reports:** Precise violation identification with location data and remediation guidance

**Key Capabilities:**

- **LWC Bundle Input:** Accepts complete component bundles via `LwcCodeSchema` structure
- **Automated Expert Analysis:** Each expert reviewer runs specialized ESLint rules using `@salesforce/eslint-plugin-lwc-graph-analyzer`
- **Static Analysis Focus:** Handles violation categories that can be reliably detected through rule-based analysis
- **Format Consistency:** All expert analysis results conform to `ExpertCodeAnalysisIssuesSchema` for unified processing

## Orchestration Workflow

Both MCP server tools are designed with built-in orchestration instructions to ensure comprehensive offline compatibility analysis regardless of which tool is called first.

### Orchestration Design Principles

* **Order Independence:** Either tool can be called first - both include orchestration instructions to ensure the other tool runs
* **Comprehensive Coverage:** Both tools must execute to provide complete offline violation analysis
* **Output Format Parity:** Both tools produce review results in compatible formats (`ExpertCodeAnalysisIssuesSchema`) for unified processing
* **Automated Orchestration:** Tools include explicit LLM instructions to handle workflow coordination without manual intervention

### Workflow Scenarios

**Scenario 1: Guidance Tool Called First**

1. `sfmobile-web-offline-guidance` returns expert review instructions with orchestration guidance
2. MCP client/LLM executes the review instructions against the LWC code
3. MCP client automatically calls `sfmobile-web-offline-analysis` with the component code
4. MCP client combines both sets of review results for comprehensive refactoring

**Scenario 2: Analysis Tool Called First**

1. `sfmobile-web-offline-analysis` returns static analysis results with orchestration guidance
2. MCP client automatically calls `sfmobile-web-offline-guidance` to obtain agentic review instructions
3. MCP client/LLM executes the agentic review instructions against the LWC code
4. MCP client combines both sets of review results for comprehensive refactoring

### Orchestration Result

The orchestrated workflow ensures that regardless of calling order, the MCP client receives:

- **Agentic Analysis Results:** Expert instructor guidance executed by LLM for complex pattern detection requiring contextual analysis
- **Static Analysis Results:** Expert reviewer analysis through ESLint-based automated detection for rule-based violations
- **Unified Format:** All results conform to `ExpertCodeAnalysisIssuesSchema` enabling seamless result aggregation and processing
- **Complete Expert Coverage:** Combined expertise from all expert instructors and expert reviewers across all offline compatibility categories
- **Automated Coordination:** Schema-embedded orchestration instructions eliminate manual workflow management

---

# Zod Schema Definitions

The Mobile Offline tool suite uses comprehensive Zod-based TypeScript schemas to ensure consistent data formats, runtime validation, and orchestration between tools. All schemas require `import { z } from "zod";` for implementation.

## Core Foundation Schemas

### Expert Reviewer Name Schema

```typescript
const ExpertReviewerNameSchema = z
  .string()
  .describe(
    "The title-cased name of the reviewer providing the review instructions, representing a brief description of the functional area meant to be reviewed."
  );
```

### Code Analysis Issue Schema

```typescript
export const CodeAnalysisIssueSchema = z.object({
  type: z.string().describe("Categorize the issue"),
  code: z
    .string()
    .optional()
    .describe("What is the code snippet with the issue?"),
  description: z.string().describe("Why this is an issue?"),
  intentAnalysis: z
    .string()
    .describe("What is the likely intent of the developer?"),
  suggestedAction: z
    .string()
    .describe(
      "How a developer should address the issue? Be as detailed as possible without adding code snippets."
    ),
  location: z
    .object({
      startLine: z.number(),
      endLine: z.number().optional(),
      startColumn: z.number().optional(),
      endColumn: z.number().optional(),
    })
    .describe(
      "Provide the exact line number(s) and column number(s) where the issue occurs"
    ),
});
```

### Expert Code Analysis Issues Schema

```typescript
export const ExpertCodeAnalysisIssuesSchema = z.object({
  expertReviewerName: ExpertReviewerNameSchema,
  issues: z
    .array(CodeAnalysisIssueSchema)
    .describe(
      "Specific issues found during the analysis. Should be empty if no issues were found."
    ),
});
```

### Expected Response Format Schema

```typescript
const ExpectedResponseFormatSchema = z.object({
  schema: z
    .record(z.any())
    .describe("The JSON schema definition for the expected response format"),
  inputValues: z
    .object({
      expertReviewerName: ExpertReviewerNameSchema,
    })
    .describe(
      "Specific values that should be used as inputs when constructing the response"
    ),
});
```

## Input Schemas

### LWC Component Bundle Schema

```typescript
const LwcFileSchema = z.object({
  path: z
    .string()
    .describe("path to component file relative to LWC component bundle root"),
  content: z.string().describe("content of the file"),
});

export const LwcCodeSchema = z.object({
  name: z.string(),
  namespace: z.string(),
  html: z.array(LwcFileSchema).min(1).describe("LWC component HTML templates."),
  js: z.array(LwcFileSchema).min(1).describe("LWC component JavaScript files."),
  css: z.array(LwcFileSchema).describe("LWC component CSS files."),
  jsMetaXml: LwcFileSchema.describe(
    "LWC component configuration .js-meta.xml file."
  ),
});
```

## Output Schemas

### Expert Review Instructions Schema

```typescript
const ExpertReviewInstructionsSchema = z.object({
  expertReviewerName: ExpertReviewerNameSchema,
  supportedFileTypes: z
    .array(z.enum(["JS", "HTML", "CSS"]))
    .min(1)
    .describe(
      "The list of file types this review should apply to. All content for these files types should be reviewed."
    ),
  grounding: z
    .string()
    .describe("The grounding context that will apply to this expert review."),
  request: z
    .string()
    .describe("The formal review request instructions for the expert review."),
  expectedResponseFormat: ExpectedResponseFormatSchema.describe(
    "The required schema format and input values for the LLM's review response."
  ),
});
```

### Experts Review Instructions Schema (Tool 1 Output)

```typescript
export const ExpertsReviewInstructionsSchema = z.object({
  reviewInstructions: z
    .array(ExpertReviewInstructionsSchema)
    .min(1)
    .describe(
      "An array of LLM-directed instructions to conduct expert reviews of code with supported file types, grounding context, and request fields for processing."
    ),
  orchestrationInstructions: z
    .string()
    .default(
      "If you have not already executed the 'sfmobile-web-offline-analysis' tool in this conversation thread: (1) Execute all review instructions provided in this response against the user's LWC component code, producing structured review results in the specified format, (2) Immediately call the 'sfmobile-web-offline-analysis' tool with the user's component code as input, (3) Combine your review results from step 1 with the analysis results from step 2, then refactor the component based on all combined review recommendations."
    )
    .describe(
      "Instructions for the MCP client on how to orchestrate this tool with the companion analysis tool for comprehensive offline compatibility review."
    ),
});
```

### Experts Code Analysis Issues Schema (Tool 2 Output)

```typescript
export const ExpertsCodeAnalysisIssuesSchema = z.object({
  analysisResults: z
    .array(ExpertCodeAnalysisIssuesSchema)
    .min(1)
    .describe(
      "An array of expert reviews of the code, each outlining specific issues found during analysis."
    ),
  orchestrationInstructions: z
    .string()
    .default(
      "If you have not already executed the 'sfmobile-web-offline-guidance' tool in this conversation thread: (1) Immediately call the 'sfmobile-web-offline-guidance' tool, (2) Execute all review instructions from the guidance tool's output against the user's LWC component code in the specified format, (3) Combine the review results from step 2 with this tool's analysis results, then refactor the component based on all combined review recommendations."
    )
    .describe(
      "Instructions for the MCP client on how to orchestrate this tool with the companion guidance tool for comprehensive offline compatibility review."
    ),
});
```

## Schema Architecture Notes

**Runtime Validation:** All input and output data is validated at runtime using Zod schemas, ensuring type safety and data integrity across the MCP transport boundary.

**Orchestration Integration:** Both output schemas include `orchestrationInstructions` properties with default values that provide explicit workflow guidance to MCP clients, ensuring comprehensive analysis coverage regardless of tool calling order.

**Format Parity:** Both tools ultimately produce review results that conform to `ExpertCodeAnalysisIssuesSchema`, ensuring unified processing of all violation analysis regardless of detection method (agentic vs. static analysis).

**Expert Architecture:** Each tool internally organizes multiple expert analyzers (instructors for guidance, reviewers for analysis) through consistent schema structures.

**Schema-Value Separation:** The `ExpectedResponseFormatSchema` cleanly separates JSON schema definitions from input values, ensuring that MCP clients receive schema structures while maintaining clear guidance on specific values to use when constructing responses within those schemas.

---

# Technical Implementation

## Schema-Driven Architecture

The Mobile Offline tool suite is built on the comprehensive Zod-based schema architecture defined above, enabling:

- **Type Safety:** Runtime validation and type inference across all tool interactions
- **Consistent Data Formats:** Unified structure for all input/output data
- **Orchestration Support:** Built-in workflow coordination through schema-embedded instructions
- **Expert Organization:** Structured approach to organizing multiple expert analyzers

## Bundled Dependencies

The MCP server package includes:

- **Zod:** Runtime schema validation and type inference
- **ESLint:** Core static analysis engine
- **@salesforce/eslint-plugin-lwc-graph-analyzer:** Komaci static analysis-based plugin for detecting offline violations in LWC patterns

## Rule Configuration

- ESLint rule configuration is handled internally by expert reviewers within the MCP server
- No rule configuration input required from MCP clients
- Each expert reviewer manages appropriate rule sets for their specific violation detection categories

---

# MCP Server Tools

Each tool's **Title** field is used as the `title` annotation in the MCP server implementation, providing human-readable display names for client interfaces.

## Tool 1: Mobile Offline Guidance

**Name:** `sfmobile-web-offline-guidance`  
**Title:** Salesforce Mobile Offline LWC Expert Instruction Delivery  
**Description:** Delivers structured expert review instructions for detecting and remediating discrete offline violations in Lightning web components that require agentic analysis and contextual pattern recognition.

### Tool Capabilities

**Expert Instruction Delivery:**

- Multi-expert architecture with specialized instructors for different violation categories
- Structured review instructions optimized for LLM consumption and execution
- Built-in orchestration guidance for comprehensive workflow coordination
- Consistent response format specifications (`ExpectedResponseFormatSchema`) across all expert instructions, providing both schema structure and input values

**Supported Violation Categories:**

1. **Unsupported Conditional Rendering Detection:**
   - Instructions to identify modern conditional directives (`lwc:if`, `lwc:elseif`, `lwc:else`) in HTML templates
   - Conversion guidance to legacy directives (`if:true`, `if:false`) required by Komaci offline analysis engine
   - Rationale explanation for the conversion requirement based on [Salesforce LWC conditional rendering documentation](https://developer.salesforce.com/docs/platform/lwc/guide/create-conditional.html)

2. **Inline GraphQL Query Detection:**
   - Instructions to identify literal GraphQL query strings within `@wire` adapter calls
   - Refactoring guidance to extract queries into separate getter methods
   - Code transformation patterns for maintaining functionality while enabling offline compatibility

### Input Schema

No input required - tool provides discrete violation detection and remediation instructions.

### Output Schema

The tool returns data conforming to `ExpertsReviewInstructionsSchema` (see [Zod Schema Definitions](#zod-schema-definitions) section for complete schema definitions).

**Key Components:**

- **reviewInstructions** - Array of expert review instruction sets for different offline violation categories, each following the `ExpertReviewInstructionsSchema` structure
- **orchestrationInstructions** - Explicit guidance for MCP client on tool orchestration workflow
- **expectedResponseFormat** - Complete schema structure and input values that LLM responses must follow, containing both the JSON schema definition (via `ExpertCodeAnalysisIssuesSchema.shape`) and specific values to use when constructing responses

### Automated Orchestration

This tool includes built-in orchestration instructions that automatically guide the MCP client to:

1. Execute all provided review instructions against the user's LWC component code
2. Call the `sfmobile-web-offline-analysis` tool if not already executed
3. Combine results from both agentic and static analysis for comprehensive refactoring guidance

No manual orchestration required - the tool output contains complete workflow instructions for the MCP client.

---

## Tool 2: Mobile Offline Analysis

**Name:** `sfmobile-web-offline-analysis`  
**Title:** Salesforce Mobile Offline LWC Expert Static Analysis  
**Description:** Performs comprehensive expert-driven static analysis of Lightning web component bundles to detect offline compatibility violations and provide specific remediation instructions through automated rule-based analysis.

### Tool Capabilities

**Expert Static Analysis Processing:**

- Multi-expert architecture with specialized reviewers for different violation categories detectable via ESLint rules
- Automated analysis using `@salesforce/eslint-plugin-lwc-graph-analyzer` with expert-specific rule configurations
- Structured result generation conforming to `ExpertsCodeAnalysisIssuesSchema` for unified processing
- Built-in orchestration guidance for comprehensive workflow coordination with the guidance tool
- Precise violation identification with location data and expert-driven remediation instructions

### Input Schema

The tool accepts LWC component bundles conforming to `LwcCodeSchema` (see [Zod Schema Definitions](#zod-schema-definitions) section for complete schema definitions).

### Output Schema

The tool returns data conforming to `ExpertsCodeAnalysisIssuesSchema` (see [Zod Schema Definitions](#zod-schema-definitions) section for complete schema definitions).

**Key Components:**

- **analysisResults** - Array of expert analysis results, each following the `ExpertCodeAnalysisIssuesSchema` structure containing the expert's name and discovered issues
- **orchestrationInstructions** - Explicit guidance for MCP client on tool orchestration workflow
- **issues** - Detailed violation analysis with precise location data and remediation guidance, each following the `CodeAnalysisIssueSchema` structure

### Automated Orchestration

This tool includes built-in orchestration instructions that automatically guide the MCP client to:

1. Call the `sfmobile-web-offline-guidance` tool if not already executed
2. Execute the agentic review instructions from the guidance tool against the user's LWC component code
3. Combine results from both static and agentic analysis for comprehensive refactoring guidance

No manual orchestration required - the tool output contains complete workflow instructions for the MCP client.

### Violation Categories

_[Placeholder for specific violation categories detected by @salesforce/eslint-plugin-lwc-graph-analyzer]_

The static analysis will detect and report on the following offline violation categories:

- _[Category 1: To be specified]_
- _[Category 2: To be specified]_
- _[Category 3: To be specified]_
- _[Additional categories as defined by the ESLint plugin rules]_
