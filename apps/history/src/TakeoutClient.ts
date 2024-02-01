import { Api, TelegramClient } from "@telegram/gramjs/dist";
import { TelegramClientParams } from "@telegram/gramjs/dist/client/telegramBaseClient";
import { Session } from "@telegram/gramjs/dist/sessions";
import { BigInteger } from "big-integer";
import { MTProtoSender } from "@telegram/gramjs/dist/network";
import { users } from "@telegram/gramjs/dist/client";

export class TakeoutClient extends TelegramClient {
  takeoutId: BigInteger;
  initTakeout: boolean = false;
  /**
   * @param session - a session to be used to save the connection and auth key to. This can be a custom session that inherits MemorySession.
   * @param apiId - The API ID you obtained from https://my.@telegram/gramjs/dist.org.
   * @param apiHash - The API hash you obtained from https://my.@telegram/gramjs/dist.org.
   * @param clientParams - see {@link TelegramClientParams}
   */
  constructor(
    takeoutId: BigInteger,
    session: string | Session,
    apiId: number,
    apiHash: string,
    clientParams: TelegramClientParams
  ) {
    super(session, apiId, apiHash, clientParams);

    this.takeoutId = takeoutId;
    this.initTakeout = false;
  }

  setTakeoutId(takeoutId: BigInteger) {
    this.takeoutId = takeoutId;
  }

  startTakeout() {
    this.initTakeout = true;
  }

  invoke<R extends Api.AnyRequest>(request: R): Promise<R["__response"]> {
    const proxiedRequest = new Api.InvokeWithTakeout({
      takeoutId: this.takeoutId,
      query: request,
    });
    return users.invoke(
      this as TelegramClient,
      this.initTakeout ? proxiedRequest : request
    );
  }

  passthroughInvoke<R extends Api.AnyRequest>(
    request: R
  ): Promise<R["__response"]> {
    return users.invoke(this as TelegramClient, request);
  }
}
