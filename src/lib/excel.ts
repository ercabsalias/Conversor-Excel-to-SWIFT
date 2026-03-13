/**
 * Excel parsing utilities using XLSX
 */

import * as XLSX from 'xlsx';
import { ExcelSheetInfo, ExcelImportData } from '@/types';

/**
 * Read Excel file and return sheet information
 */
export async function readExcelFile(file: File): Promise<ExcelImportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) {
          throw new Error('Failed to read file');
        }

        const workbook = XLSX.read(data, { type: 'array' });
        const sheets: ExcelSheetInfo[] = [];

        // Get all sheet names and basic info
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

          sheets.push({
            name: sheetName,
            rowCount: range.e.r + 1,
            colCount: range.e.c + 1,
          });
        }

        // Read first sheet by default
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as unknown[][];

        resolve({
          sheets,
          selectedSheet: workbook.SheetNames[0],
          rawData,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Switch to a different sheet in the same workbook
 */
export async function switchSheet(file: File, sheetName: string): Promise<unknown[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) {
          throw new Error('Failed to read file');
        }

        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames.includes(sheetName)) {
          throw new Error(`Sheet "${sheetName}" not found`);
        }

        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        }) as unknown[][];

        resolve(rawData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Get column letter (A, B, C, ..., Z, AA, AB, ...)
 */
export function getColumnLetter(index: number): string {
  let letter = '';
  index = index + 1;

  while (index > 0) {
    const mod = (index - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    index = Math.floor((index - mod) / 26);
  }

  return letter;
}

/**
 * Get column index from letter (A=0, B=1, ..., Z=25, AA=26, ...)
 */
export function getColumnIndex(letter: string): number {
  let index = 0;

  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + letter.charCodeAt(i) - 64;
  }

  return index - 1;
}
