/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Annotation } from '@langchain/langgraph';
import z from 'zod';
import { PLATFORM_ENUM } from '../common/schemas.js';

export const WORKFLOW_USER_INPUT_PROPERTIES = {
  platform: {
    zodType: PLATFORM_ENUM,
    description: 'Target mobile platform for the mobile app (iOS or Android)',
    friendlyName: 'mobile platform',
    promptForValue: 'Which mobile platform are you targeting for the mobile app? iOS or Android?',
  },
  projectName: {
    zodType: z.string(),
    description: 'The name of the mobile app project',
    friendlyName: 'project name',
    promptForValue: 'What is the name of the mobile app project?',
  },
  packageName: {
    zodType: z.string(),
    description: 'The package identifier of the mobile app, for example com.company.appname',
    friendlyName: 'package identifier',
    promptForValue:
      'What is the package identifier of the mobile app? For example: com.company.appname',
  },
  organization: {
    zodType: z.string(),
    description: 'The organization or company name',
    friendlyName: 'organization or company name',
    promptForValue: 'What is your organization or company name?',
  },
  connectedAppClientId: {
    zodType: z.string(),
    description:
      'The Salesforce Connected App Consumer Key associated with the mobile app. See https://help.salesforce.com/s/articleView?id=xcloud.connected_app_create_mobile.htm&type=5 for information on how to create a Connected App for mobile apps.',
    friendlyName: 'Salesforce Connected App Consumer Key',
    promptForValue:
      'What is the Salesforce Connected App Consumer Key associated with the mobile app?',
  },
  connectedAppCallbackUri: {
    zodType: z.string(),
    description:
      'The Salesforce Connected App Callback URL associated with the mobile app. See https://help.salesforce.com/s/articleView?id=xcloud.connected_app_create_mobile.htm&type=5 for information on how to create a Connected App for mobile apps.',
    friendlyName: 'Salesforce Connected App Callback URL',
    promptForValue:
      'What is the Salesforce Connected App Callback URL associated with the mobile app?',
  },
  loginHost: {
    zodType: z.string(),
    description: 'The Salesforce login host for the mobile app.',
    friendlyName: 'Salesforce login host',
    promptForValue:
      'What is the Salesforce login host for the mobile app? (e.g. login.salesforce.com)',
  },
};

export type WorkflowUserInputProperties = typeof WORKFLOW_USER_INPUT_PROPERTIES;

/**
 * Workflow state annotation for LangGraph
 * Defines the structure of state that flows through the workflow nodes
 */
export const MobileNativeWorkflowState = Annotation.Root({
  // Core workflow data
  userInput: Annotation<unknown>,
  platform: Annotation<z.infer<typeof WORKFLOW_USER_INPUT_PROPERTIES.platform.zodType>>,

  // Plan phase state
  environmentValidated: Annotation<boolean>,
  selectedTemplate: Annotation<string>,
  projectName: Annotation<z.infer<typeof WORKFLOW_USER_INPUT_PROPERTIES.projectName.zodType>>,
  projectPath: Annotation<string>,
  packageName: Annotation<z.infer<typeof WORKFLOW_USER_INPUT_PROPERTIES.packageName.zodType>>,
  organization: Annotation<z.infer<typeof WORKFLOW_USER_INPUT_PROPERTIES.organization.zodType>>,
  connectedAppClientId: Annotation<
    z.infer<typeof WORKFLOW_USER_INPUT_PROPERTIES.connectedAppClientId.zodType>
  >,
  connectedAppCallbackUri: Annotation<
    z.infer<typeof WORKFLOW_USER_INPUT_PROPERTIES.connectedAppCallbackUri.zodType>
  >,
  loginHost: Annotation<z.infer<typeof WORKFLOW_USER_INPUT_PROPERTIES.loginHost.zodType>>,

  // Build and deployment state
  buildType: Annotation<'debug' | 'release'>,
  targetDevice: Annotation<string>,
  buildSuccessful: Annotation<boolean>,
  deploymentStatus: Annotation<string>,
});

export type State = typeof MobileNativeWorkflowState.State;
