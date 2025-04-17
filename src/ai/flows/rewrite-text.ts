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
      'Academic style',
      'Journalistic style',
      'Creative/Narrative style',
      'Technical style',
      'SEO optimized',
    ])
    .describe('The style to use for rewriting the text.'),
  targetCharCount: z.number().optional().describe('The target character count for the rewritten text.'),
  targetWordCount: z.number().optional().describe('The target word count for the rewritten text.'),
  targetReadTime: z.number().optional().describe('The target reading time in minutes for the rewritten text.'),
  targetSentiment: z.enum(['Positivo', 'Neutro', 'Negativo']).optional().describe('The target sentiment for the rewritten text.'),
  additionalInstructions: z.string().optional().describe('Additional instructions for customizing the rewrite.')
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
type StyleType = 
  | 'Grammar correction' 
  | 'Formal rewrite' 
  | 'Simplified rewrite' 
  | 'Persuasive rewrite' 
  | 'Social media optimization'
  | 'Academic style'
  | 'Journalistic style'
  | 'Creative/Narrative style'
  | 'Technical style'
  | 'SEO optimized';

const getStyleInstructions = (style: StyleType): string => {
  const instructions: Record<StyleType, string> = {
    'Grammar correction': 'Corrija os erros gramaticais, ortográficos e de pontuação, mantendo o significado original.',
    'Formal rewrite': 'Reescreva o texto em um tom mais formal e profissional, adequado para comunicações corporativas ou acadêmicas.',
    'Simplified rewrite': 'Simplifique o texto para torná-lo mais claro e fácil de entender, usando palavras simples e frases curtas.',
    'Persuasive rewrite': 'Torne o texto mais persuasivo, convincente e capaz de motivar ação, mantendo sua essência.',
    'Social media optimization': 'Adapte o texto para redes sociais, tornando-o mais envolvente, conciso e atraente, incluindo elementos que geram engajamento como hashtags relevantes se apropriado.',
    'Academic style': 'Reescreva o texto em estilo acadêmico, utilizando linguagem formal, precisa e objetiva. Inclua terminologia específica da área, evite expressões coloquiais e adote um tom neutro e analítico. Priorize a clareza e o rigor científico.',
    'Journalistic style': 'Adapte o texto para um formato jornalístico, com parágrafos curtos e diretos. Estruture-o seguindo a pirâmide invertida (informações mais importantes primeiro). Use linguagem clara, objetiva e factual, mantendo um tom informativo e imparcial.',
    'Creative/Narrative style': 'Transforme o texto em uma narrativa envolvente e criativa. Utilize recursos literários como metáforas, analogias e descrições vívidas. Explore um tom mais expressivo e cativante, criando uma conexão emocional com o leitor.',
    'Technical style': 'Reescreva o texto em formato técnico, com precisão terminológica e clareza nas instruções. Organize as informações de forma lógica e sequencial, utilize termos específicos da área e mantenha um tom neutro e objetivo, priorizando a exatidão.',
    'SEO optimized': 'Otimize o texto para mecanismos de busca, mantendo uma linguagem natural e fluida. Inclua palavras-chave relevantes de forma estratégica (início de parágrafos e subtítulos), utilize subtítulos informativos, crie parágrafos curtos e de fácil leitura e inclua chamadas para ação quando apropriado.'
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
          'Academic style',
          'Journalistic style',
          'Creative/Narrative style',
          'Technical style',
          'SEO optimized',
        ])
        .describe('The style to use for rewriting the text.'),
      styleInstructions: z.string().describe('Instructions for the specific style.'),
      targetCharCount: z.number().optional().describe('The target character count for the rewritten text.'),
      targetWordCount: z.number().optional().describe('The target word count for the rewritten text.'),
      targetReadTime: z.number().optional().describe('The target reading time in minutes for the rewritten text.'),
      targetSentiment: z.string().optional().describe('The target sentiment for the rewritten text.'),
      additionalInstructions: z.string().optional().describe('Additional instructions for customizing the rewrite.')
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
{{#if targetCharCount}}
6. O texto reescrito deve ter aproximadamente {{{targetCharCount}}} caracteres.
{{/if}}
{{#if targetWordCount}}
7. O texto reescrito deve ter aproximadamente {{{targetWordCount}}} palavras.
{{/if}}
{{#if targetReadTime}}
8. O texto reescrito deve ser legível em aproximadamente {{{targetReadTime}}} minutos.
{{/if}}
{{#if targetSentiment}}
9. O tom do texto deve ser {{{targetSentiment}}}.
{{/if}}
{{#if additionalInstructions}}
10. Instruções adicionais: {{{additionalInstructions}}}
{{/if}}

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
    
    // Prepare a formatted targetSentiment if it exists
    let sentimentInstruction = input.targetSentiment;
    
    const {output} = await rewriteTextPrompt({
      text: input.text,
      style: input.style,
      styleInstructions,
      targetCharCount: input.targetCharCount,
      targetWordCount: input.targetWordCount,
      targetReadTime: input.targetReadTime,
      targetSentiment: sentimentInstruction,
      additionalInstructions: input.additionalInstructions
    });
    return output!;
  }
);
