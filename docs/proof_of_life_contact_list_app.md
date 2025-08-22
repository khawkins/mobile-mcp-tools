# Proof of Life: Contact List iOS App - Implementation Plan

## Overview

**This is a living document** that outlines the specific implementation requirements for our first technology preview iteration: an end-to-end workflow that transforms a user utterance into a functioning iOS mobile app displaying a list of Salesforce Contacts.

**Current Iteration Scope**: This first iteration of the document represents a waypoint to define the basic scaffolding of a "happy path" end-to-end flow. It by no means fully defines the end deliverable for customers, but rather establishes the foundational workflow and tooling architecture.

**Evolution Plan**: As we evolve past our proof-of-life iteration, we will evolve this document to flesh out the necessary features for our next steps. The purpose of this document is to:

- Cover the work we're doing right now
- Evolve to reflect the details of the work to come
- Maintain a living reference for implementation teams

**Alignment Note**: This implementation plan directly implements the principles and architecture outlined in [`5_mobile_native_app_generation.md`](./5_mobile_native_app_generation.md), serving as a concrete proof-of-concept for the instruction-first, three-phase workflow approach.

## Success Criteria

**User Journey**: From utterance _"I want an iOS mobile app that will show me a list of all of my Salesforce Contacts"_ to a running iOS app displaying Contacts in a simulator.

**Technical Validation**: Demonstrates instruction-first MCP tools successfully guiding an LLM through the complete Plan → Design/Iterate → Run workflow.

---

## Prerequisites and Assumptions

### Environment Assumptions (Happy Path Focus)

- User is on a supported version of macOS
- User is using Cursor IDE for agentic development
- Pre-installed tools:
  - `@salesforce/mobile-native-mcp-server` MCP server
  - Salesforce CLI with `sfdx-mobilesdk-plugin`, `@salesforce/lwc-dev-mobile`, and `@salesforce/lwc-dev-mobile-core` plugins
  - Supported version of Xcode
- User has a pre-configured Salesforce Connected App with known Client ID and Callback URI

### Resource Paths

- `<ServerRoot>`: Filesystem path to `@salesforce/mobile-native-mcp-server` package contents
- Templates located at: `<ServerRoot>/resources/iosTemplates/`

---

## High-Level Agentic Workflow

### Instruction-First Approach

1. **User utterance**: _"I want an iOS mobile app that will show me a list of all of my Salesforce Contacts."_

2. **LLM calls Workflow Orchestration Guide** → receives complete roadmap for Contact list app workflow

3. **Phase 1: Plan** (Template Discovery → Project Generation → Build Validation)
   - LLM guided through template discovery and selection
   - LLM guided through project creation with Connected App configuration
   - LLM guided through build verification

4. **Phase 2: Design/Iterate** (Code Analysis → Feature Modification)
   - LLM guided through exploring template structure
   - LLM guided through adapting record list for Contacts

5. **Phase 3: Run** (Deployment)
   - LLM guided through deploying to iOS simulator

---

## MCP Server Tool Specifications

### Primary Orchestration Tool

#### `sfmobile-native-workflow-guide`

**Purpose**: Provides high-level workflow roadmap and tool sequence guidance

**Input Schema**:

```typescript
{
  userRequest: string; // "I want an iOS mobile app that will show me a list of all of my Salesforce Contacts"
  platform: 'iOS' | 'Android'; // "iOS"
}
```

**Output**: Instruction-first workflow guidance including:

- Complete phase breakdown (Plan → Design/Iterate → Run)
- Specific tool call sequence for Contact list use case
- Success criteria and checkpoints for each phase
- Expected file paths and CLI commands the LLM will use

**Example Output**:

