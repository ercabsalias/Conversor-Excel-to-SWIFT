/**
 * SWIFT generation core logic
 * Handles movement conversion, account mapping, and SWIFT file formatting
 */

import {
  Movement,
  Parameters,
  Mapping,
  GenerateSwiftOptions,
} from '@/types';
import { normalizeNumber, generateSwiftFilename } from './parsing';

/**
 * Find the best matching target account for a source account
 */
export function findTargetAccount(
  sourceAccount: string,
  mappings: Mapping[],
  defaultTargetAccount?: string
): string | null {
  // Sort by priority (lower = higher priority)
  const sorted = [...mappings]
    .filter((m) => m.active)
    .sort((a, b) => a.priority - b.priority);

  for (const mapping of sorted) {
    let matches = false;

    if (mapping.matchType === 'exact') {
      matches = sourceAccount === mapping.sourceAccount;
    } else if (mapping.matchType === 'startsWith') {
      matches = sourceAccount.startsWith(mapping.sourceAccount);
    } else if (mapping.matchType === 'regex') {
      try {
        const regex = new RegExp(mapping.sourceAccount);
        matches = regex.test(sourceAccount);
      } catch {
        // Invalid regex, skip
      }
    }

    if (matches) {
      return mapping.targetAccount;
    }
  }

  // Fallback to default
  return defaultTargetAccount || null;
}

/**
 * Determine the sign/natureza for a movement
 */
export function determineSign(
  movement: Movement,
  parameters: Parameters
): 'D' | 'C' {
  if (parameters.viewDefault === 'C') {
    // Company view: use original natureza
    return movement.natureza;
  } else {
    // Bank view: determine from value sign, fallback to natureza
    if (parameters.invertSignOnBankView) {
      // Inverted logic
      return movement.valor < 0 ? 'C' : 'D';
    } else {
      return movement.valor < 0 ? 'D' : 'C';
    }
  }
}

/**
 * Format a single movement to SWIFT line
 */
export function formatMovementLine(
  movement: Movement,
  parameters: Parameters,
  targets: {
    targetAccount: string | null;
  }
): string | null {
  const targetAccount = targets.targetAccount;
  if (!targetAccount) {
    return null; // Skip entries without target account
  }

  const natureza = determineSign(movement, parameters);
  const valor = normalizeNumber(
    Math.abs(movement.valor),
    parameters.decimalSeparator,
    parameters.rounding
  );

  const line = [
    movement.date,
    movement.numMov,
    targetAccount,
    natureza,
    valor,
    movement.obs || '',
  ].join('|');

  return line;
}

/**
 * Generate SWIFT file content
 */
export function generateSwiftContent(
  movements: Movement[],
  parameters: Parameters,
  mappings: Mapping[]
): { content: string; count: number } {
  const lines: string[] = [];

  // Add header if configured
  if (parameters.includeHeaderInSwift) {
    lines.push('Data|NumMov|ContaDestino|Natureza|Valor|Obs');
  }

  let successCount = 0;

  for (const movement of movements) {
    const targetAccount = findTargetAccount(
      movement.sourceAccount || '',
      mappings,
      parameters.defaultTargetAccount
    );

    const line = formatMovementLine(movement, parameters, { targetAccount });

    if (line) {
      lines.push(line);
      successCount++;
    }
  }

  const content = lines.join('\n');

  return { content, count: successCount };
}

/**
 * Generate SWIFT file as Blob
 */
export function generateSwift(
  movements: Movement[],
  parameters: Parameters,
  mappings: Mapping[],
  options?: GenerateSwiftOptions
): { blob: Blob; filename: string } {
  const { content } = generateSwiftContent(movements, parameters, mappings);

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

  const filename = options?.fileName || generateSwiftFilename(parameters.companyId);

  return { blob, filename };
}

/**
 * Download SWIFT file (client-side)
 */
export function downloadSwiftFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
