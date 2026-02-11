import { NextRequest, NextResponse } from 'next/server';
import { fetchGithubStats } from '@/lib/github-client';
import { generateSvg } from '@/lib/svg-generator';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
        return new NextResponse('Username is required', { status: 400 });
    }

    try {
        const stats = await fetchGithubStats(username);
        const svg = generateSvg(stats);

        return new NextResponse(svg, {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'public, max-age=1800, s-maxage=1800, must-revalidate',
                'ETag': `W/"${Buffer.from(svg).length}-${Date.now()}"`,
            },
        });
    } catch (error: any) {
        console.error(error);
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
    }
}
