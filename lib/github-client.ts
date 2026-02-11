import { cache } from 'react';

const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";

export interface LanguageUsage {
    size: number;
    color: string;
}

export interface GitHubStats {
    username: string;
    name: string;
    avatarUrl: string;
    bio: string | null;
    company: string | null;
    location: string | null;
    websiteUrl: string | null;
    twitterUsername: string | null;
    createdAt: string;
    followers: number;
    following: number;
    organizations: string[]; // URLs of org avatars
    totalStars: number;
    totalForks: number;
    totalCommits: number;
    totalPRs: number;
    totalIssues: number;
    totalReviews: number;
    contributedTo: number;
    totalDiskUsage: number; // in KB
    languages: { [key: string]: LanguageUsage };
}

export const fetchGithubStats = cache(async (username: string): Promise<GitHubStats> => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        throw new Error("GITHUB_TOKEN is not set");
    }

    const query = `
    query($username: String!) {
      user(login: $username) {
        name
        login
        avatarUrl
        bio
        company
        location
        websiteUrl
        twitterUsername
        createdAt
        followers { totalCount }
        following { totalCount }
        organizations(first: 6) {
          nodes {
            avatarUrl
          }
        }
        repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
          totalCount
        }
        pullRequests(first: 1) { totalCount }
        issues(first: 1) { totalCount }
        contributionsCollection {
          totalCommitContributions
          totalPullRequestReviewContributions
          restrictedContributionsCount
        }
        repositories(ownerAffiliations: OWNER, isFork: false, first: 100) {
          nodes {
            name
            stargazerCount
            forkCount
            diskUsage
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                size
                node {
                  name
                  color
                }
              }
            }
          }
        }
      }
    }
  `;

    try {
        const response = await fetch(GITHUB_GRAPHQL_API, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query, variables: { username } }),
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.errors) {
            console.error("GitHub GraphQL errors:", data.errors);
            throw new Error(`GitHub GraphQL error: ${data.errors[0].message}`);
        }

        if (!data.data?.user) {
            throw new Error("User not found");
        }

        const user = data.data.user;
        const stats: GitHubStats = {
            username: user.login,
            name: user.name || user.login,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            company: user.company,
            location: user.location,
            websiteUrl: user.websiteUrl,
            twitterUsername: user.twitterUsername,
            createdAt: user.createdAt,
            followers: user.followers.totalCount,
            following: user.following.totalCount,
            organizations: user.organizations.nodes.map((org: any) => org.avatarUrl),
            totalStars: 0,
            totalForks: 0,
            totalCommits: user.contributionsCollection.totalCommitContributions + user.contributionsCollection.restrictedContributionsCount,
            totalPRs: user.pullRequests.totalCount,
            totalIssues: user.issues.totalCount,
            totalReviews: user.contributionsCollection.totalPullRequestReviewContributions,
            contributedTo: user.repositoriesContributedTo.totalCount,
            totalDiskUsage: 0,
            languages: {}
        };

        const repos = user.repositories.nodes;

        for (const repo of repos) {
            stats.totalStars += repo.stargazerCount;
            stats.totalForks += repo.forkCount;
            stats.totalDiskUsage += repo.diskUsage;

            if (repo.languages.edges) {
                for (const edge of repo.languages.edges) {
                    const languageName = edge.node.name;
                    const size = edge.size;
                    const color = edge.node.color;

                    if (!stats.languages[languageName]) {
                        stats.languages[languageName] = { size: 0, color };
                    }
                    stats.languages[languageName].size += size;
                }
            }
        }

        return stats;
    } catch (error) {
        console.error("Failed to fetch GitHub stats:", error);
        throw error;
    }
});
