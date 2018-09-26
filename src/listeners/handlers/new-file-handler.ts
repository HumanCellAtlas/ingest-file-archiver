const Promise = require('bluebird');

class NewFileHandler {
    constructor() {
    }

    handle(msg) {
        let msgContent = null;
        try {
            msgContent = JSON.parse(msg.content);
        } catch (err) {
            console.error("Failed to parse message content (ignoring): " + msg.content);
            return;
        }

        return msgContent;
        // TODO: handle new File messages by uploading to the USI tus.io server
    }
}

module.exports = NewFileHandler;