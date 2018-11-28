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
            expect(tusUpload.fileInfo.filePath).toMatch((new RegExp(`${mockFileBasePathDir}/mockFileName[123]`)));
            expect(tusUpload.submission).toEqual(mockSubmissionUuid);
            expect(tusUpload.uploadUrl).toEqual(`${mockUsiUrl}/files`);
            expect(tusUpload.fileInfo.fileName).toMatch(new RegExp("mockFileName[123]"));
        });
    });


    it("should reject bam conversion requests for a list of fastq files with length > 3 or length < 2", () => {
        const mockFileNamesTooMany = ["mockFileName1", "mockFileName2", "mockFileName3", "mockFileName4"];
        const mockFileNamesTooFew = ["mockFileName1"];


        const mockOutputName = "mockbam.bam";
        const mockFileBasePathDir = "/data/myfiles";

        const mockConversionMapTooManyInputs: ConversionMap = {
            inputs: mockFileNamesTooMany,
            outputName: mockOutputName
        };

        const mockConversionMapTooFewInputs: ConversionMap = {
            inputs: mockFileNamesTooFew,
            outputName: mockOutputName
        };

        expect(() => LocalFileUploadHandler._generateBamConvertRequest(mockConversionMapTooManyInputs, mockFileBasePathDir)).toThrow(Error);
        expect(() => LocalFileUploadHandler._generateBamConvertRequest(mockConversionMapTooFewInputs, mockFileBasePathDir)).toThrow(Error);

    });

    it("should generate bam conversion requests for 2 or 3 fastqs", () => {
        const mockFileNamesPair = ["mockFileName1", "mockFileName2"];
        const mockFileNamesPairWithIndex = ["mockFileName1", "mockFileName2", "mockFileName3"];

        const mockOutputName = "mockbam.bam";
        const mockFileBasePathDir = "/data/myfiles";

        const mockConversionMapPair: ConversionMap = {
            inputs: mockFileNamesPair,
            outputName: mockOutputName
        };

        const mockConversionMapPairWithIndex: ConversionMap = {
            inputs: mockFileNamesPairWithIndex,
            outputName: mockOutputName
        };

        const convertRequestPair = LocalFileUploadHandler._generateBamConvertRequest(mockConversionMapPair, mockFileBasePathDir);
        expect(convertRequestPair.r1Path).toEqual(`${mockFileBasePathDir}/mockFileName1`);
        expect(convertRequestPair.r2Path).toEqual(`${mockFileBasePathDir}/mockFileName2`);
        expect(convertRequestPair.indexPath).toBeUndefined();
        expect(convertRequestPair.outputName).toEqual(`${mockFileBasePathDir}/${mockOutputName}`);

        const convertRequestPairWithIndex = LocalFileUploadHandler._generateBamConvertRequest(mockConversionMapPairWithIndex, mockFileBasePathDir);
        expect(convertRequestPairWithIndex.r1Path).toEqual(`${mockFileBasePathDir}/mockFileName1`);
        expect(convertRequestPairWithIndex.r2Path).toEqual(`${mockFileBasePathDir}/mockFileName2`);
        expect(convertRequestPairWithIndex.indexPath).toEqual(`${mockFileBasePathDir}/mockFileName3`);
        expect(convertRequestPairWithIndex.outputName).toEqual(`${mockFileBasePathDir}/${mockOutputName}`);
    });
});