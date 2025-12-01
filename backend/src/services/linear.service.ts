/**
 * Linear API Service
 * Handles all communication with Linear's GraphQL API for issue management
 */

// Linear Issue Priority Mapping
// Linear uses: 0 = No priority, 1 = Urgent, 2 = High, 3 = Medium, 4 = Low
export const LINEAR_PRIORITY_MAP = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
} as const;

// Reverse mapping for display
export const PRIORITY_LABEL_MAP: Record<number, string> = {
  0: 'No Priority',
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
};

// Linear API response interfaces
export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  url: string;
  priority: number;
  state: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
  labels?: {
    nodes: Array<{ id: string; name: string; color: string }>;
  };
}

export interface LinearCreateIssueResponse {
  issueCreate: {
    success: boolean;
    issue: LinearIssue;
  };
}

export interface LinearIssuesResponse {
  team: {
    issues: {
      nodes: LinearIssue[];
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };
}

export interface LinearIssueResponse {
  issue: LinearIssue;
}

export interface CreateIssueInput {
  title: string;
  description?: string;
  priority?: keyof typeof LINEAR_PRIORITY_MAP;
  labelIds?: string[];
}

// In-memory cache for Linear issues
interface CacheEntry {
  data: any;
  timestamp: number;
}

const issuesCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

class LinearService {
  private apiUrl = 'https://api.linear.app/graphql';
  private apiToken: string | undefined;
  private teamId: string | undefined;

  constructor() {
    this.apiToken = process.env.LINEAR_API_TOKEN;
    this.teamId = process.env.LINEAR_TEAM_ID;
  }

  /**
   * Check if Linear is configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiToken && this.teamId);
  }

  /**
   * Make a GraphQL request to Linear API
   */
  private async graphqlRequest<T>(query: string, variables?: Record<string, any>): Promise<T> {
    if (!this.apiToken) {
      throw new LinearApiError('LINEAR_API_TOKEN is not configured', 'CONFIG_ERROR');
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new LinearApiError(
        `Rate limited by Linear API. Retry after ${retryAfter || 'unknown'} seconds`,
        'RATE_LIMITED'
      );
    }

    // Handle authentication errors
    if (response.status === 401) {
      throw new LinearApiError('Invalid Linear API token', 'UNAUTHORIZED');
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new LinearApiError(
        `Linear API error: ${response.status} - ${errorBody}`,
        'API_ERROR'
      );
    }

    const result = await response.json() as { data?: T; errors?: Array<{ message: string }> };

    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors.map((e) => e.message).join(', ');
      throw new LinearApiError(`GraphQL error: ${errorMessage}`, 'GRAPHQL_ERROR');
    }

    return result.data as T;
  }

