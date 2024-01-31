import { Api, TelegramClient } from "@telegram/gramjs/dist";
import { TelegramClientParams } from "@telegram/gramjs/dist/client/telegramBaseClient";
import { Session } from "@telegram/gramjs/dist/sessions";
import { BigInteger } from "big-integer";
import { MTProtoSender } from "@telegram/gramjs/dist/network";
import { users } from "@telegram/gramjs/dist/client";

export class TakeoutClient extends TelegramClient {
  takeoutId: BigInteger;
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
  }

  invoke<R extends Api.AnyRequest>(request: R): Promise<R["__response"]> {
    console.log("invoke", request.className);
    const proxiedRequest = new Api.InvokeWithTakeout({
      takeoutId: this.takeoutId,
      query: request,
    });
    return users.invoke(this as TelegramClient, proxiedRequest);
  }
}
