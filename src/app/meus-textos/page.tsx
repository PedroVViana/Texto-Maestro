"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { UserRibbon } from "@/components/Auth/UserRibbon";
import { 
  Copy, Download, Clock, FileText, 
  Sparkles, Wand, ArrowRight, PenTool, CreditCard 
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
  const { user, isLoading, userPlan } = useAuth();
  const [textResults, setTextResults] = useState<TextResult[]>([]);
  const [textGenerations, setTextGenerations] = useState<TextGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredTextResults, setFilteredTextResults] = useState<TextResult[]>([]);
  const [filteredTextGenerations, setFilteredTextGenerations] = useState<TextGeneration[]>([]);
  const [filterStyle, setFilterStyle] = useState<string>("todos");
  const [filterDateRange, setFilterDateRange] = useState<number | null>(null);
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

  // Opções de período para filtro
  const filterDateOptions = [
    { value: 7, label: "Últimos 7 dias" },
    { value: 30, label: "Últimos 30 dias" },
    { value: 90, label: "Últimos 3 meses" },
    { value: 180, label: "Últimos 6 meses" },
    { value: 365, label: "Último ano" },
    { value: null, label: "Todo o histórico" }
  ];

  // Traduções para os comprimentos
  const lengthTranslations: {[key: string] : string} = {
    "Short": "Curto",
    "Medium": "Médio",
    "Long": "Longo",
    "Curto": "Curto",
    "Médio": "Médio",
    "Longo": "Longo"
  }

  // Efeito para aplicar filtros quando os dados ou filtros mudam
  useEffect(() => {
    if (textResults.length > 0) {
      let filtered = [...textResults];
      
      // Filtro por estilo de reescrita
      if (filterStyle !== "todos") {
        filtered = filtered.filter(item => item.style === filterStyle);
      }
      
      // Filtro por período
      if (filterDateRange !== null) {
        const currentDate = new Date();
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.timestamp);
          const diffTime = Math.abs(currentDate.getTime() - itemDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= filterDateRange;
        });
      }
      
      setFilteredTextResults(filtered);
    }
    
    if (textGenerations.length > 0) {
      let filtered = [...textGenerations];
      
      // Filtro por estilo de geração
      if (filterStyle !== "todos") {
        filtered = filtered.filter(item => item.style === filterStyle);
      }
      
      // Filtro por período
      if (filterDateRange !== null) {
        const currentDate = new Date();
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.timestamp);
          const diffTime = Math.abs(currentDate.getTime() - itemDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= filterDateRange;
        });
      }
      
      setFilteredTextGenerations(filtered);
    }
  }, [textResults, textGenerations, filterStyle, filterDateRange]);

  useEffect(() => {
    // Aqui implementaríamos a lógica para buscar os textos do usuário do Firebase
    // Por enquanto, usaremos dados de exemplo do localStorage

    try {
      // Simulando carregamento de dados
      setTimeout(() => {
        const savedResults = localStorage.getItem('textResults');
        const savedGenerations = localStorage.getItem('textGenerations');
        
        if (savedResults) {
          try {
            const parsed = JSON.parse(savedResults);
            // Convertendo string de data para objeto Date e filtrando por data de acordo com o plano
            const parsed_with_dates = parsed.map((item: any) => {
              // Certifique-se de que o timestamp é um objeto Date válido
              let timestamp;
              try {
                timestamp = item.timestamp ? new Date(item.timestamp) : new Date();
                // Verificar se a data é válida
                if (isNaN(timestamp.getTime())) {
                  timestamp = new Date(); // Usar data atual se inválida
                }
              } catch (e) {
                timestamp = new Date(); // Usar data atual em caso de erro
                console.error("Erro ao converter timestamp:", e);
              }
              
              return {
                ...item,
                timestamp
              };
            });

            // Filtragem de histórico conforme o plano do usuário
            const currentDate = new Date();
            const filteredResults = parsed_with_dates.filter((item: any) => {
              if (userPlan.historyDays === "unlimited") return true;
              
              const itemDate = item.timestamp;
              const diffTime = Math.abs(currentDate.getTime() - itemDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= userPlan.historyDays;
            });
            
            setTextResults(filteredResults);
            setFilteredTextResults(filteredResults);
          } catch (e) {
            console.error("Erro ao processar dados salvos:", e);
            setTextResults([]);
            setFilteredTextResults([]);
          }
        }
        
        if (savedGenerations) {
          try {
            const parsed = JSON.parse(savedGenerations);
            // Convertendo string de data para objeto Date
            const parsed_with_dates = parsed.map((item: any) => {
              // Certifique-se de que o timestamp é um objeto Date válido
              let timestamp;
              try {
                timestamp = item.timestamp ? new Date(item.timestamp) : new Date();
                // Verificar se a data é válida
                if (isNaN(timestamp.getTime())) {
                  timestamp = new Date(); // Usar data atual se inválida
                }
              } catch (e) {
                timestamp = new Date(); // Usar data atual em caso de erro
                console.error("Erro ao converter timestamp:", e);
              }
              
              return {
                ...item,
                timestamp
              };
            });

            // Filtragem de histórico conforme o plano do usuário
            const currentDate = new Date();
            const filteredGenerations = parsed_with_dates.filter((item: any) => {
              if (userPlan.historyDays === "unlimited") return true;
              
              const itemDate = item.timestamp;
              const diffTime = Math.abs(currentDate.getTime() - itemDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= userPlan.historyDays;
            });
            
            setTextGenerations(filteredGenerations);
            setFilteredTextGenerations(filteredGenerations);
          } catch (e) {
            console.error("Erro ao processar dados salvos:", e);
            setTextGenerations([]);
            setFilteredTextGenerations([]);
          }
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
  }, [toast, user, userPlan]);

  // Renderiza os controles de filtro para todos, mas desabilita para planos gratuitos
  const renderFilterControls = () => {
    const isPremium = userPlan.type !== "free";
    
    return (
      <Card className="mb-6 bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex justify-between items-center">
            <span>Filtros de Histórico</span>
            {!isPremium && (
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
                Recurso Premium
              </span>
            )}
          </CardTitle>
          {!isPremium && (
            <CardDescription className="text-xs mt-1">
              Atualize para um plano pago para filtrar seu histórico por período e estilo
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <label htmlFor="filter-date" className="text-xs text-muted-foreground mb-1 block">
                Período de Histórico
              </label>
              <select 
                id="filter-date"
                className={`w-full p-2 rounded-md bg-background border text-sm ${!isPremium ? "opacity-60 cursor-not-allowed" : ""}`}
                value={filterDateRange === null ? "null" : filterDateRange}
                onChange={(e) => isPremium && setFilterDateRange(e.target.value === "null" ? null : Number(e.target.value))}
                disabled={!isPremium}
              >
                {filterDateOptions.map(option => (
                  <option key={option.label} value={option.value === null ? "null" : option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-1/2">
              <label htmlFor="filter-style" className="text-xs text-muted-foreground mb-1 block">
                Filtrar por Estilo
              </label>
              <select 
                id="filter-style"
                className={`w-full p-2 rounded-md bg-background border text-sm ${!isPremium ? "opacity-60 cursor-not-allowed" : ""}`}
                value={filterStyle}
                onChange={(e) => isPremium && setFilterStyle(e.target.value)}
                disabled={!isPremium}
              >
                <option value="todos">Todos os estilos</option>
                {Object.entries(rewriteStyleTranslations).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
          </div>
          {!isPremium && (
            <div className="mt-4 flex justify-center">
              <Link href="/planos">
                <Button variant="outline" size="sm" className="text-xs bg-accent/10 border-accent/30 text-accent hover:bg-accent hover:text-white">
                  <CreditCard className="h-3 w-3 mr-2" />
                  Obter acesso completo ao histórico
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    );
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
      // Verifica se o valor é uma data válida
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return "Data não disponível";
      }
      
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data não disponível";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col p-4">
          <Card className="w-full max-w-md card-glass p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Acesso Restrito</h2>
            <p className="mb-6">Faça login para acessar seu histórico de textos.</p>
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
    <div className="flex flex-col min-h-screen bg-pattern">
      <Navbar />
      <UserRibbon />
      
      <div className="grain-overlay"></div>
      <div className="fixed top-[10%] right-[10%] w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/20 blur-3xl opacity-50"></div>
      <div className="fixed bottom-[10%] left-[10%] w-28 h-28 md:w-40 md:h-40 rounded-full bg-accent/20 blur-3xl opacity-50"></div>
      
      <div className="container mx-auto py-10 flex-1 px-4 mt-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gradient">Meus Textos</h1>
          <p className="text-muted-foreground">Todos os seus textos salvos em um só lugar</p>
          <p className="text-xs text-muted-foreground mt-2">
            {userPlan.historyDays === "unlimited" 
              ? "Seu plano permite acesso ao histórico completo sem limitação de tempo." 
              : `Seu plano permite acesso ao histórico dos últimos ${userPlan.historyDays} dias.`}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2 bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-white">
                <PenTool className="h-4 w-4" />
                <span>Editor de Texto</span>
              </Button>
            </Link>
            <Link href="/gerar">
              <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2 bg-accent/10 border-accent/30 text-accent hover:bg-accent hover:text-white">
                <Wand className="h-4 w-4" />
                <span>Criar Novo Texto</span>
              </Button>
            </Link>
          </div>
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
          
          {renderFilterControls()}
          
          <TabsContent value="rewritten" className="space-y-6">
            {filteredTextResults.length === 0 ? (
              <Card className="card-glass">
                <CardContent className="pt-6 pb-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    {textResults.length === 0 
                      ? "Você ainda não tem textos reescritos." 
                      : "Nenhum texto encontrado com os filtros atuais."}
                  </p>
                  {textResults.length === 0 ? (
                    <Link href="/">
                      <Button className="bg-primary">
                        Começar a reescrever textos
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setFilterStyle("todos");
                        setFilterDateRange(null);
                      }}
                    >
                      Limpar filtros
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredTextResults.map((result) => (
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
            {filteredTextGenerations.length === 0 ? (
              <Card className="card-glass">
                <CardContent className="pt-6 pb-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    {textGenerations.length === 0 
                      ? "Você ainda não tem textos gerados." 
                      : "Nenhum texto encontrado com os filtros atuais."}
                  </p>
                  {textGenerations.length === 0 ? (
                    <Link href="/gerar">
                      <Button className="bg-accent">
                        Começar a gerar textos
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setFilterStyle("todos");
                        setFilterDateRange(null);
                      }}
                    >
                      Limpar filtros
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredTextGenerations.map((generation) => (
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