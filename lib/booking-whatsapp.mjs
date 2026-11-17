export function normalizeWhatsAppNumber(phone) {
  if (typeof phone !== 'string' || !/^[+\d\s().-]+$/.test(phone.trim())) throw new Error('This branch has no valid WhatsApp number. Please call the branch.');
  let number = phone.replace(/\D/g, '').replace(/^00/, '');
  if (number.length === 8) number = '974' + number;
  if (!/^[1-9]\d{7,14}$/.test(number)) throw new Error('This branch has no valid WhatsApp number. Please call the branch.');
  return number;
}

export function buildBookingWhatsAppUrl(details, branch, service) {
  if (!branch || branch.slug !== details.branch) throw new Error('Please select a branch before continuing.');
  if (!service || service.slug !== details.service) throw new Error('Please select a service before continuing.');
  if (!details.contact_name.trim() || !details.phone.trim() || !details.vehicle_type || !details.preferred_date) throw new Error('Please complete the required appointment details.');
  const number = normalizeWhatsAppNumber(branch.phone);
  const message = [
    `Hello Amigos Car Care - ${branch.name_en.trim()},`,
    'I would like to request a service appointment.',
    '',
    `Name: ${details.contact_name.trim()}`,
    details.email.trim() ? `Email: ${details.email.trim()}` : null,
    `Mobile: ${details.phone.trim()}`,
    `Vehicle type: ${details.vehicle_type}`,
    details.vehicle_details.trim() ? `Vehicle: ${details.vehicle_details.trim()}` : null,
    `Requested service: ${service.title_en.trim()}`,
    `Preferred branch: ${branch.name_en.trim()}`,
    `Preferred date: ${details.preferred_date}`,
    `Preferred time: ${details.preferred_time || 'Any available time'}`,
    details.message.trim() ? `Additional notes: ${details.message.trim()}` : null,
    '',
    'Please confirm availability. Thank you.',
  ].filter(line => line !== null).join('\n');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
