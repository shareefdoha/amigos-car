import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:['/','/api/public/images/'],disallow:['/admin','/api/']},sitemap:'https://amigoscarcare.com/sitemap.xml'}}
