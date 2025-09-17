import { Annotation, END, START, interrupt, StateGraph } from '@langchain/langgraph';
import {
  MCPToolInvocationData,
  type TemplateDiscoveryInput,
  type ProjectGenerationInput,
  type BuildInput,
  type DeploymentInput,
  TEMPLATE_DISCOVERY_WORKFLOW_INPUT_SCHEMA,
  PROJECT_GENERATION_WORKFLOW_INPUT_SCHEMA,
  BUILD_WORKFLOW_INPUT_SCHEMA,
  DEPLOYMENT_WORKFLOW_INPUT_SCHEMA,
} from '../schemas/index.js';
import {
  TEMPLATE_DISCOVERY_TOOL,
  PROJECT_GENERATION_TOOL,
  BUILD_TOOL,
  DEPLOYMENT_TOOL,
} from '../registry/toolRegistry.js';

/**
 * Workflow state annotation for LangGraph
 * Defines the structure of state that flows through the workflow nodes
 */
export const MobileNativeWorkflowState = Annotation.Root({
  // Core workflow data
  userInput: Annotation<unknown>,
  platform: Annotation<'iOS' | 'Android'>,

  // Plan phase state
  environmentValidated: Annotation<boolean>,
  selectedTemplate: Annotation<string>,
  projectPath: Annotation<string>,

  // Build and deployment state
  buildSuccessful: Annotation<boolean>,
  deploymentStatus: Annotation<string>,

  // Current workflow phase for routing
  currentPhase: Annotation<string>,
});

export type State = typeof MobileNativeWorkflowState.State;

/**
 * Node names for the workflow graph
 */
const ENVIRONMENT_VALIDATION_NODE_NAME = 'validateEnvironment';
const TEMPLATE_DISCOVERY_NODE_NAME = 'discoverTemplates';
const PROJECT_GENERATION_NODE_NAME = 'generateProject';
const BUILD_VALIDATION_NODE_NAME = 'validateBuild';
const DEPLOYMENT_NODE_NAME = 'deployApp';
const FINISH_NODE_NAME = 'finish';

// TODO: Implement initial input node
// function initialInputNode(state: State): Partial<State> {}

/**
 * Environment Validation Node - Phase 1: Plan
 * Note: For steel thread, we'll assume environment is validated
 */
function environmentValidationNode(_state: State): Partial<State> {
  // For steel thread implementation, we'll assume environment is validated
  // In production, this would interrupt to call environment validation tool
  return {
    environmentValidated: true,
    currentPhase: 'plan',
  };
}

/**
 * Template Discovery Node - Phase 1: Plan
 */
function templateDiscoveryNode(state: State): Partial<State> {
  const platform = extractPlatformFromUserInput(state.userInput);

  const interruptState: MCPToolInvocationData<
    typeof TEMPLATE_DISCOVERY_WORKFLOW_INPUT_SCHEMA,
    TemplateDiscoveryInput
  > = {
    llmMetadata: TEMPLATE_DISCOVERY_TOOL,
    input: {
      platform,
    },
    isComplete: false,
  };

  interrupt(interruptState);

  // TODO: Post-interrupt validation will be implemented here
  // const validatedResult = validateTemplateDiscoveryResult(state.userInput);
  // This would parse and validate the structured result from the MCP tool
  // and extract the selectedTemplate for the next workflow step

  return {
    platform,
    currentPhase: 'plan',
  };
}

/**
 * Project Generation Node - Phase 1: Plan
 */
function projectGenerationNode(state: State): Partial<State> {
  // Extract template information from previous step result
  const selectedTemplate = extractTemplateFromResult(state.userInput);
  const projectDetails = extractProjectDetailsFromUserInput();

  const interruptState: MCPToolInvocationData<
    typeof PROJECT_GENERATION_WORKFLOW_INPUT_SCHEMA,
    ProjectGenerationInput
  > = {
    llmMetadata: PROJECT_GENERATION_TOOL,
    input: {
      selectedTemplate,
      projectName: projectDetails.projectName!,
      platform: state.platform,
      packageName: projectDetails.packageName!,
      organization: projectDetails.organizationName!,
      connectedAppClientId: projectDetails.connectedAppClientId!,
      connectedAppCallbackUri: projectDetails.connectedAppCallbackUri!,
      loginHost: projectDetails.loginHost,
    },
    isComplete: false,
  };

  interrupt(interruptState);

  return {
    selectedTemplate,
    projectPath: projectDetails.outputDirectory || './ContactListApp',
    currentPhase: 'plan',
  };
}

/**
 * Build Validation Node - Phase 1: Plan
 */
function buildValidationNode(state: State): Partial<State> {
  const interruptState: MCPToolInvocationData<typeof BUILD_WORKFLOW_INPUT_SCHEMA, BuildInput> = {
    llmMetadata: BUILD_TOOL,
    input: {
      projectPath: state.projectPath,
      platform: state.platform,
    },
    isComplete: false,
  };

  interrupt(interruptState);

  return {
    buildSuccessful: true,
    currentPhase: 'run',
  };
}

