import { createContent, deleteContent, listContent, updateContent } from '@/lib/admin-collection';
export const runtime = 'nodejs';
export const GET = () => listContent('services');
export const POST = (request: Request) => createContent('services', request);
export const PUT = (request: Request) => updateContent('services', request);
export const DELETE = (request: Request) => deleteContent('services', request);
