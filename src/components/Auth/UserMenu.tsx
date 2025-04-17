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
import { Settings, CreditCard } from "lucide-react";
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
      <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
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
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "Usuário"} />
          <AvatarFallback>{getUserInitials()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.displayName || "Usuário"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/configuracoes">
          <DropdownMenuItem className="cursor-pointer focus:bg-accent flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/planos">
          <DropdownMenuItem className="cursor-pointer focus:bg-accent flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Planos</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer focus:bg-accent">
          <LogoutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 