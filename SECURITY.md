# 🔐 SECURITY.md — Plano de Blindagem, Isolamento Multi-Tenant e Conformidade OWASP do BookGrid

> **Produto:** **BookGrid** (`bookgrid.app/[slug]`)  
> **Empresa:** **GilByte Solutions**  
> **Padrão de Segurança:** OWASP Top 10 (2021/2025) + OWASP Top 10 for LLM Applications  
> **Moedas Auditadas:** Exclusivamente **USD ($)** e **EUR (€)** via **Paddle / Dodo Payments ➔ Payoneer**

---

## 1. Isolamento Multi-Tenant Estrito no Supabase (Row Level Security — RLS)

Para impedir qualquer vulnerabilidade de **Broken Access Control (OWASP A01)** ou vazamento cruzado entre lojistas (*Cross-Tenant Data Leakage*), o banco de dados PostgreSQL no Supabase aplica políticas distintas para o público anônimo (`anon`) e para o lojista autenticado (`authenticated`):

### 1.1. Função Auxiliar de Propriedade do Tenant (`SECURITY DEFINER`)
```sql
CREATE OR REPLACE FUNCTION public.is_tenant_owner(check_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE t.id = check_tenant_id
      AND t.owner_id = auth.uid()
  );
$$;
```

### 1.2. Matriz de Políticas RLS por Tabela

| Tabela | Operação | Papel (`Role`) | Condição Estrita da Política RLS (`USING` / `WITH CHECK`) |
| :--- | :--- | :--- | :--- |
| **`tenants`** | `SELECT` | `anon`, `authenticated` | `subscription_status IN ('trial', 'active')` *(Exibe dados públicos da vitrine por `slug`)* |
| **`tenants`** | `UPDATE`, `DELETE` | `authenticated` | `owner_id = auth.uid()` *(Apenas o próprio dono altera sua loja)* |
| **`staff_members`** | `SELECT` | `anon`, `authenticated` | `active = true` |
| **`staff_members`** | `INSERT`, `UPDATE`, `DELETE` | `authenticated` | `public.is_tenant_owner(tenant_id)` **E** trava de no máximo 5 membros ativos |
| **`services`** | `SELECT` | `anon`, `authenticated` | `active = true` *(Preços exclusivos em `price_usd` e `price_eur`)* |
| **`services`** | `INSERT`, `UPDATE`, `DELETE` | `authenticated` | `public.is_tenant_owner(tenant_id)` |
| **`bookings`** | `INSERT` | `anon`, `authenticated` | Permitido apenas se o `tenant_id` estiver ativo e `status = 'confirmed'` |
| **`bookings`** | `SELECT`, `UPDATE`, `DELETE` | `authenticated` | `public.is_tenant_owner(tenant_id)` *(Visitantes anônimos NUNCA podem listar a tabela `bookings`!)* |
| **`waitlist_entries`** | `INSERT` | `anon`, `authenticated` | Permitido para tenants ativos com `status = 'waiting'` |
| **`waitlist_entries`** | `SELECT`, `UPDATE`, `DELETE` | `authenticated` | `public.is_tenant_owner(tenant_id)` *(Visitantes anônimos NUNCA podem ler a lista de espera!)* |
| **`ai_import_logs`** | `ALL` | `authenticated` | `public.is_tenant_owner(tenant_id)` |
| **`payment_webhook_events`** | `ALL` | `service_role` | `false` para `anon`/`authenticated`; acessível exclusivamente via Service Role no Webhook |

> [!CAUTION]
> **Proteção de PII (Dados Pessoais de Clientes):** Visitantes anônimos em `bookgrid.app/[slug]` **NÃO** possuem permissão `SELECT` direta na tabela `bookings` (o que exporia nomes e telefones de outros clientes). A consulta de horários ocupados é feita por uma RPC/View pública que retorna **apenas** os intervalos de tempo bloqueados (`booking_date`, `booking_time`, `total_duration_minutes`, `staff_id`), sem nenhum nome ou telefone!

