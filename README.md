# Texto Maestro

![Texto Maestro Logo](public/favicon.svg)

## Sobre o Projeto

Texto Maestro é uma aplicação web moderna que utiliza inteligência artificial para transformar, aprimorar e reescrever textos em português. Com uma interface intuitiva e elegante, esta ferramenta permite que usuários aprimorem seus textos de forma rápida e eficiente, seja para correção gramatical, formalização, simplificação, persuasão ou otimização para redes sociais.

O diferencial do Texto Maestro é a capacidade de manter um histórico completo de todas as versões geradas, permitindo comparações e acesso contínuo a versões anteriores. Além disso, a aplicação foi projetada com foco em uma experiência de usuário fluida tanto em dispositivos móveis quanto em desktops.

## Demonstração

A aplicação está disponível para uso em: [https://texto-maestro.vercel.app](https://texto-maestro.vercel.app)

## Funcionalidades

- **Múltiplos estilos de reescrita**:
  - Correção gramatical
  - Reescrita formal
  - Reescrita simplificada
  - Reescrita persuasiva
  - Otimização para redes sociais

- **Gerenciamento de Versões**:
  - Histórico completo de textos gerados
  - Visualização rápida do texto original
  - Registro de data/hora de cada versão

- **Utilidades**:
  - Cópia direta para a área de transferência
  - Download de textos em formato .txt
  - Interface responsiva para todos os dispositivos

## Tecnologias Utilizadas

### Frontend
- **React 18**: Biblioteca JavaScript para construção de interfaces
- **Next.js 15**: Framework React com renderização híbrida
- **TailwindCSS**: Framework CSS utilitário para estilização
- **Shadcn UI**: Componentes de UI reutilizáveis e acessíveis
- **Lucide Icons**: Pacote de ícones leves e consistentes
- **TypeScript**: Superset tipado de JavaScript

### Inteligência Artificial
- **Google AI (Gemini)**: API de inteligência artificial para processamento de linguagem natural
- **GenKit**: Biblioteca para criação de fluxos de trabalho com IA

### Estilização e UX
- **TailwindCSS Animate**: Extensão para animações fluidas
- **CVA (class-variance-authority)**: Gerenciamento de variantes de componentes
- **clsx/tailwind-merge**: Utilitários para composição de classes CSS

### Ferramentas de Desenvolvimento
- **TurboRepo**: Ferramenta para desenvolvimento acelerado
- **ESLint**: Ferramenta de análise estática para identificar padrões problemáticos
- **TypeScript**: Verificação de tipos estáticos

## Arquitetura

O projeto segue uma arquitetura moderna baseada em componentes React com Next.js, utilizando:

- **Server Components/Actions**: Para operações do lado do servidor
- **API Routes**: Para comunicação com serviços externos
- **Fluxos de IA**: Abstrações para simplificar o uso de IA

## Como Iniciar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em [http://localhost:9002](http://localhost:9002)

## Variáveis de Ambiente

Para executar este projeto, você precisará adicionar as seguintes variáveis de ambiente ao seu arquivo `.env`:

```
GOOGLE_GENAI_API_KEY=sua_chave_api_do_google_ai
```

## Deploy

Para fazer deploy da aplicação, consulte o arquivo [DEPLOY.md](DEPLOY.md) com instruções completas para deploy na Vercel.

## Autor

Desenvolvido por [Pedro Van-lume](https://pedrovviana.github.io/portfolio-PedroVanlume/)

## Licença

Este projeto está licenciado sob a licença MIT - consulte o arquivo LICENSE para mais detalhes.
