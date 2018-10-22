import Promise from "bluebird";
import ITokenClient from "./token-client";

/**
 * Manages the HCA AAP token required for authn&authz in the USI
 *
 * */

type TokenCache = {token?: string, tokenDurationMs: number, cachedTimeMs?: number, refreshPeriodMs: number}

class TokenManager {
    tokenCache: TokenCache;
    aapTokenClient: ITokenClient;

    constructor(aapTokenClient: ITokenClient, tokenDurationMs: number, refreshPeriodMs: number) {
        this.tokenCache = {token: undefined, tokenDurationMs: tokenDurationMs, refreshPeriodMs: refreshPeriodMs};
        this.aapTokenClient = aapTokenClient;
    }

    getToken() : Promise<string> {
        if(this.tokenCache.token && ! this.isExpired()) {
            return Promise.resolve<string>(this.tokenCache.token!);
        } else {
            return new Promise((resolve, reject) => {
                this.aapTokenClient.retrieveToken()
                    .then(token => {return this.cacheToken(token)})
                    .then(token => {return resolve(token)})
                    .catch(err => reject(err));
            });
        }
    }

    cacheToken(token: string) : Promise<string> {
        this.tokenCache.token = token;
        this.tokenCache.cachedTimeMs = new Date().getTime();
        return Promise.resolve(token);
    }

    isExpired() : boolean {
        return new Date().getTime() - this.tokenCache.refreshPeriodMs > this.tokenCache.cachedTimeMs! + this.tokenCache.tokenDurationMs
    }
}

export default TokenManager;