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
  style: RewriteTextInput["style"];
  timestamp: Date;
  analysis?: TextAnalysis;
  differences?: {
    wordCount: number;
    charCount: number;
    sentenceCount: number;
    readTime: number;
  };
}

interface TextAnalysis {
  wordCount: number;
  charCount: number;
  sentenceCount: number;
  readTime: number;
  sentimentScore?: number;
  sentimentLabel: 'Positivo' | 'Neutro' | 'Negativo';
  comparison?: {
    wordCountDiff: number;
    charCountDiff: number;
    sentenceCountDiff: number;
    readTimeDiff: number;
  };
}

interface AdvancedConfig {
  targetCharCount?: number;
  targetReadTime?: number;
  targetWordCount?: number;
}

// Componente principal que usa useSearchParams
function HomeContent() {
  const searchParams = useSearchParams();
  const [text, setText] = useState("");
  const [style, setStyle] = useState<RewriteStyle>(rewriteStyles[0]);
  const [textResults, setTextResults] = useState<TextResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [textAnalysis, setTextAnalysis] = useState<TextAnalysis | null>(null);
  const { user } = useAuth();
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfig>({
    targetCharCount: undefined,
    targetReadTime: undefined,
    targetWordCount: undefined,
  });
  const {toast} = useToast();

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
    
    // Contagem de frases (aproximada)
    const sentenceCount = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
    
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
      sentenceCount,
      readTime,
      sentimentScore,
      sentimentLabel
    };
    
    setTextAnalysis(analysis);
    return analysis;
  };

  const handleRewrite = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    
    try {
      // Verificar se as configurações avançadas estão ativadas
      const hasAdvancedConfig = !!advancedConfig.targetCharCount || 
                               !!advancedConfig.targetReadTime || 
                               !!advancedConfig.targetWordCount;
      
      // Preparar o input com configurações avançadas apenas se estiverem ativadas
      const rewriteInput: RewriteTextInput = {
        text,
        style,
      };
      
      // Adicionar configurações avançadas apenas se estiverem definidas
      if (hasAdvancedConfig) {
        if (advancedConfig.targetCharCount) rewriteInput.targetCharCount = advancedConfig.targetCharCount;
        if (advancedConfig.targetWordCount) rewriteInput.targetWordCount = advancedConfig.targetWordCount;
        if (advancedConfig.targetReadTime) rewriteInput.targetReadTime = advancedConfig.targetReadTime;
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
      
      // Calculando diferenças percentuais
      const updatedAnalysis: TextAnalysis = rewrittenTextAnalysis;
      
      // Criando objeto com as diferenças
      const differences = (textAnalysis && rewrittenTextAnalysis) 
        ? {
            wordCount: calculatePercentageDiff(textAnalysis.wordCount, rewrittenTextAnalysis.wordCount),
            charCount: calculatePercentageDiff(textAnalysis.charCount, rewrittenTextAnalysis.charCount),
            sentenceCount: calculatePercentageDiff(textAnalysis.sentenceCount, rewrittenTextAnalysis.sentenceCount),
            readTime: calculatePercentageDiff(textAnalysis.readTime, rewrittenTextAnalysis.readTime)
          } 
        : undefined;
      
      // Criando objeto de resultado
      const result: TextResult = {
        id: generateId(),
        originalText: text,
        rewrittenText: data.rewrittenText,
        style,
        timestamp: new Date(),
        analysis: updatedAnalysis,
        differences
      };
      
      // Adicionando ao histórico
      setTextResults(prev => [result, ...prev]);
      
      // Salvar no localStorage se o usuário estiver logado
      if (user) {
        try {
          // Pegar os resultados existentes
          const savedResults = localStorage.getItem('textResults');
          let allResults = savedResults ? JSON.parse(savedResults) : [];
          
          // Adicionar o novo resultado
          allResults = [result, ...allResults];
          
          // Salvar de volta no localStorage
          localStorage.setItem('textResults', JSON.stringify(allResults));
        } catch (error) {
          console.error('Erro ao salvar texto:', error);
        }
      }
      
      // Notificação de sucesso
      toast({
        title: "Texto reescrito com sucesso!",
        description: "Seu texto foi reescrito no estilo solicitado.",
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

  const analyzeRewrittenText = (text: string): TextAnalysis => {
    // Contagem de palavras
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    // Contagem de caracteres
    const charCount = text.length;
    
    // Contagem de frases (aproximada)
    const sentenceCount = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
    
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
    
    return {
      wordCount,
      charCount,
      sentenceCount,
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

  const rewriteStyleTranslations: {[key: string] : string} = {
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
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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

  // Função para calcular diferença percentual
  const calculatePercentageDiff = (original: number, updated: number): number => {
    if (original === 0) return updated > 0 ? 100 : 0;
    return Math.round(((updated - original) / original) * 100);
  };

  return (
    <div className="relative flex flex-col items-center justify-start min-h-screen bg-pattern px-4 pt-20 pb-6 md:pb-8">
      {/* Elementos de fundo */}
      <div className="grain-overlay"></div>
      <div className="fixed top-[10%] right-[10%] w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/20 blur-3xl opacity-50"></div>
      <div className="fixed bottom-[10%] left-[10%] w-28 h-28 md:w-40 md:h-40 rounded-full bg-accent/20 blur-3xl opacity-50"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-60 md:h-60 rounded-full bg-secondary/10 blur-3xl opacity-30"></div>
      
      {/* Barra de navegação */}
      <Navbar />
      
      {/* Título Principal */}
      <div className="w-full max-w-2xl text-center mb-6 mt-4 md:mb-8 md:mt-8 px-2 fade-in-up">
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
                    <span className="text-muted-foreground">Frases:</span>
                    <span className="font-medium">{textAnalysis.sentenceCount}</span>
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
                {rewriteStyles.map((styleOption) => (
                  <SelectItem key={styleOption} value={styleOption} className="text-xs md:text-sm">
                    {rewriteStyleTranslations[styleOption] || styleOption}
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
                Configurações Avançadas
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <input 
                    type="checkbox" 
                    id="enable-advanced" 
                    checked={!!advancedConfig.targetCharCount || !!advancedConfig.targetReadTime || !!advancedConfig.targetWordCount}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        // Desativar todas as configurações avançadas
                        setAdvancedConfig({
                          targetCharCount: undefined,
                          targetReadTime: undefined,
                          targetWordCount: undefined,
                        });
                      } else {
                        // Ativar com valores padrão
                        setAdvancedConfig({
                          targetCharCount: 1000,
                          targetWordCount: 150,
                          targetReadTime: 5,
                        });
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="enable-advanced" className="text-xs">Ativar configurações avançadas</Label>
                </div>
                
                <div className={`space-y-4 ${!advancedConfig.targetCharCount && !advancedConfig.targetReadTime && !advancedConfig.targetWordCount ? 'opacity-50 pointer-events-none' : ''}`}>
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
        </CardContent>
      </Card>

      {textResults.length > 0 && (
        <div className="w-full max-w-xs sm:max-w-md md:max-w-2xl mt-6 fade-in-up" style={{animationDelay: "0.2s"}}>
          <div className="flex items-center gap-2 mb-3 md:mb-4 px-1">
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <h2 className="text-base md:text-xl font-semibold">Histórico de textos</h2>
          </div>
          
          <div className="space-y-4 md:space-y-6">
            {textResults.map((result, index) => (
              <Card key={result.id} className="w-full shadow-lg card-glass fade-in-up" style={{animationDelay: `${0.1 * (index + 1)}s`}}>
                <CardHeader className="pb-1 md:pb-2 p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <CardTitle className="flex items-center gap-1 md:gap-2 text-sm md:text-base">
                      <Sparkles className="h-3 w-3 md:h-5 md:w-5 text-accent" />
                      <span className="text-gradient-accent truncate max-w-[180px] sm:max-w-none">
                        {rewriteStyleTranslations[result.style] || result.style}
                      </span>
                    </CardTitle>
                    <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2 w-2 md:h-3 md:w-3" /> 
                      {formatDate(result.timestamp)}
                    </span>
                  </div>
                  <CardDescription className="mt-1 text-[10px] md:text-xs">
                    Texto original: {result.originalText.length > 30 
                      ? result.originalText.substring(0, 30) + "..." 
                      : result.originalText}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:gap-4 p-3 md:p-4">
                  <div className="whitespace-pre-line p-2 md:p-4 bg-muted/30 rounded-md border text-xs md:text-sm overflow-auto max-h-[250px] md:max-h-[300px]">
                    {result.rewrittenText}
                  </div>

                  {result.analysis && (
                    <div className="bg-muted/30 rounded-md p-2 md:p-3 border text-xs md:text-sm">
                      <div className="flex items-center gap-1 mb-1.5 text-primary font-medium">
                        <BarChart2 className="h-3 w-3 md:h-4 md:w-4" />
                        <span>Análise do Texto Reescrito</span>
                      </div>
                      
                      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Palavras:</span>
                          <span className="font-medium">{result.analysis.wordCount}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Caracteres:</span>
                          <span className="font-medium">{result.analysis.charCount}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Frases:</span>
                          <span className="font-medium">{result.analysis.sentenceCount}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Tempo de leitura:</span>
                          <span className="font-medium">{result.analysis.readTime} min</span>
                        </div>
                        
                        <div className="flex items-center gap-1 col-span-2 md:col-span-1">
                          <span className="text-muted-foreground">Sentimento:</span>
                          {renderSentimentBadge(result.analysis.sentimentLabel)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-1">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleCopy(result.rewrittenText)} 
                      className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground hover:border-accent transition-colors ripple"
                    >
                      <Copy className="h-3 w-3 md:h-4 md:w-4"/>
                      <span className="sr-only">Copiar</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleDownload(
                        result.rewrittenText, 
                        `texto_${rewriteStyleTranslations[result.style] || result.style}_${result.id}.txt`
                      )} 
                      className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors ripple"
                    >
                      <Download className="h-3 w-3 md:h-4 md:w-4"/>
                      <span className="sr-only">Baixar</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
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
