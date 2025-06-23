import { z } from 'zod';
import dedent from 'dedent';

export const AnalysisBaseIssueSchema = z.object({
  type: z.string().describe('Categorize the issue'),
  description: z.string().describe('Why this is an issue?'),
  suggestedAction: z
    .string()
    .describe(
      `How a developer should address the issue? Be as detailed as possible without adding code snippets.`
    ),
});

export const AnalysisIssueSchema = AnalysisBaseIssueSchema.extend({
  code: z.string().optional().describe('What is the code snippet with the issue?'),
  location: z
    .object({
      startLine: z.number(),
      endLine: z.number().optional(),
      startColumn: z.number().optional(),
      endColumn: z.number().optional(),
    })
    .describe('Provide the exact line number(s) and column number(s) where the issue occurs'),
});

export type AnalysisIssue = z.infer<typeof AnalysisIssueSchema>;
export type AnalysisBaseIssue = z.infer<typeof AnalysisBaseIssueSchema>;

export const NO_PRIVATE_WIRE_CONFIG_RULE_ID =
  '@salesforce/lwc-graph-analyzer/no-private-wire-config-property';

export const NO_WIRE_CONFIG_REFERENCES_NON_LOCAL_PROPERTY_REACTIVE_VALUE_RULE_ID =
  '@salesforce/lwc-graph-analyzer/no-wire-config-references-non-local-property-reactive-value';

export const noPrivateWireConfigStaticReviewConfig: AnalysisBaseIssue = {
  type: 'Private Wire Configuration Property',
  description:
    'Properties used in wire configurations must be decorated with @api to be public and resolvable by the wire service.',

  suggestedAction: dedent`
      Make the properties public by using the @api decorator:
      - Add @api decorator to properties used in wire configurations
    `,
};

export const noWireConfigReferenceNonLocalPropertyStaticReviewConfig: AnalysisBaseIssue = {
  type: 'Wire Configuration References Non-Local Property',
  description:
    'Wire configurations with reactive values ($prop) must reference only component properties, not imported values or values defined outside the component class.',

  suggestedAction: dedent`
      Wrap the non-local value in a getter:
      - Introduce a getter which returns the imported value or the value of a module-level constant
      - Update the wire configuration to use the getter name as the reactive parameter
      Example:
          // Instead of:
          @wire(getData, { param: importedValue })
          
          // Use:
          get localValue() {
              return importedValue;
          }
          @wire(getData, { param: '$localValue' })
    `,
};
