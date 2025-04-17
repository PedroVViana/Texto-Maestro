"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { 
  Copy, Download, Clock, FileText, 
  Sparkles, Wand, ArrowRight, PenTool 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Interfaces para os diferentes tipos de textos
interface TextResult {
  id: string;
  originalText: string;
  rewrittenText: string;
  style: string;
  timestamp: Date;
}

interface TextGeneration {
  id: string;
  topic: string;
  generatedText: string;
  style: string;
  length: string;
  timestamp: Date;
}

function MyTextsContent() {
  const { user, isLoading } = useAuth();
  const [textResults, setTextResults] = useState<TextResult[]>([]);
  const [textGenerations, setTextGenerations] = useState<TextGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Traduções para os estilos de reescrita
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

  // Traduções para os estilos de geração
  const generateStyleTranslations: {[key: string] : string} = {
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
  }

  // Traduções para os comprimentos
  const lengthTranslations: {[key: string] : string} = {
    "Short": "Curto",
    "Medium": "Médio",
    "Long": "Longo",
    "Curto": "Curto",
    "Médio": "Médio",
    "Longo": "Longo"
  }

  useEffect(() => {
    // Aqui implementaríamos a lógica para buscar os textos do usuário do Firebase
    // Por enquanto, usaremos dados de exemplo do localStorage

    try {
      // Simulando carregamento de dados
      setTimeout(() => {
        const savedResults = localStorage.getItem('textResults');
        const savedGenerations = localStorage.getItem('textGenerations');
        
        if (savedResults) {
          const parsed = JSON.parse(savedResults);
          // Convertendo string de data para objeto Date
          setTextResults(parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })));
        }
        
        if (savedGenerations) {
          const parsed = JSON.parse(savedGenerations);
          // Convertendo string de data para objeto Date
          setTextGenerations(parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })));
        }
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar textos:', error);
      toast({
        title: "Erro ao carregar textos",
        description: "Não foi possível recuperar seus textos salvos.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [toast, user]);

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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen pt-16">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen pt-16">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col p-4">
          <Card className="w-full max-w-md card-glass p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Acesso Restrito</h2>
            <p className="mb-6">Faça login para visualizar seus textos salvos.</p>
            <div className="flex justify-center">
              <Link href="/">
                <Button>Voltar para a página inicial</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-pattern pt-16">
      <Navbar />
      
      <div className="grain-overlay"></div>
      <div className="fixed top-[10%] right-[10%] w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/20 blur-3xl opacity-50"></div>
      <div className="fixed bottom-[10%] left-[10%] w-28 h-28 md:w-40 md:h-40 rounded-full bg-accent/20 blur-3xl opacity-50"></div>
      
      <div className="container mx-auto py-8 flex-1 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gradient">Meus Textos</h1>
          <p className="text-muted-foreground">Todos os seus textos salvos em um só lugar</p>
        </div>
        
        <Tabs defaultValue="rewritten" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="rewritten" className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              <span>Textos Reescritos</span>
            </TabsTrigger>
            <TabsTrigger value="generated" className="flex items-center gap-2">
              <Wand className="h-4 w-4" />
              <span>Textos Gerados</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="rewritten" className="space-y-6">
            {textResults.length === 0 ? (
              <Card className="card-glass">
                <CardContent className="pt-6 pb-6 text-center">
                  <p className="text-muted-foreground mb-4">Você ainda não tem textos reescritos.</p>
                  <Link href="/">
                    <Button className="bg-primary">
                      Começar a reescrever textos
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {textResults.map((result) => (
                  <Card key={result.id} className="w-full shadow-lg card-glass">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base flex items-center gap-2">
                          <PenTool className="h-4 w-4 text-primary" />
                          {rewriteStyleTranslations[result.style] || result.style}
                        </CardTitle>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> 
                          {formatDate(result.timestamp)}
                        </span>
                      </div>
                      <CardDescription className="line-clamp-1 mt-1">
                        Original: {result.originalText.substring(0, 60)}...
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="bg-muted/30 rounded-md p-3 text-sm max-h-32 overflow-auto mb-3">
                        {result.rewrittenText}
                      </div>
                      <div className="flex justify-between items-center">
                        <Link href={`/?text=${encodeURIComponent(result.rewrittenText)}`}>
                          <Button variant="outline" size="sm">
                            <PenTool className="h-3 w-3 mr-2" />
                            Reescrever
                          </Button>
                        </Link>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-8 w-8 text-accent"
                            onClick={() => handleCopy(result.rewrittenText)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-8 w-8 text-primary"
                            onClick={() => handleDownload(result.rewrittenText, `texto_${rewriteStyleTranslations[result.style] || result.style}_${result.id}.txt`)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="generated" className="space-y-6">
            {textGenerations.length === 0 ? (
              <Card className="card-glass">
                <CardContent className="pt-6 pb-6 text-center">
                  <p className="text-muted-foreground mb-4">Você ainda não tem textos gerados.</p>
                  <Link href="/gerar">
                    <Button className="bg-accent">
                      Começar a gerar textos
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {textGenerations.map((generation) => (
                  <Card key={generation.id} className="w-full shadow-lg card-glass">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Wand className="h-4 w-4 text-accent" />
                          {generateStyleTranslations[generation.style] || generation.style} • {lengthTranslations[generation.length] || generation.length}
                        </CardTitle>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> 
                          {formatDate(generation.timestamp)}
                        </span>
                      </div>
                      <CardDescription className="line-clamp-1 mt-1">
                        Tópico: {generation.topic}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="bg-muted/30 rounded-md p-3 text-sm max-h-32 overflow-auto mb-3">
                        {generation.generatedText}
                      </div>
                      <div className="flex justify-between items-center">
                        <Link href={`/?text=${encodeURIComponent(generation.generatedText)}`}>
                          <Button variant="outline" size="sm">
                            <PenTool className="h-3 w-3 mr-2" />
                            Reescrever
                          </Button>
                        </Link>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-8 w-8 text-accent"
                            onClick={() => handleCopy(generation.generatedText)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-8 w-8 text-primary"
                            onClick={() => handleDownload(generation.generatedText, `texto_${generateStyleTranslations[generation.style] || generation.style}_${lengthTranslations[generation.length] || generation.length}_${generation.id}.txt`)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p className="mb-2">
          <span className="text-gradient-primary font-semibold">Texto Maestro</span> &copy; {new Date().getFullYear()}
        </p>
        <p>Desenvolvido por Pedro Van-lume</p>
      </footer>
    </div>
  );
}

// Componente principal com Suspense
export default function MyTextsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    }>
      <MyTextsContent />
    </Suspense>
  );
} 