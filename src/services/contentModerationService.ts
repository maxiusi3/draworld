/**
 * Content Moderation Service
 * 
 * This service provides content safety checks for uploaded images
 * using various moderation APIs and techniques.
 */

export interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  reasons?: string[];
  categories?: string[];
}

export interface ModerationProvider {
  name: string;
  checkImage: (imageUrl: string) => Promise<ModerationResult>;
}

/**
 * Mock content moderation provider for development/testing
 */
class MockModerationProvider implements ModerationProvider {
  name = 'Mock Provider';

  async checkImage(imageUrl: string): Promise<ModerationResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock some basic checks based on filename or random
    const random = Math.random();
    
    // Simulate rejection for certain patterns (for testing)
    if (imageUrl.toLowerCase().includes('inappropriate') || 
        imageUrl.toLowerCase().includes('nsfw') ||
        random < 0.05) { // 5% random rejection for testing
      return {
        isApproved: false,
        confidence: 0.95,
        reasons: ['Potentially inappropriate content detected'],
        categories: ['adult_content']
      };
    }

    return {
      isApproved: true,
      confidence: 0.98,
      reasons: [],
      categories: []
    };
  }
}

/**
 * Google Cloud Vision API moderation provider
 * Note: This would require Google Cloud Vision API setup
 */
class GoogleVisionModerationProvider implements ModerationProvider {
  name = 'Google Vision API';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async checkImage(imageUrl: string): Promise<ModerationResult> {
    try {
      // This is a simplified example - in production you'd use the official SDK
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: { source: { imageUri: imageUrl } },
            features: [
              { type: 'SAFE_SEARCH_DETECTION', maxResults: 1 }
            ]
          }]
        })
      });

      const data = await response.json();
      const safeSearch = data.responses?.[0]?.safeSearchAnnotation;

      if (!safeSearch) {
        throw new Error('No safe search results returned');
      }

      // Check for inappropriate content
      const isAdult = safeSearch.adult === 'LIKELY' || safeSearch.adult === 'VERY_LIKELY';
      const isViolent = safeSearch.violence === 'LIKELY' || safeSearch.violence === 'VERY_LIKELY';
      const isRacy = safeSearch.racy === 'LIKELY' || safeSearch.racy === 'VERY_LIKELY';

      const reasons = [];
      const categories = [];

      if (isAdult) {
        reasons.push('Adult content detected');
        categories.push('adult_content');
      }
      if (isViolent) {
        reasons.push('Violent content detected');
        categories.push('violence');
      }
      if (isRacy) {
        reasons.push('Racy content detected');
        categories.push('racy');
      }

      return {
        isApproved: !isAdult && !isViolent && !isRacy,
        confidence: 0.9,
        reasons,
        categories
      };
    } catch (error) {
      console.error('Google Vision moderation error:', error);
      // Fallback to approval on API error (you might want different behavior)
      return {
        isApproved: true,
        confidence: 0.5,
        reasons: ['API error - defaulting to approval'],
        categories: []
      };
    }
  }
}

/**
 * AWS Rekognition moderation provider
 * Note: This would require AWS SDK setup
 */
class AWSRekognitionModerationProvider implements ModerationProvider {
  name = 'AWS Rekognition';
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor(region: string, accessKeyId: string, secretAccessKey: string) {
    this.region = region;
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
  }

  async checkImage(imageUrl: string): Promise<ModerationResult> {
    try {
      // This is a simplified example - in production you'd use the AWS SDK
      // For now, we'll return a mock result
      console.log('AWS Rekognition moderation not fully implemented - using mock result');
      
      return {
        isApproved: true,
        confidence: 0.9,
        reasons: [],
        categories: []
      };
    } catch (error) {
      console.error('AWS Rekognition moderation error:', error);
      return {
        isApproved: true,
        confidence: 0.5,
        reasons: ['API error - defaulting to approval'],
        categories: []
      };
    }
  }
}

