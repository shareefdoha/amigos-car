import { createContent, deleteContent, listContent, updateContent } from '@/lib/admin-collection';
export const runtime = 'nodejs';
export const GET = () => listContent('offers');
export const POST = (request: Request) => createContent('offers', request);
export const PUT = (request: Request) => updateContent('offers', request);
export const DELETE = (request: Request) => deleteContent('offers', request);
