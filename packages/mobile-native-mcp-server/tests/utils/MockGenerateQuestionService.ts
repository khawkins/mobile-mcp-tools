/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import z from 'zod';
import { PropertyMetadata } from '../../src/common/propertyMetadata.js';
import { GenerateQuestionServiceProvider } from '../../src/workflow/services/generateQuestionService.js';

/**
 * Test implementation of GenerateQuestionServiceProvider that returns pre-configured questions.
 * Useful for unit testing nodes without requiring the full LLM question generation pipeline.
 *
 * Usage:
 * ```typescript
 * const mockService = new MockGenerateQuestionService();
 * mockService.setQuestion('What is your platform?');
 * const node = new SomeNode(mockService);
 * ```
 */
export class MockGenerateQuestionService implements GenerateQuestionServiceProvider {
  private question = 'Mock question?';
  private callHistory: Array<{
    name: string;
    metadata: PropertyMetadata<z.ZodTypeAny>;
  }> = [];

  /**
   * Configures the mock to return a specific question.
   *
   * @param question The question to return
   */
  setQuestion(question: string): void {
    this.question = question;
  }

  /**
   * Mock implementation of generateQuestionForProperty.
   * Records the call and returns the pre-configured question.
   *
   * @param name The property name
   * @param metadata The property metadata
   * @returns The pre-configured question
   */
  generateQuestionForProperty(name: string, metadata: PropertyMetadata<z.ZodTypeAny>): string {
    this.callHistory.push({ name, metadata });
    return this.question;
  }

  /**
   * Returns the history of all question generation calls.
   * Useful for asserting that the service was called with correct parameters.
   */
  getCallHistory(): ReadonlyArray<{
    name: string;
    metadata: PropertyMetadata<z.ZodTypeAny>;
  }> {
    return [...this.callHistory];
  }

  /**
   * Returns the most recent call, or undefined if no calls have been made.
   */
  getLastCall():
    | {
        name: string;
        metadata: PropertyMetadata<z.ZodTypeAny>;
      }
    | undefined {
    return this.callHistory[this.callHistory.length - 1];
  }

  /**
   * Clears the call history and resets the question to default.
   */
  reset(): void {
    this.question = 'Mock question?';
    this.callHistory = [];
  }
}
