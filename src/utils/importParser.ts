import * as XLSX from 'xlsx';

const MAX_ROWS = 500;

function sanitize(val: unknown): string {
  return String(val ?? '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 500);
}

export function parseImportFile(buffer: Buffer): Record<string, string>[] {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  } catch {
    throw new Error('Could not parse file. Ensure it is a valid CSV or Excel document.');
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error('The file has no worksheets.');

  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (rows.length === 0) throw new Error('The file contains no data rows.');
  if (rows.length > MAX_ROWS) throw new Error(`File exceeds the ${MAX_ROWS}-row limit.`);

  return rows.map((row) => {
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      clean[k.trim().toLowerCase().replace(/\s+/g, '')] = sanitize(v);
    }
    return clean;
  });
}