  /**
   * Create a new issue in Linear
   */
  async createIssue(input: CreateIssueInput): Promise<LinearIssue> {
    if (!this.teamId) {
      throw new LinearApiError('LINEAR_TEAM_ID is not configured', 'CONFIG_ERROR');
    }

    const mutation = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            description
            url
            priority
            state {
              id
              name
              type
            }
            createdAt
            updatedAt
            labels {
              nodes {
                id
                name
                color
              }
            }
          }
        }
      }
    `;

    const variables = {
      input: {
        teamId: this.teamId,
        title: input.title,
        description: input.description || '',
        priority: input.priority ? LINEAR_PRIORITY_MAP[input.priority] : 0,
        labelIds: input.labelIds,
      },
    };

    const response = await this.graphqlRequest<LinearCreateIssueResponse>(mutation, variables);

    if (!response.issueCreate.success) {
      throw new LinearApiError('Failed to create issue in Linear', 'CREATE_FAILED');
    }

    // Invalidate cache after creating
    this.invalidateCache();

    return response.issueCreate.issue;
  }

  /**
   * Get all issues for the configured team
   */
  async getIssues(options?: {
    first?: number;
    after?: string;
    filter?: {
      state?: { type?: { in?: string[] } };
    };
    bypassCache?: boolean;
  }): Promise<{ issues: LinearIssue[]; hasNextPage: boolean; endCursor: string | null }> {
    if (!this.teamId) {
      throw new LinearApiError('LINEAR_TEAM_ID is not configured', 'CONFIG_ERROR');
    }

    // Check cache first (unless bypassed)
    const cacheKey = `issues-${JSON.stringify(options || {})}`;
    if (!options?.bypassCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Build query - simpler version without complex filter nesting
    const query = `
      query GetIssues($teamId: String!, $first: Int, $after: String) {
        team(id: $teamId) {
          issues(first: $first, after: $after, orderBy: createdAt) {
            nodes {
              id
              identifier
              title
              description
              url
              priority
              state {
                id
                name
                type
              }
              createdAt
              updatedAt
              labels {
                nodes {
                  id
                  name
                  color
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `;

    const variables = {
      teamId: this.teamId,
      first: options?.first || 50,
      after: options?.after,
    };

    const response = await this.graphqlRequest<LinearIssuesResponse>(query, variables);

    const result = {
      issues: response.team?.issues?.nodes || [],
      hasNextPage: response.team?.issues?.pageInfo?.hasNextPage || false,
      endCursor: response.team?.issues?.pageInfo?.endCursor || null,
    };

    // Store in cache
    this.setInCache(cacheKey, result);

    return result;
  }

  /**
   * Get a single issue by ID
   */
  async getIssue(issueId: string): Promise<LinearIssue> {
    const cacheKey = `issue-${issueId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const query = `
      query GetIssue($issueId: String!) {
        issue(id: $issueId) {
          id
          identifier
          title
          description
          url
          priority
          state {
            id
            name
            type
            }
          createdAt
          updatedAt
          labels {
            nodes {
              id
              name
              color
            }
          }
        }
      }
    `;

    const response = await this.graphqlRequest<LinearIssueResponse>(query, { issueId });
    
    this.setInCache(cacheKey, response.issue);
    
    return response.issue;
  }

  /**
   * Update an issue's status in Linear
   */
  async updateIssueState(issueId: string, stateId: string): Promise<LinearIssue> {
    const mutation = `
      mutation UpdateIssue($issueId: String!, $stateId: String!) {
        issueUpdate(id: $issueId, input: { stateId: $stateId }) {
          success
          issue {
            id
            identifier
            title
            description
            url
            priority
            state {
              id
              name
              type
            }
            createdAt
            updatedAt
          }
        }
      }
    `;

    const response = await this.graphqlRequest<{
      issueUpdate: { success: boolean; issue: LinearIssue };
    }>(mutation, { issueId, stateId });

    if (!response.issueUpdate.success) {
      throw new LinearApiError('Failed to update issue in Linear', 'UPDATE_FAILED');
    }

    this.invalidateCache();

    return response.issueUpdate.issue;
  }

  /**
   * Get available workflow states for the team
   */
  async getWorkflowStates(): Promise<Array<{ id: string; name: string; type: string }>> {
    if (!this.teamId) {
      throw new LinearApiError('LINEAR_TEAM_ID is not configured', 'CONFIG_ERROR');
    }

    const cacheKey = 'workflow-states';
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const query = `
      query GetWorkflowStates($teamId: String!) {
        team(id: $teamId) {
          states {
            nodes {
              id
              name
              type
            }
          }
        }
      }
    `;

    const response = await this.graphqlRequest<{
      team: { states: { nodes: Array<{ id: string; name: string; type: string }> } };
    }>(query, { teamId: this.teamId });

    const states = response.team.states.nodes;
    this.setInCache(cacheKey, states, 5 * 60 * 1000); // Cache for 5 minutes

    return states;
  }

  /**
   * Cache helpers
   */
  private getFromCache(key: string): any | null {
    const entry = issuesCache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      issuesCache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setInCache(key: string, data: any, ttl: number = CACHE_TTL_MS): void {
    issuesCache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Clean up old entries periodically
    if (issuesCache.size > 100) {
      const now = Date.now();
      for (const [k, v] of issuesCache.entries()) {
        if (now - v.timestamp > ttl) {
          issuesCache.delete(k);
        }
      }
    }
  }

  private invalidateCache(): void {
    issuesCache.clear();
  }
}

/**
 * Custom error class for Linear API errors
 */
export class LinearApiError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'LinearApiError';
    this.code = code;
  }
}

// Singleton instance
export const linearService = new LinearService();

