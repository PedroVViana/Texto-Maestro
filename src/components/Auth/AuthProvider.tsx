"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "firebase/auth";
import { onAuthStateChanged as firebaseAuthChanged, updateUserPlan, getUserPlan } from "@/lib/firebase";

type PlanType = "free" | "plus" | "pro";

interface UserPlan {
  type: PlanType;
  rewritesLimit: number;
  generationsLimit: number;
  wordLimit: number;
  availableStyles: number;
  advancedOptionsEnabled: boolean;
  downloadFormats: string[];
  historyDays: number | "unlimited";
}

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  userPlan: UserPlan;
  remainingRewrites: number;
  remainingGenerations: number;
  decrementRewrites: () => void;
  decrementGenerations: () => void;
  resetUsage: () => void;
  changePlan: (planType: PlanType) => void;
}

const plans: Record<PlanType, UserPlan> = {
  free: {
    type: "free",
    rewritesLimit: 5,
    generationsLimit: 3,
    wordLimit: 500,
    availableStyles: 5,
    advancedOptionsEnabled: false,
    downloadFormats: ["txt"],
    historyDays: 7
  },
  plus: {
    type: "plus",
    rewritesLimit: 20,
    generationsLimit: 10,
    wordLimit: 1000,
    availableStyles: 6,
    advancedOptionsEnabled: true,
    downloadFormats: ["txt", "docx"],
    historyDays: 30
  },
  pro: {
    type: "pro",
    rewritesLimit: Infinity,
    generationsLimit: Infinity,
    wordLimit: Infinity,
    availableStyles: 10,
    advancedOptionsEnabled: true,
    downloadFormats: ["txt", "docx", "pdf", "html"],
    historyDays: "unlimited"
  }
};

