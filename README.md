# ConverExcelToSwift - Excel to SWIFT Converter

**Sistema web para conversão de movimentações Excel → SWIFT 100% no Frontend**

## 📋 Visão Geral

ConverExcelToSwift é uma aplicação web moderna que permite converter dados de movimentação financeira de arquivos Excel para formato SWIFT, com toda a lógica de processamento executada no navegador (client-side).

O sistema oferece:
- ✅ **Conversão 100% no Frontend** - Nenhum dado sensível é enviado para o servidor
- ✅ **Parsing Robusto** - Detecção automática de colunas, suporte a múltiplos formatos de data e separadores numéricos
- ✅ **Mapeamento Flexível** - Regras de mapeamento (exact, startsWith, regex) com prioridade configurável
- ✅ **Modo Offline** - Funciona sem conexão com servidor usando dados de exemplo (seed)
- ✅ **Heurísticas Inteligentes** - Detecção automática de cabeçalhos e sugestão de mapeamento de colunas
- ✅ **Testes Unitários** - Cobertura completa de parsing, mapeamento e geração SWIFT

---

## 🏗️ Arquitetura

### Fluxo de Conversão

```
┌─────────────────────────────────────────┐
│ 1. Upload Excel                         │
│    - Seleciona arquivo                  │
│    - Detecta sheets                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. Header Detection                     │
│    - Heurística: % strings, keywords    │
│    - Toggle: Com ou sem header          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. Column Mapping                       │
│    - Manual selection ou auto-detect    │
│    - Visualization dos dados (primeiras │
│      linhas)                            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. Data Parsing                         │
│    - parseDate(fmt): 'dd/MM/yyyy', etc  │
│    - parseNumber(sep): '1.000,50'       │
│    - Validação de regras (D/C, etc)    │
│    - Logging de erros por linha        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 5. Preview & Validation                 │
│    - Tabela dos movimentos válidos      │
│    - Log dos erros de parsing          │
│    - Confirmação do usuário            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 6. Account Mapping & SWIFT Generation   │
│    - Busca targetAccount por priority  │
│    - Aplica sign rules (C / B view)    │
│    - Normaliza números e datas        │
│    - Gera arquivo SWIFT                │
└──────────────┬──────────────────────────┘
               │
               ▼
        ✅ Download
```

### Stack Tecnológico

| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| React | 18.3.1 | UI Framework |
| TypeScript | 5.8.3 | Type Safety |
| Vite | 5.4.19 | Build Tool |
| Tailwind CSS | 3.4.17 | Styling |
| shadcn-ui | Latest | Component Library |
| React Query | 5.83.0 | Data Fetching |
| React Hook Form | 7.61.1 | Form Management |
| date-fns | 3.6.0 | Date Parsing |
| xlsx | 0.18.5 | Excel Parsing |
| axios | 1.6.2 | HTTP Client |
| Vitest | 3.2.4 | Unit Testing |

---

## 📦 Domain Models

### Movement
```typescript
interface Movement {
  date: string;           // ISO format ou format customizado
  numMov: string;         // Identificador da movimentação
  natureza: 'D' | 'C';    // Débito ou Crédito
  obs: string;            // Observação/Descrição
  valor: number;          // Valor numérico
  sourceAccount?: string; // Conta de origem (opcional)
}
```

### Parameters
```typescript
interface Parameters {
  companyId: string;
  companyName: string;
  dateFormat: string;           // 'dd/MM/yyyy', 'yyyy-MM-dd', etc
  decimalSeparator: string;     // ',' ou '.'
  thousandSeparator: string;    // '.' ou ','
  currency: string;             // 'EUR', 'USD', etc
  includeHeaderInSwift: boolean;
  rounding: number;             // Casa decimais (2, 3, 4...)
  invertSignOnBankView: boolean;
  viewDefault: 'C' | 'B';       // Visão por defeito
  defaultTargetAccount?: string;
}
```

### Mapping (mapeamento de contas)
```typescript
interface Mapping {
  id: string;
  companyId: string;
  sourceAccount: string;     // Padrão a comparar
  targetAccount: string;     // Conta destino
  description?: string;
  active: boolean;
  priority: number;          // Prioridade (0 = máxima)
  matchType: 'exact' | 'startsWith' | 'regex';
}
```

### ColumnMapping (configuração de colunas do Excel)
```typescript
interface ColumnMapping {
  companyId: string;
  sheetName: string;
  hasHeader: boolean;
  fields: {
    date: string;           // Ref coluna: 'Col_A', 'Col_B'...
    numMov: string;
    natureza: string;
    obs: string;
    valor: string;
    sourceAccount?: string;
  };
}
```

---

## 🚀 Início Rápido
> **Nota:** o sistema não possui backend de autenticação. Qualquer
> utilizador/senha válidos serão aceitos e você entrará no modo offline automático.
> Dados como parâmetros e mapeamentos são carregados dos valores de "seed".

