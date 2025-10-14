/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import z from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { PropertyMetadataCollection } from '../../common/propertyMetadata.js';
import { MCPToolInvocationData } from '../../common/metadata.js';
import { INPUT_EXTRACTION_TOOL } from '../../tools/plan/sfmobile-native-input-extraction/metadata.js';
import { ToolExecutor } from '../nodes/toolExecutor.js';
import { Logger } from '../../logging/logger.js';
import { AbstractService } from './abstractService.js';

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
 * This service extends AbstractService to leverage common tool execution
 * patterns including standardized logging and result validation.
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
export class InputExtractionService
  extends AbstractService
  implements InputExtractionServiceProvider
{
  /**
   * Creates a new InputExtractionService.
   *
   * @param toolExecutor - Tool executor for invoking the extraction tool (injectable for testing)
   * @param logger - Logger instance (injectable for testing)
   */
  constructor(toolExecutor?: ToolExecutor, logger?: Logger) {
    super('InputExtractionService', toolExecutor, logger);
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

    // Prepare result schema
    const resultSchema = this.preparePropertyResultsSchema(properties);
    const resultSchemaString = JSON.stringify(zodToJsonSchema(resultSchema));

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
        resultSchema: resultSchemaString,
      },
    };

    // Execute tool with logging and custom validation
    // The custom validator handles complex validation and filtering logic
    const validatedResult = this.executeToolWithLogging(
      toolInvocationData,
      resultSchema,
      (rawResult, schema) => this.validateAndFilterResult(rawResult, properties, schema)
    );

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
   * Creates the result schema for the extracted properties.
   *
   * Note: This schema is primarily structural - it ensures all required properties
   * are present and provides type hints to the LLM. The actual type/value validation
   * happens in validateAndFilterResult() where we can gracefully handle and log errors.
   *
   * @param properties The properties that will define the result schema.
   * @returns The result schema for the extracted properties.
   */
  private preparePropertyResultsSchema(
    properties: PropertyMetadataCollection
  ): z.ZodObject<{ extractedProperties: z.ZodObject<z.ZodRawShape> }> {
    const extractedPropertiesShape: Record<string, z.ZodType> = {};

    for (const [propertyName, metadata] of Object.entries(properties)) {
      // Include the full type information in the schema for the LLM's benefit,
      // but use .catch() so validation errors don't throw - they'll be caught
      // and logged in the validateAndFilterResult phase
      extractedPropertiesShape[propertyName] = metadata.zodType
        .describe(metadata.description)
        .nullable()
        .catch((ctx: { input: unknown }) => ctx.input); // Preserve the invalid value for logging during downstream validation.
    }

    // Use .passthrough() to preserve unknown properties for warning logs
    return z.object({ extractedProperties: z.object(extractedPropertiesShape).passthrough() });
  }

  /**
   * Validates and filters extraction results.
   *
   * This method:
   * 1. Validates the overall result structure (array-of-objects from LLM)
   * 2. Converts array format to record format for easier consumption
   * 3. Filters out null/undefined property values
   * 4. Validates each property value against its Zod schema
   * 5. Removes properties that fail validation
   * 6. Returns only valid, successfully extracted properties
   *
   * @param rawResult - Raw result from tool execution (array format from LLM)
   * @param properties - Property metadata for validation
   * @returns Validated extraction result with only valid properties (record format)
   */
  private validateAndFilterResult(
    rawResult: unknown,
    properties: PropertyMetadataCollection,
    resultSchema: z.ZodObject<{ extractedProperties: z.ZodObject<z.ZodRawShape> }>
  ): ExtractionResult {
    // First, validate the overall structure (array-of-objects format from LLM)
    const structureValidated = resultSchema.parse(rawResult);
    const { extractedProperties } = structureValidated;

    this.logger.debug('Validating extracted properties', {
      extractedProperties,
    });

    // Convert array format to record format and validate individual properties
    const validatedProperties: Record<string, unknown> = {};
    const invalidProperties: string[] = [];

    for (const [propertyName, propertyValue] of Object.entries(extractedProperties)) {
      // Skip null/undefined values
      if (propertyValue == null) {
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
        const validatedValue = propertyMetadata.zodType.parse(propertyValue);
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
            value: propertyValue,
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
