# 🛡️ AGENTS.md — Constituição Oficial de Engenharia & Segurança do BookGrid

> **STATUS:** LEI OBRIGATÓRIA DO REPOSITÓRIO  
> **PRODUTO OFICIAL:** **BookGrid** (`bookgrid.app/[slug]`)  
> **EMPRESA:** **GilByte Solutions**  
> **ESCOPO DE MOEDAS:** Exclusivamente **USD ($)** e **EUR (€)** via **Paddle / Dodo Payments ➔ Payoneer** (PROIBIDO o uso de moedas locais como `CVE` ou referências a nomes antigos de protótipos).

Qualquer Agente de IA (Cursor, Antigravity, Claude Code, Copilot) ou engenheiro que interaja com este repositório **DEVE** cumprir integralmente as diretrizes abaixo antes de propor, criar ou alterar qualquer arquivo.

---

## 📜 1. Fontes Oficiais de Governança Instaladas
Este repositório incorpora e aplica as regras de:
1. [`.agent/rules/01-nextjs15-supabase-clean-arch.mdc`](file:///c:/Users/Uni-CvFCT-EdmilsonGi/Documents/projectoD/PRojectosEbooks%20AMAZOM/BookGrid/.agent/rules/01-nextjs15-supabase-clean-arch.mdc) *(Baseado em `PatrickJS/awesome-cursorrules` — Next.js 15 App Router, Supabase SSR, TypeScript Strict & Clean Architecture)*.
2. [`.agent/rules/02-owasp-security-guardrails.mdc`](file:///c:/Users/Uni-CvFCT-EdmilsonGi/Documents/projectoD/PRojectosEbooks%20AMAZOM/BookGrid/.agent/rules/02-owasp-security-guardrails.mdc) *(Baseado em `matank001/cursor-security-rules` & `ZenVeilHq/ai-security-guardrails` — OWASP Top 10 Web, OWASP Top 10 LLM, Zero-Trust Zod & Prevenção de Vazamento de Credenciais)*.

---

## 🏗️ 2. Leis de Arquitetura e Stack (Next.js 15 + Supabase + TypeScript Strict)

1. **Identidade Única do Produto:**
   - O sistema chama-se exclusivamente **BookGrid** (`bookgrid.app/[slug]`).
   - Jamais utilize nomes antigos ou referências a `CVE` / `vinti4`.
   - Toda precificação, planos de assinatura e serviços operam 100% em **`USD ($)`** e **`EUR (€)`**.
2. **TypeScript Strict Mode:**
   - É estritamente proibido o uso de `any`, `@ts-ignore` ou asserções inseguras (`as unknown as T`).
   - Todo contrato de entrada/saída deve derivar de um schema `Zod` (`type Payload = z.infer<typeof PayloadSchema>`).
3. **Next.js 15 App Router & RSC:**
   - Componentes são **React Server Components (RSC)** por padrão.
   - Adicione `'use client'` apenas nas folhas da árvore de componentes onde houver estado ou eventos de navegador.
   - Em Next.js 15, `params`, `searchParams`, `cookies()` e `headers()` são **Promises assíncronas** e devem sempre receber `await`.
4. **Separação Estrita de Camadas (Clean Architecture):**
   - `src/app/(public)/[slug]` ➔ Vitrine pública de agendamento (`bookgrid.app/[slug]`), sem expor dados sensíveis do tenant.
   - `src/app/(dashboard)` ➔ Painel autenticado do dono do negócio, protegido por Middleware e verificação `supabase.auth.getUser()`.
   - `src/app/api/webhooks/payments` ➔ Endpoint isolado para webhooks assinados do Paddle / Dodo Payments.
   - `src/schemas/` ➔ Schemas `Zod` compartilhados e validados no servidor.
   - `src/services/` ➔ Motores de regras de negócio puros (Disponibilidade Multi-Serviços, Lista de Espera Inteligente, Sanitização do Importador IA).
   - `src/lib/supabase/` ➔ Clientes `@supabase/ssr` separados por contexto (`server.ts`, `client.ts`, `admin.ts` com `import 'server-only'`).

---

## 🔒 3. Leis Inegociáveis de Cibersegurança (OWASP Top 10 & LLM Guardrails)

1. **Autenticação Server-Side Segura:**
   - Nunca utilize `supabase.auth.getSession()` no servidor para controle de acesso. Utilize **obrigatoriamente** `const { data: { user }, error } = await supabase.auth.getUser()`.
2. **Isolamento Multi-Tenant Absoluto (RLS):**
   - Nenhuma tabela pode existir no schema `public` sem `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
   - Toda mutação do lojista deve validar `tenant.owner_id = auth.uid()` tanto na política RLS do PostgreSQL quanto na camada de serviço.
3. **Validação Zero-Trust com Zod:**
   - Nenhum dado vindo do cliente (`request.json()`, `FormData`, `searchParams`, `[slug]`) ou de modelos de IA pode tocar o banco de dados sem antes passar por `Schema.safeParse()` no servidor com `.strict()`.
4. **Blindagem de Segredos:**
   - Chaves privadas (`SUPABASE_SERVICE_ROLE_KEY`, `PADDLE_WEBHOOK_SECRET`, `DODO_WEBHOOK_SECRET`, `AI_API_KEY`) jamais podem ser escritas no código-fonte ou prefixadas com `NEXT_PUBLIC_`.
5. **Segurança de Webhooks Financeiros (Paddle / Dodo ➔ Payoneer):**
   - O webhook de pagamentos deve validar a assinatura criptográfica HMAC-SHA256 sobre o *raw body* (`await req.text()`) usando `crypto.timingSafeEqual`, rejeitar timestamps com mais de 5 minutos de atraso e registrar o `event_id` para garantir idempotência.
6. **Guardrails do Importador de IA (OWASP LLM01 / LLM02):**
   - Todo texto do WhatsApp ou OCR de foto de agenda enviado pelo usuário deve ser encapsulado em delimitadores de dados não confiáveis (`<untrusted_schedule_input>`) contra *Prompt Injection*, e a saída da IA deve ser forçada em JSON estrito validado por `Zod` antes de qualquer inserção no banco.
