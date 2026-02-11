import { cache } from 'react';

const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";

export interface LanguageUsage {
    size: number;
    color: string;
}

export interface Referrer {
    name: string;
    count: number;
    uniques: number;
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
    topics: string[];
    licenses: { [key: string]: number };
    // Streak stats (from contribution calendar)
    currentStreak: number;
    longestStreak: number;
    totalContributionsLastYear: number;
    contributionCalendar: { date: string; count: number }[];
    // Code volume
    totalAdditions: number;
    totalDeletions: number;
    // Traffic (last 14 days, requires repo scope)
    totalViews: number;
    uniqueViews: number;
    totalClones: number;
    uniqueClones: number;
    referrers: Referrer[];
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
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
        repositories(ownerAffiliations: OWNER, isFork: false, first: 100) {
          nodes {
            name
            stargazerCount
            forkCount
            diskUsage
            repositoryTopics(first: 10) {
              nodes {
                topic {
                  name
                }
              }
            }
            licenseInfo {
              spdxId
              name
            }
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
            languages: {},
            topics: [],
            licenses: {},
            currentStreak: 0,
            longestStreak: 0,
            totalContributionsLastYear: 0,
            contributionCalendar: [],
            totalAdditions: 0,
            totalDeletions: 0,
            totalViews: 0,
            uniqueViews: 0,
            totalClones: 0,
            uniqueClones: 0,
            referrers: []
        };

        const repos = user.repositories.nodes;

        for (const repo of repos) {
            stats.totalStars += repo.stargazerCount;
            stats.totalForks += repo.forkCount;
            stats.totalDiskUsage += repo.diskUsage;

            if (repo.repositoryTopics?.nodes) {
                for (const topicNode of repo.repositoryTopics.nodes) {
                    const topicName = topicNode.topic.name;
                    if (!stats.topics.includes(topicName)) {
                        stats.topics.push(topicName);
                    }
                }
            }

            if (repo.licenseInfo?.spdxId && repo.licenseInfo.spdxId !== 'NOASSERTION') {
                const licenseId = repo.licenseInfo.spdxId;
                stats.licenses[licenseId] = (stats.licenses[licenseId] || 0) + 1;
            }

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

        // Process contribution calendar for streak stats
        const calendar = user.contributionsCollection.contributionCalendar;
        stats.totalContributionsLastYear = calendar.totalContributions;

        const allDays: { date: string; count: number }[] = [];
        for (const week of calendar.weeks) {
            for (const day of week.contributionDays) {
                allDays.push({ date: day.date, count: day.contributionCount });
            }
        }
        stats.contributionCalendar = allDays;

        // Calculate streaks
        // Sort days chronologically (should already be sorted, but ensure)
        allDays.sort((a, b) => a.date.localeCompare(b.date));

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // For current streak, work backwards from today
        const today = new Date().toISOString().split('T')[0];
        const todayIdx = allDays.findIndex(d => d.date === today);
        // Start from today or yesterday (today might not have contributions yet)
        const startIdx = todayIdx >= 0 ? todayIdx : allDays.length - 1;
        for (let i = startIdx; i >= 0; i--) {
            // Skip today if no contributions (might still contribute today)
            if (i === startIdx && allDays[i].count === 0 && i > 0) {
                continue;
            }
            if (allDays[i].count > 0) {
                currentStreak++;
            } else {
                break;
            }
        }

        // For longest streak, scan forward
        for (const day of allDays) {
            if (day.count > 0) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }

        stats.currentStreak = currentStreak;
        stats.longestStreak = longestStreak;

        // Fetch code frequency (additions/deletions) via REST API
        // Only fetch for top 10 most-starred repos to avoid rate limits
        const codeFreqRepos = [...repos]
            .sort((a: any, b: any) => b.stargazerCount - a.stargazerCount)
            .slice(0, 10);

        const codeFreqResults = await Promise.allSettled(
            codeFreqRepos.map(async (repo: any) => {
                const res = await fetch(
                    `https://api.github.com/repos/${username}/${repo.name}/stats/code_frequency`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: 'application/vnd.github+json',
                        },
                    }
                );
                if (!res.ok) return null;
                return res.json();
            })
        );

        for (const result of codeFreqResults) {
            if (result.status !== 'fulfilled' || !Array.isArray(result.value)) continue;
            for (const week of result.value) {
                // [timestamp, additions, deletions]
                stats.totalAdditions += week[1] || 0;
                stats.totalDeletions += Math.abs(week[2] || 0);
            }
        }

        // Fetch traffic data via REST API (requires repo scope)
        // Only fetch for up to 10 most-starred repos to avoid rate limits
        const topRepos = [...repos]
            .sort((a: any, b: any) => b.stargazerCount - a.stargazerCount)
            .slice(0, 10);

        const referrerMap: { [key: string]: { count: number; uniques: number } } = {};

        const trafficResults = await Promise.allSettled(
            topRepos.map(async (repo: any) => {
                const headers = {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github+json',
                };

                const [viewsRes, clonesRes, referrersRes] = await Promise.all([
                    fetch(`https://api.github.com/repos/${username}/${repo.name}/traffic/views`, { headers }),
                    fetch(`https://api.github.com/repos/${username}/${repo.name}/traffic/clones`, { headers }),
                    fetch(`https://api.github.com/repos/${username}/${repo.name}/traffic/popular/referrers`, { headers }),
                ]);

                const views = viewsRes.ok ? await viewsRes.json() : null;
                const clones = clonesRes.ok ? await clonesRes.json() : null;
                const referrers = referrersRes.ok ? await referrersRes.json() : null;

                return { views, clones, referrers };
            })
        );

        for (const result of trafficResults) {
            if (result.status !== 'fulfilled') continue;
            const { views, clones, referrers } = result.value;

            if (views) {
                stats.totalViews += views.count || 0;
                stats.uniqueViews += views.uniques || 0;
            }
            if (clones) {
                stats.totalClones += clones.count || 0;
                stats.uniqueClones += clones.uniques || 0;
            }
            if (Array.isArray(referrers)) {
                for (const ref of referrers) {
                    if (!referrerMap[ref.referrer]) {
                        referrerMap[ref.referrer] = { count: 0, uniques: 0 };
                    }
                    referrerMap[ref.referrer].count += ref.count || 0;
                    referrerMap[ref.referrer].uniques += ref.uniques || 0;
                }
            }
        }

        stats.referrers = Object.entries(referrerMap)
            .map(([name, data]) => ({ name, count: data.count, uniques: data.uniques }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return stats;
    } catch (error) {
        console.error("Failed to fetch GitHub stats:", error);
        throw error;
    }
});
