"use client";

import Link from "next/link";
import { Wand, FileText } from "lucide-react";
import { UserMenu } from "@/components/Auth/UserMenu";
import { useAuth } from "@/components/Auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function Navbar() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  // Detectar rolagem para aplicar estilos diferentes
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      className={`w-full fixed top-0 left-0 z-50 transition-all duration-500 ${
        scrolled 
          ? "bg-background/70 backdrop-blur-md border-b shadow-sm" 
          : "bg-transparent"
      }`}
    >
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo e nome do site */}
        <Link href="/" className="flex items-center gap-2 hover:scale-105 transition-transform">
          <Wand className={`h-5 w-5 transition-colors duration-300 ${scrolled ? "text-primary" : "text-accent"}`} />
          <span className={`font-bold text-lg ${scrolled ? "text-gradient-primary" : "text-gradient"} transition-all duration-300`}>
            Texto Maestro
          </span>
        </Link>

        {/* Botões à direita */}
        <div className="flex items-center gap-3">
          {user && (
            <Link href="/meus-textos">
              <Button 
                variant="outline" 
                className={`flex items-center gap-2 ripple button-highlight transition-all duration-300 ${
                  scrolled 
                    ? "bg-white/20 dark:bg-black/20" 
                    : "bg-white/10 dark:bg-black/10"
                } backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-white hover:border-primary hover:shadow-md hover:shadow-primary/20 group`}
              >
                <FileText className="h-4 w-4 transition-transform group-hover:rotate-12" />
                <span className="text-sm">Meus Textos</span>
              </Button>
            </Link>
          )}
          <UserMenu />
        </div>
      </div>
    </div>
  );
} 