import { Injectable } from '@angular/core';
import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CallService {
  private peer: Peer | null = null;
  private mediaCall: Peer | null = null;
  constructor() {
    this.peer?.on('connection', (con) => {
      console.log('peer connected: ', con);
    });
  }
  public initPeer() {
    if (!this.peer || this.peer.disconnected) {
      const peerJsOptions = {
        host: environment.peerUrl,
        debug: 3,
        config: {
          iceServers: [
            {
              urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
              ],
            },
          ],
        },
      };
      try {
        const id = uuidv4();
        this.peer = new Peer(environment.peerUrl);

        console.log('peerId: ', this.peer.id);
        return id;
      } catch (error) {
        console.error(error);
      }
    }
    console.log('peerId: ', this.peer);
    return this.peer ? this.peer.id : '';
  }
  getPeer() {
    return this.peer;
  }
}
