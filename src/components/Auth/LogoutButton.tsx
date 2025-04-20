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
      variant="ghost"
      size="sm"
      className="flex items-center gap-2 w-full justify-start hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-900/30 dark:hover:text-rose-300 rounded-sm px-2"
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></span>
          Saindo...
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Sair
        </span>
      )}
    </Button>
  );
} 