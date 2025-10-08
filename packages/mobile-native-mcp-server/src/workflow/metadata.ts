/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Annotation } from '@langchain/langgraph';
import z from 'zod';
import { PLATFORM_ENUM } from '../common/schemas.js';
import { PropertyMetadata, PropertyMetadataCollection } from '../common/propertyMetadata.js';

/**
 * Definition of all user input properties required by the mobile native workflow.
 * Each property includes metadata for extraction, validation, and user prompting.
 *
 * This collection serves as the single source of truth for what data needs to be
 * collected from users during the workflow initialization phase.
 */
export const WORKFLOW_USER_INPUT_PROPERTIES = {
  platform: {
    zodType: PLATFORM_ENUM,
    description: 'Target mobile platform for the mobile app (iOS or Android)',
    friendlyName: 'mobile platform',
  } satisfies PropertyMetadata<typeof PLATFORM_ENUM>,
  projectName: {
    zodType: z.string(),
    description: 'The name of the mobile app project',
    friendlyName: 'project name',
  } satisfies PropertyMetadata<z.ZodString>,
  packageName: {
    zodType: z.string(),
    description: 'The package identifier of the mobile app, for example com.company.appname',
    friendlyName: 'package identifier',
  } satisfies PropertyMetadata<z.ZodString>,
  organization: {
    zodType: z.string(),
    description: 'The organization or company name',
    friendlyName: 'organization or company name',
  } satisfies PropertyMetadata<z.ZodString>,
  connectedAppClientId: {
    zodType: z.string(),
    description:
      'The Salesforce Connected App Consumer Key associated with the mobile app. See https://help.salesforce.com/s/articleView?id=xcloud.connected_app_create_mobile.htm&type=5 for information on how to create a Connected App for mobile apps.',
    friendlyName: 'Salesforce Connected App Consumer Key',
  } satisfies PropertyMetadata<z.ZodString>,
  connectedAppCallbackUri: {
    zodType: z.string(),
    description:
      'The Salesforce Connected App Callback URL associated with the mobile app. See https://help.salesforce.com/s/articleView?id=xcloud.connected_app_create_mobile.htm&type=5 for information on how to create a Connected App for mobile apps.',
    friendlyName: 'Salesforce Connected App Callback URL',
  } satisfies PropertyMetadata<z.ZodString>,
  loginHost: {
    zodType: z.string(),
    description: 'The Salesforce login host for the mobile app.',
    friendlyName: 'Salesforce login host',
  } satisfies PropertyMetadata<z.ZodString>,
} as const satisfies PropertyMetadataCollection;

export type WorkflowUserInputProperties = typeof WORKFLOW_USER_INPUT_PROPERTIES;

/**
 * Workflow state annotation for LangGraph
 * Defines the structure of state that flows through the workflow nodes
 */
export const MobileNativeWorkflowState = Annotation.Root({
  // Core workflow data
  userInput: Annotation<unknown>,
  userInputQuestion: Annotation<string>,
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
