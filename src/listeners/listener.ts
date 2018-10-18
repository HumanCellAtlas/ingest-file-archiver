/**
 * Created by rolando on 02/08/2018.
 */
import amqp from "amqplib";
import Promise from "bluebird";

type ConnectionProperties = {scheme: string, host: string, port: string};

class Listener {
    rabbitConnectionProperties: ConnectionProperties;
    rabbitUrl: string;
    exchange: string;
    queue: string;
    exchangeType: string;
    handler?: IHandler;

    constructor(rabbitConnectionProperties: ConnectionProperties,
                exchange: string,
                queue: string,
                exchangeType: string) {
        this.rabbitConnectionProperties = rabbitConnectionProperties;
        this.rabbitUrl = rabbitConnectionProperties.scheme + "://" + rabbitConnectionProperties.host + ":" + rabbitConnectionProperties.port;
        this.exchange = exchange;
        this.queue = queue;
        this.exchangeType = exchangeType;
    }

    start() : Promise<void> {
        return new Promise<void>((resolve, reject) => {
            amqp.connect(this.rabbitUrl)
                .then(conn => {return conn.createChannel()})
                .then(ch => { ch.assertExchange(this.exchange, this.exchangeType)
                .then(() => {
                    ch.assertQueue(this.queue, {durable: false})
                    .then(() => {ch.bindQueue(this.queue, this.exchange, this.queue)
                        .then(() => {
                            ch.prefetch(1).then(() => {
                                ch.consume(this.queue, (msg) => {
                                    this.handle({messageBytes: msg!.content.toString()});
                                }, {noAck : true});
                                resolve();
                            })
                        })
                    })
                })

            })
        });
    }

    setHandler(handler: IHandler): void {
        this.handler = handler;
    }

    handle(msg: AmqpMessage) {
        this.handler!.handle(msg);
    }

}

export default Listener;
export {Listener, ConnectionProperties};