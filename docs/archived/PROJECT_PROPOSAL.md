# mobile-mcp-tools

**An open source monorepo for extensible Salesforce Mobile Model Context Protocol (MCP) servers and tools, maintained by the Mobile Platform Experience team.**

---

# Overview

Modern large language models (LLMs) often lack sufficient context about the APIs available for implementing Salesforce mobile native capabilities in Lightning web components. As a result, when users request the creation of LWCs with features such as barcode scanning, location services, or contact access, LLMs frequently generate heavily hallucinated or inaccurate solutions due to missing or incomplete API knowledge.

However, we've found that when a user queries the LLM to create LWCs with mobile native capabilities, and the request is augmented with precise, context-specific information about the available APIs, the accuracy and utility of the generated components from LLMs improves dramatically. Providing this "grounding context"—in the form of TypeScript types, API documentation, and usage patterns—enables LLMs to produce exceptional, production-ready solutions tailored to the actual capabilities of the target platform.

Model Context Protocol (MCP) server tools have emerged as the most effective avenue for delivering this kind of context-specific grounding to user requests. By exposing well-defined, discoverable API surfaces to MCP clients, these servers empower both LLMs and developers to generate and validate code that leverages real mobile native features.

The `mobile-mcp-tools` project is designed to address this need. It provides a robust, extensible monorepo for developing and publishing MCP servers and tools that deliver grounding context for mobile development use cases. The initial focus is on supporting Lightning web components with mobile native capabilities, but the architecture is intentionally flexible to support additional MCP servers and tools in the future.

This project is also designed to integrate seamlessly with Agentforce for Developers (A4D)—the Salesforce VSCode Extension that enables agentic code enhancement for Salesforce customers and codebases. A4D has established an MCP Host and Client infrastructure, providing the facilities for us to deliver our MCP server and tools directly to developers within their existing workflows, thereby fulfilling the mobile native capabilities use case and beyond.

---

# Project Goals

* **Centralize MCP Server Development:**  
  Provide a single, well-structured repository for developing, maintaining, and publishing MCP servers and tools related to mobile development using the Model Context Protocol.  
    
* **Extensibility:**  
  Architect the project as an "uber-project" (umbrella project) to support a growing ecosystem of MCP servers and tools, each as a distinct, independently managed and published Node.js package.  
    
* **Open Source Best Practices:**  
  Foster community collaboration, transparency, and code quality through open source standards, clear documentation, and a welcoming contribution process.

---

# Initial Scope

The initial focus of `mobile-mcp-tools` is to deliver an MCP server that provides **server tools for creating Lightning web components with mobile native capabilities**. These capabilities include, but are not limited to:

* Barcode scanning  
* Location services  
* Contact services  
* Additional mobile-native features as needed

## Key Characteristics

### Information-Only Tools

Each MCP server tool is designed to be "information-only," supplying grounding context to requesting MCP clients. This is achieved by exposing the TypeScript types and APIs available to the client, enabling informed code completion, validation, and discovery of mobile capabilities within the Model Context Protocol framework.

### Modular Tooling

There will be one MCP server tool for each supported mobile native capability. To ensure clear differentiation from other Salesforce MCP server tools, each tool will be named with the `sfmobile-web-` prefix (e.g., `sfmobile-web-barcode`, `sfmobile-web-location`).

---

# Project Structure

To support current and future needs, the project is organized as a **monorepo** using [Nx](https://nx.dev/):

## Uber-Project (Monorepo)

The root of the repository manages shared configuration, documentation, and developer tooling.

## Sub-Projects (Packages)

Each MCP server or tool is implemented as a standalone Node.js project, written in TypeScript, and located in its own directory under `packages/`.

* Each sub-project has its own `package.json`, dependencies, and release cycle.  
* Sub-projects can be published independently to NPM.


## Initial Sub-Project

The first sub-project will be the MCP server for mobile native capabilities, as described above.

### Example Directory Layout

```
mobile-mcp-tools/
  packages/
    mobile-web/      # To be published as @salesforce/salesforce-mobile-web-mcp-server
    mobile-offline/  # May be tools under mobile-web. TBD.
    mobile-apps/
    ...
  nx.json
  package.json
  tsconfig.base.json
  README.md
```

---

# Rationale

## Extensibility & Scalability

The monorepo structure allows for seamless addition of new MCP servers and tools as the needs of the Salesforce and broader Model Context Protocol community evolve.

## Separation of Concerns

By isolating each MCP server/tool in its own package, we ensure clean dependency management, independent versioning, and clear ownership.

## Community Engagement

Open source best practices—including clear documentation, contribution guidelines, and modular code—make it easy for both Salesforce teams and external contributors to participate and innovate.

---

# Future Vision

While the initial release will focus on mobile native capabilities for Lightning web components, the project is intentionally architected to support:

* Additional mobile development-related MCP servers and tools  
* Logical grouping of different kinds of mobile development tooling  
* Collaboration and extension by the broader Model Context Protocol community

---

# Project Timeline and Collaboration

* **Dreamforce Delivery:** Our primary goal is to deliver the initial `salesforce-mobile-web-mcp-server` package in time for Dreamforce, aligning with the launch of the other A4D MCP deliverables.  
    
* **Open Source Collaboration:** We will work closely with Salesforce Open Source Software (OSS) stakeholders to establish and configure the new open source project and repository under the [forcedotcom](https://github.com/forcedotcom) organization, following our OSS guidelines.  
    
* **Product Security Review:** We will prioritize engagement with ProdSec to ensure the required scrutiny of our MCP server and tools.

---

# References

* [\[DRAFT\] MCP Server Developer Guide \- Security Considerations](https://docs.google.com/document/d/1S72RAYpkR7kqIerhSkzM5tC9I4uIFaR0sHloN4RaZ9o/edit?usp=sharing)  
* [A4D MCP server requirements](https://docs.google.com/document/d/1WAIYoX6xLYKheEi5sOg_WOAXOjPqp8kuGoN3o9VI5_w/edit?usp=sharing)