import { Annotation } from '@langchain/langgraph';

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
  projectName: Annotation<string>,
  projectPath: Annotation<string>,
  packageName: Annotation<string>,
  organization: Annotation<string>,
  connectedAppClientId: Annotation<string>,
  connectedAppCallbackUri: Annotation<string>,
  loginHost: Annotation<string>,

  // Build and deployment state
  buildType: Annotation<'debug' | 'release'>,
  targetDevice: Annotation<string>,
  buildSuccessful: Annotation<boolean>,
  deploymentStatus: Annotation<string>,
});

export type State = typeof MobileNativeWorkflowState.State;
