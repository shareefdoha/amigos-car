// Retained as an explicit response for older clients after password-only sign-in.
export const runtime = 'nodejs';
export async function POST() {
  return Response.json({error:'Email-code sign-in is no longer used. Sign in with your username and password.'},{status:410});
}
