// app/api/user/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const sessionCookie = request.cookies.get('session')?.value || null;
    if (!sessionCookie) {
      return NextResponse.json(null);
    }

    // TODO: validate the session cookie against your session store / DB
    // Example placeholder:
    // const user = await validateSession(sessionCookie);
    // if (!user) return NextResponse.json(null);

    // Dummy user for now (replace with real user object)
    const user = { id: 'user-' + sessionCookie.slice(0, 8), email: 'user@example.com' };

    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json(null);
  }
}
