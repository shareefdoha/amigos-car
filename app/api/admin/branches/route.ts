import { createContent, deleteContent, listContent, updateContent } from '@/lib/admin-collection';
export const runtime = 'nodejs';
export const GET = () => listContent('branches');
export const POST = (request: Request) => createContent('branches', request);
export const PUT = (request: Request) => updateContent('branches', request);
export const DELETE = (request: Request) => deleteContent('branches', request);
