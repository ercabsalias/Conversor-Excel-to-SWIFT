# Nova Arquitetura - Workflow Multi-Página

## 📋 Resumo das Mudanças

A aplicação foi reorganizada de um modelo tabbed/single-page para um **workflow multi-página com UX clara e intuitiva**. Cada etapa de conversão é agora uma página separada, com navegação progr essiva.

---

## 🏗️ Arquitetura Nova

### 1. **WorkflowContext** (`src/context/WorkflowContext.tsx`)

- **Estado centralizado** para compartilhar dados entre páginas
- Gerencia: arquivo, mapeamento, movimentos,filtros, logs
- Fornece métodos para navegação entre passos

**Estrutura:**
```typescript
interface WorkflowState {
  file: File | null;                    // Excel/CSV selecionado
  columnMapping: ColumnMapping | null;  // Mapeamento de colunas
  movements: Movement[];                // Dados parseados
  dateStart, dateEnd: string | null;    // Filtros de data
  viewType: 'C' | 'B';                 // Visão: Contabilística/Bancária
  multipleCompanies: boolean;           // Modo multi-empresa
  startBalance, endBalance: number;     // Saldos para validação
  logs: Array<Log>;                     // Histórico de eventos
  currentStep: Step;                    // Passo atual (upload|mapping|filters|preview|generate)
}
```

---

### 2. **Páginas de Workflow** (`src/pages/workflow/`)

Cada página é uma etapa do processo, com validações e controles específicos:

#### **UploadPage.tsx** (Passo 1)
- Drag-and-drop de ficheiros
- Validação de tipo (.xlsx, .xls, .csv)
- Botão "Continuar para Mapeamento"

#### **MappingPage.tsx** (Passo 2)
- Detecção automática de cabeçalho
- Seleção de colunas obrigatórias:
  - 📅 Data
  - 🔢 Número de Movimento
  - ↔️ Natureza (D/C)
  - 💰 Valor
- Campos opcionais:
  - 📝 Observação
  - 🏢 Conta Origem
- Pré-visualização dos primeiros 3 registos
- Persistência em localStorage

#### **FilterPage.tsx** (Passo 3)
- **4 painéis de filtro principais:**
  1. 📅 **Filtro de Datas** - Data Inicial / Data Final
  2. ↔️ **Tipo de Visão** - Contabilística (C) vs Bancária (B)
  3. 💰 **Saldos** - Para validação e conciliação
  4. 🏢 **Configurações** - Multi-empresa

- **Real-time feedback:**
  - Total de movimentos carregados
  - Total de movimentos após filtros
  - Alerta visual com contagem

#### **PreviewPage.tsx** (Passo 4)
- **Cards de resumo:**
  - Total de Movimentos
  - 📊 Débitos (vermelho)
  - 📊 Créditos (verde)
  - 📊 Saldo Líquido
  
- **Tabela interativa:**
  - Paginação (10 linhas por página)
  - Ordenação por Data ou Número de Movimento
  - Cores para Natureza (D/C)
  - Clique no registo para ver detalhes no log
  
- **Controles:**
  - Ordenação crescente/decrescente
  - Botão Atualizar para recarregar

#### **GeneratePage.tsx** (Passo 5)
- **Resumo completo:**
  - Ficheiro selecionado
  - Total de movimentos
  - Período aplicado
  - Tipo de visão
  
- **Geração:**
  - Botão "Gerar Ficheiro SWIFT"
  - Download automático do ficheiro
  - Indicador de sucesso com checkbox verde
  - Botão para nova conversão ou download adicional

---

### 3. **WorkflowLayout** (`src/components/WorkflowLayout.tsx`)

- **Navegação visual de progresso:**
  - 5 passos com ícones
  - Indicador de conclusão (✓)
  - Desabilitação de passos inacessíveis
  
- **Renderização condicional:**
  - Mostra página correspondente ao `currentStep`
  - Navegação entre passos

- **Estrutura:**
```
┌─────────────────────────────────────────────┐
│   Header + Progress Bar                       │
├─────────────────────────────────────────────┤
│   Current Page (Upload/Mapping/etc)           │
├─────────────────────────────────────────────┤
│   Log Panel (Eventos e Erros)                 │
└─────────────────────────────────────────────┘
```

---

### 4. **LogPanel** (`src/components/LogPanel.tsx`)

- **Registro centralizado de eventos:**
  - ✅ Info (azul)
  - ⚠️ Warning (âmbar)
  - ❌ Error (vermelho)
  
- **Funcionalidades:**
  - Auto-scroll ao fim
  - Botão "Limpar Log"
  - Timestamp de cada evento
  - Máximo 40 eventos visíveis

---

## 🎯 Fluxo de Navegação

