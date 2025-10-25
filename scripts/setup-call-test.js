require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupCallTest() {
  try {
    await client.connect();
    console.log('Connected to database...\n');
    
    // Get the verified user (phone user)
    const phoneUser = await client.query(
      `SELECT id, email, "userName", "firstName", "lastName" FROM users WHERE email = $1`,
      ['testverified@loadrider.com']
    );
    
    if (phoneUser.rows.length === 0) {
      console.log('❌ Phone user not found!');
      return;
    }
    
    const phoneUserData = phoneUser.rows[0];
    console.log('📱 Phone User:');
    console.log(JSON.stringify(phoneUserData, null, 2));
    
    // Get user 41 (browser user)
    const browserUser = await client.query(
      `SELECT id, email, "userName", "firstName", "lastName" FROM users WHERE id = 41`
    );
    
    if (browserUser.rows.length === 0) {
      console.log('❌ Browser user (ID 41) not found!');
      return;
    }
    
    const browserUserData = browserUser.rows[0];
    console.log('\n💻 Browser User:');
    console.log(JSON.stringify(browserUserData, null, 2));
    
    // Check if conversation exists between these users
    const existingConv = await client.query(
      `SELECT DISTINCT c.id 
       FROM conversations c
       JOIN "conversationParticipants" cp1 ON c.id = cp1."conversationId"
       JOIN "conversationParticipants" cp2 ON c.id = cp2."conversationId"
       WHERE cp1."userId" = $1 AND cp2."userId" = $2
       AND c."chatType" = 'direct'`,
      [browserUserData.id, phoneUserData.id]
    );
    
    let conversationId;
    
    if (existingConv.rows.length > 0) {
      conversationId = existingConv.rows[0].id;
      console.log('\n✅ Existing conversation found: ID', conversationId);
    } else {
      // Create new conversation
      const newConv = await client.query(
        `INSERT INTO conversations ("chatType", "createdByUserId", "createdAt", "updatedAt")
         VALUES ('direct', $1, NOW(), NOW())
         RETURNING id`,
        [browserUserData.id]
      );
      
      conversationId = newConv.rows[0].id;
      
      // Add both participants
      await client.query(
        `INSERT INTO "conversationParticipants" ("conversationId", "userId", "joinedAt")
         VALUES ($1, $2, NOW()), ($1, $3, NOW())`,
        [conversationId, browserUserData.id, phoneUserData.id]
      );
      
      console.log('\n✅ New conversation created: ID', conversationId);
    }
    
    console.log('\n═══════════════════════════════════════');
    console.log('📞 CALL TEST SETUP COMPLETE');
    console.log('═══════════════════════════════════════\n');
    
    console.log('🔹 Browser User (Caller):');
    console.log('   ID:', browserUserData.id);
    console.log('   Email:', browserUserData.email);
    console.log('   Name:', browserUserData.firstName, browserUserData.lastName);
    
    console.log('\n🔹 Phone User (Receiver):');
    console.log('   ID:', phoneUserData.id);
    console.log('   Email:', phoneUserData.email);
    console.log('   Name:', phoneUserData.firstName, phoneUserData.lastName);
    
    console.log('\n🔹 Conversation ID:', conversationId);
    
    console.log('\n📋 NEXT STEPS:');
    console.log('═══════════════════════════════════════');
    console.log('1. Open browser: http://localhost:3001/public/test-audio.html');
    console.log('2. Get User 41 token from test-info.txt');
    console.log('3. Connect as User 41 in browser');
    console.log('4. Your phone is already logged in as User', phoneUserData.id);
    console.log('5. Navigate to conversation', conversationId, 'on your phone');
    console.log('6. Click "Call" button in browser');
    console.log('7. Accept call on phone');
    console.log('8. Test audio both ways!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

setupCallTest();