---

## 2. Validação Zero-Trust com Zod (Servidor & IA)

Nenhum payload entra no sistema sem passar pelos schemas em `src/schemas/` com `.strict()` ativado:

1. **Parâmetro de Rota `[slug]` (`TenantSlugSchema`):**
   - Regex estrita: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, comprimento entre 3 e 60 caracteres. Bloqueia Path Traversal, SQL Injection e XSS na URL.
2. **Criação de Reserva Multi-Serviços (`CreateBookingSchema`):**
   - `serviceIds`: `z.array(z.string().uuid()).min(1).max(10)`
   - `currency`: `z.enum(['USD', 'EUR'])` *(Rejeita qualquer outra moeda)*
   - `clientName`: `z.string().trim().min(2).max(80).regex(/^[^<>]*$/)`
   - `clientPhone`: `z.string().trim().regex(/^\+?[1-9]\d{6,14}$/)`
   - `bookingDate`: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`
   - `bookingTime`: `z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)`
   - **Recálculo Server-Side:** O servidor ignora qualquer preço ou duração enviados pelo navegador e recalcula `total_duration_minutes`, `total_price_usd` e `total_price_eur` consultando a tabela `services` no Supabase.
3. **Saída do Importador de IA (`AIImportedBookingArraySchema`):**
   - O texto bruto do WhatsApp ou OCR passa por delimitadores `<untrusted_schedule_input>` e o retorno do LLM é validado item a item pelo `Zod` antes de ir para a tela de confirmação do lojista.

---

## 3. Segurança de Pagamentos & Webhooks (Paddle / Dodo Payments ➔ Payoneer)

Para proteger o fluxo financeiro em **USD ($29/mês)** e **EUR (25€/mês)** contra falsificação de assinatura (*Webhook Spoofing*):

1. **Leitura do Raw Body:** O Route Handler `src/app/api/webhooks/payments/route.ts` lê o corpo bruto (`const rawBody = await request.text()`).
2. **Verificação Criptográfica HMAC-SHA256:**
   - Extrai o cabeçalho oficial (`Paddle-Signature` formato `ts=...;h1=...` ou `webhook-signature` do Dodo Payments).
   - Recalcula o HMAC-SHA256 usando `PADDLE_WEBHOOK_SECRET` / `DODO_WEBHOOK_SECRET` sobre `${timestamp}:${rawBody}`.
   - Compara os hashes com `crypto.timingSafeEqual(Buffer.from(computedHex), Buffer.from(receivedHex))` para evitar *Timing Attacks*.
3. **Prevenção contra Replay Attacks & Idempotência:**
   - Rejeita qualquer evento cujo `ts` (timestamp) tenha diferença superior a **300 segundos (5 minutos)** do relógio do servidor.
   - Verifica e grava o `event_id` único na tabela `payment_webhook_events` (`PRIMARY KEY (event_id)`). Se o `event_id` já existir, retorna `200 OK` sem reprocessar.

---

## 4. Proteção de Credenciais e Anti-Abuso (Rate Limiting)

### 4.1. Rate Limiting na Página Pública `bookgrid.app/[slug]`
Para impedir ataques de negação de serviço ou *Booking Spam* (bots preenchendo todos os horários da agenda de um lojista):
- **Limite por IP + Fingerprint:** Máximo de **5 criações de agendamento ou entradas na lista de espera por IP a cada 15 minutos**.
- **Trava de Concorrência no Banco:** Índice único parcial em `bookings (tenant_id, staff_id, booking_date, booking_time) WHERE status IN ('confirmed', 'recovered_from_waitlist')`, impedindo *Double-Booking* por condição de corrida (*Race Condition*).

### 4.2. Isolamento de Variáveis de Ambiente
- O arquivo `.env.example` documenta todas as chaves necessárias sem conter valores reais.
- O arquivo `.gitignore` bloqueia `.env`, `.env.local`, `.env.*.local`, chaves `.pem`/`.key` e diretórios de build.
