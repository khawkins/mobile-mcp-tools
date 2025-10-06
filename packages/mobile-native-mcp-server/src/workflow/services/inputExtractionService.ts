/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import z from 'zod';
import { PropertyMetadataCollection } from '../../common/propertyMetadata.js';
import { MCPToolInvocationData } from '../../common/metadata.js';
import { INPUT_EXTRACTION_TOOL } from '../../tools/plan/sfmobile-native-input-extraction/metadata.js';
import { ToolExecutor, LangGraphToolExecutor } from '../nodes/toolExecutor.js';
import { Logger, createComponentLogger } from '../../logging/logger.js';

/**
 * Result from property extraction containing validated properties.
 */
export interface ExtractionResult {
  /** Record of extracted properties, keyed by property name */
  extractedProperties: Record<string, unknown>;
}

/**
 * Interface for property extraction service.
 * Allows for dependency injection and testing with mock implementations.
 */
export interface InputExtractionServiceProvider {
  /**
   * Extracts structured properties from user input.
   *
   * @param userInput - Raw user input (string, object, or any format)
   * @param properties - Collection of properties to extract with their metadata
   * @returns ExtractionResult containing validated extracted properties
   */
  extractProperties(userInput: unknown, properties: PropertyMetadataCollection): ExtractionResult;
}

/**
 * Service for extracting structured properties from user input.
 *
 * This service provides a reusable, injectable mechanism for parsing natural language
 * user input and extracting structured property values. It uses an LLM-based extraction
 * tool to identify property values and validates them against their Zod schemas.
 *
 * Features:
 * - Accepts any PropertyMetadataCollection for flexible property definitions
 * - Validates extracted values against Zod schemas
 * - Filters out invalid or missing properties
 * - Injectable dependencies for testability
 * - Comprehensive logging for debugging
 *
 * @example
 * const properties = {
 *   platform: {
 *     zodType: z.enum(['iOS', 'Android']),
 *     description: 'Target platform',
 *     friendlyName: 'platform',
 *   },
 * };
 *
 * const service = new InputExtractionService();
 * const result = service.extractProperties(
 *   'Create an iOS app',
 *   properties
 * );
 * // result.extractedProperties = { platform: 'iOS' }
 */
export class InputExtractionService implements InputExtractionServiceProvider {
  private readonly logger: Logger;
  private readonly toolExecutor: ToolExecutor;

  /**
   * Creates a new InputExtractionService.
   *
   * @param toolExecutor - Tool executor for invoking the extraction tool (injectable for testing)
   * @param logger - Logger instance (injectable for testing)
   */
  constructor(toolExecutor?: ToolExecutor, logger?: Logger) {
    this.toolExecutor = toolExecutor ?? new LangGraphToolExecutor();
    this.logger = logger ?? createComponentLogger('InputExtractionService');
  }

  /**
   * Extracts structured properties from user input.
   *
   * This method:
   * 1. Prepares property metadata for the extraction tool
   * 2. Invokes the LLM-based extraction tool
   * 3. Validates extracted values against their Zod schemas
   * 4. Filters out null/undefined values and validation failures
   * 5. Returns only successfully extracted and validated properties
   *
   * @param userInput - Raw user input (string, object, or any format)
   * @param properties - Collection of properties to extract with their metadata
   * @returns ExtractionResult containing validated extracted properties
   *
   * @throws {z.ZodError} If the tool result doesn't match expected schema
   * @throws {Error} If tool execution fails
   *
   * @example
   * const result = service.extractProperties(
   *   'Create MyApp for Android',
   *   {
   *     platform: { zodType: z.enum(['iOS', 'Android']), ... },
   *     projectName: { zodType: z.string(), ... },
   *   }
   * );
   * // result.extractedProperties may contain { platform: 'Android', projectName: 'MyApp' }
   */
  extractProperties(userInput: unknown, properties: PropertyMetadataCollection): ExtractionResult {
    this.logger.debug('Starting property extraction', {
      userInput,
      propertyCount: Object.keys(properties).length,
    });

    // Prepare properties for extraction tool
    const propertiesToExtract = this.preparePropertiesForExtraction(properties);

    // Create tool invocation data
    const toolInvocationData: MCPToolInvocationData<typeof INPUT_EXTRACTION_TOOL.inputSchema> = {
      llmMetadata: {
        name: INPUT_EXTRACTION_TOOL.toolId,
        description: INPUT_EXTRACTION_TOOL.description,
        inputSchema: INPUT_EXTRACTION_TOOL.inputSchema,
      },
      input: {
        userUtterance: userInput,
        propertiesToExtract,
      },
    };

    this.logger.debug('Invoking extraction tool', { toolInvocationData });

    // Execute tool
    const rawResult = this.toolExecutor.execute(toolInvocationData);

    this.logger.debug('Tool execution completed', { rawResult });

    // Validate and filter result
    const validatedResult = this.validateAndFilterResult(rawResult, properties);

    this.logger.info('Property extraction completed', {
      extractedCount: Object.keys(validatedResult.extractedProperties).length,
      properties: Object.keys(validatedResult.extractedProperties),
    });

    return validatedResult;
  }

