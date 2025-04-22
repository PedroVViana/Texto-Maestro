"use client";

import {RewriteTextInput, rewriteText} from "@/ai/flows/rewrite-text";
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
  ArrowRight,
  Settings,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { UserMenu } from "@/components/Auth/UserMenu";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/components/Auth/AuthProvider";
import { UserRibbon } from "@/components/Auth/UserRibbon";

const rewriteStyles = [
  "Grammar correction",
  "Formal rewrite",
  "Simplified rewrite",
  "Persuasive rewrite",
  "Social media optimization",
  "Academic style",
  "Journalistic style",
  "Creative/Narrative style",
  "Technical style",
  "SEO optimized",
] as const;

type RewriteStyle = typeof rewriteStyles[number];

interface TextResult {
  id: string;
  originalText: string;
  rewrittenText: string;
  style: RewriteStyle;
  timestamp: Date;
  analysis?: TextAnalysis;
  differences?: {
    wordCount: number;
    charCount: number;
    readTime: number;
  };
}

interface TextAnalysis {
  wordCount: number;
  charCount: number;
  readTime: number;
  sentimentScore?: number;
  sentimentLabel: 'Positivo' | 'Neutro' | 'Negativo';
  comparison?: {
    wordCountDiff: number;
    charCountDiff: number;
    readTimeDiff: number;
  };
}

interface AdvancedConfig {
  targetCharCount?: number;
  targetReadTime?: number;
  targetWordCount?: number;
  targetSentiment?: 'Positivo' | 'Neutro' | 'Negativo';
}

