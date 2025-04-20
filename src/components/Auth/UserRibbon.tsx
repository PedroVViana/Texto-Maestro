"use client";

import { useAuth } from "./AuthProvider";
import { Info, AlertTriangle, TrendingUp } from "lucide-react";
import Link from "next/link";

export function UserRibbon() {
  const { user, userPlan, remainingRewrites, remainingGenerations } = useAuth();

  // Se não houver usuário ou se o plano for pro (ilimitado), não mostre o banner
  if (!user || userPlan.type === "pro") return null;

  // Mostrar uma mensagem de alerta se o usuário estiver quase atingindo o limite
  const isLowOnRewrites = remainingRewrites <= 1;
  const isLowOnGenerations = remainingGenerations <= 1;
  const showWarning = isLowOnRewrites || isLowOnGenerations;

  return (
    <div className={`w-full py-1.5 px-3 text-xs text-center ${showWarning ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'}`}>
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {showWarning ? (
          <>
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>
              {isLowOnRewrites && isLowOnGenerations
                ? "Seu limite diário está quase acabando!"
                : isLowOnRewrites
                ? `Apenas ${remainingRewrites} reescrita${remainingRewrites !== 1 ? 's' : ''} restante${remainingRewrites !== 1 ? 's' : ''} hoje`
                : `Apenas ${remainingGenerations} geração${remainingGenerations !== 1 ? 'ões' : ''} de texto restante${remainingGenerations !== 1 ? 's' : ''} hoje`}
            </span>
            <Link href="/planos" className="font-medium underline ml-1 hover:text-amber-600 dark:hover:text-amber-100 transition-colors">
              Faça upgrade para o plano Premium
            </Link>
          </>
        ) : (
          <>
            <Info className="h-3.5 w-3.5" />
            <span>
              {userPlan.type === "free" 
                ? `Plano Gratuito: ${remainingRewrites}/${userPlan.rewritesLimit} reescritas e ${remainingGenerations}/${userPlan.generationsLimit} gerações restantes hoje`
                : `Plano Plus: ${remainingRewrites}/${userPlan.rewritesLimit} reescritas e ${remainingGenerations}/${userPlan.generationsLimit} gerações restantes hoje`}
            </span>
            {userPlan.type === "free" && (
              <Link href="/planos" className="font-medium underline ml-1 hover:text-blue-600 dark:hover:text-blue-100 transition-colors">
                Faça upgrade para mais recursos
              </Link>
            )}
            {userPlan.type === "plus" && (
              <Link href="/planos" className="font-medium underline ml-1 hover:text-blue-600 dark:hover:text-blue-100 transition-colors flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                <span>Upgrade para Pro</span>
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
} 