import { Task, TaskStatus, TaskPriority } from './api-client'

/**
 * Interface for import strategies (Open/Closed Principle)
 */
interface ImportStrategy {
  import(data: string): Task[]
}

/**
 * Task validator (Single Responsibility Principle)
 */
class TaskValidator {
  private readonly validStatuses: TaskStatus[] = ['todo', 'in_progress', 'done']
  private readonly validPriorities: TaskPriority[] = ['low', 'medium', 'high']

  validate(task: any): task is Task {
    if (!task || typeof task !== 'object') {
      return false
    }

    // Required fields
    if (!task.id || typeof task.id !== 'string') return false
    if (!task.title || typeof task.title !== 'string') return false
    if (!task.status || !this.validStatuses.includes(task.status)) return false
    if (!task.priority || !this.validPriorities.includes(task.priority)) return false

    // Description can be null or string
    if (task.description !== null && typeof task.description !== 'string') {
      return false
    }

    return true
  }

  validateAll(tasks: any[]): Task[] {
    if (!Array.isArray(tasks)) {
      throw new Error('Invalid task data: expected array')
    }

    const validatedTasks: Task[] = []

    for (const task of tasks) {
      if (!this.validate(task)) {
        throw new Error('Invalid task data: task validation failed')
      }
      validatedTasks.push(task as Task)
    }

    return validatedTasks
  }
}

/**
 * JSON import strategy
 */
class JSONImportStrategy implements ImportStrategy {
  private readonly validator: TaskValidator

  constructor(validator: TaskValidator) {
    this.validator = validator
  }

  import(data: string): Task[] {
    try {
      const parsed = JSON.parse(data)
      return this.validator.validateAll(parsed)
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format')
      }
      throw error
    }
  }
}

/**
 * CSV import strategy
 */
class CSVImportStrategy implements ImportStrategy {
  private readonly validator: TaskValidator
  private readonly requiredHeaders = ['id', 'title', 'description', 'status', 'priority', 'created_at', 'updated_at']

  constructor(validator: TaskValidator) {
    this.validator = validator
  }

  import(data: string): Task[] {
    const lines = data.trim().split('\n')
    
    if (lines.length === 0) {
      throw new Error('Invalid CSV format: empty file')
    }

    const headers = this.parseCSVLine(lines[0])
    this.validateHeaders(headers)

    const tasks: any[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      const task = this.createTaskFromRow(headers, values)
      tasks.push(task)
    }

    return this.validator.validateAll(tasks)
  }

  private validateHeaders(headers: string[]): void {
    for (const required of this.requiredHeaders) {
      if (!headers.includes(required)) {
        throw new Error(`Invalid CSV format: missing required column '${required}'`)
      }
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }

    // Add last field
    result.push(current)

    return result
  }

  private createTaskFromRow(headers: string[], values: string[]): any {
    const task: any = {}

    headers.forEach((header, index) => {
      const value = values[index]
      
      // Handle empty values
      if (value === '' || value === undefined) {
        task[header] = header === 'description' ? null : value
      } else {
        task[header] = value
      }
    })

    return task
  }
}

/**
 * TaskImporter - Orchestrates task import functionality
 * Follows SOLID principles:
 * - Single Responsibility: Only handles task import coordination
 * - Open/Closed: Extensible via ImportStrategy interface
 * - Dependency Inversion: Depends on abstractions (ImportStrategy)
 */
export class TaskImporter {
  private readonly jsonStrategy: ImportStrategy
  private readonly csvStrategy: ImportStrategy

  constructor() {
    const validator = new TaskValidator()
    this.jsonStrategy = new JSONImportStrategy(validator)
    this.csvStrategy = new CSVImportStrategy(validator)
  }

  /**
   * Import tasks from JSON format
   */
  importFromJSON(data: string): Task[] {
    return this.jsonStrategy.import(data)
  }

  /**
   * Import tasks from CSV format
   */
  importFromCSV(data: string): Task[] {
    return this.csvStrategy.import(data)
  }

  /**
   * Import tasks from file
   */
  async importFromFile(file: File): Promise<Task[]> {
    console.log('TaskImporter.importFromFile called with:', file.name, file.type)
    
    const content = await this.readFile(file)
    console.log('File content read, length:', content.length)
    
    const extension = file.name.split('.').pop()?.toLowerCase()
    console.log('File extension:', extension)

    switch (extension) {
      case 'json':
        console.log('Importing as JSON')
        return this.importFromJSON(content)
      case 'csv':
        console.log('Importing as CSV')
        return this.importFromCSV(content)
      default:
        throw new Error(`Unsupported file format: ${extension}`)
    }
  }

  private readFile(file: File): Promise<string> {
    console.log('Reading file:', file.name)
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        console.log('FileReader onload triggered')
        const content = event.target?.result
        if (typeof content === 'string') {
          console.log('File read successfully, content length:', content.length)
          resolve(content)
        } else {
          console.error('File content is not a string:', typeof content)
          reject(new Error('Failed to read file content'))
        }
      }
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error)
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsText(file)
      console.log('FileReader.readAsText called')
    })
  }
}
