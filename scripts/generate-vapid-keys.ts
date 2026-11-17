#!/usr/bin/env npx tsx

import webPush from 'web-push';

const vapidKeys = webPush.generateVAPIDKeys();

console.log('=== VAPID Keys Generated ===');
console.log('');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('');
console.log('Add these to your .env.local and Vercel environment variables:');
console.log('');
console.log('# VAPID Keys for Web Push Notifications');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:notifications@shrawasti.com');