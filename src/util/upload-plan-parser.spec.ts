import {UploadJob} from "../common/types";
import UploadPlanParser from "./upload-plan-parser";

describe("Upload plan parser tests", () => {
   it("should handle null/undefined conversion maps in the upload plan", () => {
       const mockUploadJob: UploadJob = {
           usi_api_url: "http://mock-usi-api-url",
           ingest_api_url: "http://mock-ingest-api-url",
           submission_url: "http://mock-usi-api-url/mock-submission-id",
           files: ["mockFastq1.fast.gz"],
           bundle_uuid: "mockBundleUuid",
           conversion: undefined
       };

       expect(UploadPlanParser.uploadMessageForJob(mockUploadJob)).toBeTruthy();
   })
});