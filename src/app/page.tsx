"use client";

import {RewriteTextInput, rewriteText} from "@/ai/flows/rewrite-text";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useToast} from "@/hooks/use-toast";
import {Copy, Download, Sparkles, FileText, Wand, Clock} from "lucide-react";

const rewriteStyles = [
  "Grammar correction",
  "Formal rewrite",
  "Simplified rewrite",
  "Persuasive rewrite",
  "Social media optimization",
] as const;

type RewriteStyle = typeof rewriteStyles[number];

interface TextResult {
  id: string;
  originalText: string;
  rewrittenText: string;
  style: RewriteStyle;
  timestamp: Date;
}

export default function Home() {
  const [text, setText] = useState("");
  const [style, setStyle] = useState<RewriteStyle>(rewriteStyles[0]);
  const [textResults, setTextResults] = useState<TextResult[]>([]);
  const [loading, setLoading] = useState(false);
  const {toast} = useToast();

  const handleRewrite = async () => {
    if (!text.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, insira um texto para reescrever.",
      });
      return;
    }
    
    setLoading(true);
    try {
      const input: RewriteTextInput = {
        text: text,
        style: style,
      };
      const result = await rewriteText(input);
      
      // Adicionar novo resultado ao histórico
      const newResult: TextResult = {
        id: generateId(),
        originalText: text,
        rewrittenText: result.rewrittenText,
        style,
        timestamp: new Date(),
      };
      
      setTextResults(prev => [newResult, ...prev]);
      
      toast({
        title: "Texto reescrito",
        description: "Texto reescrito com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Falha ao reescrever o texto.",
      });
    } finally {
      setLoading(false);
    }
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
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="relative flex flex-col items-center justify-start min-h-screen bg-pattern px-4 py-6 md:py-8">
      {/* Elementos de fundo */}
      <div className="grain-overlay"></div>
      <div className="fixed top-[10%] right-[10%] w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/20 blur-3xl opacity-50"></div>
      <div className="fixed bottom-[10%] left-[10%] w-28 h-28 md:w-40 md:h-40 rounded-full bg-accent/20 blur-3xl opacity-50"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-60 md:h-60 rounded-full bg-secondary/10 blur-3xl opacity-30"></div>
      
      {/* Título Principal */}
      <div className="w-full max-w-2xl text-center mb-6 mt-4 md:mb-8 md:mt-8 px-2">
        <div className="flex items-center justify-center gap-1 md:gap-2 mb-2">
          <Wand size={28} className="text-primary animate-float hidden sm:block md:text-3xl" />
          <h1 className="text-gradient text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Texto Maestro
          </h1>
          <Sparkles size={20} className="text-accent animate-float hidden sm:block md:text-2xl" />
        </div>
        <p className="text-sm md:text-lg text-muted-foreground px-2">
          Transforme e aprimore seus textos com inteligência artificial
        </p>
      </div>

      <Card className="w-full max-w-xs sm:max-w-md md:max-w-2xl p-3 md:p-4 shadow-lg card-glass">
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <span className="text-gradient-primary">Editor de Texto</span>
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">Insira o texto que você deseja reescrever.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:gap-4 p-3 md:p-6 pt-0 md:pt-0">
          <div className="grid gap-2">
            <Textarea
              placeholder="Digite seu texto aqui..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-24 md:min-h-32 border-2 focus:border-primary/50 text-sm md:text-base"
            />
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
          <Button 
            onClick={handleRewrite} 
            disabled={loading} 
            className="bg-accent text-white hover:shadow-lg transition-all duration-300 hover:bg-accent/90 h-9 md:h-10 text-xs md:text-sm"
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
        <div className="w-full max-w-xs sm:max-w-md md:max-w-2xl mt-6">
          <div className="flex items-center gap-2 mb-3 md:mb-4 px-1">
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <h2 className="text-base md:text-xl font-semibold">Histórico de textos</h2>
          </div>
          
          <div className="space-y-4 md:space-y-6">
            {textResults.map((result) => (
              <Card key={result.id} className="w-full shadow-lg card-glass">
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
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleCopy(result.rewrittenText)} 
                      className="h-8 w-8 md:h-10 md:w-10 border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground hover:border-accent transition-colors"
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
                      className="h-8 w-8 md:h-10 md:w-10 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
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
