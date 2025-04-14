'use server';

/**
 * @fileOverview Rewrites text based on a selected style.
 *
 * - rewriteText - A function that handles the text rewriting process.
 * - RewriteTextInput - The input type for the rewriteText function.
 * - RewriteTextOutput - The return type for the rewriteText function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const RewriteTextInputSchema = z.object({
  text: z.string().describe('The text to rewrite.'),
  style: z
    .enum([
      'Grammar correction',
      'Formal rewrite',
      'Simplified rewrite',
      'Persuasive rewrite',
      'Social media optimization',
    ])
    .describe('The style to use for rewriting the text.'),
});
export type RewriteTextInput = z.infer<typeof RewriteTextInputSchema>;

const RewriteTextOutputSchema = z.object({
  rewrittenText: z.string().describe('The rewritten text.'),
});
export type RewriteTextOutput = z.infer<typeof RewriteTextOutputSchema>;

export async function rewriteText(input: RewriteTextInput): Promise<RewriteTextOutput> {
  return rewriteTextFlow(input);
}

const rewriteTextPrompt = ai.definePrompt({
  name: 'rewriteTextPrompt',
  input: {
    schema: z.object({
      text: z.string().describe('The text to rewrite.'),
      style: z
        .enum([
          'Grammar correction',
          'Formal rewrite',
          'Simplified rewrite',
          'Persuasive rewrite',
          'Social media optimization',
        ])
        .describe('The style to use for rewriting the text.'),
    }),
  },
  output: {
    schema: z.object({
      rewrittenText: z.string().describe('The rewritten text.'),
    }),
  },
  prompt: `Rewrite the following text in the style of {{{style}}}.\n\nText: {{{text}}}`,
});

const rewriteTextFlow = ai.defineFlow<typeof RewriteTextInputSchema, typeof RewriteTextOutputSchema>(
  {
    name: 'rewriteTextFlow',
    inputSchema: RewriteTextInputSchema,
    outputSchema: RewriteTextOutputSchema,
  },
  async input => {
    const {output} = await rewriteTextPrompt(input);
    return output!;
  }
);
