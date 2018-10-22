type AmqpMessage = {messageBytes: string};

interface IHandler {
    handle(msg: AmqpMessage): void;
}

export default IHandler;
export {AmqpMessage, IHandler};