import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserDto } from 'projects/dto/src';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
const apiUrl = environment.apiUrl;
const route = 'user/';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}
  createUser(user: UserDto): Observable<UserDto> {
    return this.http.post<UserDto>(apiUrl + route, user);
  }
  findUser(id: string): Observable<UserDto> {
    return this.http.get<UserDto>(apiUrl + route + id);
  }
  findUsers(): Observable<UserDto> {
    return this.http.get<UserDto>(apiUrl + route);
  }
  updateUser(id: string, user: UserDto): Observable<any> {
    return this.http.put(apiUrl + route + id, user);
  }
  findUserByEmail(email: string): Observable<UserDto> {
    return this.http.get<UserDto>(apiUrl + route + email);
  }
}
