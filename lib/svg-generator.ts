import { GitHubStats } from "./github-client";

interface LanguageData {
    name: string;
    color: string;
    percentage: number;
}

export function generateSvg(stats: GitHubStats): string {
    const languageStats = stats.languages;
    const totalSize = Object.values(languageStats).reduce((acc, curr) => acc + curr.size, 0);

    const languages: LanguageData[] = Object.entries(languageStats)
        .sort(([, a], [, b]) => b.size - a.size)
        .filter(([, data]) => data.size > 0)
        .map(([name, data]) => ({
            name,
            color: data.color || "#ccc",
            percentage: (data.size / totalSize) * 100,
        }));

    const width = 800; // Wider dashboard
    const padding = 30;

    // Layout
    const headerHeight = 120;
    const statsGridY = headerHeight + padding + 10;
    const statBoxWidth = (width - (padding * 2) - 30) / 4; // 4 columns
    const statBoxHeight = 70;
    const statsGridHeight = (statBoxHeight * 2) + 15; // 2 rows

    const barY = statsGridY + statsGridHeight + 30;
    const barHeight = 14;
    const legendStartY = barY + barHeight + 25;
    const legendRowHeight = 24;

    // Calculate total height
    const rows = Math.ceil(languages.length / 3); // 3 columns for legend
    const height = legendStartY + (rows * legendRowHeight) + padding;

    // Cyberpunk CSS
    const css = `
    .header-name { font: 700 24px 'Segoe UI', sans-serif; fill: #00f0ff; }
    .header-user { font: 400 16px 'Segoe UI', sans-serif; fill: #ff003c; letter-spacing: 1px; }
    .bio { font: 400 13px 'Segoe UI', sans-serif; fill: #a1a1aa; }
    .info-text { font: 400 12px 'Segoe UI', sans-serif; fill: #94a3b8; }
    
    .stat-value { font: 700 20px 'Segoe UI', sans-serif; fill: #ffffff; }
    .stat-label { font: 600 11px 'Segoe UI', sans-serif; fill: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    
    .lang-name { font: 600 11px 'Segoe UI', sans-serif; fill: #e2e8f0; }
    .lang-pct { font: 400 11px 'Segoe UI', sans-serif; fill: #94a3b8; }
    
    .bg-rect { fill: url(#bg-grad); stroke: #30363d; stroke-width: 1; }
    .stat-box { fill: rgba(15, 23, 42, 0.6); stroke: #334155; stroke-width: 1; }
    .icon { fill: #00f0ff; opacity: 0.8; }
  `;

    // Icons
    const icons = {
        location: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z", // Approximate
        company: "M12 7V3H4v18h16V7h-8zM6 19v-2h2v2H6zm0-4v-2h2v2H6zm0-4V9h2v2H6zm0-4V5h2v2H6zm4 12v-2h2v2h-2zm0-4v-2h2v2h-2zm0-4V9h2v2h-2zm0-4V5h2v2h-2zm4 12v-2h2v2h-2zm0-4v-2h2v2h-2zm0-4V9h2v2h-2zm4 8v-2h2v2h-2zm0-4v-2h2v2h-2zm0-4V9h2v2h-2z", // Approximate
        link: "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
        star: "M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.719-4.192-3.046-2.97a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z",
        fork: "M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z",
        commit: "M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z",
        pr: "M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zm2.25 7.5a.75.75 0 100 1.5.75.75 0 000-1.5zM.75 10.75a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM12.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zM10.5 3.25a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0z",
        issue: "M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z",
        people: "M2 5.5a3.5 3.5 0 115.898 2.549 5.507 5.507 0 013.034 4.084.75.75 0 11-1.482.235 4.001 4.001 0 00-7.9 0 .75.75 0 01-1.482-.236A5.507 5.507 0 013.102 8.05 3.49 3.49 0 012 5.5zM11 4a3.001 3.001 0 012.22 5.018 5.01 5.01 0 012.56 3.012.75.75 0 01-1.428.455 3.51 3.51 0 00-6.445 0 .75.75 0 01-1.428-.455 5.01 5.01 0 012.56-3.012A3.001 3.001 0 0111 4z",
        hdd: "M2 3.75C2 2.784 2.784 2 3.75 2h8.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0112.25 14h-8.5A1.75 1.75 0 012 12.25v-8.5zm1.75-.25a.25.25 0 00-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25v-8.5a.25.25 0 00-.25-.25h-8.5zM8 6a1 1 0 100-2 1 1 0 000 2z",
        eye: "M8 1.5c-3.176 0-6.028 2.535-7.53 5.75a.75.75 0 000 .654c1.502 3.216 4.354 5.75 7.53 5.75s6.028-2.534 7.53-5.75a.75.75 0 000-.654C13.972 3.882 11.082 1.5 8 1.5zM2.023 7.627C3.39 4.88 6.014 3 8 3s4.61 1.88 5.977 4.627c-1.366 2.747-3.99 4.627-5.977 4.627S3.39 10.373 2.023 7.627zM8 5a2.627 2.627 0 100 5.254A2.627 2.627 0 008 5zm0 1.5a1.127 1.127 0 110 2.254A1.127 1.127 0 018 6.5z"
    };

    const StatBox = (x: number, y: number, iconPath: string, label: string, value: string) => `
    <g transform="translate(${x}, ${y})">
      <rect width="${statBoxWidth}" height="${statBoxHeight}" rx="4" class="stat-box" />
      <g transform="translate(15, 15)">
        <svg viewBox="0 0 16 16" width="20" height="20"><path d="${iconPath}" class="icon"/></svg>
      </g>
      <text x="15" y="55" class="stat-label">${label}</text>
      <text x="50" y="32" class="stat-value">${value}</text>
    </g>
  `;

    const escapeXml = (unsafe: string | number | null) => {
        if (unsafe === null || unsafe === undefined) return '';
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    const headerName = escapeXml(stats.name);
    const headerUser = escapeXml(stats.username);
    const bio = escapeXml(stats.bio || "No bio available");
    const location = escapeXml(stats.location);
    const company = escapeXml(stats.company);
    const avatarUrl = escapeXml(stats.avatarUrl);

    // Header Section
    let svgContent = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1e1b4b;stop-opacity:1" />
      </linearGradient>
    </defs>
    <style><![CDATA[${css}]]></style>
    
    <!-- Background and Border -->
    <rect x="0.5" y="0.5" rx="10" width="${width - 1}" height="${height - 1}" class="bg-rect" />
    <path d="M 0.5 50 L 0.5 15 Q 0.5 0.5 15 0.5 L 50 0.5" fill="none" stroke="#00f0ff" stroke-width="2" />
    <path d="M ${width - 0.5} ${height - 50} L ${width - 0.5} ${height - 15} Q ${width - 0.5} ${height - 0.5} ${width - 15} ${height - 0.5} L ${width - 50} ${height - 0.5}" fill="none" stroke="#ff003c" stroke-width="2" />

    <!-- Header Section -->
    <g transform="translate(${padding}, ${padding + 10})">
        <!-- Avatar -->
        <image href="${avatarUrl}" x="0" y="0" height="80" width="80" rx="40" clip-path="circle(40px at center)" />
        <circle cx="40" cy="40" r="41" fill="none" stroke="#334155" stroke-width="2" />
        
        <g transform="translate(100, 10)">
            <text x="0" y="0" class="header-name" dominant-baseline="hanging">${headerName}</text>
            <text x="0" y="30" class="header-user" dominant-baseline="hanging">@${headerUser}</text>
            
            <text x="0" y="60" class="bio" dominant-baseline="hanging">${bio}</text>
            
            <g transform="translate(0, 85)">
               <!-- Info Line 1 -->
               ${location ? `<text x="0" y="0" class="info-text">${location}</text>` : ''}
               ${company ? `<text x="${location ? 120 : 0}" y="0" class="info-text">${company}</text>` : ''}
               <text x="${(location ? 120 : 0) + (company ? 120 : 0)}" y="0" class="info-text">Joined ${new Date(stats.createdAt).toLocaleDateString()}</text>
            </g>
        </g>
        
        <!-- Social Counts (Right Aligned) -->
        <g transform="translate(${width - (padding * 2) - 130}, 10)">
            <text x="0" y="0" class="stat-value" text-anchor="end">${escapeXml(stats.followers)}</text>
            <text x="10" y="0" class="stat-label" dominant-baseline="middle">Followers</text>
            
            <text x="0" y="30" class="stat-value" text-anchor="end">${escapeXml(stats.following)}</text>
            <text x="10" y="30" class="stat-label" dominant-baseline="middle">Following</text>
        </g>
    </g>

    <!-- Stats Grid -->
    <g transform="translate(${padding}, ${statsGridY})">
        <!-- Row 1 -->
        ${StatBox(0, 0, icons.star, "Total Stars", escapeXml(stats.totalStars))}
        ${StatBox(statBoxWidth + 10, 0, icons.fork, "Total Forks", escapeXml(stats.totalForks))}
        ${StatBox((statBoxWidth + 10) * 2, 0, icons.commit, "Commits", escapeXml(stats.totalCommits))}
        ${StatBox((statBoxWidth + 10) * 3, 0, icons.pr, "Pull Requests", escapeXml(stats.totalPRs))}
        
        <!-- Row 2 -->
        ${StatBox(0, statBoxHeight + 15, icons.issue, "Issues", escapeXml(stats.totalIssues))}
        ${StatBox(statBoxWidth + 10, statBoxHeight + 15, icons.eye, "Reviews", escapeXml(stats.totalReviews))} 
        ${StatBox((statBoxWidth + 10) * 2, statBoxHeight + 15, icons.people, "Contributed To", escapeXml(stats.contributedTo))}
        ${StatBox((statBoxWidth + 10) * 3, statBoxHeight + 15, icons.hdd, "Disk Usage", escapeXml((stats.totalDiskUsage / 1024).toFixed(1) + " MB"))}
    </g>

    <!-- Languages -->
    <g transform="translate(${padding}, ${barY})">
        <text x="0" y="-10" class="stat-label">Top Languages</text>
        <mask id="bar-mask"><rect x="0" y="0" width="${width - 2 * padding}" height="${barHeight}" rx="2" fill="white" /></mask>
        <rect x="0" y="0" width="${width - 2 * padding}" height="${barHeight}" rx="2" fill="#2d2d35" />
        `;

    let currentX = 0;
    languages.forEach((lang) => {
        const barWidth = (lang.percentage / 100) * (width - 2 * padding);
        if (barWidth > 0) {
            svgContent += `<rect x="${currentX}" y="0" width="${barWidth}" height="${barHeight}" fill="${lang.color}" mask="url(#bar-mask)" />`;
            currentX += barWidth;
        }
    });

    // Separators
    currentX = 0;
    languages.forEach((lang) => {
        const barWidth = (lang.percentage / 100) * (width - 2 * padding);
        currentX += barWidth;
        svgContent += `<rect x="${currentX - 1}" y="0" width="1" height="${barHeight}" fill="#0f172a" opacity="0.5" />`;
    });

    svgContent += `</g>`;

    // Legend
    svgContent += `<g transform="translate(${padding}, ${legendStartY})">`;
    const colWidth = (width - 2 * padding) / 3;

    languages.forEach((lang, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);

        const x = col * colWidth;
        const y = row * legendRowHeight;

        svgContent += `
      <g transform="translate(${x}, ${y})">
        <circle cx="5" cy="5" r="4" fill="${lang.color}" />
        <text x="15" y="9" class="lang-name">${escapeXml(lang.name)}</text>
        <text x="${colWidth - 20}" y="9" text-anchor="end" class="lang-pct">${lang.percentage.toFixed(1)}%</text>
      </g>
      `;
    });
    svgContent += `</g>`;

    svgContent += `</svg>`;

    return svgContent.trim();
}
