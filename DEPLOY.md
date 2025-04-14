# Guia de Deploy do Texto Maestro na Vercel

Este guia explica como fazer o deploy do projeto Texto Maestro na plataforma Vercel.

## Pré-requisitos

1. Uma conta na [Vercel](https://vercel.com)
2. Uma chave de API do Google AI/Gemini

## Passos para Deploy

### 1. Prepare seu repositório

Certifique-se de que seu código está em um repositório Git (GitHub, GitLab ou Bitbucket).

### 2. Acesse a Vercel

- Faça login na sua conta Vercel em [vercel.com](https://vercel.com)
- Clique em "Add New" e selecione "Project"

### 3. Importe o Repositório

- Selecione o repositório onde você armazenou o projeto Texto Maestro
- A Vercel detectará automaticamente que é um projeto Next.js

### 4. Configure Variáveis de Ambiente

Você precisará adicionar a seguinte variável de ambiente:

- Nome: `GOOGLE_GENAI_API_KEY`
- Valor: Sua chave de API do Google AI/Gemini

Para adicionar esta variável:
1. Na tela de configuração do projeto, expanda a seção "Environment Variables"
2. Adicione a variável acima
3. **IMPORTANTE**: Mantenha esta chave em segredo, nunca a compartilhe publicamente

### 5. Configurações de Build

As configurações já estão pré-configuradas no arquivo `vercel.json`:

- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 6. Faça o Deploy

- Clique em "Deploy"
- A Vercel irá construir e fazer o deploy do seu projeto
- Ao término, você receberá um URL onde o aplicativo está disponível

### 7. Domínio Personalizado (Opcional)

Para adicionar um domínio personalizado:
1. Acesse as configurações do projeto
2. Vá para a aba "Domains"
3. Adicione seu domínio personalizado
4. Siga as instruções da Vercel para configurar os registros DNS

## Solução de Problemas

- **Erro nas chamadas de API**: Verifique se a variável de ambiente `GOOGLE_GENAI_API_KEY` está corretamente configurada
- **Erro de build**: Consulte os logs de build na interface da Vercel para identificar o problema
- **Problemas com favicon**: Certifique-se de que os arquivos na pasta `public` estão sendo corretamente enviados

## Atualizações

Para atualizar seu aplicativo:
1. Faça push das mudanças para o repositório
2. A Vercel detectará automaticamente as mudanças e fará um novo deploy
3. Você pode verificar o status do deploy no painel da Vercel 