'use server';

/**
 * @fileOverview A flow that suggests relevant data fields for chart creation based on a specified outcome.
 *
 * - suggestChartFields - A function that suggests data fields for chart creation.
 * - SuggestChartFieldsInput - The input type for the suggestChartFields function.
 * - SuggestChartFieldsOutput - The return type for the suggestChartFields function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestChartFieldsInputSchema = z.object({
  outcome: z
    .string()
    .describe(
      'The specified outcome (e.g., revenue decrease) for which to suggest relevant data fields.'
    ),
  availableFields: z
    .array(z.string())
    .describe('The list of available data fields to choose from.'),
});
export type SuggestChartFieldsInput = z.infer<typeof SuggestChartFieldsInputSchema>;

const SuggestChartFieldsOutputSchema = z.object({
  suggestedFields: z
    .array(z.string())
    .describe(
      'The suggested data fields that correlate with the specified outcome.'
    ),
  reasoning: z
    .string()
    .describe('The reasoning behind the suggested data fields.'),
});
export type SuggestChartFieldsOutput = z.infer<typeof SuggestChartFieldsOutputSchema>;

export async function suggestChartFields(
  input: SuggestChartFieldsInput
): Promise<SuggestChartFieldsOutput> {
  return suggestChartFieldsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestChartFieldsPrompt',
  input: {schema: SuggestChartFieldsInputSchema},
  output: {schema: SuggestChartFieldsOutputSchema},
  prompt: `You are an AI assistant that suggests relevant data fields for chart creation based on a specified outcome and available fields.

  Given the outcome: {{{outcome}}},
  and the following available data fields: {{#each availableFields}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Suggest data fields that are most likely to correlate with the outcome.
  Explain the reasoning behind your suggestions.
  Return the suggested fields and reasoning in JSON format.
  {
    "suggestedFields": ["field1", "field2"],
    "reasoning": "Explanation of why these fields are relevant to the outcome."
  }`,
});

const suggestChartFieldsFlow = ai.defineFlow(
  {
    name: 'suggestChartFieldsFlow',
    inputSchema: SuggestChartFieldsInputSchema,
    outputSchema: SuggestChartFieldsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
