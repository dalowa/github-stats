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

  // Theme Configuration - Background Gradient
  const bgGradientStart = "#0D1117"; // Top-center (lightest point of the spotlight)
  const bgGradientMid = "#0D1117";   // Mid-transition
  const bgGradientEnd = "#0D1117";   // Edges/Bottom (darkest)

  // Theme Configuration - Text Colors
  const textPrimary = "#e0e0e0";    // Headings, big stats, values
  const textSecondary = "#cccccc";  // Subheadings, language names, user handle, icons
  const textTertiary = "#bbbbbb";   // Bio, labels
  const textQuaternary = "#999999"; // Info text, percentages, counts, less important details

  // Theme Configuration - Structural Colors
  const borderColor = "#C7BDB940";
  const boxBgColor = "#0d0f13ff";

  // Layout
  const headerHeight = 180; // Increased for dossier style
  const statsGridY = headerHeight + padding + 10;
  const statBoxWidth = (width - (padding * 2) - 30) / 4; // 4 columns
  const statBoxHeight = 70;
  const statsGridHeight = (statBoxHeight * 2) + 15; // 2 rows

  const barY = statsGridY + statsGridHeight + 50;
  // const barHeight = 14; // Removed for text-only layout
  const legendStartY = barY; // Start directly at the Y position
  const legendRowHeight = 28; // Increased for better readability

  // Calculate language legend height (3 columns)
  const langRows = Math.ceil(languages.length / 3);
  const langLegendHeight = langRows * legendRowHeight;

  // Topics section
  const topTopics = stats.topics.slice(0, 15);
  const topicsY = legendStartY + langLegendHeight + 20;
  // Estimate topic rows (we'll compute actual positions later)
  const topicTagHeight = 24;
  const topicTagPadding = 8;
  const topicRowHeight = topicTagHeight + 6;

  // Licenses section
  const sortedLicenses = Object.entries(stats.licenses)
    .sort(([, a], [, b]) => b - a);
  const totalLicensedRepos = sortedLicenses.reduce((sum, [, count]) => sum + count, 0);

  // Pre-calculate topic layout to get actual height
  const topicPositions: { x: number; y: number; w: number; text: string }[] = [];
  let tX = 0;
  let tY = 0;
  const maxRowWidth = width - 2 * padding;
  for (const topic of topTopics) {
    const tagW = topic.length * 7 + topicTagPadding * 2 + 4;
    if (tX + tagW > maxRowWidth && tX > 0) {
      tX = 0;
      tY += topicRowHeight;
    }
    topicPositions.push({ x: tX, y: tY, w: tagW, text: topic });
    tX += tagW + 6;
  }
  const topicsHeight = topTopics.length > 0 ? tY + topicRowHeight + 20 : 0;

  // License layout
  const licensesY = topicsY + topicsHeight + (topTopics.length > 0 ? 10 : 0);
  const licenseBarHeight = 14;
  const licenseLegendRowHeight = 22;
  const licenseRows = Math.ceil(sortedLicenses.length / 3);
  const licensesHeight = sortedLicenses.length > 0
    ? licenseBarHeight + 25 + (licenseRows * licenseLegendRowHeight) + 20
    : 0;

  // Streak section
  const streakY = licensesY + licensesHeight + (licensesHeight > 0 ? 10 : 0);
  const streakBoxHeight = 80;
  const streakHeight = streakBoxHeight + 30;

  // Code volume section
  const codeVolumeY = streakY + streakHeight + 10;
  const hasCodeVolume = stats.totalAdditions > 0 || stats.totalDeletions > 0;
  const codeVolumeHeight = hasCodeVolume ? 70 : 0;

  // Traffic section
  const hasTraffic = stats.totalViews > 0 || stats.totalClones > 0 || stats.referrers.length > 0;
  const trafficY = codeVolumeY + codeVolumeHeight + (hasCodeVolume ? 10 : 0);
  const trafficStatHeight = 70;
  const referrerRowHeight = 24;
  const referrerCount = stats.referrers.length;
  const trafficHeight = hasTraffic
    ? trafficStatHeight + 20 + (referrerCount > 0 ? 30 + referrerCount * referrerRowHeight : 0) + 20
    : 0;

  // Calculate total height
  const height = trafficY + trafficHeight + padding;

  // Helper: format large numbers
  const formatNum = (n: number): string => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
  };

  // Spider-Man Noir Theme CSS
  const css = `
    .header-name { font: 700 48px Impact, sans-serif; fill: ${textPrimary}; text-transform: uppercase; letter-spacing: 2px; filter: url(#text-shadow); }
    .header-user { font: 400 18px 'Courier New', monospace; fill: ${textSecondary}; letter-spacing: 1px; }
    .bio { font: 400 14px 'Courier New', monospace; fill: ${textTertiary}; }
    .info-text { font: 400 12px 'Courier New', monospace; fill: ${textQuaternary}; }
    .info-icon { fill: ${textQuaternary}; }
    
    .social-box { fill: none; stroke: ${borderColor}; stroke-width: 1; }
    .social-value { font: 700 24px Impact, sans-serif; fill: ${textPrimary}; text-anchor: middle; }
    .social-label { font: 400 10px 'Courier New', monospace; fill: ${textQuaternary}; text-transform: uppercase; text-anchor: middle; letter-spacing: 1px; }
    
    .stat-value { font: 700 24px Impact, sans-serif; fill: ${textPrimary}; letter-spacing: 1px; filter: url(#text-shadow); }
    .stat-label { font: 700 10px 'Courier New', monospace; fill: ${textTertiary}; text-transform: uppercase; letter-spacing: 1px; }
    
    .lang-name { font: 700 11px 'Courier New', monospace; fill: ${textSecondary}; }
    .lang-pct { font: 400 11px 'Courier New', monospace; fill: ${textQuaternary}; }
    
    .bg-rect { fill: url(#spotlight); }
    .halftone-overlay { fill: url(#halftone); opacity: 0.05; pointer-events: none; }
    
    .stat-box { fill: ${boxBgColor}; stroke: ${borderColor}; stroke-width: 1; shape-rendering: geometricPrecision; filter: url(#soft-shadow); }
    .icon { fill: ${textSecondary}; }
    .section-title { font: 700 18px Impact, sans-serif; fill: ${textPrimary}; text-transform: uppercase; letter-spacing: 4px; filter: url(#text-shadow); }
    
    .topic-tag { fill: ${boxBgColor}; stroke: ${borderColor}; stroke-width: 1; shape-rendering: geometricPrecision; filter: url(#soft-shadow); }
    .topic-text { font: 700 11px 'Courier New', monospace; fill: ${textSecondary}; }
    
    .license-tag { fill: ${boxBgColor}; stroke: ${borderColor}; stroke-width: 1; shape-rendering: geometricPrecision; filter: url(#soft-shadow); }
    .license-text { font: 700 11px 'Courier New', monospace; fill: ${textSecondary}; }
    .license-count { font: 400 10px 'Courier New', monospace; fill: ${textQuaternary}; }
    
    .traffic-box { fill: ${boxBgColor}; stroke: ${borderColor}; stroke-width: 1; shape-rendering: geometricPrecision; filter: url(#soft-shadow); }
    .traffic-value { font: 700 20px Impact, sans-serif; fill: ${textPrimary}; }
    .traffic-label { font: 700 10px 'Courier New', monospace; fill: ${textTertiary}; text-transform: uppercase; letter-spacing: 1px; }
    .traffic-sub { font: 400 10px 'Courier New', monospace; fill: ${textQuaternary}; }
    
    .traffic-stat-box { fill: ${boxBgColor}; stroke: ${borderColor}; stroke-width: 1; shape-rendering: geometricPrecision; filter: url(#soft-shadow); }

    .referrer-name { font: 700 12px 'Courier New', monospace; fill: ${textSecondary}; }
    .referrer-count { font: 400 12px 'Courier New', monospace; fill: ${textQuaternary}; }
    .referrer-bar-bg { fill: #1a1a1a; shape-rendering: geometricPrecision; }
    .referrer-bar { fill: url(#metal-gradient); shape-rendering: geometricPrecision; filter: url(#soft-shadow); }
    
    .streak-value { font: 700 32px Impact, sans-serif; fill: ${textPrimary}; filter: url(#text-shadow); }
    .streak-label { font: 700 12px 'Courier New', monospace; fill: ${textTertiary}; text-transform: uppercase; }
    .streak-sub { font: 400 11px 'Courier New', monospace; fill: ${textQuaternary}; }
    .streak-box { fill: ${boxBgColor}; stroke: ${borderColor}; stroke-width: 1; shape-rendering: geometricPrecision; filter: url(#soft-shadow); }
    
    .code-add { font: 700 16px 'Courier New', monospace; fill: ${textSecondary}; }
    .code-del { font: 700 16px 'Courier New', monospace; fill: ${textQuaternary}; }
    .code-label { font: 400 11px 'Courier New', monospace; fill: ${textQuaternary}; }
    .code-bar-add { fill: url(#metal-gradient); shape-rendering: geometricPrecision; }
    .code-bar-del { fill: ${borderColor}; shape-rendering: geometricPrecision; }
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
      <rect width="${statBoxWidth}" height="${statBoxHeight}" class="stat-box" />
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

  // Header Section
  let svgContent = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="spotlight" cx="50%" cy="0%" r="150%" fx="50%" fy="0%">
        <stop offset="0%" style="stop-color:${bgGradientStart};stop-opacity:1" />
        <stop offset="60%" style="stop-color:${bgGradientMid};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${bgGradientEnd};stop-opacity:1" />
      </radialGradient>
      
      <linearGradient id="metal-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#eeeeee;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#cccccc;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#999999;stop-opacity:1" />
      </linearGradient>

      <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
        <feOffset in="blur" dx="2" dy="4" result="offsetBlur" />
        <feComponentTransfer in="offsetBlur" result="shadowMatrix">
          <feFuncA type="linear" slope="0.5" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="shadowMatrix" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="text-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
        <feOffset in="blur" dx="1" dy="1" result="offsetBlur" />
         <feComponentTransfer in="offsetBlur" result="shadowMatrix">
          <feFuncA type="linear" slope="0.6" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="shadowMatrix" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <pattern id="halftone" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="0.8" fill="#555555" />
      </pattern>
    </defs>
    <style><![CDATA[${css}]]></style>
    
    <!-- Background and Border -->
    <rect x="0" y="0" width="${width}" height="${height}" class="bg-rect" />
    <rect x="0" y="0" width="${width}" height="${height}" class="halftone-overlay" />
    <rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="none" stroke="transparent" stroke-width="2" rx="0" />

    <!-- Header Section -->
    <g transform="translate(${padding}, ${padding + 10})">
        <!-- Identity Column (Left) -->
        <g transform="translate(0, 0)">
            <text x="0" y="32" class="header-name">${headerName}</text>
            <text x="2" y="56" class="header-user">@${headerUser}</text>
            
            <!-- Bio with max width -->
            <switch>
                <foreignObject x="2" y="70" width="${width * 0.6}" height="60">
                    <p xmlns="http://www.w3.org/1999/xhtml" style="margin:0; color:${textTertiary}; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.4;">
                        ${bio}
                    </p>
                </foreignObject>
                <text x="2" y="85" class="bio">${bio.substring(0, 80)}${bio.length > 80 ? '...' : ''}</text>
            </switch>
        </g>
        
        <!-- Logo (Right) -->
        <g transform="translate(${width - (padding * 2) - 125}, -25)">
            <g transform="scale(0.4)">
                <svg width="330" height="339" viewBox="0 0 230 239" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="230" height="230" fill="none"/>
                    <path d="M93.3494 84.2667C102.972 67.6 127.028 67.6 136.651 84.2667L176.344 153.017C185.966 169.683 173.938 190.517 154.693 190.517H75.3072C56.0622 190.517 44.0341 169.683 53.6566 153.017L93.3494 84.2667Z" fill="url(#metal-gradient)"/>
                    <rect x="9.19995" y="135.626" width="115" height="38.3333" rx="19.1667" transform="rotate(-60 9.19995 135.626)" fill="url(#metal-gradient)"/>
                    <rect x="162.764" y="36.0333" width="115" height="38.3333" rx="19.1667" transform="rotate(60 162.764 36.0333)" fill="url(#metal-gradient)"/>
                </svg>
            </g>
        </g>

        <!-- Meta Info Footer (Bottom of Header) -->
        <g transform="translate(2, ${headerHeight - padding - 20})">
            <line x1="0" y1="-15" x2="${width - (padding * 2)}" y2="-15" stroke="${borderColor}" stroke-width="1" stroke-dasharray="4,4" />
            
            <g transform="translate(0, 0)">
                <g transform="translate(0, -4) scale(0.8)">
                    <path d="${icons.location}" class="info-icon" />
                </g>
                <text x="20" y="10" class="info-text">${location || 'Earth'}</text>
            </g>

            <g transform="translate(200, 0)">
                 <g transform="translate(0, -5) scale(0.8)">
                    <path d="${icons.company}" class="info-icon" />
                 </g>
                <text x="20" y="10" class="info-text">${company || 'Freelance'}</text>
            </g>

            <g transform="translate(400, 0)">
                <text x="0" y="10" class="info-text">FILE OPENED: ${new Date().toLocaleDateString()}</text>
            </g>
             <g transform="translate(600, 0)">
                <text x="0" y="10" class="info-text">JOINED: ${new Date(stats.createdAt).toLocaleDateString()}</text>
            </g>
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

    <!-- Languages (Text Only) -->
    <g transform="translate(${padding}, ${barY})">
        <text x="0" y="-10" class="section-title">Top Languages</text>
        
        <g transform="translate(0, 10)">
            <defs>
                 <pattern id="dot-pattern" width="4" height="4" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="0.5" fill="${borderColor}" />
                 </pattern>
            </defs>
            ${languages.slice(0, 9).map((lang, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const colWidth = (width - 2 * padding) / 3;
    const x = col * colWidth;
    const y = row * legendRowHeight;

    // Calculate lengths for dotted leader
    const nameWidth = lang.name.length * 7 + 10;
    const pctWidth = 40;
    const leaderWidth = colWidth - nameWidth - pctWidth - 20;

    return `
                <g transform="translate(${x}, ${y})">
                    <text x="0" y="14" class="lang-name">${escapeXml(lang.name.toUpperCase())}</text>
                    <rect x="${nameWidth}" y="10" width="${Math.max(0, leaderWidth)}" height="4" fill="url(#dot-pattern)" />
                    <text x="${colWidth - 20}" y="14" text-anchor="end" class="stat-value" style="font-size: 14px;">${lang.percentage.toFixed(1)}%</text>
                </g>`;
  }).join('')}
        </g>
    </g>
    `;



  // --- SECTION 3: PROJECT INTEL (Topics & Licenses) ---
  const intelY = barY + 100 + 30; // Spacing after languages
  // Grid: Left = Topics, Right = Licenses

  // Topics (Left Col)
  if (topTopics.length > 0) {
    svgContent += `<g transform="translate(${padding}, ${intelY})">`;
    svgContent += `<text x="0" y="-10" class="section-title">Project Intel</text>`;

    // Render topics as a "Paragraph" block
    const topicText = topTopics.map(t => `#${t}`).join('  ');
    svgContent += `
        <switch>
            <foreignObject x="0" y="0" width="${(width / 2) - padding * 2}" height="100">
                <p xmlns="http://www.w3.org/1999/xhtml" style="margin:0; color:${textSecondary}; font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.8;">
                    ${topicText}
                </p>
            </foreignObject>
            <text x="0" y="14" class="topic-text">${topicText.substring(0, 50)}...</text>
        </switch>
        </g>`;
  }

  // Licenses (Right Col)
  if (sortedLicenses.length > 0) {
    svgContent += `<g transform="translate(${width / 2 + padding}, ${intelY})">`;
    svgContent += `<text x="0" y="-10" class="section-title">Clearance (Licenses)</text>`;

    const licRowHeight = 20;
    sortedLicenses.slice(0, 5).forEach(([license, count], i) => {
      const y = i * licRowHeight;
      const colW = (width / 2) - padding * 2;
      const nameW = license.length * 7 + 10;
      const pctW = 40;
      const leaderW = colW - nameW - pctW;

      svgContent += `
             <g transform="translate(0, ${y})">
                <text x="0" y="14" class="lang-name">${escapeXml(license)}</text>
                <rect x="${nameW}" y="10" width="${Math.max(0, leaderW)}" height="4" fill="url(#dot-pattern)" />
                <text x="${colW}" y="14" text-anchor="end" class="stat-value" style="font-size: 14px;">${count}</text>
             </g>`;
    });
    svgContent += `</g>`;
  }

  // --- SECTION 4: ACTIVITY LOG (Streaks & Code) ---
  const activityY = intelY + 140;
  svgContent += `<g transform="translate(${padding}, ${activityY})">`;
  svgContent += `<text x="0" y="-20" class="section-title">Activity Log</text>`;

  // Streaks (Horizontal Stamps)
  const streakBoxW = (width - padding * 2) / 3 - 10;
  const streakData = [
    { label: 'Current Streak', value: `${stats.currentStreak}`, sub: stats.currentStreak === 1 ? 'day' : 'days' },
    { label: 'Longest Streak', value: `${stats.longestStreak}`, sub: stats.longestStreak === 1 ? 'day' : 'days' },
    { label: 'Last Year', value: `${stats.totalContributionsLastYear}`, sub: 'contributions' },
  ];

  streakData.forEach((s, i) => {
    const sx = i * (streakBoxW + 15);
    svgContent += `
            <g transform="translate(${sx}, 0)">
                <rect width="${streakBoxW}" height="70" class="streak-box" />
                <text x="${streakBoxW / 2}" y="25" class="social-value" dominant-baseline="central">${escapeXml(s.value)}</text>
                <text x="${streakBoxW / 2}" y="55" class="social-label">${escapeXml(s.label.toUpperCase())}</text>
            </g>`;
  });

  // Code Volume (Clean Split Bar)
  if (hasCodeVolume) {
    const volY = 110; // Adjusted spacing from streaks
    const totalLines = stats.totalAdditions + stats.totalDeletions;
    const addPct = totalLines > 0 ? (stats.totalAdditions / totalLines) * 100 : 50;
    const barW = width - padding * 2;
    const barH = 6;

    const addBarW = (addPct / 100) * barW;

    svgContent += `<g transform="translate(0, ${volY})">`;

    // Additions Group (Left)
    svgContent += `
    <g transform="translate(0, 0)">
         <text x="0" y="0" class="code-add" style="font-size: 20px;">+${formatNum(stats.totalAdditions)}</text>
         <text x="0" y="15" class="code-label" style="font-size: 10px; letter-spacing: 1px;">LINES ADDED</text>
    </g>`;

    // Deletions Group (Right)
    svgContent += `
    <g transform="translate(${barW}, 0)">
         <text x="0" y="0" text-anchor="end" class="code-del" style="font-size: 20px;">-${formatNum(stats.totalDeletions)}</text>
         <text x="0" y="15" text-anchor="end" class="code-label" style="font-size: 10px; letter-spacing: 1px;">LINES DELETED</text>
    </g>`;

    // Split Bar
    svgContent += `
    <g transform="translate(0, 25)">
         <rect width="${barW}" height="${barH}" fill="#1a1a1a" stroke="#333333" stroke-width="1" />
         <rect width="${addBarW}" height="${barH}" fill="url(#metal-gradient)" />
    </g>`;

    svgContent += `</g>`;
  }
  svgContent += `</g>`;

  // --- SECTION 5: TRAFFIC ANALYSIS ---
  if (hasTraffic) {
    const trafficTopY = activityY + 200;
    svgContent += `<g transform="translate(${padding}, ${trafficTopY})">`;
    svgContent += `<text x="0" y="-20" class="section-title">Traffic Analysis (14 Days)</text>`;

    // Left Col: 2x2 Stats Grid
    const gridW = (width / 2) - padding * 2;
    const smallBoxW = gridW / 2 - 5;
    const smallBoxH = 50;

    const trafficStats = [
      { l: 'VIEWS', v: formatNum(stats.totalViews) },
      { l: 'CLONES', v: formatNum(stats.totalClones) },
      { l: 'VISITORS', v: formatNum(stats.uniqueViews) },
      { l: 'CLONERS', v: formatNum(stats.uniqueClones) },
    ];

    trafficStats.forEach((t, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const tx = col * (smallBoxW + 10);
      const ty = row * (smallBoxH + 10);

      svgContent += `
            <g transform="translate(${tx}, ${ty})">
                 <rect width="${smallBoxW}" height="${smallBoxH}" class="traffic-stat-box" />
                 <text x="${smallBoxW / 2}" y="25" class="stat-value" style="font-size: 20px;" text-anchor="middle" dominant-baseline="central">${t.v}</text>
                 <text x="${smallBoxW / 2}" y="42" class="social-label" style="font-size: 9px;">${t.l}</text>
            </g>`;
    });

    // Right Col: Referrers List
    if (stats.referrers.length > 0) {
      const refX = (width / 2) + 10;
      svgContent += `<g transform="translate(${refX}, 0)">`;
      // svgContent += `<text x="0" y="-5" class="social-label" text-anchor="start">TOP SOURCES</text>`;

      stats.referrers.slice(0, 5).forEach((ref, i) => {
        const ry = i * 20;
        const rcW = (width / 2) - padding * 2 - 10;
        const rNameW = ref.name.length * 7 + 10;
        const rValW = 30;
        const rLeadW = rcW - rNameW - rValW;

        svgContent += `
                 <g transform="translate(0, ${ry})">
                    <text x="0" y="14" class="lang-name">${escapeXml(ref.name)}</text>
                    <rect x="${rNameW}" y="10" width="${Math.max(0, rLeadW)}" height="4" fill="url(#dot-pattern)" />
                    <text x="${rcW}" y="14" text-anchor="end" class="stat-value" style="font-size: 12px;">${formatNum(ref.count)}</text>
                 </g>`;
      });
      svgContent += `</g>`;
    }
    svgContent += `</g>`;
  }



  svgContent += `</svg>`;

  return svgContent.trim();
}
