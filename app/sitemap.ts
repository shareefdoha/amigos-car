import type {MetadataRoute} from 'next';
export default function sitemap():MetadataRoute.Sitemap{return ['','/offers','/service','/business','/careers'].map(path=>({url:'https://amigoscarcare.com'+path}))}
