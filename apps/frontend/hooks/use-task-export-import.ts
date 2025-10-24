import { useState, useCallback, useMemo } from 'react'
import { Task } from '@/lib/api-client'
import { TaskExporter } from '@/lib/task-exporter'
import { TaskImporter } from '@/lib/task-importer'

type ExportFormat = 'json' | 'csv'

type UseTaskExportImportReturn = {
  isExporting: boolean
  isImporting: boolean
  exportTasks: (tasks: Task[], format: ExportFormat) => void
  importTasks: (file: File) => Promise<Task[]>
  error: string | null
  clearError: () => void
}

/**
 * Hook for managing task export and import operations
 * Follows Single Responsibility Principle - handles only export/import state and coordination
 */
export const useTaskExportImport = (): UseTaskExportImportReturn => {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Memoize instances to avoid recreation on every render
  const exporter = useMemo(() => new TaskExporter(), [])
  const importer = useMemo(() => new TaskImporter(), [])

  const exportTasks = useCallback((tasks: Task[], format: ExportFormat): void => {
    setIsExporting(true)
    setError(null)

    try {
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `tasks-${timestamp}.${format}`

      if (format === 'json') {
        exporter.exportAndDownloadJSON(tasks, filename)
      } else {
        exporter.exportAndDownloadCSV(tasks, filename)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }, [])

  const importTasks = useCallback(async (file: File): Promise<Task[]> => {
    setIsImporting(true)
    setError(null)

    try {
      const tasks = await importer.importFromFile(file)
      return tasks
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsImporting(false)
    }
  }, [])

  const clearError = useCallback((): void => {
    setError(null)
  }, [])

  return {
    isExporting,
    isImporting,
    exportTasks,
    importTasks,
    error,
    clearError,
  }
}
