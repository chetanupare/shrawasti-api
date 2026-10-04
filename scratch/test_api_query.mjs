import { queryProviderByPhoneOrId } from '../src/lib/db.ts';

async function main() {
  try {
    const res = await queryProviderByPhoneOrId('9111111111');
    console.log('Result from db.ts:', res);
  } catch (err) {
    console.error('Error from db.ts:', err);
  }
}

main();
