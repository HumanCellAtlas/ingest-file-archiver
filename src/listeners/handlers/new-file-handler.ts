import Promise from "bluebird";


class NewFileHandler implements IHandler {
    constructor() {
    }

    handle(msg: AmqpMessage) {
        let msgContent = null;
        try {
            msgContent = JSON.parse(msg.messageBytes);
        } catch (err) {
            console.error("Failed to parse message content (ignoring): " + msg.messageBytes);
            return;
        }

        return msgContent;
        // TODO: handle new File messages by uploading to the USI tus.io server
    }
}

export default NewFileHandler;