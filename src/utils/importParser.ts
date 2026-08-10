import ExcelJS from 'exceljs';
import { Readable } from 'stream';

const MAX_ROWS = 500;

function sanitize(val: unknown): string {
  return String(val ?? '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 500);
}

export async function parseImportFile(buffer: Buffer): Promise<Record<string, string>[]> {
  const workbook = new ExcelJS.Workbook();

  try {
    // ZIP magic bytes (PK) indicate an xlsx file; anything else is treated as CSV
    const isXlsx = buffer[0] === 0x50 && buffer[1] === 0x4b;
    if (isXlsx) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await workbook.xlsx.load(buffer as any);
    } else {
      const stream = new Readable();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stream.push(buffer as any);
      stream.push(null);
      await workbook.csv.read(stream);
    }
  } catch {
    throw new Error('Could not parse file. Ensure it is a valid CSV or Excel document.');
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('The file has no worksheets.');

  const headers: string[] = [];
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell) => {
    headers.push(String(cell.value ?? '').trim().toLowerCase().replace(/\s+/g, ''));
  });

  if (headers.length === 0) throw new Error('The file has no data rows.');

  const rows: Record<string, string>[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = sanitize(row.getCell(idx + 1).value);
    });
    rows.push(record);
  });

  if (rows.length === 0) throw new Error('The file contains no data rows.');
  if (rows.length > MAX_ROWS) throw new Error(`File exceeds the ${MAX_ROWS}-row limit.`);

  return rows;
}
