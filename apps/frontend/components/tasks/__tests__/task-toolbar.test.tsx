import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, jest } from '@jest/globals'
import { TaskToolbar } from '../task-toolbar'

describe('TaskToolbar', () => {
  const defaultProps = {
    viewMode: 'grid' as const,
    onViewModeChange: jest.fn(),
    onCreateTask: jest.fn(),
  }

  it('should render create task button', () => {
    render(<TaskToolbar {...defaultProps} />)
    
    const createButton = screen.getByRole('button', { name: /create task/i })
    expect(createButton).toBeInTheDocument()
  })

  it('should call onCreateTask when create button is clicked', () => {
    render(<TaskToolbar {...defaultProps} />)
    
    const createButton = screen.getByRole('button', { name: /create task/i })
    fireEvent.click(createButton)
    
    expect(defaultProps.onCreateTask).toHaveBeenCalledTimes(1)
  })

  it('should render view mode buttons', () => {
    render(<TaskToolbar {...defaultProps} />)
    
    const gridButton = screen.getByRole('button', { name: /grid view/i })
    const tableButton = screen.getByRole('button', { name: /table view/i })
    
    expect(gridButton).toBeInTheDocument()
    expect(tableButton).toBeInTheDocument()
  })

  it('should highlight active view mode', () => {
    render(<TaskToolbar {...defaultProps} viewMode="grid" />)
    
    const gridButton = screen.getByRole('button', { name: /grid view/i })
    expect(gridButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('should call onViewModeChange when view mode button is clicked', () => {
    render(<TaskToolbar {...defaultProps} />)
    
    const tableButton = screen.getByRole('button', { name: /table view/i })
    fireEvent.click(tableButton)
    
    expect(defaultProps.onViewModeChange).toHaveBeenCalledWith('table')
  })

  describe('Export functionality', () => {
    it('should render export button when onExport is provided', () => {
      const onExport = jest.fn()
      render(<TaskToolbar {...defaultProps} onExport={onExport} />)
      
      const exportButton = screen.getByRole('button', { name: /export/i })
      expect(exportButton).toBeInTheDocument()
    })

    it('should not render export button when onExport is not provided', () => {
      render(<TaskToolbar {...defaultProps} />)
      
      const exportButton = screen.queryByRole('button', { name: /export/i })
      expect(exportButton).not.toBeInTheDocument()
    })

    it('should show export menu when export button is clicked', () => {
      const onExport = jest.fn()
      render(<TaskToolbar {...defaultProps} onExport={onExport} />)
      
      const exportButton = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportButton)
      
      expect(screen.getByText(/export as json/i)).toBeInTheDocument()
      expect(screen.getByText(/export as csv/i)).toBeInTheDocument()
    })

    it('should call onExport with json format', () => {
      const onExport = jest.fn()
      render(<TaskToolbar {...defaultProps} onExport={onExport} />)
      
      const exportButton = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportButton)
      
      const jsonOption = screen.getByText(/export as json/i)
      fireEvent.click(jsonOption)
      
      expect(onExport).toHaveBeenCalledWith('json')
    })

    it('should call onExport with csv format', () => {
      const onExport = jest.fn()
      render(<TaskToolbar {...defaultProps} onExport={onExport} />)
      
      const exportButton = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportButton)
      
      const csvOption = screen.getByText(/export as csv/i)
      fireEvent.click(csvOption)
      
      expect(onExport).toHaveBeenCalledWith('csv')
    })

    it('should disable export button when isExporting is true', () => {
      const onExport = jest.fn()
      render(<TaskToolbar {...defaultProps} onExport={onExport} isExporting={true} />)
      
      const exportButton = screen.getByRole('button', { name: /export/i })
      expect(exportButton).toBeDisabled()
    })
  })

  describe('Import functionality', () => {
    it('should render import button when onImport is provided', () => {
      const onImport = jest.fn()
      render(<TaskToolbar {...defaultProps} onImport={onImport} />)
      
      const importButton = screen.getByRole('button', { name: /import/i })
      expect(importButton).toBeInTheDocument()
    })

    it('should not render import button when onImport is not provided', () => {
      render(<TaskToolbar {...defaultProps} />)
      
      const importButton = screen.queryByRole('button', { name: /import/i })
      expect(importButton).not.toBeInTheDocument()
    })

    it('should trigger file input when import button is clicked', () => {
      const onImport = jest.fn()
      render(<TaskToolbar {...defaultProps} onImport={onImport} />)
      
      const importButton = screen.getByRole('button', { name: /import/i })
      const fileInput = screen.getByLabelText(/import tasks file/i)
      
      const clickSpy = jest.spyOn(fileInput, 'click')
      fireEvent.click(importButton)
      
      expect(clickSpy).toHaveBeenCalled()
    })

    it('should call onImport when file is selected', () => {
      const onImport = jest.fn()
      render(<TaskToolbar {...defaultProps} onImport={onImport} />)
      
      const fileInput = screen.getByLabelText(/import tasks file/i) as HTMLInputElement
      const file = new File(['content'], 'tasks.json', { type: 'application/json' })
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })
      
      fireEvent.change(fileInput)
      
      expect(onImport).toHaveBeenCalledWith(file)
    })

    it('should accept only json and csv files', () => {
      const onImport = jest.fn()
      render(<TaskToolbar {...defaultProps} onImport={onImport} />)
      
      const fileInput = screen.getByLabelText(/import tasks file/i) as HTMLInputElement
      expect(fileInput).toHaveAttribute('accept', '.json,.csv')
    })

    it('should disable import button when isImporting is true', () => {
      const onImport = jest.fn()
      render(<TaskToolbar {...defaultProps} onImport={onImport} isImporting={true} />)
      
      const importButton = screen.getByRole('button', { name: /import/i })
      expect(importButton).toBeDisabled()
    })

    it('should reset file input after selection', () => {
      const onImport = jest.fn()
      render(<TaskToolbar {...defaultProps} onImport={onImport} />)
      
      const fileInput = screen.getByLabelText(/import tasks file/i) as HTMLInputElement
      const file = new File(['content'], 'tasks.json', { type: 'application/json' })
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })
      
      fireEvent.change(fileInput)
      
      // Value should be reset to allow importing the same file again
      expect(fileInput.value).toBe('')
    })
  })
})
