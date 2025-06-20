# mobile-mcp-tools

A collection of Model Context Protocol (MCP) tools for Salesforce Mobile Web applications. These tools provide expert grounding for implementing various mobile capabilities in Salesforce Lightning Web Components (LWC).

## Features

- **App Review**: Implement app store review functionality
- **AR Space Capture**: Capture and process AR space data
- **Barcode Scanner**: Scan and process barcodes
- **Biometrics**: Implement biometric authentication
- **Calendar**: Access and manage device calendar
- **Contacts**: Access and manage device contacts
- **Document Scanner**: Scan and process documents
- **Geofencing**: Implement location-based geofencing
- **Location**: Access device location services
- **NFC**: Implement NFC functionality
- **Payments**: Process mobile payments

## Prerequisites

- Visual Studio Code or Cursor IDE (for debugging)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/forcedotcom/mobile-mcp-tools.git
cd mobile-mcp-tools
```

2. Install dependencies:

```bash
npm install
```

## Development

### Build

Build all packages:

```bash
npm run build-all
```

### Testing

Run all unit tests:

```bash
npm run test-all
```

### Debugging

The project includes a VS Code/Cursor debug configuration for testing with the MCP Inspector:

1. Set breakpoints in your TypeScript files
2. Press `F5` or select `Run > Start Debugging`
3. The debugger will start and attach to the MCP server

You should see the following output:

```bash
Starting MCP inspector...
Debugger attached.
⚙️ Proxy server listening on port 6277
Debugger attached.
🔍 MCP Inspector is up and running at http://127.0.0.1:6274 🚀
```

4. Open the MCP Inspector URL (e.g., http://127.0.0.1:6274)
5. Click "Connect" to connect to the MCP server

![image](https://github.com/user-attachments/assets/7886de99-3a9c-46a3-9749-1c2334c17ff2)

6. Click "List Tools" to see available tools
   ![image](https://github.com/user-attachments/assets/dc38c37c-04ed-41e5-8af8-69978694841f)

7. Select a tool and click "Run Tool" to test it
   ![image](https://github.com/user-attachments/assets/0a128ee3-74f3-44d0-ad27-6cf8bf3825dd)

8. If you set a breakpoint, execution will pause there for debugging
   ![image](https://github.com/user-attachments/assets/e77d36da-6f5f-4edf-bb47-e2aecc4e53d6)

## Project Structure

```
packages/
  mobile-web/
    src/
      tools/           # Tool implementations
        appReview/     # App Review tool
        arSpaceCapture/# AR Space Capture tool
        barcodeScanner/# Barcode Scanner tool
        biometrics/    # Biometrics tool
        calendar/      # Calendar tool
        contacts/      # Contacts tool
        documentScanner/# Document Scanner tool
        geofencing/    # Geofencing tool
        location/      # Location tool
        nfc/          # NFC tool
        payments/     # Payments tool
      utils/          # Utility functions
    resources/        # Type definitions
    tests/           # Unit tests
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm run test-all`
4. Submit a pull request

## License

MIT