```markdown
# iOS Mobile App Development Workflow

## Step 1: Analyze User Request

First, analyze the user request to identify key features:

- Look for record types mentioned (Contacts, Accounts, Leads, etc.)
- Identify UI patterns (list, form, dashboard, etc.)
- Note any specific functionality (search, offline, etc.)

## Step 2: Follow Three-Phase Workflow

### Phase 1: Plan

1. **Template Discovery**: Call `sfmobile-native-template-discovery` with platform "iOS"
   - Use identified features to filter templates by tags
   - Match user requirements to template capabilities
2. **Project Generation**: Call `sfmobile-native-project-generation` with selected template
3. **Build Validation**: Call `sfmobile-native-build-validation` to verify base project
   → **Checkpoint**: Working skeletal app that builds successfully

### Phase 2: Design/Iterate

4. **Code Analysis**: Call `sfmobile-native-code-analysis` to understand template structure
5. **Feature Modification**: Call `sfmobile-native-feature-modification` to adapt for user's specific record type
6. **Iterative Testing**: Build and validate changes incrementally
   → **Checkpoint**: App displays user's requested data/functionality

### Phase 3: Run

7. **Deployment**: Call `sfmobile-native-deployment` to launch on iOS simulator
   → **Final Checkpoint**: User can interact with functioning app

**Next Step**: Begin by analyzing the user request, then start with `sfmobile-native-template-discovery`
```

---

### Phase 1: Plan Tools

#### `sfmobile-native-template-discovery`

**Purpose**: Guides LLM through template discovery and selection

**Input Schema**:

```typescript
{
  platform: "iOS" | "Android";
  featureKeywords?: string[]; // ["record-list", "contacts", "crud"]
}
```

**Output**: Instruction-first guidance including:

- Plugin verification: `sf plugins inspect sfdx-mobilesdk-plugin --json` (install with `sf plugins install sfdx-mobilesdk-plugin` if needed)
- CLI command: `sf mobilesdk ios listtemplates --templatesource=<ServerRoot>/resources/iosTemplates --json`
- Template metadata interpretation guidance
- Selection criteria for Contact list requirements
- Next steps for project generation

#### `sfmobile-native-project-generation`

**Purpose**: Guides LLM through project creation and Connected App configuration

**Input Schema**:

```typescript
{
  selectedTemplate: string;     // "salesforce-record-list-ios"
  projectName: string;         // "ContactListApp"
  connectedAppClientId?: string;
  connectedAppCallbackUri?: string;
}
```

**Output**: Instruction-first guidance including:

- CLI command: `sf mobilesdk ios createwithtemplate --templateSource=<ServerRoot>/resources/iosTemplates --template=<selectedTemplate> --projectname=<projectName>`
- Connected App configuration steps if credentials provided
- File modification instructions for OAuth setup
- Next steps for build validation

#### `sfmobile-native-build-validation`

**Purpose**: Guides LLM through initial build verification

**Input Schema**:

```typescript
{
  projectPath: string; // Path to generated Xcode project
}
```

**Output**: Instruction-first guidance including:

- CLI command: `xcodebuild -project <projectPath> -scheme <schemeName> -destination 'platform=iOS Simulator,name=iPhone 15' build`
- Build output interpretation guidance
- Common build error troubleshooting steps
- Success criteria for proceeding to Design/Iterate phase

---

### Phase 2: Design/Iterate Tools

#### `sfmobile-native-code-analysis`

**Purpose**: Guides LLM through understanding template project structure

**Input Schema**:

```typescript
{
  projectPath: string;
  targetFeature: string; // "record-list"
}
```

**Output**: Instruction-first guidance including:

- File exploration patterns for iOS project structure
- Key files to examine for record list implementation
- Code reading strategies for Swift/iOS development
- Understanding existing data model and service patterns

#### `sfmobile-native-feature-modification`

**Purpose**: Guides LLM through adapting template for Contact records

**Input Schema**:

```typescript
{
  projectPath: string;
  currentRecordType: string; // "Account" (from template)
  targetRecordType: string; // "Contact"
}
```

**Output**: Instruction-first guidance including:

- Specific files to modify for Contact integration
- SOQL query modifications needed
- Data model updates for Contact fields
- UI component updates for Contact-specific display
- Iterative build validation after each change

