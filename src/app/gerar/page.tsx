"use client";

import {GenerateTextInput, generateText} from "@/ai/flows/generate-text";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useState, useEffect, Suspense} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useToast} from "@/hooks/use-toast";
import {
  Copy, 
  Download, 
  Sparkles, 
  FileText, 
  Wand, 
  Clock, 
  BarChart2, 
  PenTool,
  ArrowLeft,
  Settings
} from "lucide-react";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useSearchParams } from "next/navigation";
import { UserMenu } from "@/components/Auth/UserMenu";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/components/Auth/AuthProvider";
import { UserRibbon } from "@/components/Auth/UserRibbon";

const textStyles = [
  "Formal",
  "Casual",
  "Informativo",
  "Persuasivo",
  "Criativo/Narrativo",
  "Acadêmico",
  "Jornalístico",
  "Poético",
  "Técnico",
  "Motivacional",
] as const;

const textLengths = [
  "Curto",
  "Médio",
  "Longo",
] as const;

type TextStyle = typeof textStyles[number];
type TextLength = typeof textLengths[number];

interface TextGeneration {
  id: string;
  topic: string;
  generatedText: string;
  style: TextStyle;
  length: TextLength;
  timestamp: Date;
  analysis?: {
    wordCount: number;
    charCount: number;
    readTime: number;
    sentimentScore?: number;
    sentimentLabel?: 'Positivo' | 'Neutro' | 'Negativo';
  };
}

interface TextAnalysis {
  wordCount: number;
  charCount: number;
  readTime: number;
  sentimentScore?: number;
  sentimentLabel?: 'Positivo' | 'Neutro' | 'Negativo';
}

interface AdvancedConfig {
  targetCharCount: number;
  targetWordCount: number;
  targetReadTime: number;
  enableAdvancedOptions: boolean;
}

// Objetos de tradução para exibição em português
const generateStyleTranslations: Record<TextStyle, string> = {
  "Formal": "Formal",
  "Casual": "Casual",
  "Informativo": "Informativo",
  "Persuasivo": "Persuasivo",
  "Criativo/Narrativo": "Criativo/Narrativo",
  "Acadêmico": "Acadêmico",
  "Jornalístico": "Jornalístico",
  "Poético": "Poético",
  "Técnico": "Técnico",
  "Motivacional": "Motivacional",
};

const lengthTranslations: Record<TextLength, string> = {
  "Curto": "Curto",
  "Médio": "Médio",
  "Longo": "Longo",
};

