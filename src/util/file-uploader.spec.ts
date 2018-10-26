import FileUploader from "./file-uploader";
import TokenManager from "./token-manager";
import AapTokenClient from "./aap-token-client";
import ITokenClient from "./token-client";
import TusUpload from "../model/tus-upload";
import Promise from "bluebird";
import * as path from "path";
import {Server} from "http";

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


    let http: Server;

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
        tusUpload.submission = mockSubmission;

        jest.setTimeout(15000);
        return fileUploader.stageLocalFile(tusUpload)
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
        http = server.listen({host, port}, () => {
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
        tusUpload.submission = mockSubmission;

        jest.setTimeout(15000);

        return fileUploader.stageLocalFile(tusUpload)
            .then(() => {return Promise.delay(3000)})
            .then(() => {
                expect(fileUploadedSuccessfully).toBeTruthy();
                return Promise.resolve();
            })
            .catch(err => fail(err));
    });

    test("it should stream a file from AWS", () => {
        const server = new tus.Server();
        server.datastore = new tus.FileStore({
            path: "/util"
        });
        const host = '127.0.0.1';
        const port = 1080;
        http = server.listen({host, port}, () => {
            console.log(`[${new Date().toLocaleTimeString()}] tus server listening at http://${host}:${port}`);
        });

        let fileUploadedSuccessfully = false;

        server.on(tus.EVENTS.EVENT_FILE_CREATED, (event: any) => {
            console.log(`File created for new upload request ${event.file.id}`);
            fileUploadedSuccessfully = true;
        });

        const cloudUrl = "s3://org-humancellatlas-upload-integration/f9abf88a-d0cf-426f-b5f5-361234bda717/R1.fastq.gz";


        const fileUploader = new FileUploader(tokenManager);
        fileUploader.stageS3File({bucket: "org-humancellatlas-upload-integration", key: "f9abf88a-d0cf-426f-b5f5-361234bda717/R1.fastq.gz"});
    });
});