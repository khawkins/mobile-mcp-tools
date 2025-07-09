# `salesforce-mobile-web-mcp-server` Design

# Overview

This tab outlines the specific requirements and technical design considerations for the `salesforce-mobile-web-mcp-server` MCP server and tools.

---

# High-Level Project Design {#high-level-project-design}

* The `salesforce-mobile-web-mcp-server` MCP server exposes tools that provide additional expert grounding to user prompts crafted to create a Lightning web component that uses Mobile Native Capabilities, such as a barcode scanner, location services, contact services, and more.  
* The grounding context provided by each server tool will be in the form of publicly available TypeScript declaration content from [`@salesforce/lightning-types`](https://www.npmjs.com/package/@salesforce/lightning-types), describing the types and APIs available for that native capability within an LWC.  
* The provided grounding context is *entirely static and public in nature*. There is *no* user-specific or authenticated context required by these MCP tools. Their job is to simply provide the API guidance to the original request, which significantly increases the accuracy of the generated components.

## System Flow

The following sequence diagram shows the flow between the user, MCP host (such as Cursor or A4D), and `salesforce-mobile-web-mcp-server` MCP tools. This example models the "Barcode Scanner" MCP tool. All of the other MCP tools in this project will mimic this tool's behavior, with their own provided TypeScript API declarations context.

---

# MCP Client Integration and Transport {#mcp-client-integration-and-transport}

* **npx Invocation:** The project is designed to be easily targeted and invoked by MCP clients using the `npx` approach. For example, clients can launch the server with a command such as:

```
npx -y @salesforce/salesforce-mobile-web-mcp-server
```

  This ensures a frictionless, installation-free experience for developers and tools integrating with the MCP server.


* **StdioServerTransport Communication:** Communication between the MCP server and clients will use the `stdio` transport mechanism, as described in the [Model Context Protocol documentation](https://modelcontextprotocol.io/docs/concepts/transports). This transport leverages standard input/output streams, and is the recommended approach for command-line and local tool scenarios.

---

# MCP Server Properties and Tools {#mcp-server-properties-and-tools}

The `sfdc-mobile-web-mcp-server` MCP server provides a collection of tools that enable developers to create Lightning web components (LWCs) with mobile native capabilities. Each tool provides expert grounding through TypeScript declaration files from the `@salesforce/lightning-types` package.

## Available Tools

### App Review
- **Name:** `sfmobile-web-app-review`
- **Description:** Provides expert grounding to implement a mobile app store review feature in a Salesforce Lightning web component (LWC).
- **API:** `appReviewService.d.ts`

### AR Space Capture
- **Name:** `sfmobile-web-ar-space-capture`
- **Description:** Provides expert grounding to implement a mobile AR space capture feature in a Salesforce Lightning web component (LWC).
- **API:** `arSpaceCapture.d.ts`

### Barcode Scanner
- **Name:** `sfmobile-web-barcode-scanner`
- **Description:** Provides expert grounding to implement a mobile barcode scanner feature in a Salesforce Lightning web component (LWC).
- **API:** `barcodeScanner.d.ts`

### Biometrics Service
- **Name:** `sfmobile-web-biometrics`
- **Description:** Provides expert grounding to implement a mobile biometrics identity feature in a Salesforce Lightning web component (LWC).
- **API:** `biometricsService.d.ts`

### Calendar Service
- **Name:** `sfmobile-web-calendar`
- **Description:** Provides expert grounding to implement a mobile calendar service feature in a Salesforce Lightning web component (LWC).
- **API:** `calendarService.d.ts`

### Contacts Service
- **Name:** `sfmobile-web-contacts`
- **Description:** Provides expert grounding to implement a mobile contacts service feature in a Salesforce Lightning web component (LWC).
- **API:** `contactsService.d.ts`

### Document Scanner
- **Name:** `sfmobile-web-doc-scanner`
- **Description:** Provides expert grounding to implement a mobile document scanning service feature in a Salesforce Lightning web component (LWC).
- **API:** `documentScanner.d.ts`

### Location Services
- **Name:** `sfmobile-web-location`
- **Description:** Provides expert grounding to implement mobile location services in a Salesforce Lightning web component (LWC).
- **API:** `locationService.d.ts`

### NFC Service
- **Name:** `sfmobile-web-nfc`
- **Description:** Provides expert grounding to implement a mobile Near-Field Communication (NFC) service feature in a Salesforce Lightning web component (LWC).
- **API:** `nfcService.d.ts`

### Payments Service
- **Name:** `sfmobile-web-payments`
- **Description:** Provides expert grounding to implement a mobile payments service feature in a Salesforce Lightning web component (LWC).
- **API:** `paymentsService.d.ts`

---

# Technical Implementation {#technical-implementation}

This section outlines the technical design and implementation details for the `salesforce-mobile-web-mcp-server` project, which exists as a sub-project within the `mobile-mcp-tools` monorepo.

## Project Structure

The project follows a standard Node.js/TypeScript project structure:

```
salesforce-mobile-web-mcp-server/
├── src/           # Source code for the MCP server implementation
├── dist/          # Compiled JavaScript output
├── scripts/       # Project utilities and maintenance scripts
├── resources/     # TypeScript declaration files for mobile capabilities
├── tests/         # Test files
└── package.json   # Project configuration and dependencies
```

## Development Environment

### TypeScript Configuration

The project is configured as a TypeScript project with the following key characteristics:

* Uses CommonJS as the module system
* Configured with "NodeNext" module resolution, which:
  * Aligns with Node.js's ESM/CJS dual package hazard resolution
  * Respects `package.json` "exports" field for precise module resolution
  * Supports both `.js` and `.mjs` extensions for ESM imports
  * Enables proper resolution of `@types` packages
  * Provides better compatibility with Node.js's module resolution algorithm
* Inherits base TypeScript configuration from the umbrella project's `tsconfig.base.json`
* Strict type checking enabled

### Code Quality Tools

The project implements several tools to ensure code quality and consistency:

* **Prettier:** Configured for consistent code formatting
* **ESLint:** Implements standard TypeScript linting rules
* **Husky:** Enforces pre-commit hooks to prevent commits with formatting or linting issues

### Testing Infrastructure

The project uses Vitest for its testing framework, providing:

* Unit testing capabilities
* Integration testing for MCP host/client interactions
* Test coverage reporting

## Project Management

### Type Declaration Management

The project maintains a collection of TypeScript declaration files that provide the grounding context for mobile native capabilities. These declarations are sourced from the `@salesforce/lightning-types` package and managed through an automated update process.

#### Declaration File Structure

The declaration files are organized in the `resources/` directory, with each capability in its own subdirectory:

```
resources/
├── mobileCapabilities.d.ts
├── BaseCapability.d.ts
├── appReview/
│   └── appReviewService.d.ts
├── arSpaceCapture/
│   └── arSpaceCapture.d.ts
├── barcodeScanner/
│   └── barcodeScanner.d.ts
├── biometrics/
│   └── biometricsService.d.ts
├── calendar/
│   └── calendarService.d.ts
├── contacts/
│   └── contactsService.d.ts
├── documentScanner/
│   └── documentScanner.d.ts
├── location/
│   └── locationService.d.ts
├── nfc/
│   └── nfcService.d.ts
└── payments/
    └── paymentsService.d.ts
```

#### Update Script

The project includes a dedicated script (`scripts/update-type-declarations.ts`) that automates the process of updating these declaration files. The script:

1. **Package Retrieval:**
   * Downloads (but does not install) the latest `@salesforce/lightning-types` package tarball
   * Uses the locally configured NPM registry
   * Leverages Node.js/NPM tooling for package retrieval

2. **File Extraction:**
   * Extracts the package tarball to a temporary location
   * Locates mobile capability declarations in `dist/lightning/mobileCapabilities/`
   * Identifies both individual capability declarations and shared type definitions

3. **File Management:**
   * Maintains the original directory structure when copying to `resources/`
   * Overwrites existing declaration files in place
   * Preserves the relationship between capability-specific and shared type definitions

4. **Usage:**
   * Available as an npm script: `npm run update-type-declarations`
   * Can be run manually or as part of automated processes
   * Changes are tracked in source control, allowing for review and selective updates

The script is designed to be idempotent and safe to run multiple times, with the expectation that changes will be committed to source control when appropriate.

### Quality Assurance

The project includes several mechanisms to ensure quality:

* Automated testing through Vitest
* Integration tests validating MCP host/client interactions
* A dedicated evaluation script that:
  * Tests generated Lightning web components
  * Scores component accuracy
  * Helps identify potential regressions

## Integration with Umbrella Project

As part of the `mobile-mcp-tools` monorepo:

* Shares common configuration through the umbrella project
* Follows consistent coding standards and practices
* Participates in the monorepo's build and test pipelines

## Future Considerations

The following areas will require additional specification and implementation details:

* Detailed configuration for the TypeScript declaration management script
* Specific test coverage requirements and thresholds
* Integration test scenarios and validation criteria
* Component evaluation metrics and scoring methodology

---

# Security Requirements and Considerations

This project aims to consider all implementation details through the lens of Product Security requirements outlined in [\[DRAFT\] MCP Server Developer Guide - Security Considerations](https://docs.google.com/document/d/1S72RAYpkR7kqIerhSkzM5tC9I4uIFaR0sHloN4RaZ9o/edit?usp=sharing). Here's a summary of security considerations in the [High-Level Project Design](#high-level-project-design) section:

| Sensitive Content | None |
| :---- | :---- |
| **Dynamic Content** | No |
| **User Authentication Context** | None |
| **Persisted State** | None |

---

# A4D MCP Server Requirements

This section is meant to check off the specific requirements for the A4D MCP host, as outlined in [A4D MCP server requirements](https://docs.google.com/document/d/1WAIYoX6xLYKheEi5sOg_WOAXOjPqp8kuGoN3o9VI5_w/edit?usp=sharing).

| MCP Server as open source Node.js package | ✅ | Per design |
| :---- | :---: | :---- |
| MCP tool names prefixed with team-/domain-specific tag | ✅ | All MCP tool names will be prefaced with `sfmobile-`. See [Modular Tooling](?tab=t.0#heading=h.sxdit9tica4s). |
| MCP server executable with `npx -y <npm package name>@<version>` | ✅ | See [MCP Client Integration and Transport](#mcp-client-integration-and-transport) above |
| MCP server uses `stdio` transport | ✅ | See [MCP Client Integration and Transport](#mcp-client-integration-and-transport) above |
