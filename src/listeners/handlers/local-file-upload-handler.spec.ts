import LocalFileUploadHandler from "./local-file-upload-handler";
import * as url from "url";
import {ConversionMap, Fastq2BamConvertRequest, FileUploadMessage} from "../../common/types";
import TusUpload from "../../model/tus-upload";


describe("Local file uploader tests", () => {
    it("should parse submission uuids from submission URIs", () => {
        const mockSubmissionUuid = "deadbeef-dead-dead-dead-deaddeafbeef";
        const mockSubmissionUrl = new url.URL(`https://mock-usi/api/submissions/${mockSubmissionUuid}`);

        expect(LocalFileUploadHandler._submissionUuidFromSubmissionUri(mockSubmissionUrl)).toEqual(mockSubmissionUuid);
    });

    it("should generate upload requests file upload messages", () => {
        const mockFileNames = ["mockFileName1", "mockFileName2", "mockFileName3"];
        const mockSubmissionUuid = "deadbeef-dead-dead-dead-deaddeafbeef";
        const mockUsiUrl = "https://mock-usi";
        const mockSubmissionUrl = new url.URL(`${mockUsiUrl}/api/submissions/${mockSubmissionUuid}`);
        const mockBundleUuid = "deadbaaa-dead-dead-dead-deaddeafbaaa";
        const mockFileBasePathDir = "/data/myfiles";

        const mockUploadMessage : FileUploadMessage = {
            fileNames: mockFileNames,
            usiUrl: mockUsiUrl,
            submissionUrl: mockSubmissionUrl.toString(),
            bundleUuid: mockBundleUuid
        };

        const uploadRequests: TusUpload[] = LocalFileUploadHandler._uploadRequestsFromUploadMessage(mockUploadMessage, mockFileBasePathDir);

        expect(uploadRequests.length).toBe(3);

        uploadRequests.forEach((tusUpload: TusUpload) => {
            expect(tusUpload.fileInfo.filePath).toMatch((new RegExp(`${mockFileBasePathDir}/${mockBundleUuid}/mockFileName[123]`)));
            expect(tusUpload.submission).toEqual(mockSubmissionUuid);
            expect(tusUpload.uploadUrl).toEqual(`${mockUsiUrl}/files`);
            expect(tusUpload.fileInfo.fileName).toMatch(new RegExp("mockFileName[123]"));
        });
    });

    it("should generate bam conversion requests", () => {
        const mockR1 = "mockR1.fastq.gz";
        const mockR2 = "mockR2.fastq.gz";
        const mockIndex = "mockI.fastq.gz";

        const mockOutputName = "mockbam.bam";
        const mockFileBasePathDir = "/data/myfiles";

        const mockConversionMapPair: ConversionMap = {
            inputs: [
                {
                    readIndex: "read1",
                    fileName: mockR1
                },
                {
                    readIndex: "read2",
                    fileName: mockR2,
                },
                {
                    readIndex: "index1",
                    fileName: mockIndex
                }
            ],
            outputName: mockOutputName
        };

        const convertRequestPair = LocalFileUploadHandler._generateBamConvertRequest(mockConversionMapPair, mockFileBasePathDir);
        expect(convertRequestPair.reads).toContainEqual({readIndex: "read1", fileName: mockR1});
        expect(convertRequestPair.reads).toContainEqual({readIndex: "read2", fileName: mockR2});
        expect(convertRequestPair.reads).toContainEqual({readIndex: "index1", fileName: mockIndex});
        expect(convertRequestPair.outputName).toEqual(`${mockFileBasePathDir}/${mockOutputName}`);
    });
});