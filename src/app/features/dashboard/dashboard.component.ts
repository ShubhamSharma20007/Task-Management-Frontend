import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../core/services/task.service';
import { UserService } from '../../core/services/user.service';
import { Subscription } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmDialogModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  taskService = inject(TaskService);
  userService = inject(UserService);
  fb = inject(FormBuilder);
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);

  tasks: any[] = [];
  users: any[] = [];
  userRole = '';

  taskForm: FormGroup;
  isTaskModalOpen = false;
  editingTaskId: string | null = null;
  filterStatus: string = '';

  private subs = new Subscription();

  constructor() {
    this.userRole = this.authService.getRole();
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(5)]],
      status: ['pending'],
      assignedTo: [''],
    });
  }

  ngOnInit() {
    this.loadTasks();
    if (this.userRole === 'Manager' || this.userRole === 'Team Lead') {
      this.loadUsers();
    }

    this.subs.add(
      this.taskService.taskCreated$.subscribe(task => {
        const alreadyExists = this.tasks.some(t => t._id === task._id);
        if (!alreadyExists) {
          this.tasks.unshift(task);
        }
      })
    );

    this.subs.add(
      this.taskService.taskUpdated$.subscribe(task => {
        const index = this.tasks.findIndex(t => t._id === task._id);
        if (index !== -1) {
          this.tasks[index] = task;
        }
      })
    );

    this.subs.add(
      this.taskService.taskDeleted$.subscribe(taskId => {
        this.tasks = this.tasks.filter(t => t._id !== taskId);
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  logout() {
    this.authService.logout();
  }

  loadTasks() {
    this.taskService.getTasks(this.filterStatus).subscribe({
      next: res => {
        console.log(res);
        this.tasks = res.data;
      },
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: res => {
        console.log(res, 32);
        this.users = res.data;
      },
    });
  }

  applyFilter(status: string) {
    this.filterStatus = status;
    this.loadTasks();
  }

  openTaskModal(task?: any) {
    this.isTaskModalOpen = true;
    if (task) {
      this.editingTaskId = task._id;
      this.taskForm.patchValue({
        title: task.title,
        description: task.description,
        status: task.status,
        assignedTo: task.assignedTo?._id || '',
      });
    } else {
      this.editingTaskId = null;
      this.taskForm.reset({ status: 'pending', assignedTo: '' });
    }
  }

  closeTaskModal() {
    this.isTaskModalOpen = false;
    this.editingTaskId = null;
    this.taskForm.reset();
  }

  saveTask() {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const payload = { ...this.taskForm.value };
    if (!payload.assignedTo) delete payload.assignedTo;

    if (this.editingTaskId) {
      this.taskService.updateTask(this.editingTaskId, payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Task updated successfully',
          });
          this.closeTaskModal();
        },
        error: err => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update task',
          });
        },
      });
    } else {
      this.taskService.createTask(payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Task created successfully',
          });
          this.closeTaskModal();
        },
        error: err => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create task',
          });
        },
      });
    }
  }

  deleteTask(id: string) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this task?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.taskService.deleteTask(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Task deleted successfully',
            });
          },
          error: err => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete task',
            });
          },
        });
      },
    });
  }

  changeStatus(task: any, newStatus: string) {
    this.taskService.updateTask(task._id, { status: newStatus }).subscribe();
  }
}
