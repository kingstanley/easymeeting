/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { AuthService } from 'projects/account/src/lib/components/services/auth.service';
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
  users: any = {};
  constrainWidth = { min: 250, ideal: 800, max: 1920 };
  constrainHeight = { min: 100, ideal: 400, max: 1080 };
  myStream: MediaStream = new MediaStream();
  isPeerOpend = false;
  meeting: any;
  user: any;
  showButtons = false;
  useVideo:
    | boolean
    | {
        width: {
          min: number;
          ideal: number;
          max: number;
        };
        // height: {
        //   min: this.constrainHeight.min,
        //   ideal: this.constrainHeight.ideal,
        //   max: this.constrainHeight.max,
        // },
        facingMode: 'user';
      } = true;
  useAudio: boolean | MediaTrackConstraints | undefined = true;
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
  ) {
    setTimeout(() => {
      this.showButtons = true;
    }, 3000);
  }

  async ngOnInit() {
    this.user = this.authService.getUser();
    console.log('loggedIn user: ', this.user);

    this.chatService
      .helloMessage()
      .subscribe((response) => console.log('hello response: ', response));
    this.chatService
      .welcomeMessage()
      .subscribe((message) => console.log('message: ', message));

    // listen to events to control camera and mic from admin
    this.socket.on('turn-off-cam', (peerId: string, socketId: string) => {
      console.log('asked to turn off cam: ', peerId, socketId);
      this.myStream.getVideoTracks()[0].enabled = false;
    });
    this.socket.on('turn-on-cam', (peerId: string, socketId: string) => {
      console.log('asked to turn on cam: ', peerId, socketId);
      this.myStream.getVideoTracks()[0].enabled = true;
    });
    this.socket.on('turn-off-mic', (peerId: string, socketId: string) => {
      console.log('asked to turn off mic: ', peerId, socketId);
      this.myStream.getAudioTracks()[0].enabled = false;
    });
    this.socket.on('turn-on-mic', (peerId: string, socketId: string) => {
      console.log('asked to turn on mic: ', peerId, socketId);
      this.myStream.getAudioTracks()[0].enabled = true;
    });

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
          if (this.isAdmin()) {
            this.username = this.user.name.split(' ')[0];
            console.log('username: ', this.username);
          }
        });
    });

    await this.getMediaStream();

    if (this.myStream) this.callService.initPeer();

    this.callService.getPeer()?.on('call', (call) => {
      call.answer(this.myStream);
      const peerVideo = document.createElement('video');
      console.log('call object: ', call);
      call.on('stream', (peerStream) => {
        console.log('user received call stream: ', peerStream);
        const user = this.users[call.peer];

        // this.addVideoStream(peerVideo, peerStream, '', '');
        const userVideoExist = document.getElementById(call.peer);
        if (user) {
          if (!userVideoExist) {
            peerVideo.id = call.peer;
            this.addVideoStream(
              peerVideo,
              peerStream,
              user?.username,
              call.peer,
              ''
            );
          } else {
            console.log('User video already exist');
            const videos = userVideoExist.getElementsByTagName('video');
            for (let i = 0; i < videos.length; i++) {
              videos[i].parentNode?.removeChild(videos[i]);
            }
            userVideoExist.append(peerVideo);
          }
        } else {
          console.log('user not found');
        }
      });
    });

    const myVideo = document.createElement('video');
    myVideo.muted = true;

    console.log('peers: ', this.peers);

    if (this.myStream) {
      console.log('my stream is ', this.myStream);
      this.callService.getPeer()?.on('open', (id) => {
        console.log('peerId on open: ', id);

        this.users[id] = {
          peerId: this.callService.getPeer()?.id || this.username,
          socketId: this.socket.ioSocket.id,
          username: this.username,
        };
      });

      this.addVideoStream(
        myVideo,
        this.myStream,
        'You',
        this.callService.getPeer()?.id || this.myStream.id,
        this.socket.ioSocket.id
      );
    }
    this.chatService.Socket.on(
      'user-connected',
      (peerId: string, username: string, socketId: string) => {
        console.log('new user peerId: ', peerId);
        if (!this.users[peerId]) {
          console.log('user not yet added to users');

          this.users[peerId] = { peerId: peerId, socketId, username: username };
        }
        this.connectToNewUser(peerId, this.myStream, username, socketId);
      }
    );
    this.socket.on(
      'ask-to-join',
      (roomId: string, username: string, socketId: string, email: string) => {
        console.log('ask to join data: ', roomId, username, socketId);

        if (!email && this.isAdmin()) {
          this.dialog
            .open(AdmitComponent, {
              data: { roomId, username, socketId },
            })
            .afterClosed()
            .subscribe((result) => {
              // admit
              this.socket.emit('admit-or-reject', socketId, result);
            });
        }
      }
    );
    this.socket.on('user-disconnected', (peerId: string) => {
      console.log('disconnected userId: ', peerId);
      if (this.peers[peerId]) {
        this.peers[peerId].close();
        // remove the div container holding the details of the exiting user
      }
    });

    // this.isPeerOpend = true;
    this.socket.on('admitted', (result: boolean) => {
      console.log('admit or reject: ', result);
      // this.callService.getPeer()?.on('open', (peerId: string) => {
      console.log('My PeerId: ', this.callService.getPeer()?.id);
      if (result) {
        console.log('isadmitted: ', result);

        const action = document.getElementById('action') as HTMLDivElement;
        action.style.display = 'none';
        this.isAdmitted = true;
        this.addVideoStream(
          myVideo,
          this.myStream,
          'You',
          this.callService.getPeer()?.id || this.username,
          this.socket.ioSocket.id
        );
        this.socket.emit(
          'join-room',
          this.ROOM_ID,
          this.callService.getPeer()?.id,
          this.username,
          this.socket.ioSocket.id
        );
        // console.log('isAdmitted: ', this.isAdmitted, result);
      } else {
        this.msb.open('You were not admitted into the meeting', 'X', {
          duration: 4000,
        });
      }
      // });
    });
  }
  askToJoin() {
    if ((this.callService.getPeer()?.id && this.username) || !this.isAdmitted) {
      console.log('asking to join with', this.callService.getPeer()?.id);
      this.chatService.asKToJoin(
        this.ROOM_ID,
        this.username,
        this.socket.ioSocket.id,
        this.user?.email
      );
    } else {
      this.msb.open('Please enter name or organization', 'X', {
        duration: 3000,
      });
    }
  }
  isAdmin() {
    return this.user?.email == this.meeting?.host;
  }
  joinAsAdmin() {
    document
      .getElementById(this.callService.getPeer()?.id || this.myStream.id)
      ?.remove();
    this.username = this.user.name.split(' ')[0];
    this.isAdmitted = true;
    const action = document.getElementById('action') as HTMLDivElement;
    action.style.display = 'none';
    this.socket.emit(
      'join-room',
      this.ROOM_ID,
      this.callService.getPeer()?.id,
      this.username
    );
    const myVideo = document.createElement('video');
    myVideo.muted = true;

    this.addVideoStream(
      myVideo,
      this.myStream,
      'You',
      this.callService.getPeer()?.id || this.myStream.id,
      this.socket.ioSocket.id
    );
  }
  cancelJoin() {
    this.myStream.getVideoTracks()[0].stop();
    this.router.navigate(['/']);
  }

  async getMediaStream() {
    this.myStream = await navigator.mediaDevices.getUserMedia({
      audio: this.useAudio,
      video:
        this.useVideo == false
          ? this.useVideo
          : {
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

  addVideoStream(
    video: HTMLVideoElement,
    stream: any,
    username: string,
    peerId: string,
    socketId: string
  ) {
    console.log('users: ', this.users);

    // this.resizeGrid();
    const videoGrid: HTMLDivElement = document.querySelector(
      '.content'
    ) as HTMLDivElement;
    console.log('videoGrid on top: ', videoGrid);
    video.srcObject = stream;

    console.log('adding stream after admitted: ', stream);
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    const holder = document.createElement('div');
    holder.id = peerId;
    // if (this.users.length <= 1) {
    //   this.constrainWidth.ideal = 500;
    //   holder.className = 'item position-relative card bg-dark';
    // (async () => {
    //   await this.getMediaStream();
    //   console.log('new stream with ideal 500: ', this.myStream);
    // })();
    // } else {
    //   this.constrainWidth.ideal = 400;
    // (async () => {
    //   await this.getMediaStream();
    //   console.log('new stream with ideal 400: ', this.myStream);
    // })();
    // }
    // if (this.users.length <= 5 && this.users.length > 2) {
    //   holder.className = 'item1 position-relative card bg-dark';
    // }
    // if (this.users.length <= 10 && this.users.length > 5) {
    //   holder.className = 'item2 position-relative card bg-dark';
    // }
    // if (this.users.length > 10) {
    //   holder.className = 'item3 position-relative card bg-dark';
    // }
    holder.append(video);
    if (!username) {
      console.log('no username');

      const user = this.users[peerId];
      console.log('but user found: ', user);

      if (user) username = user.username;
    }
    // create container for username and acitons
    const usernameLabl = document.createElement('span');
    usernameLabl.innerText = username;
    usernameLabl.className = 'text-white position-absolute';
    if (this.isAdmin() && stream != this.myStream) {
      this.addControls(holder, peerId, socketId);
    }
    holder.prepend(usernameLabl);

    videoGrid.prepend(holder);
    console.log('videoGrid: ', videoGrid);
  }
  addControls(holder: HTMLDivElement, peerId: string, socketId: string) {
    console.log('');

    if (!socketId) {
      socketId = this.users[peerId]?.socketId;
    }
    const camButtonOff = document.createElement('button');

    camButtonOff.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video-off" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M10.961 12.365a1.99 1.99 0 0 0 .522-1.103l3.11 1.382A1 1 0 0 0 16 11.731V4.269a1 1 0 0 0-1.406-.913l-3.111 1.382A2 2 0 0 0 9.5 3H4.272l.714 1H9.5a1 1 0 0 1 1 1v6a1 1 0 0 1-.144.518l.605.847zM1.428 4.18A.999.999 0 0 0 1 5v6a1 1 0 0 0 1 1h5.014l.714 1H2a2 2 0 0 1-2-2V5c0-.675.334-1.272.847-1.634l.58.814zM15 11.73l-3.5-1.555v-4.35L15 4.269v7.462zm-4.407 3.56-10-14 .814-.58 10 14-.814.58z"/>
</svg>`;
    camButtonOff.className = 'm-1 btn btn-dark';

    const camButton = document.createElement('button');

    camButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556v4.35zM2 4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H2z"/>
</svg>`;
    camButton.className = 'm-1 btn btn-dark';
    camButton.style.display = 'none';
    // mic control buttons
    const micButtonOff = document.createElement('button');
    micButtonOff.className = 'm-1 btn btn-dark';
    micButtonOff.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-mute" viewBox="0 0 16 16">
  <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a4.973 4.973 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4zm3-9v4.879l-1-1V3a2 2 0 0 0-3.997-.118l-.845-.845A3.001 3.001 0 0 1 11 3z"/>
  <path d="m9.486 10.607-.748-.748A2 2 0 0 1 6 8v-.878l-1-1V8a3 3 0 0 0 4.486 2.607zm-7.84-9.253 12 12 .708-.708-12-12-.708.708z"/>
</svg>`;

    const micButtonOn = document.createElement('button');
    micButtonOn.className = 'm-1 btn btn-dark';
    micButtonOn.style.display = 'none';
    micButtonOn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic" viewBox="0 0 16 16">
  <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
  <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
</svg>`;

    // add button event listeners
    camButtonOff.addEventListener('click', () => {
      camButtonOff.style.display = 'none';
      camButton.style.display = 'block';
      this.socket.emit('turn-off-cam', peerId, socketId);
    });

    camButton.addEventListener('click', () => {
      camButtonOff.style.display = 'block';
      camButton.style.display = 'none';
      this.socket.emit('turn-on-cam', peerId, socketId);
    });

    micButtonOff.addEventListener('click', () => {
      micButtonOn.style.display = 'block';
      micButtonOff.style.display = 'none';
      this.socket.emit('turn-off-mic', peerId, socketId);
    });
    micButtonOn.addEventListener('click', () => {
      micButtonOn.style.display = 'none';
      micButtonOff.style.display = 'block';
      this.socket.emit('turn-on-mic', peerId, socketId);
    });

    // create button container and add buttons
    const buttonHolders = document.createElement('div');
    buttonHolders.className = 'position-absolute';
    buttonHolders.style.top = '0';
    buttonHolders.style.right = '0';
    buttonHolders.append(camButtonOff);
    buttonHolders.append(camButton);
    buttonHolders.append(micButtonOff);
    buttonHolders.append(micButtonOn);
    holder.append(buttonHolders);
  }
  connectToNewUser(
    peerId: any,
    myStream: any,
    username: string,
    socketId: string
  ) {
    const alreadyExist = this.peers[peerId];
    console.log('connecting to peers', peerId, this.peers, alreadyExist);

    const userVideo = document.createElement('video');
    userVideo.addEventListener('loadedmetadata', () => {
      userVideo.play();
    });
    // if (!alreadyExist) {
    const call = this.callService.getPeer()?.call(peerId, myStream);

    console.log('call: ', call);

    call?.on('stream', (userVideoStream: any) => {
      const userVideoExist = document.getElementById(peerId);
      if (!userVideoExist) {
        userVideo.id = peerId;
        this.addVideoStream(
          userVideo,
          userVideoStream,
          username,
          peerId,
          socketId
        );
      } else {
        console.log('User video already exist 1');
        const videos = userVideoExist.getElementsByTagName('video');
        console.log('videos len: ', videos.length);

        for (let i = 0; i < videos.length; i++) {
          videos[i].parentNode?.removeChild(videos[i]);
        }
        userVideo.srcObject = userVideoStream;
        userVideoExist.append(userVideo);
        // this.addVideoStream(userVideo, userVideoStream, username, peerId);
      }
      call.on('close', () => {
        userVideo?.remove();
        // remove the container of the user video
        document.getElementById(peerId)?.remove();
      });
    });
    this.peers[peerId] = call;

    console.log('peers: ', this.peers);
    // } else {
    //   console.log('peer already exist');
    // }
  }
  endCall(result: boolean) {
    console.log('end call clicked');
    // this.myStream = null;
    this.socket.disconnect('user-disconnected');
    this.callService.getPeer()?.destroy();
    const tracks = this.myStream.getTracks();
    tracks.forEach((track: MediaStreamTrack) => {
      console.log('track: ', track);
      track.stop();
    });
    window.location.href = '/meeting/live/' + this.meeting.code;
  }
  toggleMic(value: boolean) {
    const audioTrack = this.myStream.getAudioTracks();
    audioTrack[0].enabled = !value;
  }
  toggleCam(value: boolean) {
    const videoTrack = this.myStream.getVideoTracks();
    videoTrack[0].enabled = !value;
  }
}
