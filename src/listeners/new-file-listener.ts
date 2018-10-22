/**
 * Created by rolando on 01/08/2018.
 */
import {Listener, ConnectionProperties} from "./listener";
import IHandler from "./handlers/handler";

class FileValidationListener {
    exchange: string;
    exchangeType: string;
    queue: string;
    handler: IHandler
    listener: Listener;

    constructor(rabbitConnectionProperties: ConnectionProperties, exchange: string, queue: string, handler: IHandler, exchangeType: string) {
        this.exchange = exchange;
        this.exchangeType = exchangeType;
        this.queue = queue;
        this.handler = handler;
        this.listener = new Listener(rabbitConnectionProperties, exchange, queue, exchangeType);
        this.listener.setHandler(this.handler);
    }

    start(){
        this.listener.start();
    }
}

export default FileValidationListener;