import { NextResponse } from 'next/server';
import { loginSchema, signupSchema } from '@/lib/validations/auth';
import { upsertProfile, getProfileById } from '@/lib/db/profiles';
import { UserRole } from '@/types/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || 'login';

    if (action === 'signup') {
      const validated = signupSchema.parse(body);
      const mockId = `usr_${Date.now()}`;

      const profile = await upsertProfile({
        id: mockId,
        email: validated.email,
        full_name: validated.full_name,
        role: validated.role as UserRole,
        department: validated.department,
        region: validated.region
      });

      const response = NextResponse.json({
        success: true,
        message: 'Account registered successfully',
        profile
      });

      // Store auth session cookie
      response.cookies.set('survintel_session', JSON.stringify(profile), {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      return response;
    } else if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
      response.cookies.set('survintel_session', '', { path: '/', maxAge: 0 });
      return response;
    } else {
      // Login flow
      const validated = loginSchema.parse(body);
      const email = validated.email.toLowerCase();

      // Determine role based on credentials or requested role hint
      let role: UserRole = 'supervisor';
      let fullName = 'Field Survey Supervisor';
      let region = 'Western Zone - Maharashtra';

      if (email.includes('admin') || body.role === 'admin') {
        role = 'admin';
        fullName = 'Dr. R. K. Sharma (Director - Data Quality)';
        region = 'HQ - New Delhi';
      } else if (email.includes('officer') || body.role === 'hsd_officer') {
        role = 'hsd_officer';
        fullName = 'P. V. Rao (HSD Senior Officer)';
        region = 'Southern Zone - Karnataka';
      } else if (email.includes('viewer') || body.role === 'viewer') {
        role = 'viewer';
        fullName = 'A. K. Mehta (Public Data Viewer)';
        region = 'Eastern Zone - West Bengal';
      } else if (body.full_name) {
        fullName = body.full_name;
      }

      const demoProfile = {
        id: `usr_${role}_${Math.floor(100 + Math.random() * 900)}`,
        email: validated.email,
        full_name: fullName,
        role,
        department: 'National Sample Survey Office (NSSO)',
        region
      };

      const profile = (await getProfileById(demoProfile.id)) || (await upsertProfile(demoProfile));

      const response = NextResponse.json({
        success: true,
        message: 'Authenticated successfully',
        profile
      });

      // Set session cookie
      response.cookies.set('survintel_session', JSON.stringify(profile), {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7
      });

      return response;
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ success: false, error: errMessage }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/survintel_session=([^;]+)/);

    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1]);
      const profile = JSON.parse(decoded);
      return NextResponse.json({ authenticated: true, profile });
    }

    return NextResponse.json({ authenticated: false, profile: null });
  } catch (err: unknown) {
    return NextResponse.json({ authenticated: false, profile: null, error: String(err) });
  }
}
