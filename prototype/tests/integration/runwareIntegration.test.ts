/**
 * Runware AI Integration Tests
 * Tests AI video generation integration
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Runware AI Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Video Generation Request', () => {
    it('should initiate video generation with valid parameters', async () => {
      const generationRequest = {
        imageUrl: 'https://example.com/test-image.jpg',
        prompt: 'A magical adventure with dragons and unicorns',
        mood: 'joyful' as const,
        title: 'My Magical Adventure',
        userId: 'test-user-123',
      };

      const mockResponse = {
        id: 'gen_test_123',
        status: 'processing',
        estimatedTime: 60,
        progress: 0,
        createdAt: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const response = await fetch('/api/runware/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generationRequest),
      });

      const result = await response.json();

      expect(result.id).toBe('gen_test_123');
      expect(result.status).toBe('processing');
      expect(result.estimatedTime).toBe(60);
    });

    it('should validate required parameters', async () => {
      const invalidRequest = {
        // Missing imageUrl
        prompt: 'A magical adventure',
        mood: 'joyful',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: 'Missing required parameter: imageUrl',
        }),
      });

      const response = await fetch('/api/runware/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should handle different mood settings', async () => {
      const moods = ['joyful', 'epic', 'whimsical', 'dramatic', 'peaceful'] as const;

      for (const mood of moods) {
        const request = {
          imageUrl: 'https://example.com/test-image.jpg',
          prompt: 'A test scene',
          mood,
          title: `Test ${mood}`,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            id: `gen_${mood}_123`,
            status: 'processing',
            mood,
          }),
        });

        const response = await fetch('/api/runware/generate', {
          method: 'POST',
          body: JSON.stringify(request),
        });

        const result = await response.json();
        expect(result.mood).toBe(mood);
      }
    });
  });

  describe('Video Status Polling', () => {
    it('should track generation progress', async () => {
      const generationId = 'gen_test_123';

      // Mock progressive status updates
      const statusUpdates = [
        { status: 'processing', progress: 25 },
        { status: 'processing', progress: 50 },
        { status: 'processing', progress: 75 },
        { status: 'completed', progress: 100, videoUrl: 'https://example.com/video.mp4' },
      ];

      statusUpdates.forEach((update) => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: generationId,
            ...update,
            updatedAt: new Date().toISOString(),
          }),
        });
      });

      // Simulate polling
      for (let i = 0; i < statusUpdates.length; i++) {
        const response = await fetch(`/api/runware/status/${generationId}`);
        const result = await response.json();

        expect(result.id).toBe(generationId);
        expect(result.progress).toBe(statusUpdates[i].progress);
        expect(result.status).toBe(statusUpdates[i].status);

        if (result.status === 'completed') {
          expect(result.videoUrl).toBeTruthy();
        }
      }
    });

    it('should handle generation failures', async () => {
      const generationId = 'gen_failed_123';

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: generationId,
          status: 'failed',
          error: 'Content moderation failed',
          errorCode: 'CONTENT_REJECTED',
        }),
      });

      const response = await fetch(`/api/runware/status/${generationId}`);
      const result = await response.json();

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Content moderation failed');
      expect(result.errorCode).toBe('CONTENT_REJECTED');
    });
  });

  describe('Content Moderation Integration', () => {
    it('should reject inappropriate content', async () => {
      const request = {
        imageUrl: 'https://example.com/inappropriate-image.jpg',
        prompt: 'Inappropriate content',
        mood: 'joyful' as const,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: 'Content moderation failed',
          details: 'Image contains inappropriate content',
          moderationResult: {
            isAppropriate: false,
            confidence: 0.95,
            categories: ['adult_content'],
          },
        }),
      });

      const response = await fetch('/api/runware/generate', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      const result = await response.json();

      expect(response.ok).toBe(false);
      expect(result.error).toBe('Content moderation failed');
      expect(result.moderationResult.isAppropriate).toBe(false);
    });
  });
});