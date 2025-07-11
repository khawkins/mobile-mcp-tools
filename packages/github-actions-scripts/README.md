# GitHub Actions Scripts

This TypeScript project implements and builds the JavaScript modules used by the project's GitHub Actions workflows. Having these modules pulled out of inline definition within the GitHub Actions enables better testing, reusability, and maintainability.

## Project Structure

```
packages/github-actions-scripts/
├── src/                         # TypeScript source code
│   ├── package-utils.ts         # Package.json operations
│   ├── github-utils.ts          # GitHub API operations
│   ├── npm-utils.ts             # NPM operations
│   ├── logger.ts                # Logging utilities
│   ├── release-orchestrator.ts  # High-level workflow orchestration
│   └── index.ts                 # Main entry point
├── tests/                       # Unit tests
│   └── package-utils.test.js
├── dist/                        # Compiled JavaScript output
├── project.json                 # Nx project configuration
├── package.json                 # NPM package configuration
├── tsconfig.json                # TypeScript configuration
├── vitest.config.js             # Test configuration
└── README.md                    # This file
```

## Development Workflow

The project uses a simple build workflow:

1. **Development**: Edit TypeScript files in `src/`
2. **Build**: `nx build github-actions-scripts` compiles to `dist/`
3. **Test**: `nx test github-actions-scripts` runs unit tests

```bash
# Development workflow
nx build github-actions-scripts    # Compile TypeScript
nx test github-actions-scripts     # Run tests
```

## GitHub Actions Integration

GitHub Actions workflows import directly from the built package:

```yaml
- name: Create release using orchestrator
  uses: actions/github-script@v7
  with:
    script: |
      const { ReleaseOrchestrator } = await import('${{ github.workspace }}/packages/github-actions-scripts/dist/release-orchestrator.js');

      const orchestrator = new ReleaseOrchestrator(github, context, core);
      await orchestrator.createRelease({
        packagePath: '${{ inputs.package_path }}',
        packageDisplayName: '${{ inputs.package_display_name }}'
      });
```

## Testing

All functions are unit tested to ensure coverage of our GitHub Action workflows:

```bash
# Run tests
nx test github-actions-scripts

# Run tests with coverage
nx test github-actions-scripts --coverage

# Run tests in watch mode
cd packages/github-actions-scripts && npm run test:watch
```

## Nx Commands

```bash
# Build the project
nx build github-actions-scripts

# Run tests
nx test github-actions-scripts

# Run linting
nx lint github-actions-scripts

# Run all targets
nx run-many --target=build,test,lint --projects=github-actions-scripts
```
