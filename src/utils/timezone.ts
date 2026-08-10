import { cookies } from 'next/headers';

export async function getServerLocalDateStr(): Promise<string> {
  const cookieStore = await cookies();
  const timezoneCookie = cookieStore.get('client_timezone');
  
  let timezone = 'UTC'; // Fallback to UTC if cookie is missing
  if (timezoneCookie && timezoneCookie.value) {
    timezone = timezoneCookie.value;
  }

  try {
    // Format the current date using the user's timezone to get the correct YYYY-MM-DD
    const localDateStr = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
    return localDateStr;
  } catch (err) {
    console.error('Error formatting date with timezone:', timezone, err);
    // Fallback to UTC if timezone is invalid
    return new Date().toLocaleDateString('en-CA', { timeZone: 'UTC' });
  }
}
