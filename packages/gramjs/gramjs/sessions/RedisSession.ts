import { MemorySession } from "./Memory";
import { AuthKey } from "../crypto/AuthKey";
import bigInt from "big-integer";
import { redisBase as redis } from "@telegram/redis/src/base";

function isJson(str: string) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function isNumeric(value: string) {
    return /^-?\d+$/.test(value);
}

export class RedisSession extends MemorySession {
    private readonly sessionName: string;

    constructor(sessionName: string, divider = ":") {
        super();
        if (divider == undefined) {
            divider = ":";
        }
        this.sessionName = "session" + divider + sessionName + divider;
    }

    async load() {
        if (!redis.isReady) await redis.connect();
        if (process.env.REDIS_DB)
            await redis.select(parseInt(process.env.REDIS_DB));
        const authKeyVal = await redis.get(this.sessionName + "authKey");
        let authKey;
        if (authKeyVal && isJson(authKeyVal)) {
            const authKeyParsed = JSON.parse(authKeyVal);
            this._authKey = new AuthKey();
            if ("data" in authKeyParsed) {
                authKey = Buffer.from(authKeyParsed.data);
            }
            await this._authKey.setKey(authKey);
        }

        const dcId = await redis.get(this.sessionName + "dcId");
        if (dcId && isNumeric(dcId)) {
            this._dcId = parseInt(dcId);
        }

        const port = await redis.get(this.sessionName + "port");
        if (port && isNumeric(port)) {
            this._port = parseInt(port);
        }
        const serverAddress = await redis.get(
            this.sessionName + "serverAddress",
        );
        if (serverAddress) {
            this._serverAddress = serverAddress;
        }
    }

    setDC(dcId: number, serverAddress: string, port: number) {
        redis.set(this.sessionName + "dcId", `${dcId}`);
        redis.set(this.sessionName + "port", `${port}`);
        redis.set(this.sessionName + "serverAddress", serverAddress);
        super.setDC(dcId, serverAddress, port);
    }

    setAuthKey(value?: AuthKey, dcId?: number) {
        if (dcId && dcId !== this.dcId) {
            // Not supported.
            return undefined;
        }
        this._authKey = value;
        const jsonBuffer = value?.getKey()?.toJSON();
        if (jsonBuffer)
            redis.set(this.sessionName + "authKey", JSON.stringify(jsonBuffer));
        return;
    }

    set authKey(value: AuthKey | undefined) {
        this._authKey = value;
        // const jsonBuffer = value?.getKey()?.toJSON();
        // if (jsonBuffer)
        // redis.set(this.sessionName + "authKey", JSON.stringify(jsonBuffer));
    }

    get authKey() {
        return this._authKey;
    }

    processEntities(tlo: any) {
        // console.log("processEntities");
        const rows = this._entitiesToRows(tlo);
        if (!rows) {
            return;
        }
        for (const row of rows) {
            row.push(new Date().getTime().toString());
            redis.set(this.sessionName + row[0], JSON.stringify(row));
        }
        // console.log("processEntities2");
    }

    async getEntityRowsById(
        id: string | bigInt.BigInteger,
        exact: boolean = true,
    ): Promise<any[] | undefined> {
        // console.log("getEntityRowsById");
        const val = await redis.get(this.sessionName + id.toString());
        return val && isJson(val) ? JSON.parse(val) : undefined;
    }
}

