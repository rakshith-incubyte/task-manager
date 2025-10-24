import { Task } from './api-client'

/**
 * Interface for export strategies (Open/Closed Principle)
 */
interface ExportStrategy {
  export(tasks: Task[]): string
}

/**
 * JSON export strategy
 */
class JSONExportStrategy implements ExportStrategy {
  export(tasks: Task[]): string {
    return JSON.stringify(tasks, null, 2)
  }
}

/**
 * CSV export strategy
 */
class CSVExportStrategy implements ExportStrategy {
  private readonly headers = ['id', 'title', 'description', 'status', 'priority', 'created_at', 'updated_at']

  export(tasks: Task[]): string {
    const headerRow = this.headers.join(',')
    
    if (tasks.length === 0) {
      return `${headerRow}\n`
    }

    const rows = tasks.map(task => this.taskToCSVRow(task))
    return `${headerRow}\n${rows.join('\n')}`
  }

  private taskToCSVRow(task: Task): string {
    return this.headers
      .map(header => {
        const value = task[header as keyof Task]
        return this.escapeCSVValue(value)
      })
      .join(',')
  }

  private escapeCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return ''
    }

    const stringValue = String(value)
    
    // If value contains comma, quotes, or newlines, wrap in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }

    return stringValue
  }
}

/**
 * File download service (Single Responsibility Principle)
 */
class FileDownloader {
  download(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    
    // Cleanup
    URL.revokeObjectURL(url)
    link.remove()
  }
}

/**
 * TaskExporter - Orchestrates task export functionality
 * Follows SOLID principles:
 * - Single Responsibility: Only handles task export coordination
 * - Open/Closed: Extensible via ExportStrategy interface
 * - Dependency Inversion: Depends on abstractions (ExportStrategy)
 */
export class TaskExporter {
  private readonly jsonStrategy: ExportStrategy
  private readonly csvStrategy: ExportStrategy
  private readonly fileDownloader: FileDownloader

  constructor() {
    this.jsonStrategy = new JSONExportStrategy()
    this.csvStrategy = new CSVExportStrategy()
    this.fileDownloader = new FileDownloader()
  }

  /**
   * Export tasks to JSON format
   */
  exportToJSON(tasks: Task[]): string {
    return this.jsonStrategy.export(tasks)
  }

  /**
   * Export tasks to CSV format
   */
  exportToCSV(tasks: Task[]): string {
    return this.csvStrategy.export(tasks)
  }

  /**
   * Download file with given content
   */
  downloadFile(content: string, filename: string, mimeType: string): void {
    this.fileDownloader.download(content, filename, mimeType)
  }

  /**
   * Export and download tasks as JSON
   */
  exportAndDownloadJSON(tasks: Task[], filename: string = 'tasks.json'): void {
    const content = this.exportToJSON(tasks)
    this.downloadFile(content, filename, 'application/json')
  }

  /**
   * Export and download tasks as CSV
   */
  exportAndDownloadCSV(tasks: Task[], filename: string = 'tasks.csv'): void {
    const content = this.exportToCSV(tasks)
    this.downloadFile(content, filename, 'text/csv')
  }
}
