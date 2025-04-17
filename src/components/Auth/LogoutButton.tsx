"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado da sua conta.",
      });
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: "Não foi possível desconectar da sua conta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleLogout} 
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></span>
          Saindo...
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </span>
      )}
    </Button>
  );
} 