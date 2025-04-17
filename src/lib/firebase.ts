// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";

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
const googleProvider = new GoogleAuthProvider();

// Função para autenticação com Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Erro na autenticação com Google:", error);
    throw error;
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

export { auth }; 