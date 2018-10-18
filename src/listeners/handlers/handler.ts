type AmqpMessage = {messageBytes: string};

interface IHandler {
    handle(msg: AmqpMessage): void;
}