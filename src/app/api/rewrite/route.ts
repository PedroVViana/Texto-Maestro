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
      ...(body.targetCharCount ? { targetCharCount: body.targetCharCount } : {}),
      ...(body.targetWordCount ? { targetWordCount: body.targetWordCount } : {}),
      ...(body.targetReadTime ? { targetReadTime: body.targetReadTime } : {}),
      ...(body.targetSentiment ? { targetSentiment: body.targetSentiment } : {})
    };
    
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