// Componente principal que usa useSearchParams
function HomeContent() {
  const searchParams = useSearchParams();
  const [text, setText] = useState("");
  const [style, setStyle] = useState<RewriteStyle>(rewriteStyles[0]);
  const [textResults, setTextResults] = useState<TextResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [textAnalysis, setTextAnalysis] = useState<TextAnalysis | null>(null);
  const { user, userPlan, remainingRewrites, decrementRewrites } = useAuth();
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfig>({
    targetCharCount: undefined,
    targetReadTime: undefined,
    targetWordCount: undefined,
    targetSentiment: undefined,
  });
  const {toast} = useToast();
  const [rewrittenResult, setRewrittenResult] = useState<TextResult | null>(null);

  // Buscar texto da URL, se existir (vindo da página de geração)
  useEffect(() => {
    const textFromParams = searchParams.get("text");
    if (textFromParams) {
      setText(decodeURIComponent(textFromParams));
    }
  }, [searchParams]);

  useEffect(() => {
    if (text.trim()) {
      analyzeText(text);
    } else {
      setTextAnalysis(null);
    }
  }, [text]);

  const analyzeText = (text: string): TextAnalysis => {
    // Contagem de palavras
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    // Contagem de caracteres
    const charCount = text.length;
    
    // Tempo de leitura (considerando 200 palavras por minuto)
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    
    // Análise simples de sentimento
    let sentimentScore = 0;
    const positiveWords = ['bom', 'ótimo', 'excelente', 'incrível', 'feliz', 'positivo', 'maravilhoso', 'sucesso', 'perfeito'];
    const negativeWords = ['ruim', 'péssimo', 'terrível', 'horrível', 'triste', 'negativo', 'fracasso', 'defeito', 'problema'];
    
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) sentimentScore++;
      if (negativeWords.some(nw => word.includes(nw))) sentimentScore--;
    });
    
    let sentimentLabel: 'Positivo' | 'Neutro' | 'Negativo' = 'Neutro';
    if (sentimentScore > 0) sentimentLabel = 'Positivo';
    if (sentimentScore < 0) sentimentLabel = 'Negativo';
    
    const analysis: TextAnalysis = {
      wordCount,
      charCount,
      readTime,
      sentimentScore,
      sentimentLabel
    };
    
    setTextAnalysis(analysis);
    return analysis;
  };

  const handleRewrite = async () => {
    if (!text.trim()) return;
    
    // Para planos infinitos, não verificar limites
    if (userPlan.type === "pro") {
      setLoading(true);
      setRewrittenResult(null);
      
      try {
        // Preparar o input 
        const rewriteInput: RewriteTextInput = {
          text,
          style,
        };
        
        // Adicionar configurações avançadas se existirem
        if (userPlan.advancedOptionsEnabled) {
          if (advancedConfig.targetCharCount) rewriteInput.targetCharCount = advancedConfig.targetCharCount;
          if (advancedConfig.targetWordCount) rewriteInput.targetWordCount = advancedConfig.targetWordCount;
          if (advancedConfig.targetReadTime) rewriteInput.targetReadTime = advancedConfig.targetReadTime;
          if (advancedConfig.targetSentiment) rewriteInput.targetSentiment = advancedConfig.targetSentiment;
        }

        const response = await fetch('/api/rewrite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rewriteInput),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao reescrever texto');
        }
        
        // Análise do texto reescrito
        const rewrittenTextAnalysis: TextAnalysis = analyzeText(data.rewrittenText);
        
        // Calculando diferenças percentuais apenas se ambas as análises existirem
        let differences = undefined;
        if (textAnalysis && rewrittenTextAnalysis) {
          differences = {
            wordCount: calculatePercentageDiff(textAnalysis.wordCount, rewrittenTextAnalysis.wordCount),
            charCount: calculatePercentageDiff(textAnalysis.charCount, rewrittenTextAnalysis.charCount),
            readTime: calculatePercentageDiff(textAnalysis.readTime, rewrittenTextAnalysis.readTime)
          };
        }
        
        // Criando objeto de resultado
        const result: TextResult = {
          id: generateId(),
          originalText: text,
          rewrittenText: data.rewrittenText,
          style,
          timestamp: new Date(),
          analysis: rewrittenTextAnalysis,
          differences
        };
        
        // Salvando o resultado no histórico
        const savedResults = localStorage.getItem('textResults');
        let allResults = savedResults ? JSON.parse(savedResults) : [];
        allResults = [result, ...allResults];
        
        // Limitar o histórico com base no plano do usuário (se não for ilimitado)
        if (user && userPlan.historyDays !== "unlimited") {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - (userPlan.historyDays as number));
          
          allResults = allResults.filter((item: TextResult) => 
            new Date(item.timestamp) >= cutoffDate
          );
        }
        
        // Salvar no localStorage
        localStorage.setItem('textResults', JSON.stringify(allResults));
        
        // Atualizar estado para mostrar o card com o resultado
        setRewrittenResult(result);
        
        // Atualizando estado para mostrar o link para a página de histórico
        setTextResults(prev => {
          // Verificar se já existe resultados para mostrar o link "Ver meu histórico"
          if (prev.length === 0) {
            return [result];
          }
          return prev;
        });
        
        // Notificação de sucesso
        toast({
          title: "Texto reescrito com sucesso!",
          description: `Seu texto foi reescrito no estilo solicitado.`,
        });
      } catch (error) {
        console.error('Erro ao reescrever texto:', error);
        toast({
          title: "Erro ao reescrever texto",
          description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Para planos não infinitos, verificar limites
    // Verificar limites de plano
    if (text.trim().split(/\s+/).length > userPlan.wordLimit) {
      toast({
        variant: "destructive",
        title: "Limite de palavras excedido",
        description: `Seu plano permite textos com no máximo ${userPlan.wordLimit} palavras. Considere reduzir o texto ou fazer um upgrade.`,
      });
      return;
    }

    // Verificar cota diária
    if (remainingRewrites <= 0) {
      toast({
        variant: "destructive",
        title: "Limite diário atingido",
        description: "Você atingiu seu limite diário de reescritas. Aguarde até amanhã ou faça um upgrade de plano.",
      });
      return;
    }
    
    setLoading(true);
    setRewrittenResult(null); // Limpar resultado anterior ao iniciar nova requisição
    
    try {
      // Verificar se as configurações avançadas estão ativadas e se o usuário tem permissão para usá-las
      const hasAdvancedConfig = !!advancedConfig.targetCharCount || 
                               !!advancedConfig.targetReadTime || 
                               !!advancedConfig.targetWordCount ||
                               !!advancedConfig.targetSentiment;
      
      // Se o usuário está tentando usar configurações avançadas sem ter permissão
      if (hasAdvancedConfig && !userPlan.advancedOptionsEnabled) {
        toast({
          variant: "destructive",
          title: "Recurso não disponível",
          description: "Configurações avançadas estão disponíveis apenas nos planos Plus e Pro.",
        });
        return;
      }
      
      // Verificar se o usuário tem acesso ao estilo selecionado
      const styleIndex = rewriteStyles.indexOf(style);
      if (styleIndex >= userPlan.availableStyles) {
        toast({
          variant: "destructive",
          title: "Estilo não disponível",
          description: `O estilo "${rewriteStyleTranslations[style]}" está disponível apenas em planos superiores.`,
        });
        return;
      }
      
      // Preparar o input com configurações avançadas apenas se estiverem ativadas
      const rewriteInput: RewriteTextInput = {
        text,
        style,
      };
      
      // Adicionar configurações avançadas apenas se estiverem definidas
      if (hasAdvancedConfig && userPlan.advancedOptionsEnabled) {
        if (advancedConfig.targetCharCount) rewriteInput.targetCharCount = advancedConfig.targetCharCount;
        if (advancedConfig.targetWordCount) rewriteInput.targetWordCount = advancedConfig.targetWordCount;
        if (advancedConfig.targetReadTime) rewriteInput.targetReadTime = advancedConfig.targetReadTime;
        if (advancedConfig.targetSentiment) rewriteInput.targetSentiment = advancedConfig.targetSentiment;
      }

      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rewriteInput),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao reescrever texto');
      }
      
      // Decrementar a cota do usuário
      decrementRewrites();
      
      // Análise do texto reescrito
      const rewrittenTextAnalysis: TextAnalysis = analyzeText(data.rewrittenText);
      
      // Calculando diferenças percentuais apenas se ambas as análises existirem
      let differences = undefined;
      if (textAnalysis && rewrittenTextAnalysis) {
        differences = {
          wordCount: calculatePercentageDiff(textAnalysis.wordCount, rewrittenTextAnalysis.wordCount),
          charCount: calculatePercentageDiff(textAnalysis.charCount, rewrittenTextAnalysis.charCount),
          readTime: calculatePercentageDiff(textAnalysis.readTime, rewrittenTextAnalysis.readTime)
        };
      }
      
      // Criando objeto de resultado
      const result: TextResult = {
        id: generateId(),
        originalText: text,
        rewrittenText: data.rewrittenText,
        style,
        timestamp: new Date(),
        analysis: rewrittenTextAnalysis,
        differences
      };
      
      // Salvando o resultado no histórico
      const savedResults = localStorage.getItem('textResults');
      let allResults = savedResults ? JSON.parse(savedResults) : [];
      allResults = [result, ...allResults];
      
      // Limitar o histórico com base no plano do usuário (se não for ilimitado)
      if (user && typeof userPlan.historyDays === 'number') {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - userPlan.historyDays);
        
        allResults = allResults.filter((item: TextResult) => 
          new Date(item.timestamp) >= cutoffDate
        );
      }
      
      // Salvar no localStorage
      localStorage.setItem('textResults', JSON.stringify(allResults));
      
      // Atualizar estado para mostrar o card com o resultado
      setRewrittenResult(result);
      
      // Atualizando estado para mostrar o link para a página de histórico
      setTextResults(prev => {
        // Verificar se já existe resultados para mostrar o link "Ver meu histórico"
        if (prev.length === 0) {
          return [result];
        }
        return prev;
      });
      
      // Notificação de sucesso
      toast({
        title: "Texto reescrito com sucesso!",
        description: `Seu texto foi reescrito no estilo solicitado. Você tem ${remainingRewrites - 1} reescritas restantes hoje.`,
      });
    } catch (error) {
      console.error('Erro ao reescrever texto:', error);
      toast({
        title: "Erro ao reescrever texto",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  // Função para calcular diferença percentual
  const calculatePercentageDiff = (original: number, updated: number): number => {
    if (original === 0) return updated > 0 ? 100 : 0;
    return Math.round(((updated - original) / original) * 100);
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

  const rewriteStyleTranslations: {[key: string]: string} = {
    "Grammar correction": "Correção gramatical",
    "Formal rewrite": "Reescrita formal",
    "Simplified rewrite": "Reescrita simplificada",
    "Persuasive rewrite": "Reescrita persuasiva",
    "Social media optimization": "Otimização de mídia social",
    "Academic style": "Estilo acadêmico",
    "Journalistic style": "Estilo jornalístico",
    "Creative/Narrative style": "Estilo criativo/narrativo",
    "Technical style": "Estilo técnico",
    "SEO optimized": "Otimizado para SEO",
  };

  // Função para formatar a data para o card de resultado
  const formatDate = (date: Date) => {
    try {
      // Verificar se o valor é uma data válida
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return "Agora";
      }
      
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Agora";
    }
  };

  // Função para copiar o texto
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência.",
    });
  };

  // Função para baixar o texto
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
        <div className="flex justify-end mb-3">
          <Link href="/gerar" className="flex items-center gap-1 text-primary hover:text-accent transition-colors">
            <span className="text-xs md:text-sm">Criar Novo Texto</span>
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
          </Link>
        </div>
        <div className="flex items-center justify-center gap-1 md:gap-2 mb-2">
          <Wand size={24} className="text-primary animate-float block md:text-3xl" />
          <h1 className="text-gradient text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight">
            Texto Maestro
          </h1>
          <Sparkles size={18} className="text-accent animate-float block md:text-2xl" />
        </div>
        <p className="text-sm md:text-lg text-muted-foreground px-2">
          Transforme e aprimore seus textos com inteligência artificial
        </p>
      </div>

      <Card className="w-full max-w-xs sm:max-w-md md:max-w-2xl p-2 sm:p-3 md:p-4 shadow-lg card-glass fade-in-up" style={{animationDelay: "0.1s"}}>
        <CardHeader className="p-2 sm:p-3 md:p-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <span className="text-gradient-primary">Editor de Texto</span>
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">Insira o texto que você deseja reescrever.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-6 pt-0 md:pt-0">
          <div className="grid gap-2">
            <Textarea
              placeholder="Digite seu texto aqui..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-24 md:min-h-32 border-2 focus:border-primary/50 text-sm md:text-base"
            />
            
            {textAnalysis && (
              <div className="bg-muted/30 rounded-md p-2 md:p-3 border text-xs md:text-sm">
                <div className="flex items-center gap-1 mb-1.5 text-primary font-medium">
                  <BarChart2 className="h-3 w-3 md:h-4 md:w-4" />
                  <span>Análise de Texto</span>
                </div>
                
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Palavras:</span>
                    <span className="font-medium">{textAnalysis.wordCount}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Caracteres:</span>
                    <span className="font-medium">{textAnalysis.charCount}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Tempo de leitura:</span>
                    <span className="font-medium">{textAnalysis.readTime} min</span>
                  </div>
                  
                  <div className="flex items-center gap-1 col-span-2 md:col-span-1">
                    <span className="text-muted-foreground">Sentimento:</span>
                    {renderSentimentBadge(textAnalysis.sentimentLabel)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Select onValueChange={value => setStyle(value as RewriteTextInput["style"])}>
              <SelectTrigger className="text-xs md:text-sm h-9 md:h-10">
                <SelectValue placeholder={rewriteStyleTranslations[style] || style}/>
              </SelectTrigger>
              <SelectContent>
                {rewriteStyles.map((styleOption, index) => (
                  <SelectItem 
                    key={styleOption} 
                    value={styleOption} 
                    className={`text-xs md:text-sm ${index >= (userPlan?.availableStyles || 5) ? 'opacity-50' : ''}`}
                    disabled={index >= (userPlan?.availableStyles || 5)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{rewriteStyleTranslations[styleOption] || styleOption}</span>
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
                    checked={!!advancedConfig.targetCharCount || !!advancedConfig.targetReadTime || !!advancedConfig.targetWordCount || !!advancedConfig.targetSentiment}
                    onChange={(e) => {
                      if (!userPlan?.advancedOptionsEnabled) {
                        toast({
                          variant: "destructive",
                          title: "Recurso Premium",
                          description: "As configurações avançadas estão disponíveis apenas nos planos Plus e Pro. Faça upgrade para desbloquear.",
                        });
                        return;
                      }
                      
                      if (!e.target.checked) {
                        // Desativar todas as configurações avançadas
                        setAdvancedConfig({
                          targetCharCount: undefined,
                          targetReadTime: undefined,
                          targetWordCount: undefined,
                          targetSentiment: undefined,
                        });
                      } else {
                        // Ativar com valores padrão
                        setAdvancedConfig({
                          targetCharCount: 1000,
                          targetWordCount: 150,
                          targetReadTime: 5,
                          targetSentiment: 'Neutro',
                        });
                      }
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
                
                <div className={`space-y-4 ${!advancedConfig.targetCharCount && !advancedConfig.targetReadTime && !advancedConfig.targetWordCount && !advancedConfig.targetSentiment ? 'opacity-50 pointer-events-none' : ''} ${!userPlan?.advancedOptionsEnabled ? 'opacity-40' : ''}`}>
                  <div className="space-y-2">
                    <Label className="text-xs">Tamanho do texto (caracteres): {advancedConfig.targetCharCount ?? "Não especificado"}</Label>
                    <Slider 
                      defaultValue={[advancedConfig.targetCharCount ?? 0]} 
                      max={5000} 
                      step={50}
                      min={0}
                      onValueChange={(value) => setAdvancedConfig({
                        ...advancedConfig,
                        targetCharCount: value[0] === 0 ? undefined : value[0]
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Quantidade de palavras: {advancedConfig.targetWordCount ?? "Não especificado"}</Label>
                    <Slider 
                      defaultValue={[advancedConfig.targetWordCount ?? 0]} 
                      max={1000} 
                      step={10}
                      min={0}
                      onValueChange={(value) => setAdvancedConfig({
                        ...advancedConfig,
                        targetWordCount: value[0] === 0 ? undefined : value[0]
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Tempo de leitura (minutos): {advancedConfig.targetReadTime ?? "Não especificado"}</Label>
                    <Slider 
                      defaultValue={[advancedConfig.targetReadTime ?? 0]} 
                      max={30} 
                      step={1}
                      min={0}
                      onValueChange={(value) => setAdvancedConfig({
                        ...advancedConfig,
                        targetReadTime: value[0] === 0 ? undefined : value[0]
                      })}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button 
            onClick={handleRewrite} 
            disabled={loading || !text.trim()} 
            className="bg-accent text-white hover:shadow-lg transition-all duration-300 hover:bg-accent/90 h-9 md:h-10 text-xs md:text-sm ripple pulse-effect"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-3 w-3 md:h-4 md:w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Gerando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
                Gerar texto
              </span>
            )}
          </Button>
          
          {textResults.length > 0 && (
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

      {/* Card do Resultado da Reescrita */}
      {rewrittenResult && (
        <Card className="w-full max-w-xs sm:max-w-md md:max-w-2xl p-2 sm:p-3 md:p-4 shadow-lg card-glass fade-in-up mt-6" style={{animationDelay: "0.2s"}}>
          <CardHeader className="p-2 sm:p-3 md:p-6">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <PenTool className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                <span className="text-gradient-primary">Texto Reescrito</span>
              </CardTitle>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(rewrittenResult.timestamp)}
              </span>
            </div>
            <CardDescription className="text-xs md:text-sm flex items-center gap-1">
              <span>Estilo:</span>
              <span className="font-medium">{rewriteStyleTranslations[rewrittenResult.style] || rewrittenResult.style}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 md:p-6 pt-0 md:pt-0">
            <div className="bg-muted/30 rounded-md p-3 text-sm max-h-64 overflow-auto mb-3">
              {rewrittenResult.rewrittenText}
            </div>
            
            {rewrittenResult.analysis && (
              <div className="bg-muted/30 rounded-md p-2 md:p-3 border text-xs md:text-sm mb-3">
                <div className="flex items-center gap-1 mb-1.5 text-primary font-medium">
                  <BarChart2 className="h-3 w-3 md:h-4 md:w-4" />
                  <span>Análise do Texto Reescrito</span>
                </div>
                
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Palavras:</span>
                    <span className="font-medium">{rewrittenResult.analysis.wordCount}</span>
                    {rewrittenResult.differences && (
                      <span className={`text-xs ${rewrittenResult.differences.wordCount > 0 ? 'text-green-500' : rewrittenResult.differences.wordCount < 0 ? 'text-red-500' : ''}`}>
                        {rewrittenResult.differences.wordCount > 0 ? `+${rewrittenResult.differences.wordCount}%` : rewrittenResult.differences.wordCount < 0 ? `${rewrittenResult.differences.wordCount}%` : ''}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Caracteres:</span>
                    <span className="font-medium">{rewrittenResult.analysis.charCount}</span>
                    {rewrittenResult.differences && (
                      <span className={`text-xs ${rewrittenResult.differences.charCount > 0 ? 'text-green-500' : rewrittenResult.differences.charCount < 0 ? 'text-red-500' : ''}`}>
                        {rewrittenResult.differences.charCount > 0 ? `+${rewrittenResult.differences.charCount}%` : rewrittenResult.differences.charCount < 0 ? `${rewrittenResult.differences.charCount}%` : ''}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Tempo de leitura:</span>
                    <span className="font-medium">{rewrittenResult.analysis.readTime} min</span>
                    {rewrittenResult.differences && (
                      <span className={`text-xs ${rewrittenResult.differences.readTime > 0 ? 'text-green-500' : rewrittenResult.differences.readTime < 0 ? 'text-red-500' : ''}`}>
                        {rewrittenResult.differences.readTime > 0 ? `+${rewrittenResult.differences.readTime}%` : rewrittenResult.differences.readTime < 0 ? `${rewrittenResult.differences.readTime}%` : ''}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 col-span-2 md:col-span-1">
                    <span className="text-muted-foreground">Sentimento:</span>
                    {renderSentimentBadge(rewrittenResult.analysis.sentimentLabel)}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setText(rewrittenResult.rewrittenText);
                  setRewrittenResult(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <PenTool className="h-3 w-3 mr-2" />
                Reescrever novamente
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8 text-accent"
                  onClick={() => handleCopy(rewrittenResult.rewrittenText)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8 text-primary"
                  onClick={() => handleDownload(rewrittenResult.rewrittenText, `texto_${rewriteStyleTranslations[rewrittenResult.style] || rewrittenResult.style}_${rewrittenResult.id}.txt`)}
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
            Transformando texto comum em obras-primas com IA
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
function LoadingHome() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  );
}

// Componente principal que exportamos, envolvido com Suspense
export default function Home() {
  return (
    <Suspense fallback={<LoadingHome />}>
      <HomeContent />
    </Suspense>
  );
}
