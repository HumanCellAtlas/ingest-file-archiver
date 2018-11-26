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
import {S3TusUpload} from "../model/s3-tus-upload";
import ts from "../common/types";
import S3Info = ts.S3Info;

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
        const filePath = path.resolve(__dirname, "./mockfile.txt");
        const tusUpload = new TusUpload({fileName: "mock-file-name", filePath: filePath}, "http://" + tusTestServer.host + ":" + tusTestServer.port + "/files");
        fs.writeFileSync(filePath, "hello world");

        tusUpload.uploadUrl = "http://" + tusTestServer.host + ":" + tusTestServer.port + "/files";
        tusUpload.submission = mockSubmission;

        jest.setTimeout(15000);

        return fileUploader.stageLocalFile(tusUpload)
            .then(() => {return Promise.delay(3000)})
            .then(() => {
                expect(fileUploadedSuccessfully).toBeTruthy();
                fs.unlinkSync(tusUpload.fileInfo.filePath!);
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
        const filePath = path.resolve(__dirname, "./mockfile.txt");
        const tusUpload = new TusUpload({fileName: "mock-file-name", filePath: filePath}, "http://" + tusTestServer.host + ":" + tusTestServer.port + "/files");
        fs.writeFileSync(filePath, "hello world");

        tusUpload.uploadUrl = "http://" + tusTestServer.host + ":" + tusTestServer.port + "/files";
        tusUpload.submission = mockSubmission;

        jest.setTimeout(15000);

        return fileUploader.stageLocalFile(tusUpload)
            .then(() => {return Promise.delay(3000)})
            .then(() => {
                expect(metadataPopulated).toBeTruthy();
                fs.unlinkSync(tusUpload.fileInfo.filePath!);
                return Promise.resolve();
            })
            .catch(err => fail(err));
    });


    test("it should stream a file from AWS", () => {
        jest.setTimeout(15000);

        const cloudUrl = new url.URL("s3://https://org-hca-dss-checkout-dev/bundles/125592cd-c350-47db-a412-abfe6ba02c86.2018-09-21T154249.020512Z/cell_suspension_0.json");
        const tusServerURl = "http://" + tusTestServer.host + ":" + tusTestServer.port + "/files";

        const tusUpload = new TusUpload({fileName: "mock-file-name"}, tusServerURl);
        tusUpload.submission = mockSubmission;
        tusUpload.uploadUrl = "http://" + tusTestServer.host + ":" + tusTestServer.port + "/files";
        const s3Info: S3Info = {
            s3Location: S3TusUpload._s3LocationFromPresignedUrl(cloudUrl),
            s3AuthInfo: S3TusUpload._s3AuthFromPresignedUrl(cloudUrl)
        };
        const s3TusUpload = new S3TusUpload(s3Info, tusUpload);

        let fileUploadedSuccessfully = false;

        tusTestServer.tusServer!.on(tus.EVENTS.EVENT_FILE_CREATED, (event: any) => {
            console.log(`File created for new upload request ${event.file.id}`);
            fileUploadedSuccessfully = true;
        });

        const fileUploader = new FileUploader(tokenManager);
        return fileUploader.stageS3File(s3TusUpload)
            .then(upload => {
                expect(upload).toBeTruthy();
                return Promise.delay(2000)
                    .then(() => {
                        expect(fileUploadedSuccessfully).toBeTruthy();
                    });
            });
    });

    test("it should stream a file from AWS using a pre-signed URL", () => {
        jest.setTimeout(25000);

        const cloudUrl = new url.URL("https://org-hca-dss-checkout-prod.s3.amazonaws.com/bundles/b6d096f4-239a-476d-9685-2a03c86dc06b.2018-10-30T160600.058907Z/CG00052_SingleCell3_ReagentKitv2UserGuide_RevE.pdf?AWSAccessKeyId=ASIARSZHKI4KDLBA4D6U&Signature=%2BqIDnrNL28%2FXKTuARZmZBwN9jqM%3D&x-amz-security-token=FQoGZXIvYXdzEM7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaDITjnMGJ7QY5HJqx0yLgAcpRtfyqp%2BW9i8fvR1iGg0dl8lmAiaXi5hSPt0JYt%2BdHZlGYfKpaQ3KkbudmoAfXQeEPpyGiWjQPw1%2B12uY6tCSJ%2FS%2FtGFBrvS%2B3aQMP7W6BZISVyuua6PwbNTVf4nTRjjS20bt%2F1MjqmgyJVBrzfv6dwMTFF%2BL8R49bCb6qNBmXIRniGh3nQgkKxxsX2PuNKKfbUWO28pxAPliJtrn8D79YCFT9m27js%2FGk4Ceaf9NCkjYVTEVYfpBUz9TqAaqtrs7mJIVVA2AH0J1P1zgSgyh90500mPfl0vcuALi17AJjKNf0398F&Expires=1542992678");
        const tusServerURl = "http://" + tusTestServer.host + ":" + tusTestServer.port + "/files";

        const tusUpload = new TusUpload({fileName: "mock-file-name"}, tusServerURl);
        tusUpload.submission = mockSubmission;
        tusUpload.uploadUrl = "http://" + tusTestServer.host + ":" + tusTestServer.port + "/files";
        tusUpload.submission = mockSubmission;
        tusUpload.fileInfo.fileSize = 5645416;
        const s3Info: S3Info = {
            s3Location: S3TusUpload._s3LocationFromPresignedUrl(cloudUrl),
            s3AuthInfo: S3TusUpload._s3AuthFromPresignedUrl(cloudUrl)
        };

        const s3TusUpload = new S3TusUpload(s3Info, tusUpload);

        let fileUploadedSuccessfully = false;

        tusTestServer.tusServer!.on(tus.EVENTS.EVENT_FILE_CREATED, (event: any) => {
            console.log(`File created for new upload request ${event.file.id}`);
            fileUploadedSuccessfully = true;
        });

        const fileUploader = new FileUploader(tokenManager);
        return fileUploader.stageS3File(s3TusUpload)
            .then(upload => {
                expect(upload).toBeTruthy();
                return Promise.delay(2000)
                    .then(() => {
                        expect(fileUploadedSuccessfully).toBeTruthy();
                    });
            });
    });
});