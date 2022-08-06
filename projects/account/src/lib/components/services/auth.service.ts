import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserDto } from 'projects/dto/src';
import { environment } from 'src/environments/environment';

const apiUrl = environment.apiUrl;
const route = 'auth/';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}
  signin(user: UserDto) {
    return this.http.post<UserDto>(apiUrl + route, user);
  }
  setToken(token: string) {
    localStorage.setItem('token', token);
  }
  setUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
  }
  getToken() {
    return localStorage.getItem('token');
  }
  getUser() {
    const user = localStorage.getItem('user');

    if (user) return JSON.parse(user);
  }
}
