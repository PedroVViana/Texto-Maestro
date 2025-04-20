"use client";

import { useState, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/Auth/AuthProvider";
import { Check, AlertCircle } from "lucide-react";
import { UserRibbon } from "@/components/Auth/UserRibbon";
import { useToast } from "@/hooks/use-toast";

function PricingContent() {
  const { user, userPlan, changePlan } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { toast } = useToast();

  const plans = [
    {
      id: "free",
      name: "Gratuito",
      price: "R$ 0",
      description: "Para uso casual e experimentar a plataforma",
      features: [
        "5 reescritas por dia",
        "3 gerações de texto por dia",
        "Limite de 500 palavras por texto",
        "Acesso a 5 estilos de reescrita",
        "Histórico limitado a 7 dias",
        "Análise básica de texto"
      ],
      buttonText: "Assinar Plano Gratuito",
      popular: false,
      disabled: false
    },
    {
      id: "plus",
      name: "Plus",
      price: "R$ 14,90",
      period: "/mês",
      description: "Para criadores de conteúdo e estudantes",
      features: [
        "20 reescritas por dia",
        "10 gerações de texto por dia",
        "Limite de 1.000 palavras por texto",
        "Acesso a 6 estilos de reescrita",
        "Filtros avançados de histórico",
        "Histórico por 30 dias",
        "Download em TXT e DOCX"
      ],
      buttonText: "Assinar Plano Plus",
      popular: true,
      disabled: false
    },
    {
      id: "pro",
      name: "Pro",
      price: "R$ 29,90",
      period: "/mês",
      description: "Para profissionais e empresas",
      features: [
        "Reescritas ilimitadas",
        "Gerações de texto ilimitadas",
        "Sem limite de palavras",
        "Todos os estilos de reescrita",
        "Filtros avançados de histórico",
        "Histórico ilimitado",
        "Download em todos os formatos"
      ],
      buttonText: "Assinar Plano Pro",
      popular: false,
      disabled: false
    }
  ];

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    
    // Verificar se o planId é válido ("free", "plus" ou "pro")
    if (planId !== "free" && planId !== "plus" && planId !== "pro") {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Tipo de plano inválido."
      });
      return;
    }
    
    // Verificar se é o mesmo plano atual
    if (planId === userPlan.type) {
      toast({
        title: "Plano Mantido",
        description: `Você optou por permanecer no plano ${planId.charAt(0).toUpperCase() + planId.slice(1)}.`
      });
      return;
    }
    
    // Mudar o plano do usuário (temporariamente para demonstração)
    try {
      // Verificar se é um downgrade de plano
      const isDowngrade = 
        (userPlan.type === "pro" && (planId === "plus" || planId === "free")) ||
        (userPlan.type === "plus" && planId === "free");
      
      await changePlan(planId as "free" | "plus" | "pro");
      
      // Notificar o usuário com mensagem específica para downgrade
      if (isDowngrade) {
        toast({
          title: "Plano alterado",
          description: `Seu plano foi alterado para ${planId.charAt(0).toUpperCase() + planId.slice(1)}. Observe que alguns recursos podem não estar mais disponíveis.`,
        });
      } else {
        toast({
          title: "Plano atualizado",
          description: `Seu plano foi alterado para ${planId.charAt(0).toUpperCase() + planId.slice(1)}. Agora você tem acesso a todos os recursos deste plano.`
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar o plano:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar plano",
        description: "Não foi possível atualizar seu plano. Tente novamente mais tarde."
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-pattern">
      <Navbar />
      <UserRibbon />
      
      <div className="grain-overlay"></div>
      <div className="fixed top-[10%] right-[10%] w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/20 blur-3xl opacity-50"></div>
      <div className="fixed bottom-[10%] left-[10%] w-28 h-28 md:w-40 md:h-40 rounded-full bg-accent/20 blur-3xl opacity-50"></div>
      
      <div className="container mx-auto px-4 py-8 flex-grow mt-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">Planos e Preços</h1>
          <p className="text-lg text-muted-foreground">
            Escolha o plano ideal para suas necessidades e aproveite o poder do Texto Maestro
          </p>
          {!user && (
            <p className="mt-4 text-sm bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md inline-flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              Você precisa estar logado para assinar um plano.
            </p>
          )}
          {user && (
            <p className="mt-4 text-sm bg-blue-100 dark:bg-blue-900/30 p-3 rounded-md inline-flex items-center gap-2 text-blue-800 dark:text-blue-200">
              Seu plano atual: <span className="font-bold ml-1">{userPlan.type.charAt(0).toUpperCase() + userPlan.type.slice(1)}</span>
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`border-2 relative ${
                plan.id === userPlan.type
                  ? "border-green-500 shadow-lg shadow-green-500/10"
                  : plan.popular 
                  ? "border-primary shadow-lg shadow-primary/10" 
                  : "border-border"
              } transition-all hover:shadow-md`}
            >
              {plan.popular && plan.id !== userPlan.type && (
                <div className="absolute -top-3 left-0 right-0 mx-auto w-fit px-3 py-1 bg-primary text-xs font-semibold text-white rounded-full">
                  Mais Popular
                </div>
              )}
              {plan.id === userPlan.type && (
                <div className="absolute -top-3 left-0 right-0 mx-auto w-fit px-3 py-1 bg-green-500 text-xs font-semibold text-white rounded-full">
                  Plano Atual
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground mb-1">{plan.period}</span>}
                </div>
                <CardDescription className="mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full ${
                    plan.id === userPlan.type 
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : plan.popular 
                      ? "bg-primary hover:bg-primary/90" 
                      : ""
                  }`}
                  disabled={plan.disabled || !user}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {plan.id === userPlan.type ? "Permanecer no Plano Atual" : plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 text-center max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-3">Dúvidas frequentes</h2>
          <p className="text-muted-foreground mb-6">
            Para mais informações sobre os planos, consulte nossa página de <a href="#" className="text-primary underline">perguntas frequentes</a> ou entre em <a href="#" className="text-primary underline">contato</a> com nosso suporte.
          </p>
        </div>
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

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
} 