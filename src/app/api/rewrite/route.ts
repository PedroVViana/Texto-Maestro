import { NextRequest, NextResponse } from 'next/server';
import { rewriteText, RewriteTextInput } from '@/ai/flows/rewrite-text';

export async function POST(request: NextRequest) {
  try {
    // Verificar o corpo da requisição
    const body = await request.json();
    
    // Validar os dados necessários
    if (!body.text || !body.style) {
      return NextResponse.json(
        { error: 'Texto e estilo são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Chamar a função de reescrita
    const input: RewriteTextInput = {
      text: body.text,
      style: body.style,
      targetCharCount: body.targetCharCount,
      targetReadTime: body.targetReadTime,
      targetSentiment: body.targetSentiment,
      targetWordCount: body.targetWordCount,
      additionalInstructions: body.additionalInstructions
    };
    
    // Adicionar configurações opcionais apenas se fornecidas e válidas
    if (typeof body.targetCharCount === 'number' && body.targetCharCount > 0) {
      input.targetCharCount = body.targetCharCount;
    }
    
    if (typeof body.targetWordCount === 'number' && body.targetWordCount > 0) {
      input.targetWordCount = body.targetWordCount;
    }
    
    if (typeof body.targetReadTime === 'number' && body.targetReadTime > 0) {
      input.targetReadTime = body.targetReadTime;
    }
    
    if (body.targetSentiment && ['Positivo', 'Neutro', 'Negativo'].includes(body.targetSentiment)) {
      input.targetSentiment = body.targetSentiment;
    }
    
    // Processar a reescrita do texto
    const result = await rewriteText(input);
    
    // Retornar o resultado
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao processar reescrita:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno no servidor' },
      { status: 500 }
    );
  }
} 