// rabbitmq.js = reusable RabbitMQ publisher for order-service.
//
// order-service only ever PUBLISHES (it never consumes), so this module is
// intentionally small: connect once, keep the channel alive for the life of
// the process, expose a single publish() function.
//
// RabbitMQ is a best-effort dependency here, same spirit as the old
// notification HTTP call: if the broker is down, publish() rejects but never
// throws synchronously and never crashes the process. It's up to the caller
// (order.controller) to catch that rejection, log it, and let the order
// continue — RabbitMQ being down must never fail an otherwise valid order.

const amqplib = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'order-events';

let channel = null;
let connecting = null; // in-flight connection promise, shared by concurrent callers

// Opens (or reuses) the connection + channel and asserts the topic exchange.
// Safe to call concurrently — the actual connect only happens once.
async function getChannel() {
  if (channel) return channel;
  if (connecting) return connecting;

  connecting = (async () => {
    const conn = await amqplib.connect(RABBITMQ_URL);

    // A connection-level error/close should not crash the process. Drop our
    // cached channel so the next publish() call reconnects from scratch.
    conn.on('error', (err) => {
      console.error('[rabbitmq] connection error:', err.message);
    });
    conn.on('close', () => {
      console.warn('[rabbitmq] connection closed');
      channel = null;
    });

    const ch = await conn.createChannel();
    ch.on('error', (err) => {
      console.error('[rabbitmq] channel error:', err.message);
    });
    ch.on('close', () => {
      channel = null;
    });

    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });

    channel = ch;
    return ch;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
}

// Publish a JSON payload to the order-events exchange under the given
// routing key. Rejects on failure (broker down, connection refused, etc.) —
// it is the caller's job to try/catch this and decide it's non-fatal.
async function publish(routingKey, payload) {
  const ch = await getChannel();
  const body = Buffer.from(JSON.stringify(payload));

  const ok = ch.publish(EXCHANGE, routingKey, body, {
    persistent: true,
    contentType: 'application/json',
  });

  if (!ok) {
    // Node-side write buffer is full; the message is still queued to be
    // written, just not immediately. Not an error, just worth a log line.
    console.warn('[rabbitmq] publish buffer full, message may be delayed');
  }
}

// Called once at startup so a broken RABBITMQ_URL is visible in the logs
// immediately instead of on the first order. Failure here must NOT stop the
// service from starting: RabbitMQ is not a hard dependency for order-service
// to be able to accept orders.
async function connectRabbitMQ() {
  try {
    await getChannel();
    console.log(`[rabbitmq] connected, exchange "${EXCHANGE}" ready`);
  } catch (err) {
    console.error(
      '[rabbitmq] startup connection failed, will retry lazily on next publish:',
      err.message
    );
  }
}

module.exports = { publish, connectRabbitMQ };
