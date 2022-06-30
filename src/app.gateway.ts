//! Please Install >> redis-server <<
//TODO link tutorial from Redis => https://www.learmoreseekmore.com/2020/12/nestjs-redis-cache.html, Socket.io => https://gabrieltanner.org/blog/nestjs-realtime-chat/

import { CACHE_MANAGER, Inject, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Cache } from 'cache-manager';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AppGateway');

  @SubscribeMessage('msgToServer')
  async handleMessage(client: Socket, payload: any): Promise<void> {
    const messaage: any = payload;
    const valueMessage: any = await this.cacheManager.get('messages');
    let updateMessage: any[] = [];

    if (valueMessage === null) {
      updateMessage = [
        {
          sender: messaage.name,
          message: messaage.text,
          dateTime: Date.now(),
        },
      ];
    } else {
      const recodeString = JSON.parse(valueMessage);
      updateMessage = [
        ...recodeString,
        {
          sender: messaage.name,
          message: messaage.text,
          dateTime: Date.now(),
        },
      ];
    }
    await this.cacheManager.set('messages', JSON.stringify(updateMessage), {
      ttl: 300,
    });

    console.log(JSON.parse(valueMessage));
    this.server.emit('msgToClient', payload);
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }
}
