import {ConnectionProperties} from "../common/types";
import request from "request-promise";
import Promise from "bluebird";
import TokenManager from "./token-manager";
import R from "ramda";

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
        return this.retrieveSubmission(submissionId).then(submissionResource => {
            const submissionContentsLink = submissionResource["_links"]["contents"]["href"];
            return this.retrieve(submissionContentsLink).then(submissionContentsResource => {
                const submissionFilesLink = submissionContentsResource["_links"]["files"]["href"];
                return this.retrieve(submissionFilesLink).then(embeddedFilesResource => {
                    const embeddedFiles: any[] = embeddedFilesResource["_embedded"]["files"];
                    return Promise.resolve(R.any(file => file["filename"] == fileName, embeddedFiles));
                });
            });
        });
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
}

export default UsiClient;