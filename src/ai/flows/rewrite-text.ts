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

// Definir um tipo para os estilos possíveis
type StyleType = 'Grammar correction' | 'Formal rewrite' | 'Simplified rewrite' | 'Persuasive rewrite' | 'Social media optimization';

const getStyleInstructions = (style: StyleType): string => {
  const instructions: Record<StyleType, string> = {
    'Grammar correction': 'Corrija os erros gramaticais, ortográficos e de pontuação, mantendo o significado original.',
    'Formal rewrite': 'Reescreva o texto em um tom mais formal e profissional, adequado para comunicações corporativas ou acadêmicas.',
    'Simplified rewrite': 'Simplifique o texto para torná-lo mais claro e fácil de entender, usando palavras simples e frases curtas.',
    'Persuasive rewrite': 'Torne o texto mais persuasivo, convincente e capaz de motivar ação, mantendo sua essência.',
    'Social media optimization': 'Adapte o texto para redes sociais, tornando-o mais envolvente, conciso e atraente, incluindo elementos que geram engajamento como hashtags relevantes se apropriado.'
  };
  
  return instructions[style];
};

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
      styleInstructions: z.string().describe('Instructions for the specific style.')
    }),
  },
  output: {
    schema: z.object({
      rewrittenText: z.string().describe('The rewritten text.'),
    }),
  },
  prompt: `Reescreva o texto a seguir de acordo com as instruções. 
  
INSTRUÇÕES:
1. Mantenha SEMPRE o mesmo idioma do texto original (provavelmente Português).
2. {{{styleInstructions}}}
3. Preserve o significado principal do texto original.
4. Não adicione informações que não estejam no original, a menos que seja necessário para o estilo solicitado.
5. Não gere traduções, apenas reescreva o texto.

Texto original: {{{text}}}

Reescrita:`,
});

const rewriteTextFlow = ai.defineFlow<typeof RewriteTextInputSchema, typeof RewriteTextOutputSchema>(
  {
    name: 'rewriteTextFlow',
    inputSchema: RewriteTextInputSchema,
    outputSchema: RewriteTextOutputSchema,
  },
  async input => {
    const styleInstructions = getStyleInstructions(input.style as StyleType);
    const {output} = await rewriteTextPrompt({
      text: input.text,
      style: input.style,
      styleInstructions
    });
    return output!;
  }
);