  /**
   * Prepares property metadata for the extraction tool.
   * Converts PropertyMetadataCollection to the format expected by the extraction tool.
   *
   * @param properties - Property metadata collection
   * @returns Array of property definitions for the extraction tool
   */
  private preparePropertiesForExtraction(
    properties: PropertyMetadataCollection
  ): Array<{ propertyName: string; description: string }> {
    const propertiesToExtract: Array<{ propertyName: string; description: string }> = [];

    for (const [propertyName, metadata] of Object.entries(properties)) {
      propertiesToExtract.push({
        propertyName,
        description: metadata.description,
      });
    }

    this.logger.debug('Prepared properties for extraction', {
      count: propertiesToExtract.length,
      properties: propertiesToExtract.map(p => p.propertyName),
    });

    return propertiesToExtract;
  }

  /**
   * Validates and filters extraction results.
   *
   * This method:
   * 1. Validates the overall result structure
   * 2. Filters out null/undefined property values
   * 3. Validates each property value against its Zod schema
   * 4. Removes properties that fail validation
   * 5. Returns only valid, successfully extracted properties
   *
   * @param rawResult - Raw result from tool execution
   * @param properties - Property metadata for validation
   * @returns Validated extraction result with only valid properties
   */
  private validateAndFilterResult(
    rawResult: unknown,
    properties: PropertyMetadataCollection
  ): ExtractionResult {
    // First, validate the overall structure
    const structureValidated = INPUT_EXTRACTION_TOOL.resultSchema.parse(rawResult);
    const { extractedProperties } = structureValidated;

    this.logger.debug('Validating extracted properties', {
      rawProperties: Object.keys(extractedProperties),
    });

    // Now validate and filter individual properties
    const validatedProperties: Record<string, unknown> = {};
    const invalidProperties: string[] = [];

    for (const [propertyName, value] of Object.entries(extractedProperties)) {
      // Skip null/undefined values
      if (value == null) {
        this.logger.debug(`Skipping property with null/undefined value`, { propertyName });
        continue;
      }

      // Check if property exists in metadata
      const propertyMetadata = properties[propertyName];
      if (!propertyMetadata) {
        this.logger.warn(`Unknown property in extraction result`, { propertyName });
        continue;
      }

      // Validate against Zod schema
      try {
        const validatedValue = propertyMetadata.zodType.parse(value);
        validatedProperties[propertyName] = validatedValue;
        this.logger.debug(`Property validated successfully`, {
          propertyName,
          value: validatedValue,
        });
      } catch (error) {
        invalidProperties.push(propertyName);
        if (error instanceof z.ZodError) {
          this.logger.debug(`Property validation failed`, {
            propertyName,
            value,
            errors: error.errors,
          });
        } else {
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.logger.error(`Unexpected validation error for ${propertyName}: ${errorMsg}`);
          throw error;
        }
      }
    }

    if (invalidProperties.length > 0) {
      this.logger.info(`Some properties failed validation`, {
        invalidProperties,
        validCount: Object.keys(validatedProperties).length,
      });
    }

    return { extractedProperties: validatedProperties };
  }
}
