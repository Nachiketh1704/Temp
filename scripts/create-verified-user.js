require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createVerifiedUser() {
  try {
    await client.connect();
    console.log('Connected to database...\n');
    
    // User details
    const email = 'testverified@loadrider.com';
    const userName = 'testverified';
    const password = 'Test@12345';
    const firstName = 'Test';
    const lastName = 'Verified';
    const phoneNumber = '+1234567890';
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existingUser = await client.query(
      `SELECT id, email FROM users WHERE email = $1`,
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('User already exists. Updating to verified status...');
      
      const updateResult = await client.query(
        `UPDATE users 
         SET "isEmailVerified" = true, 
             "emailVerifiedAt" = NOW()
         WHERE email = $1 
         RETURNING id, email, "firstName", "lastName", "isEmailVerified"`,
        [email]
      );
      
      console.log('\n✅ User updated successfully:');
      console.log(JSON.stringify(updateResult.rows[0], null, 2));
    } else {
      console.log('Creating new verified user...');
      
      const insertResult = await client.query(
        `INSERT INTO users (
          email,
          "userName",
          password, 
          "firstName", 
          "lastName", 
          "phoneNumber",
          "isEmailVerified", 
          "emailVerifiedAt",
          "createdAt",
          "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW(), NOW())
        RETURNING id, email, "userName", "firstName", "lastName", "phoneNumber", "isEmailVerified"`,
        [email, userName, hashedPassword, firstName, lastName, phoneNumber]
      );
      
      console.log('\n✅ User created successfully:');
      console.log(JSON.stringify(insertResult.rows[0], null, 2));
    }
    
    console.log('\n📧 Login credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\n✅ User is fully verified and ready to use!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

createVerifiedUser();
