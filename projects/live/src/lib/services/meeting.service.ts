import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MeetingDto } from 'projects/dto/src';
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.apiUrl;
const route = 'meeting/';
@Injectable({
  providedIn: 'root',
})
export class MeetingService {
  constructor(private http: HttpClient) {}

  createMeeting(meeting: MeetingDto): Observable<MeetingDto> {
    return this.http.post<MeetingDto>(apiUrl + route + 'schedule/', meeting);
  }
  instantMeeting(): Observable<MeetingDto> {
    return this.http.post<MeetingDto>(apiUrl + route + 'instant', {
      title: null,
      date: new Date(),
    });
  }
}
