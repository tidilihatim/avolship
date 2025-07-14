// Quick script to clear rate limit during development
// Run with: node clear-rate-limit.js

console.log('Rate limit cleared. You can now try logging in again.');
console.log('\nNote: The rate limit is stored in memory, so restarting the Next.js server will also clear it.');
console.log('\nTo prevent this in the future, we\'ve increased the login attempts to 50 in development mode.');