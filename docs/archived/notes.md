I want a project description for a new open source project, for a repo under the https://github.com/forcedotcom organization named "mobile-mcp-tools", with the following requirements:

- The project is designed for hosting MCP servers and tools
- The project will initially host an MCP server that provides server tools for creating Lightning web components with mobile native capabilities, such as barcode scanning, location services, contact services, and more.
    - These MCP server tools are "information-only", providing grounding context to the requesting MCP client in the form of the TypeScript types and APIs that are available to the MCP client.
    - There will be one MCP server tool for each of the supported mobile native capabilities
    - To support differentiation with other Salesforce MCP server tools, the name of each of these tools will be prefixed with "sf-mobile-"
- The structure of the project—the umbrella project will be referred to as the "uber-project" from here on out—is meant to be extensible enough to support other mobile MCP servers and tools in the future
- Each sub-project of the uber-project will be structured as a Node.js project implemented with TypeScript
    - There will be one sub-project corresponding to each MCP server
    - Initially there will be only one MCP server / sub-project: the mobile native capabilities project described above
- To allow for the potential for multiple, separately publishable MCP server packages in the future, the uber-project will implement a monorepo structure using Nx