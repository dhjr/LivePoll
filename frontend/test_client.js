const { io } = require('socket.io-client');
const client = io('http://localhost:3001');

console.log("Attempting connection...");

client.on('connect', () => {
    console.log('✅ Connected with ID:', client.id);
    
    // Listen for initial data
    client.on('initial_data', (data) => {
        console.log('📩 Received initial_data:', JSON.stringify(data, null, 2));
        
        // Cast a vote for Next.js
        console.log('👉 Casting vote for "Next.js"');
        client.emit('cast_vote', 'Next.js');
    });

    client.on('update_votes', (data) => {
        console.log('📩 Received update_votes:', JSON.stringify(data, null, 2));
        
        // If Next.js has votes, try Ubuntu
        if (data['Next.js'] > 0 && data['Ubuntu'] === 0) {
             console.log('👉 Now casting vote for "Ubuntu"');
             client.emit('cast_vote', 'Ubuntu');
        } else if (data['Ubuntu'] > 0) {
             console.log('✅ Ubuntu vote confirmed. Test finished.');
             client.close();
             process.exit(0);
        }
    });

    client.on('connect_error', (err) => {
      console.log(`connect_error due to ${err.message}`);
    });
});
