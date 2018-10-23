import FileUploader from "./file-uploader";
import TokenManager from "./token-manager";
import AapTokenClient from "./aap-token-client";
import ITokenClient from "./token-client";
import TusUpload from "../model/tus-upload";
import Promise from "bluebird";
import * as path from "path";

const tus: any = require("tus-node-server");


describe("Uploader tests", () => {
    const mockTokenClient: ITokenClient = new AapTokenClient({
        username: "blah",
        password: "blah"
    }, "http://mock-auth-url");
    const mockSubmission = "mock-submission-id";

    const retrieveTokenMock = jest.spyOn(mockTokenClient, "retrieveToken");
    retrieveTokenMock.mockImplementation(() => {
        return Promise.resolve("mocktoken")
    });

    const tokenManager = new TokenManager(mockTokenClient, 20 * 6 * 1000, 5 * 6 * 1000);


    test("it should upload a file from local disk", () => {
        const mockTusServerHost = "127.0.0.1";
        const mockTusServerPort = 9000;
        const retrieveTokenMock = jest.spyOn(mockTokenClient, "retrieveToken");
        retrieveTokenMock.mockImplementation(() => {
            return Promise.resolve("mocktoken")
        });

        const fileUploader = new FileUploader(tokenManager);
        const tusUpload = new TusUpload();
        tusUpload.filePath = path.resolve(__dirname, "./file-uploader.ts");
        tusUpload.uploadUrl = "http://" + mockTusServerHost + ":" + mockTusServerPort;

        jest.setTimeout(15000);
        return fileUploader.stageLocalFile(tusUpload, mockSubmission)
            .then(() => {
                return;
            })
            .catch((err: { causingError: { code: string, port: number, address: string } }) => {
                // expecting an error connecting to the tus server
                expect(err.causingError.code).toEqual("ECONNREFUSED");
                expect(err.causingError.port).toEqual(mockTusServerPort);
                expect(err.causingError.address).toEqual(mockTusServerHost);
            });
    });

    test("it should store a file on a tus-server", () => {
        const server = new tus.Server();
        server.datastore = new tus.FileStore({
            path: "/util"
        });
        const host = '127.0.0.1';
        const port = 1080;
        const http = server.listen({host, port}, () => {
            console.log(`[${new Date().toLocaleTimeString()}] tus server listening at http://${host}:${port}`);
        });

        let fileUploadedSuccessfully = false;

        server.on(tus.EVENTS.EVENT_FILE_CREATED, (event: any) => {
            console.log(`File created for new upload request ${event.file.id}`);
            fileUploadedSuccessfully = true;
        });


        const retrieveTokenMock = jest.spyOn(mockTokenClient, "retrieveToken");
        retrieveTokenMock.mockImplementation(() => {
            return Promise.resolve("mocktoken")
        });

        const fileUploader = new FileUploader(tokenManager);
        const tusUpload = new TusUpload();
        tusUpload.filePath = path.resolve(__dirname, "./file-uploader.ts");
        tusUpload.uploadUrl = "http://" + host + ":" + port + "/files";
        tusUpload.fileName = "mock-file-name";

        jest.setTimeout(15000);

        return fileUploader.stageLocalFile(tusUpload, mockSubmission)
            .then(() => {return Promise.delay(3000)})
            .then(() => {
                expect(fileUploadedSuccessfully).toBeTruthy();
                http.close();
                return Promise.resolve();
            })
            .catch(err => fail(err));
    });
});