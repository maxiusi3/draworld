import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImageUploader } from '../ImageUploader'

// Mock file validation
jest.mock('@/lib/utils', () => ({
  validateFile: jest.fn((file) => {
    if (file.type === 'text/plain') {
      return { valid: false, error: 'Please upload a JPEG or PNG image.' }
    }
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'File size must be less than 10MB.' }
    }
    return { valid: true }
  }),
}))

describe('ImageUploader Component', () => {
  const mockOnImageSelect = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders upload area correctly', () => {
    render(
      <ImageUploader 
        onImageSelect={mockOnImageSelect}
        onError={mockOnError}
      />
    )
    
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
    expect(screen.getByText(/browse files/i)).toBeInTheDocument()
    expect(screen.getByText(/jpeg, png/i)).toBeInTheDocument()
  })

  it('handles valid file upload', async () => {
    render(
      <ImageUploader 
        onImageSelect={mockOnImageSelect}
        onError={mockOnError}
      />
    )

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const input = screen.getByTestId('file-input')
    
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockOnImageSelect).toHaveBeenCalledWith(file)
    })
  })

  it('handles invalid file type', async () => {
    render(
      <ImageUploader 
        onImageSelect={mockOnImageSelect}
        onError={mockOnError}
      />
    )

    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByTestId('file-input')
    
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Please upload a JPEG or PNG image.')
      expect(mockOnImageSelect).not.toHaveBeenCalled()
    })
  })

  it('handles file too large', async () => {
    render(
      <ImageUploader 
        onImageSelect={mockOnImageSelect}
        onError={mockOnError}
      />
    )

    // Create a mock large file
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { 
      type: 'image/jpeg' 
    })
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 })
    
    const input = screen.getByTestId('file-input')
    
    fireEvent.change(input, { target: { files: [largeFile] } })

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('File size must be less than 10MB.')
      expect(mockOnImageSelect).not.toHaveBeenCalled()
    })
  })

  it('handles drag and drop', async () => {
    render(
      <ImageUploader 
        onImageSelect={mockOnImageSelect}
        onError={mockOnError}
      />
    )

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const dropZone = screen.getByTestId('drop-zone')
    
    fireEvent.dragOver(dropZone)
    expect(dropZone).toHaveClass('border-pink-500')
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(mockOnImageSelect).toHaveBeenCalledWith(file)
    })
  })

  it('shows preview when image is selected', async () => {
    render(
      <ImageUploader 
        onImageSelect={mockOnImageSelect}
        onError={mockOnError}
      />
    )

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const input = screen.getByTestId('file-input')
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:test-url')
    
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByTestId('image-preview')).toBeInTheDocument()
      expect(screen.getByAltText('Uploaded preview')).toBeInTheDocument()
    })
  })

  it('allows removing selected image', async () => {
    render(
      <ImageUploader 
        onImageSelect={mockOnImageSelect}
        onError={mockOnError}
      />
    )

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const input = screen.getByTestId('file-input')
    
    global.URL.createObjectURL = jest.fn(() => 'blob:test-url')
    global.URL.revokeObjectURL = jest.fn()
    
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByTestId('image-preview')).toBeInTheDocument()
    })

    const removeButton = screen.getByTestId('remove-image-button')
    fireEvent.click(removeButton)

    expect(screen.queryByTestId('image-preview')).not.toBeInTheDocument()
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url')
  })

  it('handles multiple files by taking the first one', async () => {
    render(
      <ImageUploader 
        onImageSelect={mockOnImageSelect}
        onError={mockOnError}
      />
    )

    const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' })
    const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
    const input = screen.getByTestId('file-input')
    
    fireEvent.change(input, { target: { files: [file1, file2] } })

    await waitFor(() => {
      expect(mockOnImageSelect).toHaveBeenCalledWith(file1)
      expect(mockOnImageSelect).toHaveBeenCalledTimes(1)
    })
  })
})