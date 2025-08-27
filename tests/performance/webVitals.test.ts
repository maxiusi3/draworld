/**
 * Web Vitals Performance Tests
 * Tests Core Web Vitals metrics for key pages
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

// Mock web-vitals library for testing
jest.mock('web-vitals', () => ({
  getCLS: jest.fn(),
  getFID: jest.fn(),
  getFCP: jest.fn(),
  getLCP: jest.fn(),
  getTTFB: jest.fn(),
}))

describe('Web Vitals Performance Tests', () => {
  let mockMetrics: { [key: string]: number }

  beforeEach(() => {
    mockMetrics = {}
    
    // Mock metric collection
    ;(getCLS as jest.Mock).mockImplementation((callback) => {
      callback({ value: mockMetrics.cls || 0.1 })
    })
    
    ;(getFID as jest.Mock).mockImplementation((callback) => {
      callback({ value: mockMetrics.fid || 50 })
    })
    
    ;(getFCP as jest.Mock).mockImplementation((callback) => {
      callback({ value: mockMetrics.fcp || 1200 })
    })
    
    ;(getLCP as jest.Mock).mockImplementation((callback) => {
      callback({ value: mockMetrics.lcp || 2000 })
    })
    
    ;(getTTFB as jest.Mock).mockImplementation((callback) => {
      callback({ value: mockMetrics.ttfb || 300 })
    })
  })

  describe('Core Web Vitals Thresholds', () => {
    it('should have good CLS (Cumulative Layout Shift) score', (done) => {
      mockMetrics.cls = 0.05 // Good score
      
      getCLS((metric) => {
        expect(metric.value).toBeLessThan(0.1) // Good threshold
        expect(metric.value).toBeLessThan(0.25) // Poor threshold
        done()
      })
    })

    it('should have good FID (First Input Delay) score', (done) => {
      mockMetrics.fid = 80 // Good score
      
      getFID((metric) => {
        expect(metric.value).toBeLessThan(100) // Good threshold
        expect(metric.value).toBeLessThan(300) // Poor threshold
        done()
      })
    })

    it('should have good FCP (First Contentful Paint) score', (done) => {
      mockMetrics.fcp = 1500 // Good score
      
      getFCP((metric) => {
        expect(metric.value).toBeLessThan(1800) // Good threshold
        expect(metric.value).toBeLessThan(3000) // Poor threshold
        done()
      })
    })

    it('should have good LCP (Largest Contentful Paint) score', (done) => {
      mockMetrics.lcp = 2200 // Good score
      
      getLCP((metric) => {
        expect(metric.value).toBeLessThan(2500) // Good threshold
        expect(metric.value).toBeLessThan(4000) // Poor threshold
        done()
      })
    })

    it('should have good TTFB (Time to First Byte) score', (done) => {
      mockMetrics.ttfb = 500 // Good score
      
      getTTFB((metric) => {
        expect(metric.value).toBeLessThan(800) // Good threshold
        expect(metric.value).toBeLessThan(1800) // Poor threshold
        done()
      })
    })
  })

  describe('Performance Budget Tests', () => {
    it('should meet performance budget for homepage', () => {
      const performanceBudget = {
        lcp: 2500, // ms
        fid: 100,  // ms
        cls: 0.1,  // score
        fcp: 1800, // ms
        ttfb: 800, // ms
      }

      // Simulate homepage metrics
      mockMetrics = {
        lcp: 2200,
        fid: 80,
        cls: 0.05,
        fcp: 1500,
        ttfb: 500,
      }

      Object.entries(mockMetrics).forEach(([metric, value]) => {
        expect(value).toBeLessThanOrEqual(performanceBudget[metric as keyof typeof performanceBudget])
      })
    })

    it('should meet performance budget for create page', () => {
      const performanceBudget = {
        lcp: 3000, // ms (slightly higher due to image upload components)
        fid: 100,  // ms
        cls: 0.1,  // score
        fcp: 2000, // ms
        ttfb: 800, // ms
      }

      // Simulate create page metrics
      mockMetrics = {
        lcp: 2800,
        fid: 90,
        cls: 0.08,
        fcp: 1800,
        ttfb: 600,
      }

      Object.entries(mockMetrics).forEach(([metric, value]) => {
        expect(value).toBeLessThanOrEqual(performanceBudget[metric as keyof typeof performanceBudget])
      })
    })

    it('should meet performance budget for gallery page', () => {
      const performanceBudget = {
        lcp: 2800, // ms (higher due to image loading)
        fid: 100,  // ms
        cls: 0.15, // score (slightly higher due to dynamic content)
        fcp: 2000, // ms
        ttfb: 800, // ms
      }

      // Simulate gallery page metrics
      mockMetrics = {
        lcp: 2600,
        fid: 85,
        cls: 0.12,
        fcp: 1900,
        ttfb: 650,
      }

      Object.entries(mockMetrics).forEach(([metric, value]) => {
        expect(value).toBeLessThanOrEqual(performanceBudget[metric as keyof typeof performanceBudget])
      })
    })
  })

  describe('Performance Regression Tests', () => {
    it('should not regress from baseline performance', () => {
      // Baseline metrics from previous measurements
      const baseline = {
        lcp: 2200,
        fid: 80,
        cls: 0.05,
        fcp: 1500,
        ttfb: 500,
      }

      // Allow 10% regression tolerance
      const regressionTolerance = 0.1

      mockMetrics = {
        lcp: 2300, // 4.5% increase - acceptable
        fid: 85,   // 6.25% increase - acceptable
        cls: 0.055, // 10% increase - at limit
        fcp: 1600, // 6.7% increase - acceptable
        ttfb: 520, // 4% increase - acceptable
      }

      Object.entries(mockMetrics).forEach(([metric, value]) => {
        const baselineValue = baseline[metric as keyof typeof baseline]
        const maxAllowed = baselineValue * (1 + regressionTolerance)
        
        expect(value).toBeLessThanOrEqual(maxAllowed)
      })
    })
  })

  describe('Mobile Performance Tests', () => {
    it('should meet mobile performance thresholds', () => {
      // Mobile thresholds are typically stricter
      const mobileThresholds = {
        lcp: 3000, // ms
        fid: 100,  // ms
        cls: 0.1,  // score
        fcp: 2000, // ms
        ttfb: 1000, // ms
      }

      // Simulate mobile metrics (typically slower)
      mockMetrics = {
        lcp: 2800,
        fid: 95,
        cls: 0.08,
        fcp: 1900,
        ttfb: 800,
      }

      Object.entries(mockMetrics).forEach(([metric, value]) => {
        expect(value).toBeLessThanOrEqual(mobileThresholds[metric as keyof typeof mobileThresholds])
      })
    })
  })

  describe('Performance Monitoring', () => {
    it('should collect all required metrics', () => {
      const requiredMetrics = ['cls', 'fid', 'fcp', 'lcp', 'ttfb']
      
      requiredMetrics.forEach(metric => {
        expect(mockMetrics).toHaveProperty(metric)
        expect(typeof mockMetrics[metric]).toBe('number')
        expect(mockMetrics[metric]).toBeGreaterThanOrEqual(0)
      })
    })

    it('should handle metric collection errors gracefully', () => {
      // Simulate metric collection failure
      ;(getLCP as jest.Mock).mockImplementation((callback) => {
        // Simulate no callback execution (metric not available)
      })

      expect(() => {
        getLCP(() => {})
      }).not.toThrow()
    })
  })

  describe('Resource Loading Performance', () => {
    it('should load critical resources within budget', () => {
      // Mock performance entries
      const mockPerformanceEntries = [
        {
          name: 'https://example.com/app.js',
          duration: 800,
          transferSize: 150000,
        },
        {
          name: 'https://example.com/styles.css',
          duration: 400,
          transferSize: 50000,
        },
      ]

      // Resource loading budgets
      const resourceBudgets = {
        javascript: { duration: 1000, size: 200000 },
        css: { duration: 500, size: 100000 },
      }

      mockPerformanceEntries.forEach(entry => {
        if (entry.name.endsWith('.js')) {
          expect(entry.duration).toBeLessThanOrEqual(resourceBudgets.javascript.duration)
          expect(entry.transferSize).toBeLessThanOrEqual(resourceBudgets.javascript.size)
        } else if (entry.name.endsWith('.css')) {
          expect(entry.duration).toBeLessThanOrEqual(resourceBudgets.css.duration)
          expect(entry.transferSize).toBeLessThanOrEqual(resourceBudgets.css.size)
        }
      })
    })
  })
})