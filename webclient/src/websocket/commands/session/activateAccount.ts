import { AccountActivationParams } from 'store';
import { StatusEnum, WebSocketConnectOptions } from 'types';

import webClient from '../../WebClient';
import { SessionPersistence } from '../../persistence';

import { disconnect, login, updateStatus } from './';

export function activateAccount(options: WebSocketConnectOptions, passwordSalt?: string): void {
  const { userName, token } = options as unknown as AccountActivationParams;

  const accountActivationConfig = {
    ...webClient.clientConfig,
    userName,
    token,
  };

  const CmdActivate = webClient.protobuf.controller.Command_Activate.create(accountActivationConfig);

  const sc = webClient.protobuf.controller.SessionCommand.create({
    '.Command_Activate.ext': CmdActivate
  });

  webClient.protobuf.sendSessionCommand(sc, raw => {
    if (raw.responseCode === webClient.protobuf.controller.Response.ResponseCode.RespActivationAccepted) {
      SessionPersistence.accountActivationSuccess();
      login(options, passwordSalt);
    } else {
      updateStatus(StatusEnum.DISCONNECTED, 'Account Activation Failed');
      disconnect();
      SessionPersistence.accountActivationFailed();
    }
  });
}
