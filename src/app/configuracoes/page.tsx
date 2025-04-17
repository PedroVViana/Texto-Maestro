"use client";

import { useState, Suspense, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/Auth/AuthProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, User, Camera, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function SettingsContent() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obter as iniciais do usuário para o fallback do avatar
  const getUserInitials = () => {
    if (!user || !user.displayName) return "U";
    return user.displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulação de salvamento
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso."
      });
    }, 1000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setSelectedImage(event.target.result);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (isLoading) {
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
            <p className="mb-6">Faça login para acessar as configurações da sua conta.</p>
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
      
      <div className="container mx-auto py-12 flex-1 px-4">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e informações da conta
          </p>
        </div>
        
        <div className="w-full max-w-2xl mx-auto">
          <Card className="border shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <span>Informações do Perfil</span>
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e detalhes da conta
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Foto de perfil */}
                <div className="flex flex-col items-center gap-4 mb-6">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 cursor-pointer border-2 border-primary/30">
                      <AvatarImage 
                        src={selectedImage || user.photoURL || undefined} 
                        alt={user.displayName || "Usuário"} 
                        className="object-cover"
                      />
                      <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer"
                      onClick={triggerFileInput}
                    >
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clique na imagem para alterar sua foto de perfil
                  </p>
                </div>
                
                {/* Nome do usuário */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input 
                    id="name" 
                    defaultValue={user.displayName || ""} 
                    placeholder="Seu nome"
                  />
                </div>
                
                {/* Email (não editável) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={user.email || ""} 
                    className="bg-muted/50" 
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    O email não pode ser alterado
                  </p>
                </div>
                
                {/* Alerta sobre alteração de senha */}
                <div className="border rounded-md p-4 bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                        Alterar senha
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Para alterar sua senha, você precisará sair e usar a opção "Esqueci minha senha" na tela de login.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" className="bg-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                        Salvando...
                      </>
                    ) : "Salvar alterações"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Seção de planos */}
          <Card className="border shadow-md mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-accent" />
                <span>Plano atual</span>
              </CardTitle>
              <CardDescription>
                Gerencie seu plano de assinatura e recursos disponíveis
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="bg-muted/30 rounded-md p-4 border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">Plano Gratuito</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      5 reescritas por dia, 3 gerações de texto por dia, limite de 500 palavras
                    </p>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                    Ativo
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end">
              <Link href="/planos">
                <Button variant="outline" className="bg-accent/10 border-accent/30 text-accent hover:bg-accent hover:text-white">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Atualizar para plano premium
                </Button>
              </Link>
            </CardFooter>
          </Card>
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

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
} 