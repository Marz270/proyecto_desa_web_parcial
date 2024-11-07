import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {LayoutComponent} from '../../layout/layout.component';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonicModule,
    LayoutComponent
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css'
})
export class HomePage {

  private router : Router = inject(Router);

  Login() {
    this.router.navigate(['/login']);
  }

  Register() {
    this.router.navigate(['/register']);
  }

  View() {
    this.router.navigate(['/all-properties']);
  }
}
