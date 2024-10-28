import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../interfaces/user';
import { NgFor, NgIf } from '@angular/common';
import { ConfirmationTabComponent } from '../../components/confirmation-tab/confirmation-tab.component';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [NgFor, NgIf, ConfirmationTabComponent],
  templateUrl: './users.page.html',
  styleUrl: './users.page.css',
})
export class UsersPage implements OnInit {
  private router: Router = inject(Router);
  private _usersService: UsersService = inject(UsersService);
  showConfirmationTab = false;
  idToDelete: string | null = null;
  public userList: User[] = [];

  async ngOnInit(): Promise<void> {
    this._usersService.updateUserList().then(() => {
      this.userList = this._usersService.usersList;
    });
  }

  formatRegistrationDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  openDeleteTab(id: string) {
    this.idToDelete = id;
    this.showConfirmationTab = true;
  }

  async deleteUser(id: string) {
    try {
      await this._usersService.deleteUser(id);
      this.showConfirmationTab = false;
      await this._usersService.updateUserList(); // Actualiza la lista después de eliminar
      this.userList = this._usersService.usersList; // Obtiene la lista actualizada
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
    }
  }

  confirmDelete() {
    if (this.idToDelete) {
      this.deleteUser(this.idToDelete);
    }
  }

  goToAdminPanel() {
    this.router.navigate(['/admin-panel']);
  }
}
