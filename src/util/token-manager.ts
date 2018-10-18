import Promise from "bluebird";
import request from "request-promise";

/**
 * Manages the HCA AAP token required for authn&authz in the USI
 *
 * */

type TokenCache = {token?: string}
type Credentials = {username: string, password: string}

class TokenManager {

    authUrl: string;
    credentials: Credentials;
    tokenCache: TokenCache;

    constructor(authUrl: string, credentials: Credentials) {
        this.tokenCache = {token: undefined};
        this.credentials = credentials;
        this.authUrl = authUrl;
    }

    getToken() : Promise<string> {
        if(this.tokenCache.token) {
            return Promise.resolve<string>(this.tokenCache.token!);
        } else {
            return new Promise((resolve, reject) => {
                this.retrieveToken(this.authUrl, this.credentials)
                    .then(token => {return this.cacheToken(token)})
                    .then(token => {return resolve(token)})
                    .catch(err => reject(err));
            });
        }
    }

    /**
     *
     * Retrieves a token from AAP using HTTP Authentication with a username and password
     */
    retrieveToken(authUrl: string, credentials: Credentials) : Promise<string> {
        return new Promise<string>((resolve, reject) => {
            request({
                method: "GET",
                url: authUrl,
                auth: credentials
            })
                .then(resp => resolve(resp))
                .catch(error => reject(error));
        });
    }

    cacheToken(token: string) : Promise<string> {
        this.tokenCache["token"] = token;
        return Promise.resolve(token);
    }
}

export default TokenManager;