---

### Phase 3: Run Tools

#### `sfmobile-native-deployment`

**Purpose**: Guides LLM through deploying app to iOS simulator

**Input Schema**:

```typescript
{
  projectPath: string;
  simulatorDevice?: string; // "iPhone 15"
}
```

**Output**: Instruction-first guidance including:

- CLI command: `@salesforce/lwc-dev-mobile` plugin usage for deployment
- iOS simulator selection and management
- App launch verification steps
- User interaction validation guidance

---

## Template Metadata Requirements

### Tier 1: Templates Directory Metadata

**Location**: `<ServerRoot>/resources/iosTemplates/metadata.json`

**Structure**:

```json
{
  "templateRepositoryVersion": "1.0.0",
  "description": "iOS native app templates for Salesforce Mobile SDK",
  "lastUpdated": "2024-01-15",
  "templates": [
    {
      "templateId": "salesforce-record-list-ios",
      "displayName": "Salesforce Record List",
      "description": "List view with search, detail navigation, and offline support",
      "tags": ["record-list", "crud", "search", "offline", "contacts", "accounts", "leads"],
      "complexity": "moderate",
      "estimatedSetupTime": "15-30 minutes",
      "supportedRecordTypes": ["Contact", "Account", "Lead", "Opportunity"]
    }
  ]
}
```

### Tier 2: Individual Template Metadata

**Location**: `<ServerRoot>/resources/iosTemplates/salesforce-record-list-ios/metadata.json`

**Structure**:

```json
{
  "templateId": "salesforce-record-list-ios",
  "version": "1.0.0",
  "description": "iOS app with Salesforce record list view and basic CRUD operations",
  "features": ["record-list", "search", "detail-view", "offline-sync"],
  "defaultRecordType": "Account",
  "customizationPoints": [
    {
      "feature": "record-list",
      "description": "Change the record type displayed in the list",
      "files": [
        "ContactListApp/Services/RecordListService.swift",
        "ContactListApp/Models/RecordModel.swift",
        "ContactListApp/Views/RecordListViewController.swift"
      ],
      "instructions": [
        "1. Modify SOQL query in RecordListService.swift line 23 to select from Contact instead of Account",
        "2. Update RecordModel.swift properties to match Contact field schema (Name, Email, Phone)",
        "3. Adjust table view cell configuration in RecordListViewController.swift to display Contact fields"
      ]
    },
    {
      "feature": "oauth-configuration",
      "description": "Configure Connected App credentials for Salesforce authentication",
      "files": ["ContactListApp/Supporting Files/Info.plist"],
      "instructions": [
        "1. Replace placeholder CLIENT_ID with actual Connected App Consumer Key",
        "2. Replace placeholder CALLBACK_URI with actual Connected App Callback URL"
      ]
    }
  ],
  "complexity": "moderate",
  "requiredXcodeVersion": "15.0+",
  "targetiOSVersion": "17.0+",
  "dependencies": {
    "SalesforceSDKCore": "11.0+",
    "SalesforceAnalytics": "11.0+",
    "SalesforceSDKCommon": "11.0+"
  }
}
```

---

## Connected App Configuration (Happy Path)

### User Input Collection

For this proof-of-life iteration, tools will guide the LLM to prompt the user for:

1. **Connected App Consumer Key (Client ID)**
   - User provides from their Salesforce org's Connected App configuration
   - Format validation: 3MVG9... (standard Salesforce format)

2. **Connected App Callback URI**
   - User provides from their Connected App configuration
   - Format validation: URL format starting with custom scheme

### Configuration Integration

Tools guide the LLM through:

1. Locating OAuth configuration files in generated template
2. Replacing placeholder values with user-provided credentials
3. Validating configuration format and consistency

**Future Iterations**: Discovery tools, configuration validation, and automated setup assistance.

---

## Implementation Deliverables

### Phase 1: MCP Server Foundation

