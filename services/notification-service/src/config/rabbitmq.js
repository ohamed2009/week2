// rabbitmq.js = RabbitMQ consumer for notification-service.
//
// Connects to the shared "order-events" topic exchange, declares/binds this
// service's own durable queue, and consumes "order.confirmed" events. Each
// message is handed to a caller-supplied handler(payload); the message is
// ACKed only after the handler resolves successfully, and NACKed (without
// requeue) if the handler rejects — e.g. a malformed payload — so a single
// bad message can't be redelivered forever.
//
// RabbitMQ is treated the same way order-service treats it: a connection
// failure is logged and retried, it never crashes the process. The service
// must stay up (and POST /notifications must keep working) even if the
// broker is completely unreachable.

const amqplib = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'order-events';
const QUEUE = process.env.RABBITMQ_QUEUE || 'notification-service-order-confirmed';
const ROUTING_KEY = 'order.confirmed';

const RETRY_DELAY_MS = 5000;

let channel = null;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Connects, asserts the exchange + this service's own durable queue, binds
// them, and starts consuming. On any connection/channel error it logs the
// problem and schedules a reconnect instead of throwing — this function is
// meant to be "fire and forget" from server.js.
async function startConsumer(handler) {
  try {
    const conn = await amqplib.connect(RABBITMQ_URL);

    conn.on('error', (err) => {
      console.error('[rabbitmq] connection error:', err.message);
    });
    conn.on('close', () => {
      console.warn(`[rabbitmq] connection closed, reconnecting in ${RETRY_DELAY_MS}ms`);
      channel = null;
      delay(RETRY_DELAY_MS).then(() => startConsumer(handler));
    });

    const ch = await conn.createChannel();
    channel = ch;

    // Only pull one unacked message at a time — keeps memory bounded and
    // means a slow/failed handler doesn't starve other consumers of this
    // queue if the service is ever scaled out.
    await ch.prefetch(1);

    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
    await ch.assertQueue(QUEUE, { durable: true });
    await ch.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

    console.log(
      `[rabbitmq] consuming queue "${QUEUE}" bound to "${EXCHANGE}" (${ROUTING_KEY})`
    );

    ch.consume(QUEUE, async (msg) => {
      if (!msg) return; // consumer was cancelled by the server

      let payload;
      try {
        payload = JSON.parse(msg.content.toString());
      } catch (parseErr) {
        console.error('[rabbitmq] malformed message (invalid JSON), dropping:', parseErr.message);
        ch.nack(msg, false, false); // discard, do not requeue — it will never parse
        return;
      }

      try {
        await handler(payload);
        ch.ack(msg);
      } catch (handlerErr) {
        console.error('[rabbitmq] failed to process message, dropping:', handlerErr.message);
        // Validation/DB errors are not transient in a way a retry would fix
        // (a message missing "userId" will always be missing "userId"), so
        // we drop rather than requeue to avoid a poison-message loop.
        ch.nack(msg, false, false);
      }
    });
  } catch (err) {
    console.error(
      `[rabbitmq] failed to connect/start consumer, retrying in ${RETRY_DELAY_MS}ms:`,
      err.message
    );
    channel = null;
    await delay(RETRY_DELAY_MS);
    return startConsumer(handler);
  }
}

module.exports = { startConsumer };
