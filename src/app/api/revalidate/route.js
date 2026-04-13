import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { secret, path, tag, type, tags } = body;

    // Verify the secret token to prevent unauthorized revalidation
    if (!secret || secret !== process.env.REVALIDATION_SECRET) {
      console.error('Revalidation attempt with invalid secret');
      return NextResponse.json(
        { message: 'Invalid or missing secret token' },
        { status: 401 }
      );
    }

    // Revalidate by path (for specific pages)
    if (type === 'path' && path) {
      try {
        await revalidatePath(path, 'page');
        console.log(`✅ Successfully revalidated path: ${path}`);
        return NextResponse.json({
          revalidated: true,
          type: 'path',
          path,
          now: Date.now(),
        });
      } catch (error) {
        console.error(`❌ Error revalidating path ${path}:`, error);
        return NextResponse.json(
          { message: 'Error revalidating path', error: error.message },
          { status: 500 }
        );
      }
    }

    // Revalidate multiple tags in one request (optional)
    if (Array.isArray(tags) && tags.length > 0) {
      try {
        const revalidated = [];
        for (const t of tags) {
          if (typeof t !== 'string' || !t.trim()) continue;
          await revalidateTag(t.trim(), 'max');
          revalidated.push(t.trim());
        }
        console.log(`✅ Successfully revalidated tags: ${revalidated.join(', ')}`);
        return NextResponse.json({
          revalidated: true,
          type: 'tags',
          tags: revalidated,
          now: Date.now(),
        });
      } catch (error) {
        console.error('❌ Error revalidating tags batch:', error);
        return NextResponse.json(
          { message: 'Error revalidating tags', error: error.message },
          { status: 500 }
        );
      }
    }

    // Revalidate by tag (for multiple pages with same tag)
    if (type === 'tag' && tag) {
      try {
        // FIX: Add 'max' as second argument for updated Next.js API
        await revalidateTag(tag, 'max');
        console.log(`✅ Successfully revalidated tag: ${tag}`);
        return NextResponse.json({
          revalidated: true,
          type: 'tag',
          tag,
          now: Date.now(),
        });
      } catch (error) {
        console.error(`❌ Error revalidating tag ${tag}:`, error);
        return NextResponse.json(
          { message: 'Error revalidating tag', error: error.message },
          { status: 500 }
        );
      }
    }

    // Fallback: if no type specified but path provided
    if (path && !type) {
      try {
        await revalidatePath(path, 'page');
        console.log(`✅ Successfully revalidated path (fallback): ${path}`);
        return NextResponse.json({
          revalidated: true,
          path,
          now: Date.now(),
        });
      } catch (error) {
        console.error(`❌ Error revalidating path ${path}:`, error);
        return NextResponse.json(
          { message: 'Error revalidating path', error: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: 'Missing required parameters (path or tag)' },
      { status: 400 }
    );
  } catch (err) {
    console.error('❌ Revalidation error:', err);
    return NextResponse.json(
      { message: 'Error processing revalidation request', error: err.message },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for health checks
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Revalidation endpoint is active',
    version: '2.0', // Updated version
  });
}