### Instalação

```bash
# Clone o repositório
git clone https://github.com/ercabsalias/Conversor-Excel-to-SWIFT.git
cd ConversorExcelToSwift

# Instale dependências
npm install

# Inicie em modo desenvolvimento
npm run dev
```

### Build para Produção

```bash
npm run build
npm run preview
```

### Testes

```bash
# Rodar todos os testes uma vez
npm test

# Rodar em modo watch
npm test:watch
```

---

## 📖 Guia de Uso

### 1️⃣ Upload de Excel

1. Clique em "Selecionar Arquivo" ou arraste um arquivo Excel
2. Se múltiplas sheets: selecione a desejada
3. Clique em "Continuar para Mapeamento"

### 2️⃣ Detecção de Header

- O sistema detecta automaticamente a linha de cabeçalho via heurística
- Pode togglá-lo manualmente se necessário
- Mostre/oculte via checkbox

### 3️⃣ Mapeamento de Colunas

1. O sistema sugere automaticamente as colunas:
   - **Data**: Busca formatos de data (dd/MM/yyyy, yyyy-MM-dd)
   - **D/C**: Procura por valores 'D', 'C', 'Débito', 'Crédito'
   - **Valor**: Detecta colunas numéricas
   - **Conta Origem**: Padrões de conta (6+ algarismos)

2. Ajuste manualmente via dropdowns se necessário
3. Clique "Aplicar Mapeamento e Previsualizar"

### 4️⃣ Prévia & Validação

- Tabela com primeiros 10 movimentos válidos
- Log detalhado de erros (linha, coluna, motivo)
- Download de relatório de erros (future)
- Confirme ou volta ao mapeamento

### 5️⃣ Configuração de Parâmetros

**Painel de Parâmetros:**
- Formatode Data: `dd/MM/yyyy`, `yyyy-MM-dd`, etc
- Separador Decimal: `,` ou `.`
- Separador Milhar: `.` ou `,`
- Casas Decimais
- Vista por Defeito: Empresa (C) ou Banco (B)

**Painel de Mapeamentos:**
- Visualizar todos os mapeamentos ativos
- Ativar/desativar
- Deletar
- Adicionar novo (future)

### 6️⃣ Geração SWIFT

1. Sistema mapeia conta origem → destino via regras (priority)
2. Aplica sign rules (C / B view) + sinal do valor
3. Normaliza números com separadores configurados
4. Gera arquivo: `SWIFT_<companyId>_<yyyyMMdd_HHmmss>.txt`

**Formato de saída:**
```
Data|NumMov|ContaDestino|Natureza|Valor|Obs
01/01/2024|001|TARGET001|D|1000,50|Descrição
01/01/2024|002|TARGET002|C|500,25|Outra desc
```

---

## 🧮 Referência de Funções

### Parsing Utilities (`lib/parsing.ts`)

#### `parseNumber(value, decimalSeparator, thousandSeparator)`
```typescript
parseNumber('1.000,50', ',', '.') // → 1000.5
parseNumber('1,000.50', '.', ',') // → 1000.5
```

#### `parseDate(value, format)`
```typescript
parseDate('01/01/2024', 'dd/MM/yyyy') // → Date
parseDate('2024-01-01', 'yyyy-MM-dd') // → Date
```

#### `detectHeaderRow(rows, maxRowsToCheck)`
- Retorna índice da linha de cabeçalho
- Usa heurística de keywords + % strings

#### `suggestColumnIndex(rows, fieldType)`
- Sugere índice de coluna para: `date`, `natureza`, `valor`, `sourceAccount`, `numMov`
- Análise de padrões (datas, D/C, números)

#### `autoDetectColumnMapping(rows, fieldNames)`
- Retorna mapeamento automático completo

#### `normalizeNumber(value, decimalSeparator, rounding)`
```typescript
normalizeNumber(1000.5, ',', 2) // → '1000,50'
```

### SWIFT Generation (`lib/swift.ts`)

#### `findTargetAccount(sourceAccount, mappings, defaultTargetAccount)`
- Busca por priority: exact → startsWith → regex
- Retorna targetAccount ou null

#### `determineSign(movement, parameters)`
- Retorna 'D' ou 'C' baseado em:
  - `viewDefault = 'C'`: usa natureza original
  - `viewDefault = 'B'`: usa sinal do valor ± inversão

#### `generateSwiftContent(movements, parameters, mappings)`
```typescript
{
  content: string,      // Conteúdo completo
  count: number         // Movimentos processados
}
```

#### `generateSwift(movements, parameters, mappings, options?)`
```typescript
{
  blob: Blob,           // Arquivo pronto
  filename: string      // Nome gerado
}
```

