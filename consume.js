require('dotenv').config();
const amqp =require('amqplib');
async function main() {
    const conn = await
    amqp.connect(process.env.RABBITMQ_URL);
    const channel = await
    conn.createChannel();
    const exchange = 'oreder-events';
    await channel.assertExchange(exchange,'topic' ,{durable:true});
    const routingKey ='order.confirmed';
    const q = await chasnnel.assertQueue('',{exclusive: true});
    await channel.bindQueue(q.queue, exchange, 'order.confirmed');
    console.log('wating for messages ...');
    channel.consume(q.queue, (msg)=>{if (msg){console.log('Received:',JSON.parse(msg.content.toString()));
        channel.ack(msg);}
    });
}
main().catch(console.error);