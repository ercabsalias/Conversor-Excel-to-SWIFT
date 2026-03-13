# 📋 Guia de Parâmetros - Conversor Excel to SWIFT

## Visão Geral

A seção de **Parâmetros** permite configurar todos os dados e regras específicas da sua empresa para a conversão de movimentos Excel para SWIFT.

---

## 📍 Onde Encontrar

Na página principal do Conversor, role para baixo até à seção **"⚙️ Configuração"**.

Você verá dois painéis:
- **Parâmetros** (lado esquerdo)
- **Mapeamentos** (lado direito)

---

## 🏢 Dados da Empresa

Estes são os dados identificadores e de configuração da sua empresa/conta:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **Referência** | Identificador/código da empresa | `teste` |
| **Conta** | Sigla da conta bancária | `BA11` |
| **Nº Conta** | Número completo da conta | `1005412286` |
| **Sequência** | Número sequencial de registro | `1` |
| **Moeda** | Código da moeda (ISO 4217) | `EUR`, `USD`, `GBP` |
| **Doc. Crédito** | Tipo de documento para créditos | `DVD` |
| **Doc. Débito** | Tipo de documento para débitos | `DVC` |

### Exemplo de Preenchimento

```
Referência: cliente_001
Conta: ACC
Nº Conta: 0000123456
Sequência: 001
Moeda: EUR
Doc. Crédito: VD1
Doc. Débito: DB1
```

---

## 📊 Configuração de Conversão

Estes parâmetros controlam como os dados são parseados e formatados:

| Campo | Descrição | Opções | Padrão |
|-------|-----------|--------|--------|
| **Formato de Data** | Padrão para ler datas no arquivo | `dd/MM/yyyy`, `yyyy-MM-dd`, `MM/dd/yyyy` | `dd/MM/yyyy` |
| **Separador Decimal** | Símbolo de separação de decimais | `,` ou `.` | `,` |
| **Separador Milhar** | Símbolo de separação de milhares | `.` ou `,` | `.` |
| **Casas Decimais** | Número de casas decimais na saída | `1` a `4` | `2` |
| **Visualização Default** | Perspectiva de cálculo de sinal | `Empresa (C)` ou `Banco (B)` | `Empresa (C)` |

### Exemplos Práticos

**Português (PT)**
```
Formato de Data: dd/MM/yyyy
Separador Decimal: ,
Separador Milhar: .
Exemplo de número: 1.000,50
```

**Inglês (EN)**
```
Formato de Data: MM/dd/yyyy
Separador Decimal: .
Separador Milhar: ,
Exemplo de número: 1,000.50
```

**Europeu (EU)**
```
Formato de Data: yyyy-MM-dd
Separador Decimal: ,
Separador Milhar: .
Exemplo de número: 1.000,50
```

---

## 🔧 Como Editar Parâmetros

### Modo Visualização

Quando você abre a página, os parâmetros são mostrados em **modo de visualização** em cards com fundo cinzento.

Cada card mostra:
- Nome do parâmetro (em cima, mais claro)
- Valor atual (em baixo, em destaque)

### Modo Edição

1. Clique no botão **"✏️ Editar"** no final da seção
2. Os campos ficarão **edináveis** com dois abas:
   - **Empresa**: dados da empresa
   - **Conversão**: parâmetros de formato

3. Faça as alterações necessárias

4. Clique em **"✓ Salvar"** para guardar
   - Verá mensagem de confirmação: "✓ Salvo"
   - Os dados são salvos em **localStorage** (no seu navegador)

5. Se quiser descartar as alterações, clique **"Cancelar"**

---

## 💾 Persistência de Dados

Todos os parâmetros são salvos **automaticamente** no seu navegador em `localStorage`.

**Dados salvos:**
- Referência
- Conta
- Nº Conta
- Sequência
- Moeda
- Doc. Crédito
- Doc. Débito
- Formato de Data
- Separadores
- Casas Decimais
- Visualização padrão

**Como limpar dados:**
```javascript
// No console do navegador (F12 > Console)
localStorage.clear()
// Depois recarregue a página (F5)
```

---

## 📌 Dicas Importantes

1. **Antes de começar**: Configure todos os parâmetros da sua empresa
2. **Verifique o formato de data**: Deve corresponder ao seu arquivo Excel
3. **Separadores**: Use os mesmos separadores que o seu arquivo
4. **Visualização default**: Afeta como os sinais (D/C) são interpretados
5. **Salve frequentemente**: Cada alteração é salva automaticamente ao clicar em "Salvar"

---

## ⚠️ Problemas Comuns

### "Erros de Datas no uploads"
**Causa**: Formato de data incorreto
**Solução**: Verifique o campo "Formato de Data" e ajuste para corresponder ao seu arquivo

**Exemplo:**
- Arquivo tem: `01/01/2024`
- Configure: `dd/MM/yyyy` ✓

### "Valores com casas decimais erradas"
**Causa**: Separadores decimal/milhar invertidos
**Solução**: Ajuste em "Separador Decimal" e "Separador Milhar"

**Exemplo:**
- Valor no arquivo: `1.000,50`
- Configure: Sep. Decimal = `,` e Sep. Milhar = `.` ✓

### "Sinais (D/C) invertidos na saída SWIFT"
**Causa**: Visualização default incorreta
**Solução**: Altere entre "Empresa (C)" e "Banco (B)"

---

## 🎯 Workflow Recomendado

1. ✅ **Passo 1**: Configure todos os "Dados da Empresa"
2. ✅ **Passo 2**: Configure todos os "Parâmetros de Conversão"
3. ✅ **Passo 3**: Clique em "✓ Salvar"
4. ✅ **Passo 4**: Faça upload de um arquivo de teste
5. ✅ **Passo 5**: Se houver erros, ajuste os parâmetros
6. ✅ **Passo 6**: Re-confira e baixe o SWIFT

---

## 🔗 Relacionado

- **Mapeamentos**: Veja [MAPPINGS_GUIDE.md](./MAPPINGS_GUIDE.md) para regras de conta origem → destino
- **Quick Start**: Veja [QUICK_START.md](./QUICK_START.md) para instruções gerais

---

## 📞 Suporte

Se os parâmetros não estão sendo salvos:
1. Verifique se localStorage está ativado no navegador
2. Abra o console (F12) e verifique se há erros
3. Limpe o cache e tente novamente

---

**Última atualização**: 03/03/2026  
**Versão**: 1.0.0
