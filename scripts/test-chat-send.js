const WebSocket = require('ws');
const token = 'c5bcd85c468533bc15ddd5db551bfefbc33f244beb6a2e2d';
const ws = new WebSocket(`ws://127.0.0.1:18902/?token=${token}`);

ws.on('open', () => {
  console.log('✅ Connecting...\n');

  ws.send(JSON.stringify({
    type: "req",
    id: "connect_1",
    method: "connect",
    params: {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: "cli",
        version: "1.0.0",
        platform: "web",
        mode: "node"
      },
      auth: { token }
    }
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());

  if (msg.type === 'res' && msg.payload?.type === 'hello-ok') {
    console.log('✅ Connected! Testing chat.send...\n');

    // Test chat.send with proper params
    ws.send(JSON.stringify({
      type: "req",
      id: "chat_test",
      method: "chat.send",
      params: {
        agent: "main",
        session: "main",
        message: {
          role: "user",
          content: "Hello from OpenJarvis test!"
        }
      }
    }));
  }

  if (msg.type === 'res' && msg.id === 'chat_test') {
    if (msg.ok === false) {
      console.log('❌ chat.send failed:');
      console.log('  Error:', JSON.stringify(msg.error, null, 2));
    } else {
      console.log('✅ chat.send succeeded!');
      console.log('  Response:', JSON.stringify(msg, null, 2));
    }
    ws.close();
    process.exit(msg.ok ? 0 : 1);
  }
});

ws.on('error', (e) => {
  console.log('❌ Error:', e.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('⏱️  Timeout');
  process.exit(1);
}, 15000);
