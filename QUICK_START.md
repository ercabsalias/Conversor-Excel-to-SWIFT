# 🚀 Quick Start Guide - Conversor Excel to SWIFT

## 1. Instalação e Inicialização

### Primeira vez
```bash
cd ConversorExcelToSwift
npm install
npm run dev
```

O servidor iniciará em: **http://localhost:8081/**

### Próximas vezes
```bash
npm run dev
```

---

## 2. Login

- **Utilizador**: qualquer texto (ex: `admin`)
- **Password**: qualquer texto (ex: `123`)
- ✅ A aplicação opera em **modo offline** - não requer servidor backend

---

## 3. Como Usar o Conversor

### Passo 1: Upload de Arquivo
1. Clique na área de upload ou **arraste um arquivo**
2. Formatos suportados: `.xlsx`, `.xls`, `.csv`
3. Se o arquivo tem múltiplas sheets, selecione qual usar

**Arquivo de teste disponível em:**
```
c:\Users\ernesto.salias\OneDrive - Openlimits\Documentos\test_movements.csv
```

### Passo 2: Mapeamento de Colunas
1. O sistema **detecta automaticamente** quais são as colunas
2. Verifique os mapeamentos sugeridos:
   - 📅 **Data**: formato dd/MM/yyyy (configurável)
   - 🔢 **Número Mov**: identificador único
   - ↔️ **Natureza (D/C)**: débito ou crédito
   - 💰 **Valor**: valor numérico
   - 📝 **Observação** (opcional)
   - 🏢 **Conta Origem** (opcional)

3. **Ajuste manualmente** se necessário
4. Clique **"Aplicar Mapeamento e Previsualizar"**

### Passo 3: Prévia & Validação
1. Revise os **primeiros 10 movimentos válidos**
2. Verifique o **log de erros** (se houver)
   - Mostra linha, coluna e motivo do erro
3. Clique **"Confirmar e Gerar SWIFT"** para continuar

### Passo 4: Gerar e Download
1. O sistema mapeia contas origem → destino via regras
2. Aplica sign rules (Empresa vs Banco view)
3. Gera arquivo SWIFT com nomenclatura: `SWIFT_<EMPRESA>_<DATA>.txt`
4. Clique **"Baixar Arquivo SWIFT"**

---

## 4. Configuração de Parâmetros

Na **seção inferior** da página, você verá os parâmetros:

| Parametro | Descrição | Padrão |
|-----------|-----------|--------|
| **Data Format** | Formato das datas (dd/MM/yyyy, yyyy-MM-dd) | `dd/MM/yyyy` |
| **Separador Decimal** | Símbolo de decimal (`,` ou `.`) | `,` |
| **Separador Milhar** | Símbolo de milhar (`.` ou `,`) | `.` |
| **Casas Decimais** | Número de casas decimais | `2` |
| **Vista Default** | Empresa (C) ou Banco (B) | `C` |

**Para editar**: Clique em "Editar", mude os valores e clique "Salvar"

---

## 5. Mapeamento de Contas

A seção **"Mapeamentos"** mostra as regras de conta origem → destino:

### Regras de Matching
- **Exact**: correspondência exata
- **startsWith**: começa com padrão
- **regex**: expressão regular

### Ações disponíveis
- ✓ Ativar/desativar mapeamento
- 🗑️ Deletar mapeamento
- 📋 Ver prioridade e descrição

---

## 6. Estrutura do Arquivo CSV/Excel

Seu arquivo deve ter **NO MÍNIMO** estas colunas:

```
Data        | NumMov | Natureza | Valor   | Obs
01/01/2024  | 001    | D        | 1000,50 | Transfer
02/01/2024  | 002    | C        | 500,25  | Refund
```

---

## 7. Troubleshooting

### ❌ "Arquivo não carregou"
- Verifique o formato: `.xlsx`, `.xls` ou `.csv`
- Arquivo está corrompido? Tente salvá-lo novamente

### ❌ "Nenhum movimento válido encontrado"
- Verifique o **mapeamento de colunas** está correto
- Revise o **log de erros** para detalhes específicos
- Datas devem estar no **formato configurado**

### ❌ "Datas inválidas"
- Altere o **Data Format** em Parâmetros
- Exemplos: `dd/MM/yyyy`, `yyyy-MM-dd`, `MM/dd/yyyy`

### ❌ "Valores com decimais errados"
- Atualize **Separador Decimal** em Parâmetros
- Se arquivo usa `,`: configure para `,`
- Se arquivo usa `.`: configure para `.`

### ❌ "Arquivo SWIFT não mostra nenhuma conta destino"
- Verifique se **Conta Origem** está mapeada/detectada
- Adicione **defaultTargetAccount** em Parâmetros (future)
- Revise as regras de **Mapeamento**

### ❌ "Tabs 'Mapeamento', 'Prévia', 'Gerar' estão desabilitados"
- Você precisa fazer **Upload de um arquivo primeiro**
- As tabs serão habilitadas automaticamente após upload bem-sucedido

---

## 8. Dados Salvos Localmente

A aplicação salva **automaticamente** em seu navegador:

- ✓ Parâmetros de conversão
- ✓ Mapeamentos de contas
- ✓ Mapeamentos de coluna
- ✓ Dados parseados (durante sessão)

**Para limpar dados**: `localStorage.clear()` no console do navegador

---

## 9. Modo de Desenvolvedor

### Build para produção
```bash
npm run build
npm run preview
```

### Rodar testes
```bash
npm test              # Uma vez
npm test:watch       # Modo watch
```

### Verificar erros TypeScript
```bash
npx tsc --noEmit
```

---

## 10. Recursos Disponíveis

✅ **Implementado**
- Detecção automática de colunas com heurísticas
- Validação robusta de dados
- Mapeamento flexível (exact, startsWith, regex)
- Parâmetros configuráveis
- Persistência em localStorage
- Testes unitários completos (33 testes)

🔄 **Futuro**
- Importação de dados de servidor
- Gestor de múltiplos mapeamentos
- Exportar/importar configurações
- Processamento em batch
- Relatórios de erros

---

## 💡 Dicas

1. **Primeiro teste**: Use o arquivo `test_movements.csv` para familiarizar-se
2. **Auto-detect**: O sistema é muito bom em detectar colunas automaticamente
3. **Erros detalhados**: Sempre revise o "Log de Erros" para ver exatamente o que falhou
4. **Salvamento automático**: Todos os parâmetros são salvos localmente automaticamente
5. **Modo offline**: Funciona 100% sem internet - dados processados localmente

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique o **console do navegador** (F12 → Console)
2. Revise o **Troubleshooting** acima
3. Limpe o cache e tente novamente: `localStorage.clear()`

---

**Versão**: 1.0.0  
**Última atualização**: 03/03/2026  
**Status**: ✅ Funcional (Modo Offline)