/**
 * Main Content Moderation Service
 */
export class ContentModerationService {
  private providers: ModerationProvider[] = [];
  private requireAllProviders: boolean = false;

  constructor() {
    // Initialize with mock provider by default
    this.providers.push(new MockModerationProvider());

    // Add real providers if API keys are available
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY;
    if (googleApiKey) {
      this.providers.push(new GoogleVisionModerationProvider(googleApiKey));
    }

    const awsRegion = process.env.NEXT_PUBLIC_AWS_REGION;
    const awsAccessKey = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID;
    const awsSecretKey = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY;
    if (awsRegion && awsAccessKey && awsSecretKey) {
      this.providers.push(new AWSRekognitionModerationProvider(awsRegion, awsAccessKey, awsSecretKey));
    }
  }

  /**
   * Add a custom moderation provider
   */
  addProvider(provider: ModerationProvider): void {
    this.providers.push(provider);
  }

  /**
   * Set whether all providers must approve (true) or just one (false)
   */
  setRequireAllProviders(require: boolean): void {
    this.requireAllProviders = require;
  }

  /**
   * Check image content safety
   */
  async moderateImage(imageUrl: string): Promise<ModerationResult> {
    if (this.providers.length === 0) {
      throw new Error('No moderation providers configured');
    }

    try {
      const results = await Promise.allSettled(
        this.providers.map(provider => provider.checkImage(imageUrl))
      );

      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<ModerationResult> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      if (successfulResults.length === 0) {
        throw new Error('All moderation providers failed');
      }

      // Combine results based on strategy
      if (this.requireAllProviders) {
        // All providers must approve
        const isApproved = successfulResults.every(result => result.isApproved);
        const avgConfidence = successfulResults.reduce((sum, result) => sum + result.confidence, 0) / successfulResults.length;
        const allReasons = successfulResults.flatMap(result => result.reasons || []);
        const allCategories = [...new Set(successfulResults.flatMap(result => result.categories || []))];

        return {
          isApproved,
          confidence: avgConfidence,
          reasons: allReasons,
          categories: allCategories
        };
      } else {
        // At least one provider must approve
        const approvedResults = successfulResults.filter(result => result.isApproved);
        
        if (approvedResults.length > 0) {
          const bestResult = approvedResults.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
          );
          return bestResult;
        } else {
          // All providers rejected
          const avgConfidence = successfulResults.reduce((sum, result) => sum + result.confidence, 0) / successfulResults.length;
          const allReasons = successfulResults.flatMap(result => result.reasons || []);
          const allCategories = [...new Set(successfulResults.flatMap(result => result.categories || []))];

          return {
            isApproved: false,
            confidence: avgConfidence,
            reasons: allReasons,
            categories: allCategories
          };
        }
      }
    } catch (error) {
      console.error('Content moderation error:', error);
      throw new Error(`Content moderation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user-friendly error message for rejected content
   */
  static getErrorMessage(result: ModerationResult): string {
    if (result.isApproved) {
      return '';
    }

    const reasons = result.reasons || [];
    
    if (reasons.length === 0) {
      return 'This image cannot be processed. Please try a different image.';
    }

    if (reasons.some(r => r.toLowerCase().includes('adult'))) {
      return 'This image contains adult content and cannot be processed. Please upload a family-friendly drawing.';
    }

    if (reasons.some(r => r.toLowerCase().includes('violent'))) {
      return 'This image contains violent content and cannot be processed. Please upload a peaceful drawing.';
    }

    if (reasons.some(r => r.toLowerCase().includes('inappropriate'))) {
      return 'This image contains inappropriate content and cannot be processed. Please upload a child-friendly drawing.';
    }

    return 'This image cannot be processed due to content policy violations. Please try a different image.';
  }

  /**
   * Check if content moderation is enabled
   */
  static isEnabled(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_CONTENT_MODERATION !== 'false';
  }
}

// Export singleton instance
export const contentModerationService = new ContentModerationService();