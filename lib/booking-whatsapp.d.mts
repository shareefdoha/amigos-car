export type BookingDetails = {
  contact_name:string; email:string; phone:string; service:string; branch:string;
  vehicle_type:string; vehicle_details:string; preferred_date:string; preferred_time:string; message:string;
};
export function normalizeWhatsAppNumber(phone:string): string;
export function buildBookingWhatsAppUrl(details:BookingDetails, branch:{slug:string;name_en:string;phone:string}|undefined, service:{slug:string;title_en:string}|undefined): string;
