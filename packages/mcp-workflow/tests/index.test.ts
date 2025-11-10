/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { describe, it, expect } from 'vitest';
import * as mcpWorkflow from '../src/index.js';

describe('mcp-workflow package', () => {
  it('should export core infrastructure modules', () => {
    // Verify Phase 2 core infrastructure exports
    expect(mcpWorkflow.WellKnownDirectoryManager).toBeDefined();
    expect(mcpWorkflow.createLogger).toBeDefined();
    expect(mcpWorkflow.WORKFLOW_STATE_DATA_SCHEMA).toBeDefined();
    expect(mcpWorkflow.LangGraphToolExecutor).toBeDefined();
    expect(mcpWorkflow.executeToolWithLogging).toBeDefined();
  });

  it('should export metadata types and schemas', () => {
    // Verify metadata exports
    expect(mcpWorkflow.WORKFLOW_PROPERTY_NAMES).toBeDefined();
    expect(mcpWorkflow.WORKFLOW_TOOL_BASE_INPUT_SCHEMA).toBeDefined();
    expect(mcpWorkflow.MCP_WORKFLOW_TOOL_OUTPUT_SCHEMA).toBeDefined();
  });
});
