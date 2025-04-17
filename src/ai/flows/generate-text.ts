'use server';

/**
 * @fileOverview Generates text based on a topic or prompt.
 *
 * - generateText - A function that handles the text generation process.
 * - GenerateTextInput - The input type for the generateText function.
 * - GenerateTextOutput - The return type for the generateText function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateTextInputSchema = z.object({
  topic: z.string().describe('O tópico ou prompt para geração de texto.'),
  style: z
    .enum([
      'Formal',
      'Casual',
      'Informativo',
      'Persuasivo',
      'Criativo/Narrativo',
      'Acadêmico',
      'Jornalístico',
      'Poético',
      'Técnico',
      'Motivacional',
    ])
    .describe('O estilo a ser usado para a geração do texto.'),
  length: z
    .enum(['Curto', 'Médio', 'Longo'])
    .describe('O comprimento desejado do texto.'),
  targetCharCount: z.number().optional(),
  targetWordCount: z.number().optional(),
  targetReadTime: z.number().optional(),
  targetSentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  additionalInstructions: z.string().optional().describe('Instruções adicionais para personalizar a geração do texto.'),
});
export type GenerateTextInput = z.infer<typeof GenerateTextInputSchema>;

const GenerateTextOutputSchema = z.object({
  generatedText: z.string().describe('O texto gerado.'),
});
export type GenerateTextOutput = z.infer<typeof GenerateTextOutputSchema>;

export async function generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
  return generateTextFlow(input);
}

type StyleType = 
  | 'Formal'
  | 'Casual'
  | 'Informativo'
  | 'Persuasivo'
  | 'Criativo/Narrativo'
  | 'Acadêmico'
  | 'Jornalístico'
  | 'Poético'
  | 'Técnico'
  | 'Motivacional';

type LengthType = 'Curto' | 'Médio' | 'Longo';

const getStyleInstructions = (style: StyleType): string => {
  const instructions: Record<StyleType, string> = {
    'Formal': 'Use linguagem formal, precisa e estruturada. Evite gírias e expressões coloquiais. Mantenha um tom profissional e objetivo.',
    'Casual': 'Use linguagem casual e conversacional. Pode incluir expressões do dia a dia e um tom mais descontraído. Escreva como se estivesse conversando com um amigo.',
    'Informativo': 'Foque em fornecer informações claras e precisas. Organize os fatos de forma lógica. Mantenha um tom neutro e objetivo, como um artigo informativo.',
    'Persuasivo': 'Escreva de forma convincente, com argumentos fortes e chamadas para ação. Use linguagem persuasiva que destaca benefícios e motiva o leitor.',
    'Criativo/Narrativo': 'Crie um texto narrativo envolvente com elementos de storytelling. Use descrições vívidas, metáforas e um tom expressivo que cativa o leitor.',
    'Acadêmico': 'Use linguagem formal acadêmica com terminologia específica. Estruture o texto logicamente com argumentos baseados em evidências. Mantenha um tom analítico e rigoroso.',
    'Jornalístico': 'Escreva em estilo de reportagem, com parágrafos curtos e informações importantes no início. Use citações quando apropriado e mantenha um tom informativo e direto.',
    'Poético': 'Crie um texto com elementos poéticos como ritmo, metáforas e linguagem figurada. Priorize a beleza da expressão e o impacto emocional das palavras.',
    'Técnico': 'Use linguagem técnica precisa com terminologia específica da área. Organize as informações de forma clara e sequencial. Priorize a clareza e exatidão.',
    'Motivacional': 'Escreva um texto inspirador que encoraje e motive o leitor. Use histórias de superação, mensagens positivas e chamadas para ação motivadoras.'
  };
  
  return instructions[style];
};

const getLengthInstructions = (length: LengthType): string => {
  const instructions: Record<LengthType, string> = {
    'Curto': 'Escreva um texto curto com aproximadamente 100-150 palavras (1 parágrafo).',
    'Médio': 'Escreva um texto de comprimento médio com aproximadamente 250-350 palavras (3-4 parágrafos).',
    'Longo': 'Escreva um texto mais longo com aproximadamente 500-700 palavras (5-7 parágrafos).'
  };
  
  return instructions[length];
};

const getSentimentInstructions = (sentiment?: string): string => {
  if (!sentiment) return "";
  
  switch (sentiment) {
    case 'positive':
      return "O texto deve expressar um sentimento FORTEMENTE POSITIVO, com linguagem entusiasmada, otimista e encorajadora. Use palavras positivas, expressões de alegria e esperança.";
    case 'negative':
      return "O texto deve expressar um sentimento FORTEMENTE NEGATIVO, com linguagem crítica, pessimista ou cética. Use palavras que expressem preocupação, dúvida ou problemas.";
    case 'neutral':
      return "O texto deve manter um tom ESTRITAMENTE NEUTRO e imparcial, focando apenas nos fatos sem expressar opiniões positivas ou negativas.";
    default:
      return "";
  }
};

const generateTextPrompt = ai.definePrompt({
  name: 'generateTextPrompt',
  input: {
    schema: z.object({
      topic: z.string().describe('O tópico ou prompt para geração de texto.'),
      style: z
        .enum([
          'Formal',
          'Casual',
          'Informativo',
          'Persuasivo',
          'Criativo/Narrativo',
          'Acadêmico',
          'Jornalístico',
          'Poético',
          'Técnico',
          'Motivacional',
        ])
        .describe('O estilo a ser usado para a geração do texto.'),
      styleInstructions: z.string().describe('Instruções específicas para o estilo.'),
      lengthInstructions: z.string().describe('Instruções sobre o comprimento do texto.'),
      additionalInstructions: z.string().optional().describe('Instruções adicionais para personalizar a geração do texto.'),
      sentimentInstructions: z.string().optional().describe('Instruções sobre o sentimento do texto.')
    }),
  },
  output: {
    schema: z.object({
      generatedText: z.string().describe('O texto gerado.'),
    }),
  },
  prompt: `Gere um texto em português sobre o tópico fornecido, seguindo as instruções abaixo.

TÓPICO: {{{topic}}}

INSTRUÇÕES DE ESTILO:
{{{styleInstructions}}}

INSTRUÇÕES DE COMPRIMENTO:
{{{lengthInstructions}}}

{{#if sentimentInstructions}}
SENTIMENTO DO TEXTO:
{{{sentimentInstructions}}}
{{/if}}

DIRETRIZES ADICIONAIS:
1. O texto deve ser escrito exclusivamente em português brasileiro.
2. Organize o texto em parágrafos bem estruturados e coesos.
3. Evite repetições excessivas e mantenha um fluxo natural de ideias.
4. Adapte o vocabulário e tom ao estilo solicitado.
5. Se o tópico for muito amplo, foque nos aspectos mais relevantes.
6. Seja criativo e original, evitando clichês quando possível.
{{#if additionalInstructions}}
7. Instruções específicas: {{{additionalInstructions}}}
{{/if}}

Texto gerado:`,
});

const generateTextFlow = ai.defineFlow<typeof GenerateTextInputSchema, typeof GenerateTextOutputSchema>(
  {
    name: 'generateTextFlow',
    inputSchema: GenerateTextInputSchema,
    outputSchema: GenerateTextOutputSchema,
  },
  async (input) => {
    const { topic, style, length, targetCharCount, targetWordCount, targetReadTime, targetSentiment, additionalInstructions } = input;

    // Determinar as instruções de estilo
    const styleInstructions = getStyleInstructions(style as StyleType);

    // Determinar as instruções de comprimento
    const lengthInstructions = getLengthInstructions(length as LengthType);
    
    // Determinar as instruções de sentimento
    const sentimentInstructions = getSentimentInstructions(targetSentiment);
    
    // Instruções específicas de comprimento
    const targetLengthInstructions = [];
    
    if (targetCharCount) {
      targetLengthInstructions.push(`O texto DEVE ter aproximadamente ${targetCharCount} caracteres no total.`);
    }
    
    if (targetWordCount) {
      targetLengthInstructions.push(`O texto DEVE ter aproximadamente ${targetWordCount} palavras no total.`);
    }
    
    if (targetReadTime) {
      targetLengthInstructions.push(`O texto DEVE ser escrito para um tempo de leitura de aproximadamente ${targetReadTime} minutos.`);
    }
    
    const targetLengthText = targetLengthInstructions.length > 0 
      ? "Instruções específicas de comprimento:\n" + targetLengthInstructions.join("\n")
      : "";

    // Combinar todas as instruções
    const allInstructions = [
      styleInstructions,
      lengthInstructions,
      sentimentInstructions,
      targetLengthText,
      additionalInstructions
    ]
      .filter(Boolean)
      .join('\n\n');

    // Gerar o texto
    const result = await generateTextPrompt({
      topic,
      style,
      styleInstructions: allInstructions,
      lengthInstructions: "",
      additionalInstructions: "",
      sentimentInstructions: ""
    });

    return {
      generatedText: result.output!.generatedText
    };
  }
); 