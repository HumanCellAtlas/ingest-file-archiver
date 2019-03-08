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
        return this.retrieve(`${this.usiApiUrl}/api/files/search/by-submission?submissionId=${submissionId}&filename=${fileName}`)
            .then((searchResults: any) => {return Promise.resolve(searchResults["_embedded"]["files"].length > 0)});
    }
}

export default UsiClient;