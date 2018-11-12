import FileUploader from "./file-uploader";
import TokenManager from "./token-manager";
import AapTokenClient from "./aap-token-client";
import ITokenClient from "./token-client";
import TusUpload from "../model/tus-upload";
import Promise from "bluebird";
import * as path from "path";
import {Server} from "http";
import url from "url";
import fs from "fs";


const tus: any = require("tus-node-server");


describe("Uploader tests", () => {
    type TusTestServer = {
        tusServer: any,
        tusHttpServer?: Server,
        host?: string,
        port?: number
    };

    const initTusTestServer = (): TusTestServer => {
        const host = '127.0.0.1';
        const port = 1080;
        return {
            tusServer: undefined,
            tusHttpServer: undefined,
            host: host,
            port: port
        }
    };

    const startTestTusServer = (tusTestServer: TusTestServer): TusTestServer => {
        const tusServer = new tus.Server();
        tusServer.datastore = new tus.FileStore({
            path: "/util"
        });

        const host = tusTestServer.host;
        const port = tusTestServer.port;

        tusTestServer.tusServer = tusServer;
        tusTestServer.tusHttpServer = tusTestServer.tusServer.listen({host, port}, () => {
            console.log(`[${new Date().toLocaleTimeString()}] tus server listening at http://${host}:${port}`);
        });

        return tusTestServer;
    };

    const stopTestTusServer = (tusTestServer: TusTestServer): TusTestServer => {
        tusTestServer.tusHttpServer!.close();
        tusTestServer.tusHttpServer = undefined;
        return tusTestServer;
    };

    const tusTestServer = initTusTestServer();

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


    beforeAll(() => {
       startTestTusServer(tusTestServer);
    });

    afterAll(() => {
        stopTestTusServer(tusTestServer);
    });

    test("it should store a file on a tus-server", () => {
        let fileUploadedSuccessfully = false;

        tusTestServer.tusServer!.on(tus.EVENTS.EVENT_FILE_CREATED, (event: any) => {
            console.log(`File created for new upload request ${event.file.id}`);
            fileUploadedSuccessfully = true;
        });


        const retrieveTokenMock = jest.spyOn(mockTokenClient, "retrieveToken");
        retrieveTokenMock.mockImplementation(() => {
            return Promise.resolve("mocktoken")
        });

        const fileUploader = new FileUploader(tokenManager);
        const tusUpload = new TusUpload();
        const filePath = path.resolve(__dirname, "./mockfile.txt");
        fs.writeFileSync(filePath, "hello world");

        tusUpload.filePath = filePath;
        tusUpload.uploadUrl = "http://" + tusTestServer.host + ":" + tusTestServer.port + "/files";
        tusUpload.fileName = "mock-file-name";
        tusUpload.submission = mockSubmission;

        jest.setTimeout(15000);

        return fileUploader.stageLocalFile(tusUpload)
            .then(() => {return Promise.delay(3000)})
            .then(() => {
                expect(fileUploadedSuccessfully).toBeTruthy();
                fs.unlinkSync(tusUpload.filePath!);
                return Promise.resolve();
            })
            .catch(err => fail(err));
    });

    test("it should populate tus metadata headers for upload requests", () => {
        let metadataPopulated = "";

        tusTestServer.tusServer!.on(tus.EVENTS.EVENT_FILE_CREATED, (event: any) => {
            metadataPopulated = event.file.upload_metadata;
        });


        const retrieveTokenMock = jest.spyOn(mockTokenClient, "retrieveToken");
        retrieveTokenMock.mockImplementation(() => {
            return Promise.resolve("mocktoken")
        });

        const fileUploader = new FileUploader(tokenManager);
        const tusUpload = new TusUpload();
        const filePath = path.resolve(__dirname, "./mockfile.txt");
        fs.writeFileSync(filePath, "hello world");

        tusUpload.filePath = filePath;
        tusUpload.uploadUrl = "http://" + tusTestServer.host + ":" + tusTestServer.port + "/files";
        tusUpload.fileName = "mock-file-name";
        tusUpload.submission = mockSubmission;

        jest.setTimeout(15000);

        return fileUploader.stageLocalFile(tusUpload)
            .then(() => {return Promise.delay(3000)})
            .then(() => {
                expect(metadataPopulated).toBeTruthy();
                fs.unlinkSync(tusUpload.filePath!);
                return Promise.resolve();
            })
            .catch(err => fail(err));
    });


    test("it should stream a file from AWS", () => {
        jest.setTimeout(15000);

        const cloudUrl = "s3://org-humancellatlas-upload-integration/f9abf88a-d0cf-426f-b5f5-361234bda717/R1.fastq.gz";
        const tusUpload = new TusUpload();
        tusUpload.filePath = path.resolve(__dirname, "./file-uploader.ts");
        tusUpload.uploadUrl = "http://" + tusTestServer.host + ":" + tusTestServer.port + "/files";
        tusUpload.fileName = "mock-file-name";
        tusUpload.submission = mockSubmission;
        tusUpload.setS3Url(new url.URL(cloudUrl));

        let fileUploadedSuccessfully = false;

        tusTestServer.tusServer!.on(tus.EVENTS.EVENT_FILE_CREATED, (event: any) => {
            console.log(`File created for new upload request ${event.file.id}`);
            fileUploadedSuccessfully = true;
        });

        const fileUploader = new FileUploader(tokenManager);
        return fileUploader.stageS3File(tusUpload)
            .then(upload => {
                expect(upload).toBeTruthy();
                return Promise.delay(2000)
                    .then(() => {
                        expect(fileUploadedSuccessfully).toBeTruthy();
                    });
            });
    });
});