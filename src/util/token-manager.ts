const requests = require("request-promise");
const Promise = require("bluebird");


/**
 * Manages the HCA AAP token required for authn&authz in the USI
 *
 * */
class TokenManager {
    constructor(authUrl, credentials) {
        this.tokenCache = {};
        this.credentials = {
            username: null,
            password: null
        };
        this.authUrl = null;
    }

    getToken() {
        if(this.tokenCache["token"]) {
            return Promise.resolve(this.tokenCache["token"]);
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
    retrieveToken(authUrl, credentials) {
        return requests({
            method: "GET",
            url: authUrl,
            auth: credentials
        });
    }

    cacheToken(token) {
        this.tokenCache["token"] = token;
        return Promise.resolve(token);
    }
}

module.exports = TokenManager;