```
┌─────────────────┐
│  1. UPLOAD      │  ← Selecionar ficheiro Excel
└────────┬────────┘
         │
┌────────▼────────┐
│  2. MAPPING     │  ← Mapear colunas (Auto-detecção)
└────────┬────────┘
         │
┌────────▼────────┐
│  3. FILTROS     │  ← Aplicar filtros (Data, Visão, etc)
└────────┬────────┘
         │
┌────────▼────────┐
│  4. PRÉVIA      │  ← Revisar dados (Paginação, Ordenação)
└────────┬────────┘
         │
┌────────▼────────┐
│  5. GERAR       │  ← Gerar e descarregar SWIFT
└─────────────────┘
```

**Validações em cada etapa:**
- ✅ Upload: Ficheiro válido obrigatório
- ✅ Mapping: Campos obrigatórios preenchidos
- ✅ Filtros: (Sem bloqueios)
- ✅ Prévia: (Visualização apenas)
- ✅ Gerar: Executa download

---

## 📐 Layout da Página `/app/conversor`

```
┌──────────────────────────────────────────────────────────────┐
│  [Modo Offline - Banner] (se aplicável)                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────┐  ┌────────────────────────┐ │
│  │                             │  │                        │ │
│  │   WorkflowLayout            │  │    Sidebar             │ │
│  │   (3 colunas)               │  │    (1 coluna)          │ │
│  │                             │  │                        │ │
│  │  - Header                   │  │  ├─ Parâmetros        │ │
│  │  - Progress Bar             │  │  │  Dashboard          │ │
│  │  - Current Page             │  │  │  (Empresa/Conv)     │ │
│  │  - Log Panel                │  │  │                      │ │
│  │                             │  │  ├─ Mapeamentos        │ │
│  │                             │  │  │  (Contas)            │ │
│  │                             │  │  │                      │ │
│  └─────────────────────────────┘  └────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Integração com Estado Global

### App.tsx
```tsx
<WorkflowProvider>
  <QueryClientProvider ...>
    <Router>
      <ConversorPage />
    </Router>
  </QueryClientProvider>
</WorkflowProvider>
```

### ConversorPage.tsx
```tsx
const ConversorPage = () => {
  const { user } = useAuth();
  
  return (
    <div className="grid grid-cols-4">
      <div className="col-span-3">
        <WorkflowLayout />  {/* Renderiza a página atual */}
      </div>
      <div>
        {user?.companyId && <ParametersPanel companyId={user.companyId} />}
        {user?.companyId && <MappingsPanel companyId={user.companyId} />}
      </div>
    </div>
  );
};
```

---

## 📊 Fluxo de Dados

```
WorkflowContext (estado centralizado)
     ├── useWorkflow() → Qualquer componente
     ├── setFile() → Carrega ficheiro
     ├── setColumnMapping() → Armazena mapeamento
     ├── setMovements() → Armazena dados parseados
     ├── setDateStart/End() → Aplica filtros
     ├── goToStep() → Navega para próximo passo
     └── addLog() → Registra eventos

UploadPage
  ↓ (setFile + goToStep('mapping'))
MappingPage
  ↓ (setColumnMapping + goToStep('filters'))
FilterPage
  ↓ (setMovements + goToStep('preview'))
PreviewPage
  ↓ (goToStep('generate'))
GeneratePage
```

---

## 🎨 UX Improvements

### ✅ **Antes (Estrutura Antiga)**
- ❌ Tudo em uma página (overcrowded)
- ❌ Abas lado a lado (confuso)
- ❌ Sem indicador de progresso
- ❌ Filtros dispersos

### ✅ **Depois (Nova Arquitetura)**
- ✅ Páginas separadas (cada passo é clara)
- ✅ Navegação linear (upload → mapping → filters → preview → generate)
- ✅ Progress bar (sabe-se em que passo está)
- ✅ Filtros organizados em 4 painéis (📅📊💰🏢)
- ✅ Log panel integrado para feedback em tempo real
- ✅ Sidebar com configurações (sempre acessível)

---

## 🛠️ Tecnologias Utilizadas

- **React 18.3** - UI Framework
- **TypeScript 5.8** - Type Safety
- **Context API** - State Management (em vez de Redux)
- **Tailwind CSS** - Styling
- **shadcn/ui** - Components
- **date-fns** - Date Parsing
- **XLSX** - Excel Import

---

## 📝 Próximos Passos Opcionais

1. **Persistência de Workflow**
   - Salvar estado em sessionStorage
   - Permitir retomar conversão interrompida

2. **Export/Import de Configurações**
   - Guardar/restaurar Mappings e Parameters
   - Compartilhar entre utilizadores

3. **Batch Processing**
   - Processar múltiplos ficheiros
   - Agendamento de conversões

4. **Advanced Analytics**
   - Dashboard de conversões realizadas
   - Estatísticas de erros/warnings

---

## 📞 Suporte

**Modificar páginas de workflow:**
- Editá-las em `src/pages/workflow/`
- Usar `useWorkflow()` para acessar estado
- Usar `goToStep()` para navegação

**Adicionar novo filtro:**
- Adicionar campo em `WorkflowState`
- Criar setter em `WorkflowContext`
- Implementar input em `FilterPage`

**Customizar log:**
- Modifi­car `LogPanel.tsx`
- Alterar cores/ícones em `getLogColor()`, `getLogIcon()`