// Componente principal que usa useSearchParams
function GeneratePageContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic") || "";
  const [topic, setTopic] = useState(initialTopic);
  const [style, setStyle] = useState<TextStyle>(textStyles[0]);
  const [length, setLength] = useState<TextLength>(textLengths[1]);
  const [textGeneration, setTextGeneration] = useState<TextGeneration | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHistoryLink, setShowHistoryLink] = useState(false);
  const [textAnalysis, setTextAnalysis] = useState<TextAnalysis | null>(null);
  const { user, userPlan, remainingGenerations, decrementGenerations } = useAuth();
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfig>({
    targetCharCount: 0,
    targetWordCount: 0,
    targetReadTime: 5,
    enableAdvancedOptions: false
  });
  const {toast} = useToast();

  // Carregar histórico do localStorage apenas para verificar se existem textos salvos
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGenerations = localStorage.getItem('textGenerations');
      if (savedGenerations) {
        try {
          const parsedGenerations = JSON.parse(savedGenerations);
          // Apenas verificar se existem textos para mostrar o link
          if (parsedGenerations && parsedGenerations.length > 0) {
            setShowHistoryLink(true); // Mostrar o link "Ver meu histórico"
          }
        } catch (error) {
          console.error('Erro ao verificar histórico de gerações:', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (topic.trim()) {
      analyzeText(topic);
    } else {
      setTextAnalysis(null);
    }
  }, [topic]);

  const analyzeText = (text: string) => {
    // Contagem de palavras
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    // Contagem de caracteres
    const charCount = text.length;
    
    // Tempo de leitura (considerando 200 palavras por minuto)
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    
    setTextAnalysis({
      wordCount,
      charCount,
      readTime
    });
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, insira um tópico para gerar o texto.",
      });
      return;
    }
    
    // Para planos infinitos, não verificar limites de cota
    if (userPlan.type === "pro") {
      setLoading(true);
      setTextGeneration(null); // Limpar resultado anterior ao iniciar nova requisição
      
      try {
        // Preparar input básico
        const input: GenerateTextInput = {
          topic: topic,
          style: style,
          length: length,
        };
        
        // Adicionar configurações avançadas se existirem
        if (advancedConfig.enableAdvancedOptions && userPlan.advancedOptionsEnabled) {
          let additionalInstructions = "";
          
          if (advancedConfig.targetCharCount > 0) {
            additionalInstructions += `\nMantenha o texto com aproximadamente ${advancedConfig.targetCharCount} caracteres.`;
          }
          
          if (advancedConfig.targetWordCount > 0) {
            additionalInstructions += `\nMantenha o texto com aproximadamente ${advancedConfig.targetWordCount} palavras.`;
          }
          
          if (advancedConfig.targetReadTime > 0) {
            additionalInstructions += `\nEscreva de forma que o tempo de leitura seja de aproximadamente ${advancedConfig.targetReadTime} minutos.`;
          }
          
          // Adicionar instruções adicionais apenas se existirem
          if (additionalInstructions) {
            input.additionalInstructions = additionalInstructions.trim();
          }
        }
        
        // Chamar a API para gerar o texto
        const result = await generateText(input);
        
        // Análise do texto gerado
        const generatedTextAnalysis = analyzeGeneratedText(result.generatedText);
        
        // Criando objeto de resultado
        const generationResult: TextGeneration = {
          id: generateId(),
          topic,
          generatedText: result.generatedText,
          style,
          length,
          timestamp: new Date(),
          analysis: generatedTextAnalysis
        };
        
        // Atualizar o estado para mostrar o card com o resultado
        setTextGeneration(generationResult);
        setShowHistoryLink(true);
        
        // Salvando o resultado no histórico
        try {
          const savedGenerations = localStorage.getItem('textGenerations');
          let allGenerations = savedGenerations ? JSON.parse(savedGenerations) : [];
          
          // Adicionar nova geração no início da lista
          allGenerations = [generationResult, ...allGenerations];
          
          // Se o usuário está logado e temos limite de histórico por dias
          if (user && userPlan.historyDays !== "unlimited") {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - (userPlan.historyDays as number));
            
            // Filtrar gerações antigas com tratamento de erro para datas
            allGenerations = allGenerations.filter((item: TextGeneration) => {
              try {
                // Converter string para Date se necessário
                const itemDate = typeof item.timestamp === 'string' 
                  ? new Date(item.timestamp) 
                  : item.timestamp;
                
                // Verificar se a data é válida
                if (!(itemDate instanceof Date) || isNaN(itemDate.getTime())) {
                  return false;
                }
                
                return itemDate >= cutoffDate;
              } catch (error) {
                console.error("Erro ao processar data durante filtragem:", error);
                return false;
              }
            });
          }
          
          // Salvar de volta no localStorage
          localStorage.setItem('textGenerations', JSON.stringify(allGenerations));
        } catch (error) {
          console.error('Erro ao salvar texto gerado:', error);
        }
        
        toast({
          title: "Texto gerado",
          description: `Texto gerado com sucesso.`,
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message || "Falha ao gerar o texto.",
        });
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Verificar cota diária para planos com limite
    if (remainingGenerations <= 0) {
      toast({
        variant: "destructive",
        title: "Limite diário atingido",
        description: "Você atingiu seu limite diário de gerações de texto. Aguarde até amanhã ou faça um upgrade de plano.",
      });
      return;
    }
    
    // Verificar se o usuário está tentando usar configurações avançadas sem permissão
    if (advancedConfig.enableAdvancedOptions && !userPlan.advancedOptionsEnabled) {
      toast({
        variant: "destructive",
        title: "Recurso não disponível",
        description: "Configurações avançadas estão disponíveis apenas nos planos Plus e Pro.",
      });
      return;
    }
    
    // Verificar se o usuário tem acesso ao estilo selecionado
    const styleIndex = textStyles.indexOf(style);
    
    if (styleIndex >= userPlan.availableStyles) {
      toast({
        variant: "destructive",
        title: "Estilo não disponível",
        description: `O estilo "${style}" está disponível apenas em planos superiores.`,
      });
      return;
    }
    
    setLoading(true);
    setTextGeneration(null); // Limpar resultado anterior ao iniciar nova requisição
    
    try {
      // Preparar input básico
      const input: GenerateTextInput = {
        topic: topic,
        style: style,
        length: length,
      };
      
      // Adicionar instruções adicionais apenas se as configurações avançadas estiverem ativadas
      // e o usuário tiver permissão para usá-las
      if (advancedConfig.enableAdvancedOptions && userPlan.advancedOptionsEnabled) {
        let additionalInstructions = "";
        
        if (advancedConfig.targetCharCount > 0) {
          // Verificar se o número de caracteres excede o limite do plano
          if (advancedConfig.targetCharCount > userPlan.wordLimit * 6) { // estimativa de 6 caracteres por palavra
            toast({
              variant: "destructive",
              title: "Limite excedido",
              description: `Seu plano permite textos com no máximo aproximadamente ${userPlan.wordLimit * 6} caracteres.`,
            });
            setLoading(false);
            return;
          }
          
          additionalInstructions += `\nMantenha o texto com aproximadamente ${advancedConfig.targetCharCount} caracteres.`;
        }
        
        if (advancedConfig.targetWordCount > 0) {
          // Verificar se o número de palavras excede o limite do plano
          if (advancedConfig.targetWordCount > userPlan.wordLimit) {
            toast({
              variant: "destructive",
              title: "Limite excedido",
              description: `Seu plano permite textos com no máximo ${userPlan.wordLimit} palavras.`,
            });
            setLoading(false);
            return;
          }
          
          additionalInstructions += `\nMantenha o texto com aproximadamente ${advancedConfig.targetWordCount} palavras.`;
        }
        
        if (advancedConfig.targetReadTime > 0) {
          // Converter tempo de leitura para palavras (estimativa de 200 palavras por minuto)
          const estimatedWords = advancedConfig.targetReadTime * 200;
          if (estimatedWords > userPlan.wordLimit) {
            toast({
              variant: "destructive",
              title: "Limite excedido",
              description: `O tempo de leitura solicitado excede o limite de palavras do seu plano.`,
            });
            setLoading(false);
            return;
          }
          
          additionalInstructions += `\nEscreva de forma que o tempo de leitura seja de aproximadamente ${advancedConfig.targetReadTime} minutos.`;
        }
        
        // Adicionar instruções adicionais apenas se existirem
        if (additionalInstructions) {
          input.additionalInstructions = additionalInstructions.trim();
        }
      }
      
      // Chamar a API para gerar o texto
      const result = await generateText(input);
      
      // Decrementar a cota do usuário
      decrementGenerations();
      
      // Análise do texto gerado
      const generatedTextAnalysis = analyzeGeneratedText(result.generatedText);
      
      // Criando objeto de resultado
      const generationResult: TextGeneration = {
        id: generateId(),
        topic,
        generatedText: result.generatedText,
        style,
        length,
        timestamp: new Date(),
        analysis: generatedTextAnalysis
      };
      
      // Atualizar o estado para mostrar o card com o resultado
      setTextGeneration(generationResult);
      setShowHistoryLink(true);
      
      // Salvando o resultado no histórico
      try {
        const savedGenerations = localStorage.getItem('textGenerations');
        let allGenerations = savedGenerations ? JSON.parse(savedGenerations) : [];
        
        // Adicionar nova geração no início da lista
        allGenerations = [generationResult, ...allGenerations];
        
        // Se o usuário está logado e temos limite de histórico por dias
        if (user && typeof userPlan.historyDays === 'number') {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - userPlan.historyDays);
          
          // Filtrar gerações antigas com tratamento de erro para datas
          allGenerations = allGenerations.filter((item: TextGeneration) => {
            try {
              // Converter string para Date se necessário
              const itemDate = typeof item.timestamp === 'string' 
                ? new Date(item.timestamp) 
                : item.timestamp;
              
              // Verificar se a data é válida
              if (!(itemDate instanceof Date) || isNaN(itemDate.getTime())) {
                return false;
              }
              
              return itemDate >= cutoffDate;
            } catch (error) {
              console.error("Erro ao processar data durante filtragem:", error);
              return false;
            }
          });
        }
        
        // Salvar de volta no localStorage
        localStorage.setItem('textGenerations', JSON.stringify(allGenerations));
      } catch (error) {
        console.error('Erro ao salvar texto gerado:', error);
      }
      
      toast({
        title: "Texto gerado",
        description: `Texto gerado com sucesso. Você tem ${remainingGenerations - 1} gerações restantes hoje.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Falha ao gerar o texto.",
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeGeneratedText = (text: string) => {
    // Contagem de palavras
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    // Contagem de caracteres
    const charCount = text.length;
    
    // Tempo de leitura (considerando 200 palavras por minuto)
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    
    // Análise mais robusta de sentimento
    let sentimentScore = 0;
    // Lista expandida de palavras positivas e negativas
    const positiveWords = [
      'bom', 'ótimo', 'excelente', 'incrível', 'feliz', 'positivo', 'maravilhoso', 'sucesso', 
      'perfeito', 'melhor', 'eficaz', 'benefício', 'vantagem', 'promissor', 'esperança', 
      'solução', 'inovação', 'vencer', 'alegria', 'prazer', 'satisfação', 'agradável', 'bonito', 
      'satisfatório', 'elogio', 'avanço', 'progresso', 'conquista', 'vitória', 'facilidade', 
      'ganho', 'crescimento', 'oportunidade', 'recompensa', 'celebração', 'êxito', 'triunfo', 
      'beleza', 'admirável', 'encantador', 'inspirador', 'eficiente', 'favorável', 'gratificante'
    ];
    
    const negativeWords = [
      'ruim', 'péssimo', 'terrível', 'horrível', 'triste', 'negativo', 'fracasso', 'defeito', 
      'problema', 'falha', 'risco', 'perigo', 'preocupação', 'crise', 'dificuldade', 'limitação', 
      'conflito', 'perda', 'dano', 'erro', 'prejuízo', 'mal', 'desvantagem', 'adversidade', 
      'obstáculo', 'queda', 'decepção', 'insatisfação', 'inadequado', 'ineficaz', 'ineficiente', 
      'desastre', 'catástrofe', 'destruição', 'ameaça', 'trauma', 'colapso', 'derrota', 'falência',
      'crítica', 'questionável', 'insuficiente', 'lamentável', 'indesejável', 'decadente', 'caos'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) {
        positiveCount++;
        sentimentScore++;
      }
      if (negativeWords.some(nw => word.includes(nw))) {
        negativeCount++;
        sentimentScore--;
      }
    });
    
    // Calcular percentual de palavras de sentimento em relação ao total
    const totalWords = words.length;
    const positivePercentage = (positiveCount / totalWords) * 100;
    const negativePercentage = (negativeCount / totalWords) * 100;
    
    // Usar porcentagens para determinar o sentimento de forma mais precisa
    // Se uma grande porcentagem do texto tiver palavras negativas, ele deve ser classificado como negativo
    // mesmo que haja algumas palavras positivas
    
    let sentimentLabel: 'Positivo' | 'Neutro' | 'Negativo' = 'Neutro';
    
    // Ajustar limiares para melhor detecção
    if (sentimentScore > 3 || positivePercentage > 5) sentimentLabel = 'Positivo';
    if (sentimentScore < -3 || negativePercentage > 5) sentimentLabel = 'Negativo';
    
    // Verificação de casos extremos
    if (negativePercentage > 10 && negativePercentage > positivePercentage * 1.5) {
      sentimentLabel = 'Negativo';
    } else if (positivePercentage > 10 && positivePercentage > negativePercentage * 1.5) {
      sentimentLabel = 'Positivo';
    }
    
    // Análise contextual para textos curtos
    // Se o texto for curto, damos mais peso para cada palavra de sentimento
    if (wordCount < 100 && sentimentScore !== 0) {
      sentimentLabel = sentimentScore > 0 ? 'Positivo' : 'Negativo';
    }
    
    return {
      wordCount,
      charCount,
      readTime,
      sentimentScore,
      sentimentLabel
    };
  };

  const generateId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência.",
    });
  };

  const handleDownload = (text: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatDate = (date: Date) => {
    try {
      // Verificar se o valor é uma data válida
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return "Data não disponível";
      }
      
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data não disponível";
    }
  };

  const renderSentimentBadge = (sentiment: 'Positivo' | 'Neutro' | 'Negativo') => {
    let badgeClass = 'px-1.5 py-0.5 rounded text-xs font-medium ';
    
    if (sentiment === 'Positivo') {
      badgeClass += 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300';
    } else if (sentiment === 'Negativo') {
      badgeClass += 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300';
    } else {
      badgeClass += 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300';
    }
    
    return <span className={badgeClass}>{sentiment}</span>;
  };

  return (
    <div className="relative flex flex-col items-center justify-start min-h-screen bg-pattern px-4 pb-6 md:pb-8">
      {/* Elementos de fundo */}
      <div className="grain-overlay"></div>
      <div className="fixed top-[10%] right-[10%] w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/20 blur-3xl opacity-50"></div>
      <div className="fixed bottom-[10%] left-[10%] w-28 h-28 md:w-40 md:h-40 rounded-full bg-accent/20 blur-3xl opacity-50"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-60 md:h-60 rounded-full bg-secondary/10 blur-3xl opacity-30"></div>
      
      {/* Barra de navegação */}
      <Navbar />
      <UserRibbon />
      
      {/* Título Principal */}
      <div className="w-full max-w-2xl text-center mb-6 mt-16 md:mb-8 md:mt-20 px-2 fade-in-up">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-1 text-primary hover:text-accent transition-colors">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            <span className="text-xs md:text-sm">Voltar para Reescrita</span>
          </Link>
        </div>
        
        <div className="flex items-center justify-center gap-1 md:gap-2 mb-2 mt-4">
          <PenTool size={24} className="text-primary animate-float block md:text-3xl" />
          <h1 className="text-gradient text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight">
            Criar Texto
          </h1>
          <Sparkles size={18} className="text-accent animate-float block md:text-2xl" />
        </div>
        <p className="text-sm md:text-lg text-muted-foreground px-2 text-center">
          Gere textos criativos para qualquer tópico com inteligência artificial
        </p>
      </div>

      <Card className="w-full max-w-xs sm:max-w-md md:max-w-2xl p-2 sm:p-3 md:p-4 shadow-lg card-glass fade-in-up" style={{animationDelay: "0.1s"}}>
        <CardHeader className="p-2 sm:p-3 md:p-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <span className="text-gradient-primary">Gerador de Texto</span>
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Insira um tópico ou prompt para criar um texto completo automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-6 pt-0 md:pt-0">
          <div className="grid gap-2">
            <Textarea
              placeholder="Digite um tópico ou ideia para gerar um texto..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-24 md:min-h-32 border-2 focus:border-primary/50 text-sm md:text-base"
            />
            
            {textAnalysis && (
              <div className="bg-muted/30 rounded-md p-2 md:p-3 border text-xs md:text-sm">
                <div className="flex items-center gap-1 mb-1.5 text-primary font-medium">
                  <BarChart2 className="h-3 w-3 md:h-4 md:w-4" />
                  <span>Análise de Prompt</span>
                </div>
                
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Palavras:</span>
                    <span className="font-medium">{textAnalysis.wordCount}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Caracteres:</span>
                    <span className="font-medium">{textAnalysis.charCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Estilo de escrita
              </label>
              <Select 
                value={style} 
                onValueChange={(value) => setStyle(value as TextStyle)}
              >
                <SelectTrigger className="text-xs md:text-sm h-9 md:h-10">
                  <SelectValue placeholder={style} />
                </SelectTrigger>
                <SelectContent>
                  {textStyles.map((styleOption, index) => (
                    <SelectItem 
                      key={styleOption} 
                      value={styleOption} 
                      className={`text-xs md:text-sm ${index >= (userPlan?.availableStyles || 5) ? 'opacity-50' : ''}`}
                      disabled={index >= (userPlan?.availableStyles || 5)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{styleOption}</span>
                        {index >= (userPlan?.availableStyles || 5) && (
                          <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 px-1.5 py-0.5 rounded">
                            Premium
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Tamanho do texto
              </label>
              <Select 
                value={length} 
                onValueChange={(value) => setLength(value as TextLength)}
              >
                <SelectTrigger className="text-xs md:text-sm h-9 md:h-10">
                  <SelectValue placeholder={length} />
                </SelectTrigger>
                <SelectContent>
                  {textLengths.map((lengthOption) => (
                    <SelectItem key={lengthOption} value={lengthOption} className="text-xs md:text-sm">
                      {lengthOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Accordion 
            type="single" 
            collapsible 
            className="w-full border rounded-md"
          >
            <AccordionItem value="advanced-options">
              <AccordionTrigger className="px-4 py-2 text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <div className="flex items-center gap-2">
                  <span>Configurações Avançadas</span>
                  {!userPlan?.advancedOptionsEnabled && (
                    <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 px-1.5 py-0.5 rounded">
                      Premium
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <input 
                    type="checkbox" 
                    id="enable-advanced" 
                    checked={advancedConfig.enableAdvancedOptions}
                    onChange={(e) => {
                      if (!userPlan?.advancedOptionsEnabled) {
                        toast({
                          variant: "destructive",
                          title: "Recurso Premium",
                          description: "As configurações avançadas estão disponíveis apenas nos planos Plus e Pro. Faça upgrade para desbloquear.",
                        });
                        return;
                      }
                      
                      // Atualizar o estado diretamente
                      setAdvancedConfig({
                        ...advancedConfig,
                        enableAdvancedOptions: e.target.checked,
                        // Se estiver sendo desativado, resetar valores para defaults
                        targetCharCount: e.target.checked ? advancedConfig.targetCharCount : 0,
                        targetWordCount: e.target.checked ? advancedConfig.targetWordCount : 0,
                        targetReadTime: e.target.checked ? advancedConfig.targetReadTime : 5,
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    disabled={!userPlan?.advancedOptionsEnabled}
                  />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="enable-advanced" className={`text-xs ${!userPlan?.advancedOptionsEnabled ? 'opacity-50' : ''}`}>
                      Ativar configurações avançadas
                    </Label>
                    {!userPlan?.advancedOptionsEnabled && (
                      <Link href="/planos" className="text-xs text-primary underline">
                        Fazer upgrade
                      </Link>
                    )}
                  </div>
                </div>
                
                <div className={`space-y-4 ${!advancedConfig.enableAdvancedOptions ? 'opacity-50 pointer-events-none' : ''} ${!userPlan?.advancedOptionsEnabled ? 'opacity-40' : ''}`}>
                  <div className="space-y-2">
                    <Label className="text-xs">Tamanho do texto (caracteres): {advancedConfig.targetCharCount}</Label>
                    <Slider 
                      defaultValue={[advancedConfig.targetCharCount]} 
                      max={2000} 
                      step={50}
                      min={100}
                      onValueChange={(value) => setAdvancedConfig({
                        ...advancedConfig,
                        targetCharCount: value[0]
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Quantidade de palavras: {advancedConfig.targetWordCount}</Label>
                    <Slider 
                      defaultValue={[advancedConfig.targetWordCount]} 
                      max={500} 
                      step={10}
                      min={20}
                      onValueChange={(value) => setAdvancedConfig({
                        ...advancedConfig,
                        targetWordCount: value[0]
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Tempo de leitura (minutos): {advancedConfig.targetReadTime}</Label>
                    <Slider 
                      defaultValue={[advancedConfig.targetReadTime]} 
                      max={10} 
                      step={1}
                      min={1}
                      onValueChange={(value) => setAdvancedConfig({
                        ...advancedConfig,
                        targetReadTime: value[0]
                      })}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <Button 
            onClick={handleGenerate} 
            disabled={loading || !topic.trim()} 
            className="bg-accent text-white hover:shadow-lg transition-all duration-300 hover:bg-accent/90 h-9 md:h-10 text-xs md:text-sm ripple pulse-effect"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-3 w-3 md:h-4 md:w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Gerando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Wand className="h-3 w-3 md:h-4 md:w-4" />
                Gerar texto
              </span>
            )}
          </Button>
          
          {showHistoryLink && (
            <div className="flex justify-center mt-4">
              <Link href="/meus-textos" className="text-primary hover:text-accent transition-colors text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Ver meu histórico de textos
                </span>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Card do Resultado da Geração */}
      {textGeneration && (
        <Card className="w-full max-w-xs sm:max-w-md md:max-w-2xl p-2 sm:p-3 md:p-4 shadow-lg card-glass fade-in-up mt-6" style={{animationDelay: "0.2s"}}>
          <CardHeader className="p-2 sm:p-3 md:p-6">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Wand className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                <span className="text-gradient-primary">Texto Gerado</span>
              </CardTitle>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(textGeneration.timestamp)}
              </span>
            </div>
            <CardDescription className="text-xs md:text-sm flex items-center gap-1">
              <span>Tópico: </span>
              <span className="font-medium">{textGeneration.topic}</span>
              <span className="mx-1">•</span>
              <span>Estilo: </span>
              <span className="font-medium">{generateStyleTranslations[textGeneration.style] || textGeneration.style}</span>
              <span className="mx-1">•</span>
              <span>Tamanho: </span>
              <span className="font-medium">{lengthTranslations[textGeneration.length] || textGeneration.length}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 md:p-6 pt-0 md:pt-0">
            <div className="bg-muted/30 rounded-md p-3 text-sm max-h-96 overflow-auto mb-3">
              {textGeneration.generatedText}
            </div>
            
            {textGeneration.analysis && (
              <div className="bg-muted/30 rounded-md p-2 md:p-3 border text-xs md:text-sm mb-3">
                <div className="flex items-center gap-1 mb-1.5 text-primary font-medium">
                  <BarChart2 className="h-3 w-3 md:h-4 md:w-4" />
                  <span>Análise do Texto Gerado</span>
                </div>
                
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Palavras:</span>
                    <span className="font-medium">{textGeneration.analysis.wordCount}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Caracteres:</span>
                    <span className="font-medium">{textGeneration.analysis.charCount}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Tempo de leitura:</span>
                    <span className="font-medium">{textGeneration.analysis.readTime} min</span>
                  </div>
                  
                  {textGeneration.analysis.sentimentLabel && (
                    <div className="flex items-center gap-1 col-span-1">
                      <span className="text-muted-foreground">Sentimento:</span>
                      {renderSentimentBadge(textGeneration.analysis.sentimentLabel)}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  // Navegar para a página principal com o texto gerado para reescrever
                  window.location.href = `/?text=${encodeURIComponent(textGeneration.generatedText)}`;
                }}
              >
                <PenTool className="h-3 w-3 mr-2" />
                Reescrever
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8 text-accent"
                  onClick={() => handleCopy(textGeneration.generatedText)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8 text-primary"
                  onClick={() => handleDownload(textGeneration.generatedText, `texto_${generateStyleTranslations[textGeneration.style] || textGeneration.style}_${textGeneration.id}.txt`)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <footer className="w-full max-w-xs sm:max-w-md md:max-w-2xl text-center mt-8 md:mt-12 mb-4 md:mb-6 text-xs md:text-sm text-muted-foreground">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-1 md:mb-2">
            <span className="text-gradient-primary font-semibold">Texto Maestro</span> &copy; {new Date().getFullYear()}
          </div>
          <p className="text-[10px] md:text-sm mb-2">
            Transformando ideias em obras-primas com IA
          </p>
          <div className="text-[10px] md:text-sm mb-3">
            Desenvolvido por <span className="font-medium">Pedro Van-lume</span>
          </div>
          <a 
            href="https://pedrovviana.github.io/portfolio-PedroVanlume/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors text-xs md:text-sm font-medium"
          >
            <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
            Ver outros projetos do autor
          </a>
        </div>
      </footer>
    </div>
  );
}

// Componente de fallback simples para o Suspense
function LoadingGeneratePage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  );
}

// Componente principal que exportamos, envolvido com Suspense
export default function GeneratePage() {
  return (
    <Suspense fallback={<LoadingGeneratePage />}>
      <GeneratePageContent />
    </Suspense>
  );
} 