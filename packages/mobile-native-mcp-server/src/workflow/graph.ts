/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { END, START, StateGraph } from '@langchain/langgraph';
import { MobileNativeWorkflowState } from './metadata.js';
import { InitialUserInputNode } from './nodes/initialUserInput.js';
import { EnvironmentValidationNode } from './nodes/environment.js';
import { TemplateDiscoveryNode } from './nodes/templateDiscovery.js';
import { ProjectGenerationNode } from './nodes/projectGeneration.js';
import { BuildValidationNode } from './nodes/buildValidation.js';
import { DeploymentNode } from './nodes/deploymentNode.js';
import { CompletionNode } from './nodes/completionNode.js';

const initialUserInputExtractionNode = new InitialUserInputNode();
const environmentValidationNode = new EnvironmentValidationNode();
const templateDiscoveryNode = new TemplateDiscoveryNode();
const projectGenerationNode = new ProjectGenerationNode();
const buildValidationNode = new BuildValidationNode();
const deploymentNode = new DeploymentNode();
const completionNode = new CompletionNode();

/**
 * The main workflow graph for mobile native app development
 * Follows the Plan → Design/Iterate → Run three-phase architecture
 * Steel thread implementation starts with user input triage, then Plan → Run with basic Contact list app
 */
export const mobileNativeWorkflow = new StateGraph(MobileNativeWorkflowState)
  // Add all workflow nodes
  .addNode(initialUserInputExtractionNode.name, initialUserInputExtractionNode.execute)
  .addNode(environmentValidationNode.name, environmentValidationNode.execute)
  .addNode(templateDiscoveryNode.name, templateDiscoveryNode.execute)
  .addNode(projectGenerationNode.name, projectGenerationNode.execute)
  .addNode(buildValidationNode.name, buildValidationNode.execute)
  .addNode(deploymentNode.name, deploymentNode.execute)
  .addNode(completionNode.name, completionNode.execute)

  // Define workflow edges - steel thread linear progression starting with triage
  .addEdge(START, initialUserInputExtractionNode.name)
  .addEdge(initialUserInputExtractionNode.name, environmentValidationNode.name)
  .addEdge(environmentValidationNode.name, templateDiscoveryNode.name)
  .addEdge(templateDiscoveryNode.name, projectGenerationNode.name)
  .addEdge(projectGenerationNode.name, buildValidationNode.name)
  .addEdge(buildValidationNode.name, deploymentNode.name)
  .addEdge(deploymentNode.name, completionNode.name)
  .addEdge(completionNode.name, END);
