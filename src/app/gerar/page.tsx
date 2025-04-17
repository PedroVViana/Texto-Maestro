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
    sentenceCount: number;
    readTime: number;
    sentimentScore?: number;
    sentimentLabel?: 'Positivo' | 'Neutro' | 'Negativo';
  };
}

interface TextAnalysis {
  wordCount: number;
  charCount: number;
  sentenceCount: number;
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

// Componente principal que usa useSearchParams
function GeneratePageContent() {
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState<TextStyle>(textStyles[0]);
  const [length, setLength] = useState<TextLength>(textLengths[1]);
  const [textGenerations, setTextGenerations] = useState<TextGeneration[]>([]);
  const [loading, setLoading] = useState(false);
  const [textAnalysis, setTextAnalysis] = useState<TextAnalysis | null>(null);
  const { user } = useAuth();
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfig>({
    targetCharCount: 500,
    targetWordCount: 100,
    targetReadTime: 3,
    enableAdvancedOptions: false
  });
  const {toast} = useToast();

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
    
    // Contagem de frases (aproximada)
    const sentenceCount = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
    
    // Tempo de leitura (considerando 200 palavras por minuto)
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    
    setTextAnalysis({
      wordCount,
      charCount,
      sentenceCount,
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
    
    setLoading(true);
    try {
      // Preparar input básico
      const input: GenerateTextInput = {
        topic: topic,
        style: style,
        length: length,
      };
      
      // Adicionar instruções adicionais apenas se as configurações avançadas estiverem ativadas
      if (advancedConfig.enableAdvancedOptions) {
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
      
      // Adicionar novo resultado ao histórico
      const newGeneration: TextGeneration = {
        id: generateId(),
        topic: topic,
        generatedText: result.generatedText,
        style,
        length,
        timestamp: new Date(),
        analysis: generatedTextAnalysis
      };
      
      setTextGenerations(prev => [newGeneration, ...prev]);
      
      // Salvar no localStorage se o usuário estiver logado
      if (user) {
        try {
          // Pegar os resultados existentes
          const savedGenerations = localStorage.getItem('textGenerations');
          let allGenerations = savedGenerations ? JSON.parse(savedGenerations) : [];
          
          // Adicionar o novo resultado
          allGenerations = [newGeneration, ...allGenerations];
          
          // Salvar de volta no localStorage
          localStorage.setItem('textGenerations', JSON.stringify(allGenerations));
        } catch (error) {
          console.error('Erro ao salvar texto gerado:', error);
        }
      }
      
      toast({
        title: "Texto gerado",
        description: "Texto gerado com sucesso.",
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
    
    // Contagem de frases (aproximada)
    const sentenceCount = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
    
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
      <div className="w-full max-w-2xl mb-6 mt-4 md:mb-8 md:mt-8 px-2 fade-in-up">
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
                  {textStyles.map((styleOption) => (
                    <SelectItem key={styleOption} value={styleOption} className="text-xs md:text-sm">
                      {styleOption}
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
                Configurações Avançadas
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <input 
                    type="checkbox" 
                    id="enable-advanced" 
                    checked={advancedConfig.enableAdvancedOptions}
                    onChange={(e) => {
                      // Atualizar o estado diretamente
                      setAdvancedConfig({
                        ...advancedConfig,
                        enableAdvancedOptions: e.target.checked,
                        // Se estiver sendo desativado, resetar valores para defaults
                        targetCharCount: e.target.checked ? advancedConfig.targetCharCount : 500,
                        targetWordCount: e.target.checked ? advancedConfig.targetWordCount : 100,
                        targetReadTime: e.target.checked ? advancedConfig.targetReadTime : 3,
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="enable-advanced" className="text-xs">Ativar configurações avançadas</Label>
                </div>
                
                <div className={`space-y-4 ${!advancedConfig.enableAdvancedOptions ? 'opacity-50 pointer-events-none' : ''}`}>
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
        </CardContent>
      </Card>

      {textGenerations.length > 0 && (
        <div className="w-full max-w-xs sm:max-w-md md:max-w-2xl mt-6 fade-in-up" style={{animationDelay: "0.2s"}}>
          <div className="flex items-center gap-2 mb-3 md:mb-4 px-1">
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <h2 className="text-base md:text-xl font-semibold">Histórico de textos gerados</h2>
          </div>
          
          <div className="space-y-4 md:space-y-6">
            {textGenerations.map((generation, index) => (
              <Card key={generation.id} className="w-full shadow-lg card-glass fade-in-up" style={{animationDelay: `${0.1 * (index + 1)}s`}}>
                <CardHeader className="pb-1 md:pb-2 p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <CardTitle className="flex items-center gap-1 md:gap-2 text-sm md:text-base">
                      <Sparkles className="h-3 w-3 md:h-5 md:w-5 text-accent" />
                      <span className="text-gradient-accent truncate max-w-[180px] sm:max-w-none">
                        {generation.style} • {generation.length}
                      </span>
                    </CardTitle>
                    <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2 w-2 md:h-3 md:w-3" /> 
                      {formatDate(generation.timestamp)}
                    </span>
                  </div>
                  <CardDescription className="mt-1 text-[10px] md:text-xs">
                    Tópico: {generation.topic.length > 60 
                      ? generation.topic.substring(0, 60) + "..." 
                      : generation.topic}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:gap-4 p-3 md:p-4">
                  <div className="whitespace-pre-line p-2 md:p-4 bg-muted/30 rounded-md border text-xs md:text-sm overflow-auto max-h-[250px] md:max-h-[300px]">
                    {generation.generatedText}
                  </div>

                  {generation.analysis && (
                    <div className="bg-muted/30 rounded-md p-2 md:p-3 border text-xs md:text-sm">
                      <div className="flex items-center gap-1 mb-1.5 text-primary font-medium">
                        <BarChart2 className="h-3 w-3 md:h-4 md:w-4" />
                        <span>Análise do Texto Gerado</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Palavras:</span>
                          <span className="font-medium">{generation.analysis.wordCount}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Caracteres:</span>
                          <span className="font-medium">{generation.analysis.charCount}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Frases:</span>
                          <span className="font-medium">{generation.analysis.sentenceCount}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Tempo de leitura:</span>
                          <span className="font-medium">{generation.analysis.readTime} min</span>
                        </div>
                        
                        {generation.analysis.sentimentLabel && (
                          <div className="flex items-center gap-1 col-span-2 md:col-span-4 mt-2">
                            <span className="text-muted-foreground">Sentimento:</span>
                            {renderSentimentBadge(generation.analysis.sentimentLabel)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center gap-2">
                    <Link
                      href={`/?text=${encodeURIComponent(generation.generatedText)}`}
                      className="text-xs text-primary hover:underline hover:text-accent transition-colors flex items-center gap-1"
                    >
                      <PenTool className="h-3 w-3" />
                      Reescrever este texto
                    </Link>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleCopy(generation.generatedText)} 
                        className="h-8 w-8 md:h-10 md:w-10 border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground hover:border-accent transition-colors ripple"
                      >
                        <Copy className="h-3 w-3 md:h-4 md:w-4"/>
                        <span className="sr-only">Copiar</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleDownload(
                          generation.generatedText, 
                          `texto_${generation.style}_${generation.id}.txt`
                        )} 
                        className="h-8 w-8 md:h-10 md:w-10 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors ripple"
                      >
                        <Download className="h-3 w-3 md:h-4 md:w-4"/>
                        <span className="sr-only">Baixar</span>
                      </Button>
                    </div>
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