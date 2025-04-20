// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDai5dKlEoiM-PneBsBgxOIz7V511P-57A",
  authDomain: "texto-maestro.firebaseapp.com",
  projectId: "texto-maestro",
  storageBucket: "texto-maestro.appspot.com",
  messagingSenderId: "585742848549",
  appId: "1:585742848549:web:fb6de6c3bf712d169ee5cc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Função para autenticação com Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Adicionar o usuário ao Firestore se for primeira vez
    await createUserIfNotExists(result.user);
    
    return result.user;
  } catch (error) {
    console.error("Erro na autenticação com Google:", error);
    throw error;
  }
};

// Função para criar usuário no Firestore caso não exista
export const createUserIfNotExists = async (user: User) => {
  if (!user) return;
  
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    try {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        planType: "free", // Plano padrão
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("Usuário criado no Firestore");
    } catch (error) {
      console.error("Erro ao criar usuário no Firestore:", error);
    }
  } else {
    // Atualizar último login
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
    });
  }
};

// Função para atualizar o plano do usuário no Firestore
export const updateUserPlan = async (userId: string, planType: "free" | "plus" | "pro") => {
  if (!userId) {
    console.error("ID de usuário não fornecido");
    return false;
  }
  
  try {
    const userRef = doc(db, "users", userId);
    
    // Verificar se o documento existe
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      // Documento existe, atualize-o
      await updateDoc(userRef, {
        planType,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Documento não existe, crie-o
      await setDoc(userRef, {
        uid: userId,
        planType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Adicione outros campos padrão se necessário
        email: auth.currentUser?.email || null,
        displayName: auth.currentUser?.displayName || null,
        photoURL: auth.currentUser?.photoURL || null,
      });
    }
    
    console.log(`Plano do usuário atualizado para ${planType} no Firestore`);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar plano do usuário:", error);
    return false;
  }
};

// Função para obter o plano do usuário do Firestore
export const getUserPlan = async (userId: string) => {
  if (!userId) {
    console.error("getUserPlan: ID de usuário não fornecido");
    return null;
  }
  
  try {
    console.log(`getUserPlan: Buscando plano para usuário ${userId}`);
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log(`getUserPlan: Documento encontrado, dados:`, userData);
      return userData.planType || "free";
    }
    
    console.log(`getUserPlan: Documento não encontrado para usuário ${userId}`);
    return null; // Retorna null em vez de "free" para indicar que o documento não existe
  } catch (error) {
    console.error(`getUserPlan: Erro ao buscar plano do usuário ${userId}:`, error);
    return null; // Retorna null em caso de erro para melhor tratamento
  }
};

// Função para fazer logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    throw error;
  }
};

// Função que retorna o usuário atual
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Função para observar mudanças no estado de autenticação
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};

export { auth, db }; 