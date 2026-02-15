const WebSocket = require('ws');
const token = 'c5bcd85c468533bc15ddd5db551bfefbc33f244beb6a2e2d';
const ws = new WebSocket(`ws://127.0.0.1:18902/?token=${token}`);

ws.on('open', () => {
  console.log('✅ Connected\n');

  const deviceId = `node-client-${Math.random().toString(36).slice(2)}`;
  const publicKey = Buffer.from(deviceId + '-public-key').toString('base64');
  const signature = Buffer.from(`${deviceId}:${Date.now()}`).toString('base64');

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
    console.log('✅ HELLO-OK RECEIVED\n');
    console.log('📋 Features:');
    console.log('  Methods:', msg.payload.features?.methods?.slice(0, 10), '... (' + msg.payload.features?.methods?.length + ' total)');
    console.log('  Events:', msg.payload.features?.events?.slice(0, 5));
    console.log('\n🔐 Auth info:');
    console.log('  ', JSON.stringify(msg.payload.auth, null, 2));
    console.log('\n📊 Snapshot:');
    console.log('  Default agent:', msg.payload.snapshot?.health?.defaultAgentId);
    console.log('  Protocol:', msg.payload.protocol);
    console.log('\n🎯 Full payload:');
    console.log(JSON.stringify(msg.payload, null, 2).substring(0, 2000));

    ws.close();
    process.exit(0);
  }

  if (msg.type === 'res' && msg.ok === false) {
    console.log('❌ Error:', msg.error?.message || msg.error);
    ws.close();
    process.exit(1);
  }
});

ws.on('error', (e) => {
  console.log('❌ Error:', e.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('⏱️  Timeout');
  process.exit(1);
}, 10000);