#### `downloadSwiftFile(blob, filename)`
- Dispara download no browser

---

## 🔌 Integração com Backend

### API Endpoints Esperados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/Users/Login` | Validaçãoutenticação |
| GET | `/api/parameters/{companyId}` | Carregar Parameters |
| PUT | `/api/parameters/{companyId}` | Atualizar Parameters |
| GET | `/api/mappings/{companyId}` | Listar Mappings |
| POST | `/api/mappings` | Criar Mapping |
| PUT | `/api/mappings/{id}` | Atualizar Mapping |
| DELETE | `/api/mappings/{id}` | Deletar Mapping |
| GET | `/api/column-mappings/{companyId}/{sheetName}` | Carregar ColumnMapping |
| POST | `/api/column-mappings` | Salvar ColumnMapping |

### Falback Offline

Se o backend estiver indisponível:
1. Sistema mostra banner: "Modo sem servidor"
2. Carrega seed data (SEED_PARAMETERS, SEED_MAPPINGS)
3. Persiste alterações em localStorage
4. Continua funcionando normalmente

---

## 💾 Persistência de Dados

### localStorage Keys

| Key | Descrição |
|-----|-----------|
| `auth_token` | Token JWT |
| `auth_userId` | User ID |
| `auth_companyId` | Company ID |
| `offline_mode` | Flag de modo offline |
| `seed_parameters` | Parameters em cache |
| `seed_mappings` | Mappings em cache |
| `column_mapping_{companyId}` | ColumnMapping por empresa |
| `current_column_mapping` | Mapeamento actual (sessão) |
| `parsed_movements` | Movimentos parseados (sessão) |

---

## 🧪 Testes

### Cobertura Atual

✓ **parsing.test.ts** (19 testes)
- parseNumber (6 casos)
- parseDate (4 casos)
- detectHeaderRow (2 casos)
- suggestColumnIndex (3 casos)
- normalizeNumber (4 casos)

✓ **swift.test.ts** (13 testes)
- findTargetAccount (5 casos)
- determineSign (3 casos)
- generateSwiftContent (3 casos)

```bash
npm test              # Rodar uma vez
npm test:watch       # Modo watch
```

---

## 🔐 Modo Seed / Offline

### Dados de Exemplo

**SEED_PARAMETERS:**
```typescript
{
  companyId: 'DEMO_001',
  dateFormat: 'dd/MM/yyyy',
  decimalSeparator: ',',
  thousandSeparator: '.',
  viewDefault: 'C',
  // ...
}
```

**SEED_MAPPINGS:**
```typescript
[
  {
    sourceAccount: 'INTERNAL',
    targetAccount: 'INT_ACCOUNT',
    matchType: 'exact',
    priority: 1,
  },
  // ...
]
```

### Ativação

```typescript
import { setOfflineMode } from '@/services/seed';

setOfflineMode(true);  // Ativa modo offline
```

---

## 📝 Notas de Implementação

### Layout SWIFT Temporário

Atualmente usa:
```
Data|NumMov|ContaDestino|Natureza|Valor|Obs
```

**Para customizar (future):**
1. Editar `lib/swift.ts` → `formatMovementLine()`
2. Adicionar configuração ao `Parameters`
3. Fazer layout multi-template

### Validação de Licença

O sistema **NÃO** valida licença durante conversão (apenas no login).
- Se necessário integrar validação, adicionar na:
  - `hooks/useAuth.tsx` (após login bem-sucedido)
  - Ou middleware de API

### Segurança

✅ **Client-side processing** → Dados financeiros nunca enviados
✅ **Input validation** → parseDate, parseNumber com tratamento de erro
✅ **Type safety** → TypeScript strict mode
✅ **No secrets** → Nenhuma credencial hardcoded

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| "Mapeamento não encontrado" | Recarregue ColumnMapper ou re-selecione arquivo |
| Datas não parseadas | Verifique format em Parameters (dd/MM/yyyy vs yyyy-MM-dd) |
| Números incorretos | Verifique decimalSeparator e thousandSeparator |
| Arquivo SWIFT vazio | Verifique se há defaultTargetAccount ou matching mappings |
| Modo offline permanente | Limpar localStorage: `localStorage.removeItem('offline_mode')` |

---

## 📚 Referências

- [date-fns docs](https://date-fns.org/)
- [XLSX docs](https://docs.sheetjs.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/)

---

## 📄 Licença

Proprietary - OpenLimits

---

## 👥 Contribuindo

Para contribuir:

1. Clone o repo
2. Crie branch: `git checkout -b feature/minha-feature`
3. Commit: `git commit -m "add: minha feature"`
4. Push: `git push origin feature/minha-feature`
5. Abra Pull Request

---

## 📞 Suporte

Para dúvidas ou issues:
- Abra issue no GitHub
- Contacte tim técnica
