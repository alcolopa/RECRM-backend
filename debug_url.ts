import * as dotenv from 'dotenv';
dotenv.config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);
const url = process.env.DATABASE_URL;
if (url) {
  try {
    const parsed = new URL(url);
    console.log('Protocol:', parsed.protocol);
    console.log('Host:', parsed.host);
    console.log('Port:', parsed.port);
    console.log('Pathname:', parsed.pathname);
    console.log('Search:', parsed.search);
  } catch (e: any) {
    console.error('Failed to parse URL:', e.message);
  }
}
