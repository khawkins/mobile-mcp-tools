# Mobile Native Capabilities \- Tool Suite Design

# Overview

This tab outlines the specific requirements and technical design considerations for the Mobile Native Capabilities tool suite within the `@salesforce/mobile-web-mcp-server` MCP server.

The Mobile Native Capabilities suite provides grounding context for creating Lightning web components that integrate with device-native capabilities such as barcode scanning, location services, contact access, and other mobile-specific features.

---

# Tool Suite Design

The Mobile Native Capabilities tool suite provides grounding context for creating Lightning web components that integrate with device-native capabilities such as barcode scanning, location services, contact access, and other mobile-specific features.

## Core Design Principles

* **Information-Only Tools:** Each tool provides TypeScript API declarations from [`@salesforce/lightning-types`](https://www.npmjs.com/package/@salesforce/lightning-types), describing the types and APIs available for specific native capabilities within LWCs.

* **Static Grounding Context:** The provided grounding context is entirely static and public in nature, with no user-specific or authenticated context required.

* **API-Focused Guidance:** Tools provide precise API guidance to enhance the accuracy of generated components that integrate with mobile device capabilities.

---

# MCP Server Tools

Each tool's **Title** field is used as the `title` annotation in the MCP server implementation, providing human-readable display names for client interfaces.

## App Review

**Name:** `sfmobile-web-app-review`  
**Title:** Salesforce Mobile App Review LWC Native Capability  
**Description:** Provides expert grounding to implement a mobile app store review feature in a Salesforce Lightning web component (LWC).  
**API:** `appReviewService.d.ts`

## AR Space Capture

**Name:** `sfmobile-web-ar-space-capture`  
**Title:** Salesforce Mobile AR Space Capture LWC Native Capability  
**Description:** Provides expert grounding to implement a mobile AR space capture feature in a Salesforce Lightning web component (LWC).  
**API:** `arSpaceCapture.d.ts`

## Barcode Scanner

**Name:** `sfmobile-web-barcode-scanner`  
**Title:** Salesforce Mobile Barcode Scanner LWC Native Capability  
**Description:** Provides expert grounding to implement a mobile barcode scanner feature in a Salesforce Lightning web component (LWC).  
**API:** `barcodeScanner.d.ts`

## Biometrics Service

**Name:** `sfmobile-web-biometrics`  
**Title:** Salesforce Mobile Biometrics Service LWC Native Capability  
**Description:** Provides expert grounding to implement a mobile biometrics identity feature in a Salesforce Lightning web component (LWC).  
**API:** `biometricsService.d.ts`

## Calendar Service

**Name:** `sfmobile-web-calendar`  
**Title:** Salesforce Mobile Calendar Service LWC Native Capability  
**Description:** Provides expert grounding to implement a mobile calendar service feature in a Salesforce Lightning web component (LWC).  
**API:** `calendarService.d.ts`

## Contacts Service

**Name:** `sfmobile-web-contacts`  
**Title:** Salesforce Mobile Contacts Service LWC Native Capability  
**Description:** Provides expert grounding to implement a mobile contacts service feature in a Salesforce Lightning web component (LWC).  
**API:** `contactsService.d.ts`

## Document Scanner

**Name:** `sfmobile-web-doc-scanner`  
**Title:** Salesforce Mobile Document Scanner LWC Native Capability  
**Description:** Provides expert grounding to implement a mobile document scanning service feature in a Salesforce Lightning web component (LWC).  
**API:** `documentScanner.d.ts`

## Location Services

**Name:** `sfmobile-web-location`  
**Title:** Salesforce Mobile Location Services LWC Native Capability  
**Description:** Provides expert grounding to implement mobile location services in a Salesforce Lightning web component (LWC).  
**API:** `locationService.d.ts`

## NFC Service

**Name:** `sfmobile-web-nfc`  
**Title:** Salesforce Mobile NFC Service LWC Native Capability  
**Description:** Provides expert grounding to implement a mobile Near-Field Communication (NFC) service feature in a Salesforce Lightning web component (LWC).  
**API:** `nfcService.d.ts`

## Payments Service

**Name:** `sfmobile-web-payments`  
**Title:** Salesforce Mobile Payments Service LWC Native Capability  
**Description:** Provides expert grounding to implement a mobile payments service feature in a Salesforce Lightning web component (LWC).  
**API:** `paymentsService.d.ts`

---

# Technical Implementation

## Declaration File Structure

The Mobile Native Capabilities declaration files are organized in the `resources/` directory, with each capability in its own subdirectory:

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

## Type Declaration Management

The Mobile Native Capabilities suite maintains a collection of TypeScript declaration files that provide the grounding context for mobile native capabilities. These declarations are sourced from the `@salesforce/lightning-types` package and managed through an automated update process.

### Update Script

The project includes a dedicated script (`scripts/update-native-capabilities-declarations.ts`) that automates the process of updating these declaration files. The script:

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

   * Available as an npm script: `npm run update-native-capabilities-declarations`  
   * Can be run manually or as part of automated processes  
   * Changes are tracked in source control, allowing for review and selective updates

The script is designed to be idempotent and safe to run multiple times, with the expectation that changes will be committed to source control when appropriate.

## Quality Assurance

The Mobile Native Capabilities suite includes several mechanisms to ensure quality:

* **Automated testing** through Vitest for each capability tool
* **Integration tests** validating MCP host/client interactions for native capabilities
* **Component evaluation** script that:  
  * Tests generated Lightning web components using native capabilities
  * Scores component accuracy against expected native capability usage patterns
  * Helps identify potential regressions in capability-specific grounding context

## Tool Registration

Each native capability tool is registered with the MCP server using a consistent pattern:

```typescript
// Example for barcode scanner
{
  name: "sfmobile-web-barcode-scanner",
  description: "Provides expert grounding to implement a mobile barcode scanner feature in a Salesforce Lightning web component (LWC)",
  inputSchema: {
    type: "object",
    properties: {
      // Tool-specific input schema
    }
  }
}
```

---

# Future Considerations

The Mobile Native Capabilities suite will require additional specification and implementation details in the following areas:

* **Detailed configuration** for the TypeScript declaration management script
* **Specific test coverage requirements** and thresholds for each capability
* **Integration test scenarios** and validation criteria for native capability workflows
* **Component evaluation metrics** and scoring methodology for capability usage accuracy
* **New capability addition process** as additional mobile native capabilities become available in `@salesforce/lightning-types`

---

# Capability-Specific Implementation Notes

## High-Usage Capabilities

The following native capabilities are expected to have high usage and should be prioritized for comprehensive testing and documentation:

* **Barcode Scanner** - Critical for inventory and data capture scenarios
* **Location Services** - Essential for field service and location-aware applications
* **Contacts Service** - Important for CRM integration scenarios
* **Document Scanner** - Key for document management and processing workflows

## Emerging Capabilities

The following capabilities represent newer or more specialized use cases:

* **AR Space Capture** - Advanced augmented reality scenarios
* **Biometrics Service** - Security and identity verification use cases
* **NFC Service** - Near-field communication for specialized workflows
* **Payments Service** - Mobile commerce integration scenarios

Each capability group may require different levels of documentation depth and testing coverage based on expected usage patterns and complexity.
