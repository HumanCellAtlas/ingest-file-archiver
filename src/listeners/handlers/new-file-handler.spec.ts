import NewFileHandler from "./new-file-handler";
import {IHandler, AmqpMessage} from "./handler";


describe("New file handler tests", () => {
    test("Handle AMQP message", () => {
        let handler: IHandler = new NewFileHandler();
        handler.handle({messageBytes: '{"key": "value"}'})
    });
});