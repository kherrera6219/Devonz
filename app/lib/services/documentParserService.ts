/**
 * Document Parser Service
 *
 * Parses various document formats (PDF, DOCX, XLSX, MD, JSON, YAML)
 * and extracts text content for agent processing and RAG indexing.
 */

import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('DocumentParser');

export interface ParsedDocument {
  /** Extracted text content */
  content: string;

  /** Document metadata */
  metadata: {
    format: string;
    originalPath: string;
    pages?: number;
    sheets?: string[];
    wordCount?: number;
    parseTime?: number;
  };

  /** Whether parsing was successful */
  success: boolean;

  /** Error message if parsing failed */
  error?: string;
}

export interface ParseOptions {
  /** For Excel: which sheet to parse (default: all) */
  sheet?: string;

  /** For PDF: max pages to parse (default: all) */
  maxPages?: number;

  /** Include metadata in output */
  includeMetadata?: boolean;
}

/**
 * Supported document formats
 */
export const SUPPORTED_FORMATS = [
  '.pdf',
  '.docx',
  '.xlsx',
  '.xls',
  '.md',
  '.markdown',
  '.json',
  '.yaml',
  '.yml',
  '.txt',
  '.csv',
] as const;

export type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

/**
 * Check if a file format is supported
 */
export function isSupportedFormat(path: string): boolean {
  const ext = getFileExtension(path).toLowerCase();
  return SUPPORTED_FORMATS.includes(ext as SupportedFormat);
}

/**
 * Get file extension from path
 */
function getFileExtension(path: string): string {
  const lastDot = path.lastIndexOf('.');
  return lastDot >= 0 ? path.slice(lastDot) : '';
}

/**
 * Parse a document and extract text content
 */
export async function parseDocument(
  content: Buffer | string,
  path: string,
  options: ParseOptions = {},
): Promise<ParsedDocument> {
  const startTime = Date.now();
  const ext = getFileExtension(path).toLowerCase();

  try {
    let result: ParsedDocument;

    switch (ext) {
      case '.pdf':
        result = await parsePDF(content as Buffer, path, options);
        break;
      case '.docx':
        result = await parseDOCX(content as Buffer, path);
        break;
      case '.xlsx':
      case '.xls':
        result = await parseExcel(content as Buffer, path, options);
        break;
      case '.md':
      case '.markdown':
        result = parseMarkdown(content.toString(), path);
        break;
      case '.json':
        result = parseJSON(content.toString(), path);
        break;
      case '.yaml':
      case '.yml':
        result = await parseYAML(content.toString(), path);
        break;
      case '.txt':
        result = parsePlainText(content.toString(), path);
        break;
      case '.csv':
        result = parseCSV(content.toString(), path);
        break;
      default:
        return {
          content: '',
          metadata: { format: ext, originalPath: path },
          success: false,
          error: `Unsupported format: ${ext}`,
        };
    }

    result.metadata.parseTime = Date.now() - startTime;
    logger.info(`Parsed ${ext} document: ${path} in ${result.metadata.parseTime}ms`);

    return result;
  } catch (error) {
    logger.error(`Failed to parse document: ${path}`, error);

    return {
      content: '',
      metadata: { format: ext, originalPath: path },
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Parse PDF document
 */
async function parsePDF(buffer: Buffer, path: string, options: ParseOptions): Promise<ParsedDocument> {
  // Dynamic import with type assertion for ESM compatibility
  const pdfParseModule = (await import('pdf-parse')) as { default?: unknown };
  const pdfParse = (pdfParseModule.default ?? pdfParseModule) as (
    buf: Buffer,
    opts?: { max?: number },
  ) => Promise<{ text: string; numpages: number }>;
  const data = await pdfParse(buffer, {
    max: options.maxPages || 0, // 0 = all pages
  });

  return {
    content: data.text,
    metadata: {
      format: 'pdf',
      originalPath: path,
      pages: data.numpages,
      wordCount: data.text.split(/\s+/).length,
    },
    success: true,
  };
}

/**
 * Parse DOCX document
 */
async function parseDOCX(buffer: Buffer, path: string): Promise<ParsedDocument> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });

  return {
    content: result.value,
    metadata: {
      format: 'docx',
      originalPath: path,
      wordCount: result.value.split(/\s+/).length,
    },
    success: true,
  };
}

/**
 * Parse Excel document
 */
async function parseExcel(buffer: Buffer, path: string, options: ParseOptions): Promise<ParsedDocument> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const sheets = options.sheet ? [options.sheet] : workbook.SheetNames;
  const content: string[] = [];

  for (const sheetName of sheets) {
    if (!workbook.Sheets[sheetName]) {
      continue;
    }

    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);

    content.push(`--- Sheet: ${sheetName} ---`);
    content.push(csv);
  }

  return {
    content: content.join('\n\n'),
    metadata: {
      format: 'xlsx',
      originalPath: path,
      sheets: workbook.SheetNames,
    },
    success: true,
  };
}

/**
 * Parse Markdown document (passthrough with metadata)
 */
function parseMarkdown(content: string, path: string): ParsedDocument {
  return {
    content,
    metadata: {
      format: 'markdown',
      originalPath: path,
      wordCount: content.split(/\s+/).length,
    },
    success: true,
  };
}

/**
 * Parse JSON document
 */
function parseJSON(content: string, path: string): ParsedDocument {
  const parsed = JSON.parse(content);
  const formatted = JSON.stringify(parsed, null, 2);

  return {
    content: formatted,
    metadata: {
      format: 'json',
      originalPath: path,
    },
    success: true,
  };
}

/**
 * Parse YAML document
 */
async function parseYAML(content: string, path: string): Promise<ParsedDocument> {
  const yaml = await import('yaml');
  const parsed = yaml.parse(content);

  // Convert to formatted string for readability
  const formatted = yaml.stringify(parsed);

  return {
    content: formatted,
    metadata: {
      format: 'yaml',
      originalPath: path,
    },
    success: true,
  };
}

/**
 * Parse plain text document
 */
function parsePlainText(content: string, path: string): ParsedDocument {
  return {
    content,
    metadata: {
      format: 'text',
      originalPath: path,
      wordCount: content.split(/\s+/).length,
    },
    success: true,
  };
}

/**
 * Parse CSV document
 */
function parseCSV(content: string, path: string): ParsedDocument {
  return {
    content,
    metadata: {
      format: 'csv',
      originalPath: path,
    },
    success: true,
  };
}
