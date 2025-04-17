"use client";

import { useState, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/Auth/AuthProvider";
import { Check, AlertCircle } from "lucide-react";

function PricingContent() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

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
        "Acesso a 3 estilos de reescrita",
        "Sem configurações avançadas"
      ],
      buttonText: "Plano Atual",
      popular: false,
      disabled: true
    },
    {
      id: "plus",
      name: "Plus",
      price: "R$ 29,90",
      period: "/mês",
      description: "Para criadores de conteúdo e estudantes",
      features: [
        "30 reescritas por dia",
        "20 gerações de texto por dia",
        "Limite de 2.000 palavras por texto",
        "Acesso a todos os estilos de reescrita",
        "Configurações avançadas",
        "Download em DOCX e PDF",
        "Histórico ilimitado"
      ],
      buttonText: "Assinar Plano Plus",
      popular: true,
      disabled: false
    },
    {
      id: "pro",
      name: "Pro",
      price: "R$ 59,90",
      period: "/mês",
      description: "Para profissionais e empresas",
      features: [
        "Reescritas ilimitadas",
        "Gerações de texto ilimitadas",
        "Sem limite de palavras",
        "Todos os recursos do Plus",
        "API de acesso",
        "Análise avançada de SEO",
        "Suporte prioritário"
      ],
      buttonText: "Assinar Plano Pro",
      popular: false,
      disabled: false
    }
  ];

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    // Aqui implementaríamos a integração com um gateway de pagamento
    // como Stripe, PagSeguro, etc.
    alert(`Você selecionou o plano ${planId}. A integração de pagamento será implementada em breve.`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-pattern pt-16">
      <Navbar />
      
      <div className="grain-overlay"></div>
      <div className="fixed top-[10%] right-[10%] w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/20 blur-3xl opacity-50"></div>
      <div className="fixed bottom-[10%] left-[10%] w-28 h-28 md:w-40 md:h-40 rounded-full bg-accent/20 blur-3xl opacity-50"></div>
      
      <div className="container mx-auto py-12 flex-1 px-4">
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`border-2 relative ${
                plan.popular 
                  ? "border-primary shadow-lg shadow-primary/10" 
                  : "border-border"
              } transition-all hover:shadow-md`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-0 right-0 mx-auto w-fit px-3 py-1 bg-primary text-xs font-semibold text-white rounded-full">
                  Mais Popular
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
                    plan.popular ? "bg-primary hover:bg-primary/90" : ""
                  }`}
                  disabled={plan.disabled || !user}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {plan.buttonText}
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