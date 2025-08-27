import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Simple mock component for testing
const CreditDisplay = ({ credits }: { credits: number }) => (
  <div data-testid="credit-display">{credits} credits</div>
)

describe('CreditDisplay', () => {
  it('displays credit amount correctly', () => {
    render(<CreditDisplay credits={150} />)
    expect(screen.getByTestId('credit-display')).toHaveTextContent('150 credits')
  })

  it('handles zero credits', () => {
    render(<CreditDisplay credits={0} />)
    expect(screen.getByTestId('credit-display')).toHaveTextContent('0 credits')
  })
})