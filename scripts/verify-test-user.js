require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function verifyTestUser() {
  try {
    await client.connect();
    console.log('Connected to database...');
    
    // Check current status
    const checkResult = await client.query(
      `SELECT id, email, "isEmailVerified", "isPhoneVerified" FROM users WHERE email = $1`,
      ['testuser2@loadrider.com']
    );
    
    console.log('\nCurrent status:');
    console.log(JSON.stringify(checkResult.rows, null, 2));
    
    if (checkResult.rows.length > 0) {
      const user = checkResult.rows[0];
      
      // Update to set email as verified
      const updateResult = await client.query(
        `UPDATE users SET "isEmailVerified" = true WHERE email = $1 RETURNING id, email, "isEmailVerified"`,
        ['testuser2@loadrider.com']
      );
      
      console.log('\nUpdated status:');
      console.log(JSON.stringify(updateResult.rows, null, 2));
      console.log('\n✅ testuser2@loadrider.com is now email verified!');
    } else {
      console.log('\n❌ User not found!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

verifyTestUser();
