import { json, type LoaderFunction, type LoaderFunctionArgs } from '@remix-run/node';
import { withSecurity } from '~/lib/security';

interface GitInfo {
  local: {
    commitHash: string;
    branch: string;
    commitTime: string;
    author: string;
    email: string;
    remoteUrl: string;
    repoName: string;
  };
  github?: {
    currentRepo?: {
      fullName: string;
      defaultBranch: string;
      stars: number;
      forks: number;
      openIssues?: number;
    };
  };
  isForked?: boolean;
  timestamp?: string;
}

interface AppContext {
  env?: {
    GITHUB_ACCESS_TOKEN?: string;
  };
}

interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  languages_url: string;
}

interface GitHubGist {
  id: string;
  html_url: string;
  description: string;
}

declare const __COMMIT_HASH: string;
declare const __GIT_BRANCH: string;
declare const __GIT_COMMIT_TIME: string;
declare const __GIT_AUTHOR: string;
declare const __GIT_EMAIL: string;
declare const __GIT_REMOTE_URL: string;
declare const __GIT_REPO_NAME: string;

export const loader: LoaderFunction = withSecurity(
  async ({ request, context }: LoaderFunctionArgs & { context: AppContext }) => {
    console.log('Git info API called with URL:', request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    console.log('Git info action:', action);

    if (action === 'getUser' || action === 'getRepos' || action === 'getOrgs' || action === 'getActivity') {
      const serverGithubToken = process.env.GITHUB_ACCESS_TOKEN || context.env?.GITHUB_ACCESS_TOKEN;
      const cookieToken = request.headers
        .get('Cookie')
        ?.split(';')
        .find((cookie) => cookie.trim().startsWith('githubToken='))
        ?.split('=')[1];

      const authHeader = request.headers.get('Authorization');
      const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      const token = serverGithubToken || headerToken || cookieToken;

      if (!token) {
        return json(
          { error: 'No GitHub token available' },
          {
            status: 401,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            },
          },
        );
      }

      try {
        if (action === 'getUser') {
          const response = await fetch('https://api.github.com/user', {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
          }

          const userData = await response.json();

          return json(
            { user: userData },
            {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              },
            },
          );
        }

        if (action === 'getRepos') {
          const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (!reposResponse.ok) {
            throw new Error(`GitHub API error: ${reposResponse.status}`);
          }

          const repos = (await reposResponse.json()) as GitHubRepo[];

          const gistsResponse = await fetch('https://api.github.com/gists', {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              Authorization: `Bearer ${token}`,
            },
          });

          const gists = gistsResponse.ok ? ((await gistsResponse.json()) as GitHubGist[]) : [];
          const languageStats: Record<string, number> = {};
          let totalStars = 0;
          let totalForks = 0;

          for (const repo of repos) {
            totalStars += repo.stargazers_count || 0;
            totalForks += repo.forks_count || 0;

            if (repo.language && repo.language !== 'null') {
              languageStats[repo.language] = (languageStats[repo.language] || 0) + 1;
            }
          }

          return json(
            {
              repos,
              stats: {
                totalStars,
                totalForks,
                languages: languageStats,
                totalGists: gists.length,
              },
            },
            {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              },
            },
          );
        }

        if (action === 'getOrgs') {
          const response = await fetch('https://api.github.com/user/orgs', {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
          }

          const orgs = await response.json();

          return json(
            { organizations: orgs },
            {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              },
            },
          );
        }

        if (action === 'getActivity') {
          const username = request.headers
            .get('Cookie')
            ?.split(';')
            .find((cookie) => cookie.trim().startsWith('githubUsername='))
            ?.split('=')[1];

          if (!username) {
            return json(
              { error: 'GitHub username not found in cookies' },
              {
                status: 400,
                headers: {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                },
              },
            );
          }

          const response = await fetch(`https://api.github.com/users/${username}/events?per_page=30`, {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
          }

          const events = await response.json();

          return json(
            { recentActivity: events },
            {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              },
            },
          );
        }
      } catch (error) {
        console.error('GitHub API error:', error);
        return json(
          { error: error instanceof Error ? error.message : 'Unknown error' },
          {
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            },
          },
        );
      }
    }

    const gitInfo: GitInfo = {
      local: {
        commitHash: typeof __COMMIT_HASH !== 'undefined' ? __COMMIT_HASH : 'development',
        branch: typeof __GIT_BRANCH !== 'undefined' ? __GIT_BRANCH : 'main',
        commitTime: typeof __GIT_COMMIT_TIME !== 'undefined' ? __GIT_COMMIT_TIME : new Date().toISOString(),
        author: typeof __GIT_AUTHOR !== 'undefined' ? __GIT_AUTHOR : 'development',
        email: typeof __GIT_EMAIL !== 'undefined' ? __GIT_EMAIL : 'development@local',
        remoteUrl: typeof __GIT_REMOTE_URL !== 'undefined' ? __GIT_REMOTE_URL : 'local',
        repoName: typeof __GIT_REPO_NAME !== 'undefined' ? __GIT_REPO_NAME : 'bolt.diy',
      },
      timestamp: new Date().toISOString(),
    };

    return json(gitInfo, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  },
);
