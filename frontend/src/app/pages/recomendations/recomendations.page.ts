import { Component, inject, OnInit } from '@angular/core';
import { IonGrid, IonRow, IonCol, IonIcon } from '@ionic/angular/standalone';
import { Property } from '../../interfaces/property';
import { Router } from '@angular/router';
import { RecomendacionService } from '../../services/recomendacion.service';
import { PropertyCardComponent } from "../../components/property-card/property-card.component";
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-recomendations',
  templateUrl: './recomendations.page.html',
  standalone: true,
  imports: [IonIcon, IonCol, IonRow, IonGrid, PropertyCardComponent, NgIf, NgFor],
})
export class RecomendationsPage implements OnInit {
  recomendedList: Property[] = [];

  private router: Router = inject(Router);
  private recommendationService = inject(RecomendacionService);

  ngOnInit() {
    this.loadFavorites();
  }

  private async loadFavorites(): Promise<void> {
    await this.recommendationService.getRecomendationList();
    this.recomendedList = this.recommendationService['recomendationList'];
  }

  goToAllProperties() {
    this.router.navigate(['/all-properties']);
  }
}
