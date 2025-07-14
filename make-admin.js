// Quick script to make a user admin
// Run with: node make-admin.js

async function makeUserAdmin() {
  try {
    console.log('Making user tidihatim1@gmail.com an admin...');
    
    const response = await fetch('http://localhost:3000/api/test/make-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', data.message);
      console.log('User details:', data.user);
      console.log('\n⚠️  Important: Please logout and login again for the changes to take effect!');
    } else {
      console.error('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Failed to make user admin:', error.message);
    console.log('\nMake sure:');
    console.log('1. The server is running on http://localhost:3000');
    console.log('2. You are logged in as tidihatim1@gmail.com');
  }
}

console.log(`
===========================================
Admin Role Upgrade Script
===========================================

This will make the current logged-in user an ADMIN.

Note: You must be logged in first!
`);

makeUserAdmin();