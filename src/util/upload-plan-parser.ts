import {ConversionMap, FileUploadMessage, UploadJob, UploadJobConversion} from "../common/types";
import R from "ramda";

class UploadPlanParser {

    static uploadMessageForJob(uploadJob: UploadJob): FileUploadMessage {
        return {
            bundleUuid: uploadJob.bundle_uuid,
            submissionUrl: uploadJob.submission_url,
            fileNames: uploadJob.files,
            usiUrl: uploadJob.usi_api_url,
            conversionMap: uploadJob.conversion ? UploadPlanParser.parseConversionMap(uploadJob.conversion) : undefined
        }
    }

    static parseConversionMap(uploadJobConversion: UploadJobConversion) : ConversionMap {
        return {
            inputs: R.map((conversionInput) => {return {readIndex: conversionInput.read_index, fileName: conversionInput.name} } , uploadJobConversion.inputs),
            outputName: uploadJobConversion.output_name
        }
    }
}

export default UploadPlanParser;