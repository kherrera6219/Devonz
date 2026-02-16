import type { GitLabProjectInfo, GitLabStats, GitLabGroupInfo, GitLabEvent } from '~/types/GitLab';

export function calculateProjectStats(projects: Record<string, unknown>[]): { projects: GitLabProjectInfo[] } {
  const projectStats = {
    projects: projects.map((project: Record<string, unknown>) => ({
      id: Number(project.id),
      name: String(project.name),
      path_with_namespace: String(project.path_with_namespace),
      description: String(project.description || ''),
      http_url_to_repo: String(project.http_url_to_repo),
      star_count: Number(project.star_count || 0),
      forks_count: Number(project.forks_count || 0),
      default_branch: String(project.default_branch),
      updated_at: String(project.updated_at),
      visibility: String(project.visibility),
    })),
  };

  return projectStats;
}

export function calculateStatsSummary(
  projects: GitLabProjectInfo[],
  events: Record<string, unknown>[],
  groups: Record<string, unknown>[],
  snippets: Record<string, unknown>[],
  user: Record<string, unknown>,
): GitLabStats {
  const totalStars = projects.reduce((sum, p) => sum + (p.star_count || 0), 0);
  const totalForks = projects.reduce((sum, p) => sum + (p.forks_count || 0), 0);
  const privateProjects = projects.filter((p) => p.visibility === 'private').length;

  const recentActivity: GitLabEvent[] = events.slice(0, 5).map((event: Record<string, unknown>) => ({
    id: Number(event.id),
    action_name: String(event.action_name),
    project_id: Number(event.project_id),
    project: event.project as { name: string; path_with_namespace: string },
    created_at: String(event.created_at),
  }));

  return {
    projects,
    recentActivity,
    totalSnippets: snippets.length,
    publicProjects: projects.filter((p) => p.visibility === 'public').length,
    privateProjects,
    stars: totalStars,
    forks: totalForks,
    followers: Number(user.followers || 0),
    snippets: snippets.length,
    groups: groups as unknown as GitLabGroupInfo[],
    lastUpdated: new Date().toISOString(),
  };
}
