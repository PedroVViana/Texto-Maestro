"use client";

import { useState, useEffect } from "react";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import { LogoutButton } from "./LogoutButton";
import { LoginButton } from "./LoginButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { User } from "firebase/auth";
import { Settings, CreditCard, Home, UserRound, Loader2 } from "lucide-react";
import Link from "next/link";

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <LoginButton />;
  }

  // Iniciais do usuário para o avatar fallback
  const getUserInitials = () => {
    if (!user.displayName) return "U";
    return user.displayName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none group">
        <Avatar className="h-10 w-10 cursor-pointer transition-all duration-200 group-hover:scale-105 group-hover:ring-2 ring-primary/20 group-focus:ring-2">
          <AvatarImage 
            src={user.photoURL || undefined} 
            alt={user.displayName || "Usuário"} 
            className="transition-opacity duration-200"
          />
          <AvatarFallback className="bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/20">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 overflow-hidden" sideOffset={8}>
        <DropdownMenuLabel className="p-4 pb-3">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.displayName || "Usuário"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/" className="block">
          <DropdownMenuItem className="cursor-pointer transition-colors duration-150 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary flex items-center gap-2 p-3">
            <Home className="h-4 w-4" />
            <span>Página Principal</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/configuracoes" className="block">
          <DropdownMenuItem className="cursor-pointer transition-colors duration-150 hover:bg-accent/10 hover:text-accent focus:bg-accent/10 focus:text-accent flex items-center gap-2 p-3">
            <Settings className="h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/planos" className="block">
          <DropdownMenuItem className="cursor-pointer transition-colors duration-150 hover:bg-accent/10 hover:text-accent focus:bg-accent/10 focus:text-accent flex items-center gap-2 p-3">
            <CreditCard className="h-4 w-4" />
            <span>Planos</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-default p-0 focus:bg-transparent hover:bg-transparent">
          <LogoutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 