1. **Workflow Orchestration Guide tool** with Contact list workflow template
2. **Template Discovery tool** with Tier 1/Tier 2 metadata parsing
3. **Project Generation tool** with Connected App configuration guidance
4. **Build Validation tool** with Xcode build orchestration

### Phase 2: Template Infrastructure

1. **iOS template directory structure** with sample "salesforce-record-list-ios" template
2. **Tier 1 metadata file** for template repository
3. **Tier 2 metadata file** for record list template with customization guidance
4. **Template validation** ensuring buildable Xcode project

### Phase 3: Feature Adaptation Tools

1. **Code Analysis tool** with iOS/Swift exploration guidance
2. **Feature Modification tool** with Contact-specific adaptation instructions
3. **Deployment tool** with iOS simulator integration

### Phase 4: Integration Testing

1. **End-to-end workflow validation** from utterance to running app
2. **Error handling verification** for common failure points
3. **Documentation updates** based on implementation learnings

---

## Success Metrics

### Technical Metrics

- **Time to Working App**: < 10 minutes from utterance to simulator
- **Build Success Rate**: 100% for happy path workflow
- **Template Adaptation Accuracy**: Contact list displays actual Salesforce Contact records

### Workflow Metrics

- **Tool Call Sequence**: LLM follows prescribed workflow without deviation
- **Instruction Following**: LLM successfully executes CLI commands as guided
- **Error Recovery**: LLM uses provided guidance to resolve common issues

### User Experience Metrics

- **Minimal User Intervention**: Only Connected App credentials required from user
- **Clear Progress Indicators**: User understands workflow progress at each checkpoint
- **Functional End Result**: User can interact with Contact list in working iOS app

---

## Future Iterations (Planned for Subsequent Releases)

**Important**: The features listed below are **planned for future iterations**, not permanently out of scope. As this living document evolves, these sections will be moved into active implementation phases and detailed accordingly.

### Comprehensive Environment Setup _(Next Priority)_

**Implementation Details**: See [Comprehensive Environment Setup and Validation](./5_mobile_native_app_generation.md#comprehensive-environment-setup-and-validation) in the main design document for detailed implementation specifications.

- **Salesforce CLI Installation Validation**: Automated detection and installation guidance for the Salesforce CLI itself, including platform-specific installation instructions and npm-based installation workflows
- **Required Plugin Management**: Automated verification and installation of all required Salesforce CLI plugins (`sfdx-mobilesdk-plugin`, `@salesforce/lwc-dev-mobile`, `@salesforce/lwc-dev-mobile-core`)
- **Third-Party Tool Validation**: Comprehensive environment checks for Xcode, Android Studio, Java, and other platform-specific development tools using existing `@salesforce/lwc-dev-mobile-core` capabilities

**Tool Specification**: Implemented via the [`sfmobile-native-environment-validation`](./5_mobile_native_app_generation.md#sfmobile-native-environment-validation) tool with comprehensive first-party CLI validation while maintaining instruction-first principles.

### Enhanced Connected App Management _(High Priority)_

- Automatic Connected App discovery in user environment
- Connected App creation guidance for new users
- Configuration validation and troubleshooting

### Advanced Error Recovery _(Critical for Production)_

- Comprehensive build error diagnosis and resolution
- Template compatibility validation
- Xcode version and dependency management

### Extended Template Ecosystem _(Platform Expansion)_

- Multiple iOS template options (dashboard, forms, etc.)
- Android template support
- Cross-platform project generation

### Production Readiness Features _(Customer Deployment)_

- Code signing and provisioning profile management
- App Store preparation guidance
- Performance optimization recommendations

**Document Evolution**: As we prioritize and begin work on these features, this document will be updated to include detailed implementation specifications, tool definitions, and workflow guidance for each area.

---

_This document serves as the definitive implementation guide for work item creation and development. All implementation must maintain alignment with the instruction-first philosophy and three-phase workflow architecture outlined in the main design document._
