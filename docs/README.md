# Documentation

This project maintains comprehensive documentation to help developers understand and implement mobile capabilities in Salesforce Lightning Web Components.

## Documentation Structure

The documentation is organized in the `/docs` directory:

- **`/docs/`** - Project documentation including:
  - [Project Overview](./1_project_overview.md) - High-level project goals and architecture
  - [Salesforce Mobile Web MCP Server](./2_salesforce-mobile-web-mcp-server.md) - Server implementation details
  - [Mobile Native Capabilities](./3_mobile_native_capabilities.md) - Available mobile features
  - [Mobile Offline](./4_mobile_offline.md) - Offline functionality guidance
  - [README](./README.md) - Documentation index and navigation

## Getting Started with Documentation

1. **Start with the [Project Overview](./1_project_overview.md)** to understand the project's purpose and architecture
2. **Review [Mobile Native Capabilities](./3_mobile_native_capabilities.md)** to see what features are available
3. **Check the [Salesforce Mobile Web MCP Server](./2_salesforce-mobile-web-mcp-server.md)** for implementation details
4. **Explore [Mobile Offline](./4_mobile_offline.md)** for offline functionality guidance

## Contributing to Documentation

When adding new features or making schema changes:

1. Review existing documentation patterns in `/docs/`
2. Update relevant documentation sections to reflect your changes
3. Add new documentation files following the established structure
4. Ensure all code examples and type definitions are accurate

## Creating Sequence Diagrams

1. Install `mermaid-cli`

        $ npm install -g mermaid-cli

2. Create a new file with the `.mmd` extension.

3. For generation of e.g. a PNG image:

        $ mmdc -i sequence_diagram.mmd -o sequence_diagram.png 