// Helpers for the admin Excel import / export screens.
// xlsx is ~400KB, so it is only loaded when a file is actually read or written.

export type XlsxModule = typeof import('xlsx');

export const loadXlsx = (): Promise<XlsxModule> => import('xlsx');

// "Họ và tên" -> "hovaten": header and cell matching that ignores accents, case and punctuation
export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export async function writeWorkbook(headers: string[], rows: Record<string, string>[], fileName: string): Promise<void> {
  const XLSX = await loadXlsx();
  const sheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Danh_Sach');
  XLSX.writeFile(workbook, fileName);
}

// Rows of the first sheet keyed by header; the header row is spreadsheet row 1
export async function readFirstSheet(file: File): Promise<{ XLSX: XlsxModule; rows: Record<string, unknown>[] }> {
  const XLSX = await loadXlsx();
  const workbook = XLSX.read(await file.arrayBuffer());
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return { XLSX, rows: XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' }) };
}
