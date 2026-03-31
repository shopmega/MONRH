/**
 * Test suite for AVIS API client functions
 * Tests all major AVISINE API integration points
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  searchCompanies,
  resolveCompany,
  getCompanyById,
  getCompanyContextCard,
  getCompanyRiskSummary,
  getCompanySalaryBenchmarks,
  getCompanyTrust,
  getAvisSiteUrl,
  type AVisSearchOptions,
  type AVisResolveRequest,
  type AVisCompany,
  type AVisSearchResult,
  type AVisResolveResult,
  type AVisCompanyDetailResult,
  type AVisCompanyContextCardResult,
  type AVisCompanyRiskSummaryResult,
  type AVisCompanySalaryBenchmarksResult,
  type AVisCompanyTrustResult,
} from './avis-api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
const originalEnv = process.env;

describe('AVIS API Client', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env = {
      ...originalEnv,
      AVIS_API_URL: 'https://api.avisine.com',
      NEXT_PUBLIC_AVIS_SITE_URL: 'https://avisine.com',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('searchCompanies', () => {
    it('should search companies successfully with basic query', async () => {
      const mockResponse: AVisSearchResult = {
        results: [
          {
            id: 'company-123',
            name: 'Test Company',
            slug: 'test-company',
            category: 'Technology',
            logo_url: 'https://example.com/logo.png',
            city: 'Paris',
            overall_rating: 4.5,
            description: 'A test company',
            is_claimed: true,
            entity_type: 'company',
            match_confidence: 'high',
          },
        ],
        query: 'Test Company',
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        filters: { category: null, city: null },
        meta: {
          responseTime: '50ms',
          contractVersion: 'companies.v1',
          source: 'businesses_adapter',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchCompanies('Test Company');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.avisine.com/api/v1/companies/search?q=Test+Company',
        {
          headers: { Accept: 'application/json' },
          next: { revalidate: 0 },
          signal: expect.any(AbortSignal),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle search with all options', async () => {
      const options: AVisSearchOptions = {
        limit: 20,
        page: 2,
        city: 'Paris',
        category: 'Technology',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], query: 'test', pagination: { page: 2, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false }, filters: { category: 'Technology', city: 'Paris' } }),
      });

      await searchCompanies('test', options);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.avisine.com/api/v1/companies/search?q=test&limit=20&page=2&city=Paris&category=Technology',
        expect.any(Object)
      );
    });

    it('should return empty result for queries that are too short or too long', async () => {
      const shortResult = await searchCompanies('a');
      expect(shortResult.results).toHaveLength(0);
      expect(mockFetch).not.toHaveBeenCalled();

      const longResult = await searchCompanies('a'.repeat(101));
      expect(longResult.results).toHaveLength(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchCompanies('test')).rejects.toThrow('AVis API error: 500 Internal Server Error');
    });

    it('should handle timeout scenarios', async () => {
      mockFetch.mockImplementationOnce(() => new Promise((_, reject) => {
        setTimeout(() => reject(new DOMException('AbortError', 'AbortError')), 10);
      }));

      await expect(searchCompanies('test')).rejects.toThrow();
    });

    it('should throw error when AVIS_API_URL is not configured', async () => {
      delete process.env.AVIS_API_URL;

      await expect(searchCompanies('test')).rejects.toThrow('AVIS_API_URL is not configured');
    });
  });

  describe('resolveCompany', () => {
    it('should resolve company successfully', async () => {
      const mockResponse: AVisResolveResult = {
        companyId: 'company-123',
        confidence: 'high',
        method: 'name',
        normalizedCompanySlug: 'test-company',
        candidates: [
          {
            companyId: 'company-123',
            score: 0.95,
            reason: 'Exact name match',
          },
        ],
        meta: {
          contractVersion: 'companies.resolve.v1',
          source: 'businesses_adapter',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const request: AVisResolveRequest = {
        companyName: 'Test Company',
        city: 'Paris',
      };

      const result = await resolveCompany(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.avisine.com/api/v1/companies/resolve',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyName: 'Test Company',
            city: 'Paris',
          }),
          next: { revalidate: 0 },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should return empty result for empty company name', async () => {
      const result = await resolveCompany({ companyName: '   ' });

      expect(result).toEqual({
        companyId: null,
        confidence: 'none',
        method: 'none',
        normalizedCompanySlug: '',
        candidates: [],
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(resolveCompany({ companyName: 'test' })).rejects.toThrow('AVis resolve error: 400 Bad Request');
    });
  });

  describe('getCompanyById', () => {
    it('should get company details successfully', async () => {
      const mockResponse: AVisCompanyDetailResult = {
        company: {
          id: 'company-123',
          slug: 'test-company',
          name: 'Test Company',
          city: 'Paris',
          location: 'Paris, France',
          category: 'Technology',
          description: 'A test company',
          website: 'https://testcompany.com',
          logo_url: 'https://example.com/logo.png',
          overall_rating: 4.5,
          review_count: 100,
          is_claimed: true,
          entity_type: 'company',
          trust_summary: {
            overallScore: 85,
            confidenceLevel: 'high',
            confidenceLabel: 'High confidence',
            sourceMixLabel: 'Multiple sources',
            whyThisResult: 'Strong evidence from reviews and verification',
            lastUpdatedAt: '2024-01-01T00:00:00Z',
          },
        },
        meta: {
          contractVersion: 'companies.detail.v1',
          source: 'businesses_adapter',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getCompanyById('company-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.avisine.com/api/v1/companies/company-123',
        {
          headers: { Accept: 'application/json' },
          next: { revalidate: 0 },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle 404 responses gracefully', async () => {
      const mockResponse = {
        company: null,
        error: 'Company not found',
        message: 'No company found with ID: invalid-id',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockResponse,
      });

      const result = await getCompanyById('invalid-id');

      expect(result).toEqual(mockResponse);
    });

    it('should return error for invalid company ID', async () => {
      const result = await getCompanyById('   ');

      expect(result).toEqual({
        company: null,
        error: 'Invalid company id',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('getCompanyContextCard', () => {
    it('should get company context card successfully', async () => {
      const mockResponse: AVisCompanyContextCardResult = {
        companyId: 'company-123',
        contextCard: {
          id: 'company-123',
          slug: 'test-company',
          name: 'Test Company',
          city: 'Paris',
          category: 'Technology',
          overallRating: 4.5,
          reviewCount: 100,
          isClaimed: true,
          trustSummary: {
            overallScore: 85,
            confidenceLevel: 'high',
            confidenceLabel: 'High confidence',
            sourceMixLabel: 'Multiple sources',
            whyThisResult: 'Strong evidence',
            lastUpdatedAt: '2024-01-01T00:00:00Z',
          },
          verificationSummary: {
            total: 50,
            verified: 45,
            rejected: 3,
            needsMoreInfo: 2,
            criticalQueueCount: 1,
            evidenceArtifactCount: 25,
            evidenceAvailableCount: 20,
          },
          salarySummary: {
            submissionCount: 30,
            medianMonthlySalary: 3500,
            pctAboveCityAvg: 15,
            pctAboveSectorAvg: 10,
            mostReportedJobTitle: 'Software Engineer',
          },
          riskSummary: {
            level: 'low',
            reasons: ['Strong verification record', 'Positive reviews'],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getCompanyContextCard('company-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.avisine.com/api/v1/companies/company-123/context-card',
        {
          headers: { Accept: 'application/json' },
          next: { revalidate: 0 },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle 404 responses', async () => {
      const mockResponse = {
        companyId: null,
        contextCard: null,
        error: 'Company not found',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockResponse,
      });

      const result = await getCompanyContextCard('invalid-id');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCompanyRiskSummary', () => {
    it('should get company risk summary successfully', async () => {
      const mockResponse: AVisCompanyRiskSummaryResult = {
        companyId: 'company-123',
        riskSummary: {
          level: 'medium',
          reasons: ['Mixed verification results', 'Some negative reviews'],
          trustScore: 65,
          confidenceLevel: 'medium',
          verificationTotal: 25,
          salarySubmissionCount: 15,
          criticalQueueCount: 2,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getCompanyRiskSummary('company-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.avisine.com/api/v1/companies/company-123/risk-summary',
        {
          headers: { Accept: 'application/json' },
          next: { revalidate: 0 },
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCompanySalaryBenchmarks', () => {
    it('should get company salary benchmarks successfully', async () => {
      const mockResponse: AVisCompanySalaryBenchmarksResult = {
        companyId: 'company-123',
        salaryBenchmarks: {
          submissionCount: 30,
          medianMonthlySalary: 3500,
          pctAboveCityAvg: 15,
          pctAboveSectorAvg: 10,
          mostReportedJobTitle: 'Software Engineer',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getCompanySalaryBenchmarks('company-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.avisine.com/api/v1/companies/company-123/salary-benchmarks',
        {
          headers: { Accept: 'application/json' },
          next: { revalidate: 0 },
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCompanyTrust', () => {
    it('should get company trust information successfully', async () => {
      const mockResponse: AVisCompanyTrustResult = {
        companyId: 'company-123',
        trust: {
          overallScore: 85,
          confidenceLevel: 'high',
        },
        sources: [
          { id: 'reviews', label: 'Reviews', count: 100 },
          { id: 'salaries', label: 'Salaries', count: 30 },
          { id: 'verification', label: 'Verification', count: 50 },
        ],
        assumptions: ['Recent verification activity'],
        missingInformation: ['Historical data'],
        signalsSummary: {
          reviewCount: 100,
          salaryCount: 30,
          approvedOfferCount: 25,
          offerTransparencyScore: 80,
          offerSalaryDisclosureRate: 75,
          verificationCount: 50,
          verifiedCount: 45,
          rejectedCount: 3,
          needsMoreInfoCount: 2,
          evidenceArtifactCount: 25,
          evidenceAvailableCount: 20,
          verificationQueueOpenCount: 5,
          verificationQueueInReviewCount: 3,
          verificationQueueCriticalCount: 1,
          moderationReviewTotal: 10,
          moderationRejectedReviewCount: 2,
          moderationFlaggedReviewCount: 3,
          moderationQueueOpenCount: 5,
          moderationQueueInReviewCount: 3,
          moderationQueueCriticalCount: 1,
          isClaimed: true,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getCompanyTrust('company-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.avisine.com/api/v1/companies/company-123/trust',
        {
          headers: { Accept: 'application/json' },
          next: { revalidate: 0 },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should return error for invalid company ID', async () => {
      const result = await getCompanyTrust('   ');

      expect(result).toEqual({
        companyId: null,
        trust: null,
        sources: [],
        assumptions: [],
        missingInformation: ['Invalid company id'],
        signalsSummary: null,
        error: 'Invalid company id',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('getAvisSiteUrl', () => {
    it('should return NEXT_PUBLIC_AVIS_SITE_URL when available', () => {
      const url = getAvisSiteUrl();
      expect(url).toBe('https://avisine.com');
    });

    it('should fallback to AVIS_API_URL when public URL is not available', () => {
      delete process.env.NEXT_PUBLIC_AVIS_SITE_URL;
      const url = getAvisSiteUrl();
      expect(url).toBe('https://api.avisine.com');
    });

    it('should return default URL when neither is configured', () => {
      delete process.env.NEXT_PUBLIC_AVIS_SITE_URL;
      delete process.env.AVIS_API_URL;
      const url = getAvisSiteUrl();
      expect(url).toBe('https://avisine.com');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(searchCompanies('test')).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(searchCompanies('test')).rejects.toThrow('Invalid JSON');
    });

    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      });

      // This should not throw, but return the malformed response
      const result = await searchCompanies('test');
      expect(result).toEqual({ invalid: 'response' });
    });

    it('should handle special characters in company IDs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ company: null }),
      });

      await getCompanyById('company-with-special-chars-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.avisine.com/api/v1/companies/company-with-special-chars-123',
        expect.any(Object)
      );
    });
  });

  describe('Parameter validation', () => {
    it('should validate search limit bounds', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], query: 'test', pagination: { page: 1, limit: 1, total: 0, totalPages: 0, hasNext: false, hasPrev: false }, filters: { category: null, city: null } }),
      });

      await searchCompanies('test', { limit: 0 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=1'),
        expect.any(Object)
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], query: 'test', pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasNext: false, hasPrev: false }, filters: { category: null, city: null } }),
      });

      await searchCompanies('test', { limit: 100 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );
    });

    it('should validate page bounds', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], query: 'test', pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false }, filters: { category: null, city: null } }),
      });

      await searchCompanies('test', { page: 0 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1'),
        expect.any(Object)
      );
    });
  });
});
