/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { AuthService } from 'projects/account/src/lib/components/services/auth.service';
import { UserService } from 'projects/account/src/lib/components/services/user.service';
import { CallService } from 'src/app/shared/call.service';
import { ChatService } from 'src/app/shared/chat.service';
import { MeetingService } from '../../services/meeting.service';
import { AdmitComponent } from '../admit/admit.component';

@Component({
  selector: 'meet-live',

  templateUrl: './live.component1.html',
  styleUrls: ['./live.component1.scss'],
})
export class LiveComponent implements OnInit {
  peers = Object.assign({});
  streams: Array<any> = [];
  ROOM_ID = '';
  averageRating = 0;
  isAdmitted = false;
  username = '';
  users: Array<{ stream: any }> = [];
  constrainWidth = { min: 250, ideal: 800, max: 1920 };
  constrainHeight = { min: 100, ideal: 400, max: 1080 };
  myStream: MediaStream | any = new MediaStream();
  isPeerOpend = false;
  meeting: any;
  user: any;
  constructor(
    private router: Router,
    private callService: CallService,
    private chatService: ChatService,
    private socket: Socket,
    private activatedRoute: ActivatedRoute,
    private msb: MatSnackBar,
    private dialog: MatDialog,
    private meetingService: MeetingService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.user = this.authService.getUser();
    console.log('loggedIn user: ', this.user);

    this.chatService
      .helloMessage()
      .subscribe((response) => console.log('hello response: ', response));
    this.chatService
      .welcomeMessage()
      .subscribe((message) => console.log('message: ', message));
    console.log('io socket: ', this.chatService.Socket.ioSocket);
    this.chatService.sendMessage('hello', 'Hello server');

    this.activatedRoute.params.subscribe((param) => {
      console.log('rood id: ', param['id']);
      this.ROOM_ID = param['id'];
      this.meetingService
        .getMeetingByCode(this.ROOM_ID)
        .subscribe((meeting) => {
          this.meeting = meeting;
          console.log('meeting: ', meeting);
          if (this.user?.email == this.meeting.host) {
            this.isAdmitted = true;
          }
        });
    });
    // console.log(
    //   'supported constraints: ',
    //   navigator.mediaDevices.getSupportedConstraints()
    // );

    this.callService.initPeer();
    // (async () => {
    await this.getMediaStream();
    // })();

    if (this.myStream) this.callService.initPeer();

    const myVideo = document.createElement('video');
    myVideo.muted = true;

    console.log('peers: ', this.peers);

    if (this.myStream) {
      // myVideo.style.width = 'auto';
      // myVideo.style.height = 'auto';
      console.log('my stream is ', this.myStream);
      this.addVideoStream(myVideo, this.myStream);

      this.callService.getPeer()?.on('call', (call: any) => {
        call.answer(this.myStream);
        const peerVideo = document.createElement('video');

        call.on('stream', (peerStream: any) => {
          this.addVideoStream(peerVideo, peerStream);
        });
      });
    }
    this.chatService.Socket.on(
      'user-connected',
      (peerId: string | any, usertype: string) => {
        console.log('new user peerId: ', peerId);
        this.connectToNewUser(peerId, this.myStream, usertype);
      }
    );
    this.socket.on(
      'ask-to-join',
      (roomId: string, username: string, socketId: string) => {
        console.log('ask to join data: ', roomId, username, socketId);

        this.dialog
          .open(AdmitComponent, {
            data: { roomId, username, socketId },
          })
          .afterClosed()
          .subscribe((result) => {
            if (result) {
              // admit
              this.socket.emit('admit-or-reject', socketId, result);
            } else {
              // reject
            }
          });
      }
    );
    this.socket.on('user-disconnected', (peerId: string) => {
      console.log('disconnected userId: ', peerId);
      if (this.peers[peerId]) {
        this.peers[peerId].close();
      }
    });

    // this.isPeerOpend = true;
    this.socket.on('admit-or-reject', (result: string) => {
      this.callService.getPeer()?.on('open', (peerId: string) => {
        console.log('My PeerId: ', peerId);
        if (result) {
          console.log('isadmitted: ', result);

          this.addVideoStream(myVideo, this.myStream);
          this.socket.emit('join-room', this.ROOM_ID, peerId);
          this.isAdmitted = true;
          console.log('isAdmitted: ', this.isAdmitted, result);
        } else {
          this.msb.open('You were not admitted into the meeting', 'X', {
            duration: 4000,
          });
        }
      });
    });
  }
  askToJoin() {
    console.log('asking to join with', this.callService.getPeer()?.id);

    if (this.callService.getPeer()?.id && this.username) {
      this.socket.emit(
        'ask-to-join',
        this.ROOM_ID,
        this.username,
        this.socket.ioSocket.id
      );
    } else {
      this.msb.open('Please enter name or organization', 'X', {
        duration: 3000,
      });
    }
  }
  cancelJoin() {
    console.log('cancel join');
  }
  async getMediaStream() {
    this.myStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: {
          min: this.constrainWidth.min,
          ideal: this.constrainWidth.ideal,
          max: this.constrainWidth.max,
        },
        // height: {
        //   min: this.constrainHeight.min,
        //   ideal: this.constrainHeight.ideal,
        //   max: this.constrainHeight.max,
        // },
        facingMode: 'user',
      },
    });
  }
  resizeGrid() {
    const container = document.querySelector('.content') as HTMLDivElement;
    console.log('resing : ', container);

    if (this.users.length < 5) {
      container.style.gridTemplateColumns = '1fr 1fr';
      container.style.gridAutoRows = '350px ';
    }
    if (this.users.length == 1) {
      container.style.gridTemplateColumns = '1fr';
      container.style.gridAutoRows = '600px ';
    }
    if (this.users.length < 10 && this.users.length >= 5) {
      container.style.gridTemplateColumns = '1fr 1fr 1fr';
      container.style.gridAutoRows = '350px ';
    }
    if (this.users.length < 15 && this.users.length >= 10) {
      container.style.gridTemplateColumns = '1fr 1fr 1fr 1fr';
      container.style.gridAutoRows = '200px ';
    }
    if (this.users.length < 20 && this.users.length >= 15) {
      container.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr';
      container.style.gridAutoRows = '200px ';
    }
    if (this.users.length >= 20) {
      container.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr 1fr';
      container.style.gridAutoRows = '200px ';
    }
  }
  addPreview(video: HTMLVideoElement, stream: any) {
    const videoGrid: HTMLDivElement = document.querySelector(
      '.preview'
    ) as HTMLDivElement;
    video.srcObject = stream;
    // video.autoplay;
    //   console.log("My stream: ", stream);
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    videoGrid.append(video);
  }
  addVideoStream(video: HTMLVideoElement, stream: any, usertype?: string) {
    this.users.push({ stream: stream });
    console.log('my stream: ', stream);

    // this.resizeGrid();
    const videoGrid: HTMLDivElement = document.querySelector(
      '.content'
    ) as HTMLDivElement;
    video.srcObject = stream;
    // video.autoplay;
    //   console.log("My stream: ", stream);
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    const holder = document.createElement('div');
    if (this.users.length <= 2) {
      this.constrainWidth.ideal = 1000;
      holder.className = 'item';
      (async () => {
        await this.getMediaStream();
        console.log('new stream: ', this.myStream);
      })();
    }
    if (this.users.length <= 5 && this.users.length > 2) {
      holder.className = 'item1';
    }
    if (this.users.length <= 10 && this.users.length > 5) {
      holder.className = 'item2';
    }
    if (this.users.length > 10) {
      holder.className = 'item3';
    }
    // holder.style.width = '100%';
    // holder.style.height = 'auto';

    holder.append(video);
    videoGrid.prepend(holder);
  }
  connectToNewUser(peerId: any, stream: any, usertype: string) {
    const alreadyExist = this.peers[peerId];
    console.log('connecting to peers', peerId, this.peers, alreadyExist);

    const userVideo = document.createElement('video');
    if (!alreadyExist) {
      const call = this.callService.getPeer()?.call(peerId, stream);
      console.log('call: ', call);

      call?.on('stream', (userVideoStream: any) => {
        const userVideoExist = document.getElementById(peerId);
        if (!userVideoExist) {
          userVideo.id = peerId;
          this.addVideoStream(userVideo, userVideoStream, usertype);
        } else {
          console.log('User video already exist');
        }
        call.on('close', () => {
          userVideo.remove();
        });
      });
      this.peers[peerId] = call;

      console.log('peers: ', this.peers);
    }
  }
}
