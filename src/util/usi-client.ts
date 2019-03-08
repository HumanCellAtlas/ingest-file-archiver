import {ConnectionProperties} from "../common/types";
import request from "request-promise";
import Promise from "bluebird";
import TokenManager from "./token-manager";

class UsiClient {
    usiApiConnectionProperties?: ConnectionProperties;
    usiApiUrl: string;
    tokenManager: TokenManager;

    constructor(usiApiUrl: string, tokenManager: TokenManager, usiApiConnectionProperties?: ConnectionProperties) {
        this.usiApiUrl = usiApiUrl;
        this.tokenManager = tokenManager;
        this.usiApiConnectionProperties = usiApiConnectionProperties;
    }

    checkFileAlreadyUploaded(submissionId: string, fileName: string) : Promise<boolean> {
        return this.checkIfFileInSubmission(submissionId, fileName);
    }

    retrieve(resourceUrl: string) : Promise<any> {
        return this.tokenManager.getToken().then(token => {
            return new Promise<any>((resolve, reject) => {
                request({
                    url: resourceUrl,
                    method: "GET",
                    json: true,
                    headers : {
                        Authorization: `Bearer ${token}`
                    }
                })
                    .then(resp => resolve(resp))
                    .catch(error => reject(error));
            });
        });
    }

    retrieveSubmission(submissionId: string) : Promise<any> {
        return this.retrieve(`${this.usiApiUrl}/api/submissions/${submissionId}`);
    }

    checkIfFileInSubmission(submissionId: string, fileName: string) : Promise<boolean>{
        return this.retrieve(`${this.usiApiUrl}/api/files/search/by-filename-and-submission?submissionId=${submissionId}&filename=${fileName}`)
            .then(() => {return Promise.resolve(true)})
            .catch(err => {return Promise.resolve(false)});
    }
}

export default UsiClient;