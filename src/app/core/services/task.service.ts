import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import environments from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = `${environments.apiURL}/tasks`;
  private socket: Socket;

  public taskCreated$ = new BehaviorSubject<any>(null);
  public taskUpdated$ = new BehaviorSubject<any>(null);
  public taskDeleted$ = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {
    this.socket = io(environments.socketURL, {
      withCredentials: true,
    });

    this.socket.on('taskCreated', task => {
      this.taskCreated$.next(task);
    });

    this.socket.on('taskUpdated', task => {
      this.taskUpdated$.next(task);
    });

    this.socket.on('taskDeleted', taskId => {
      this.taskDeleted$.next(taskId);
    });
  }

  getTasks(status?: string): Observable<any> {
    let url = this.apiUrl;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get(url);
  }

  createTask(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateTask(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, data);
  }

  deleteTask(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