const STORAGE_KEY_REWRITES = "texto-maestro-remaining-rewrites";
const STORAGE_KEY_GENERATIONS = "texto-maestro-remaining-generations";
const STORAGE_KEY_RESET_DATE = "texto-maestro-last-reset";

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isLoading: true,
  userPlan: plans.free,
  remainingRewrites: plans.free.rewritesLimit,
  remainingGenerations: plans.free.generationsLimit,
  decrementRewrites: () => {},
  decrementGenerations: () => {},
  resetUsage: () => {},
  changePlan: () => {}
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<UserPlan>(plans.free);
  const [remainingRewrites, setRemainingRewrites] = useState(plans.free.rewritesLimit);
  const [remainingGenerations, setRemainingGenerations] = useState(plans.free.generationsLimit);

  // Função para verificar se devemos resetar o uso diário
  const checkAndResetDailyUsage = () => {
    if (typeof window === 'undefined') return;
    
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem(STORAGE_KEY_RESET_DATE);
    
    if (!lastReset || lastReset !== today) {
      console.log('Resetando contadores de uso diário');
      localStorage.setItem(STORAGE_KEY_RESET_DATE, today);
      setRemainingRewrites(userPlan.rewritesLimit);
      setRemainingGenerations(userPlan.generationsLimit);
      localStorage.setItem(STORAGE_KEY_REWRITES, userPlan.rewritesLimit.toString());
      localStorage.setItem(STORAGE_KEY_GENERATIONS, userPlan.generationsLimit.toString());
    }
  };

  useEffect(() => {
    const unsubscribe = firebaseAuthChanged(async (currentUser) => {
      setUser(currentUser);
      
      // Verificar o plano no Firestore se o usuário estiver logado
      let userPlanType: PlanType = "free";
      
      if (currentUser) {
        try {
          // Tentar obter o plano do Firestore
          const firebasePlanType = await getUserPlan(currentUser.uid);
          
          if (firebasePlanType && (firebasePlanType === "free" || firebasePlanType === "plus" || firebasePlanType === "pro")) {
            userPlanType = firebasePlanType;
            console.log(`Plano carregado do Firebase: ${firebasePlanType}`);
            
            // Atualizar o localStorage com o plano do Firebase
            localStorage.setItem("texto-maestro-user-plan", userPlanType);
          } else {
            // Se o plano não existir no Firestore, tente pegar do localStorage
            const savedPlanType = localStorage.getItem("texto-maestro-user-plan") as PlanType;
            if (savedPlanType && (savedPlanType === "free" || savedPlanType === "plus" || savedPlanType === "pro")) {
              userPlanType = savedPlanType;
              // Atualize o Firestore com o plano do localStorage
              await updateUserPlan(currentUser.uid, userPlanType);
              console.log(`Plano atualizado no Firebase a partir do localStorage: ${userPlanType}`);
            } else {
              // Se nenhum plano for encontrado, use o padrão "free"
              userPlanType = "free";
              // Tente criar o documento do usuário com o plano padrão
              await updateUserPlan(currentUser.uid, userPlanType);
              console.log(`Novo usuário criado no Firestore com plano: ${userPlanType}`);
            }
          }
        } catch (error) {
          console.error('Erro ao buscar/atualizar plano do Firestore:', error);
          
          // Verificar se há um plano salvo no localStorage como fallback
          const savedPlanType = localStorage.getItem("texto-maestro-user-plan") as PlanType;
          if (savedPlanType && (savedPlanType === "free" || savedPlanType === "plus" || savedPlanType === "pro")) {
            userPlanType = savedPlanType;
            console.log(`Usando plano do localStorage como fallback: ${savedPlanType}`);
          }
        }
      } else {
        // Se não estiver logado, remover o plano do localStorage
        localStorage.removeItem("texto-maestro-user-plan");
      }
      
      setUserPlan(plans[userPlanType]);
      setIsLoading(false);

      // Carrega o número restante de reescritas/gerações do localStorage
      if (typeof window !== 'undefined') {
        const today = new Date().toDateString();
        const lastReset = localStorage.getItem(STORAGE_KEY_RESET_DATE);
        
        // Se a data de hoje for diferente da última data de reset (ou se não houver data de reset),
        // reseta os contadores
        if (!lastReset || lastReset !== today) {
          console.log('Primeiro login do dia: resetando contadores');
          localStorage.setItem(STORAGE_KEY_RESET_DATE, today);
          setRemainingRewrites(plans[userPlanType].rewritesLimit);
          setRemainingGenerations(plans[userPlanType].generationsLimit);
          localStorage.setItem(STORAGE_KEY_REWRITES, plans[userPlanType].rewritesLimit.toString());
          localStorage.setItem(STORAGE_KEY_GENERATIONS, plans[userPlanType].generationsLimit.toString());
        } else {
          // Caso contrário, carrega os valores salvos
          const savedRewrites = localStorage.getItem(STORAGE_KEY_REWRITES);
          const savedGenerations = localStorage.getItem(STORAGE_KEY_GENERATIONS);
          
          if (savedRewrites) {
            setRemainingRewrites(parseInt(savedRewrites));
          } else {
            setRemainingRewrites(plans[userPlanType].rewritesLimit);
          }
          
          if (savedGenerations) {
            setRemainingGenerations(parseInt(savedGenerations));
          } else {
            setRemainingGenerations(plans[userPlanType].generationsLimit);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Verifica o reset de contadores diariamente
  useEffect(() => {
    // Verifica imediatamente quando o componente monta
    checkAndResetDailyUsage();
    
    // Configura um intervalo para verificar periodicamente
    const intervalId = setInterval(checkAndResetDailyUsage, 1000 * 60 * 10); // Verifica a cada 10 minutos
    
    return () => clearInterval(intervalId);
  }, [userPlan]);

  // Função para decrementar reescritas
  const decrementRewrites = () => {
    if (remainingRewrites > 0) {
      const newValue = remainingRewrites - 1;
      setRemainingRewrites(newValue);
      localStorage.setItem(STORAGE_KEY_REWRITES, newValue.toString());
    }
  };

  // Função para decrementar gerações
  const decrementGenerations = () => {
    if (remainingGenerations > 0) {
      const newValue = remainingGenerations - 1;
      setRemainingGenerations(newValue);
      localStorage.setItem(STORAGE_KEY_GENERATIONS, newValue.toString());
    }
  };

  // Função para resetar contadores
  const resetUsage = () => {
    setRemainingRewrites(userPlan.rewritesLimit);
    setRemainingGenerations(userPlan.generationsLimit);
    localStorage.setItem(STORAGE_KEY_REWRITES, userPlan.rewritesLimit.toString());
    localStorage.setItem(STORAGE_KEY_GENERATIONS, userPlan.generationsLimit.toString());
    localStorage.setItem(STORAGE_KEY_RESET_DATE, new Date().toDateString());
  };

  // Função para mudar temporariamente o plano do usuário
  const changePlan = async (planType: PlanType) => {
    // Verificar se é um tipo de plano válido
    if (!plans[planType]) {
      console.error(`Tipo de plano inválido: ${planType}`);
      return false;
    }
    
    console.log(`Iniciando mudança de plano para: ${planType}`);
    
    // Atualizar o plano do usuário no Firestore, se o usuário estiver logado
    let firebaseUpdated = false;
    if (user) {
      try {
        console.log(`Tentando atualizar plano no Firebase para o usuário: ${user.uid}`);
        firebaseUpdated = await updateUserPlan(user.uid, planType);
        
        if (!firebaseUpdated) {
          console.error("Falha ao atualizar plano no Firebase");
        }
      } catch (error) {
        console.error('Erro ao atualizar plano no Firebase:', error);
      }
    } else {
      console.warn("Nenhum usuário logado ao tentar mudar o plano");
    }
    
    // Atualizar o plano do usuário no estado local
    setUserPlan(plans[planType]);
    console.log(`Estado local do plano atualizado para: ${planType}`);
    
    // Atualizar os limites com base no novo plano
    setRemainingRewrites(plans[planType].rewritesLimit);
    setRemainingGenerations(plans[planType].generationsLimit);
    
    // Salvar no localStorage
    localStorage.setItem("texto-maestro-user-plan", planType);
    localStorage.setItem(STORAGE_KEY_REWRITES, plans[planType].rewritesLimit.toString());
    localStorage.setItem(STORAGE_KEY_GENERATIONS, plans[planType].generationsLimit.toString());
    console.log(`Plano e limites salvos no localStorage: ${planType}`);
    
    // Feedback de console para depuração
    console.log(`Plano alterado para: ${planType}${firebaseUpdated ? ' (atualizado no Firebase)' : ' (apenas localStorage)'}`);
    
    return true;
  };

  const value = {
    user,
    isLoading,
    userPlan,
    remainingRewrites,
    remainingGenerations,
    decrementRewrites,
    decrementGenerations,
    resetUsage,
    changePlan
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 