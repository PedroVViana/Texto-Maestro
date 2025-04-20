import "@/app/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { UserRibbon } from "@/components/Auth/UserRibbon";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Texto Maestro | IA para textos",
  description: "Transforme e crie textos incríveis com inteligência artificial. Reescritas, criação e otimização de conteúdo.",
  icons: [
    {
      rel: "icon",
      url: "/favicon.svg",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <main>
            {children}
          </main>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
