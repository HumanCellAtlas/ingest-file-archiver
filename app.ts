const config = require('config');

const TokenManager = require("src/util/token-manager");
const NewFileListener = require("src/listeners/new-file-listener");
const NewFileHandler = require("src/listeners/handlers/new-file-handler");


/* ----------------------------------- */

const tokenManager = (() => {
    const authUrl = config.get("AUTH.authUrl");
    const credentials = config.get("AUTH.credentials");

    return new TokenManager(authUrl, credentials);
})();

const fileUploader = (() => {

})();

const newFileHandler = (() => {
    return new NewFileHandler();
})();

const newFileListener = (() => {
    const rabbitConnectionConfig = config.get("AMQP.newFile.connection");
    const rabbitMessagingConfig = config.get("AMQP.newFile.messaging");

    const exchange = rabbitMessagingConfig.exchange;
    const queueName = rabbitMessagingConfig.queueName;
    const exchangeType = rabbitMessagingConfig.exchangeType;

    return new NewFileListener(rabbitConnectionConfig, exchange, queueName, newFileHandler, exchangeType);
})();