/**
 * Deployment Node - Phase 3: Run
 */
function deploymentNode(state: State): Partial<State> {
  const interruptState: MCPToolInvocationData<
    typeof DEPLOYMENT_WORKFLOW_INPUT_SCHEMA,
    DeploymentInput
  > = {
    llmMetadata: DEPLOYMENT_TOOL,
    input: {
      projectPath: state.projectPath,
      platform: state.platform,
      buildType: 'debug' as const,
      targetDevice: undefined,
    },
    isComplete: false,
  };

  interrupt(interruptState);

  return {
    deploymentStatus: 'deployed',
    currentPhase: 'run',
  };
}

/**
 * Finish Node - Complete the workflow
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function finishNode(_state: State): Partial<State> {
  const completionInterrupt: MCPToolInvocationData = {
    llmMetadata: {
      name: 'workflow-complete',
      inputSchema: TEMPLATE_DISCOVERY_TOOL.inputSchema, // Placeholder
      description: 'Workflow completed successfully',
    },
    input: {},
    isComplete: true,
  };

  interrupt(completionInterrupt);

  return {};
}

/**
 * Helper function to extract platform from user input
 */
function extractPlatformFromUserInput(userInput: any): 'iOS' | 'Android' {
  // Handle structured input
  if (typeof userInput === 'object' && userInput && userInput.platform) {
    return userInput.platform as 'iOS' | 'Android';
  }

  // Handle string input - simple extraction logic for steel thread
  const inputStr = typeof userInput === 'string' ? userInput : JSON.stringify(userInput);
  if (inputStr.toLowerCase().includes('android')) {
    return 'Android';
  }
  // Default to iOS for proof of life
  return 'iOS';
}

/**
 * Helper function to extract template from discovery result
 */
function extractTemplateFromResult(_result: any): string {
  // Handle structured input
  if (typeof _result === 'object' && _result && _result.selectedTemplate) {
    return _result.selectedTemplate as string;
  }

  // Handle string input - parse the LLM's template selection from the discovery result
  // For steel thread, we'll use a default template name
  // In production, this would parse structured output from the discovery tool
  const resultStr = typeof _result === 'string' ? _result : JSON.stringify(_result);
  const match = resultStr.match(/template[:\s]+([^\s\n,]+)/i);
  return match?.[1] || 'iOSNativeSwiftTemplate';
}

/**
 * Helper function to extract project details from user input
 */
function extractProjectDetailsFromUserInput(): {
  projectName: string;
  packageName: string;
  organizationName: string;
  connectedAppClientId: string;
  connectedAppCallbackUri: string;
  loginHost?: string;
  outputDirectory?: string;
} {
  // For steel thread, return sensible defaults
  // In production, this would parse user input more intelligently
  return {
    projectName: 'ContactListApp',
    packageName: 'com.mycompany.contactlistapp',
    organizationName: 'My Company',
    connectedAppClientId: 'your_connected_app_client_id',
    connectedAppCallbackUri: 'myapp://oauth/callback',
    outputDirectory: './ContactListApp',
  };
}

/**
 * The main workflow graph for mobile native app development
 * Follows the Plan → Design/Iterate → Run three-phase architecture
 * Steel thread implementation focuses on Plan → Run with basic Contact list app
 */
export const mobileNativeWorkflow = new StateGraph(MobileNativeWorkflowState)
  // Add all workflow nodes
  .addNode(ENVIRONMENT_VALIDATION_NODE_NAME, environmentValidationNode)
  .addNode(TEMPLATE_DISCOVERY_NODE_NAME, templateDiscoveryNode)
  .addNode(PROJECT_GENERATION_NODE_NAME, projectGenerationNode)
  .addNode(BUILD_VALIDATION_NODE_NAME, buildValidationNode)
  .addNode(DEPLOYMENT_NODE_NAME, deploymentNode)
  .addNode(FINISH_NODE_NAME, finishNode)

  // Define workflow edges - steel thread linear progression
  .addEdge(START, ENVIRONMENT_VALIDATION_NODE_NAME)
  .addEdge(ENVIRONMENT_VALIDATION_NODE_NAME, TEMPLATE_DISCOVERY_NODE_NAME)
  .addEdge(TEMPLATE_DISCOVERY_NODE_NAME, PROJECT_GENERATION_NODE_NAME)
  .addEdge(PROJECT_GENERATION_NODE_NAME, BUILD_VALIDATION_NODE_NAME)
  .addEdge(BUILD_VALIDATION_NODE_NAME, DEPLOYMENT_NODE_NAME)
  .addEdge(DEPLOYMENT_NODE_NAME, FINISH_NODE_NAME)
  .addEdge(FINISH_NODE_NAME, END);
