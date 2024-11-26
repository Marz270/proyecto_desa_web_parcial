import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { BackendApiService } from './backend-api.service';
import { Property } from '../interfaces/property';

@Injectable({
  providedIn: 'root'
})
export class RecomendacionService {

  private recomendationList: Property[] = [];

  constructor(
    private authService: AuthService,
    private backendApi: BackendApiService) {
  }

  // obtiene los favoritos del usuario desde el backend
  async getRecomendationList(): Promise<void> {
    const userId = this.authService.getUserId();
    this.recomendationList = await this.backendApi.get<Property[]>(`users/${userId}/recomendaciones/recomendacion`);
  }

  // añade un favorito
  async addRecomendation(property_id: number): Promise<Property> {
    const user_id = this.authService.getUserId();
    const body = JSON.stringify({ user_id, property_id });
    return this.backendApi.post<Property>(`users/${user_id}/recomendaciones/recomendacion`, body);
  }

  // elimina un favorito
  async removeRecomendation(propertyId: number): Promise<void> {
    const userId = this.authService.getUserId();
    await this.backendApi.delete<void>(`users/${userId}/recomendaciones/recomendacion/${propertyId}`);
  }

  // añade o remueve una propiedad de la lista de favoritos del usuario
  async addOrRemoveRecomendation(property: Property) {
    const existingFavorite = this.recomendationList.findIndex(fav => fav.id === property.id);

    if (existingFavorite === -1) {
      // Añade si no está en la lista
      await this.addRecomendation(property.id);
      this.recomendationList.push(property);
      console.log("Favorito agregado");
    } else {
      // Elimina si ya está en la lista
      const favoriteId = this.recomendationList[existingFavorite].id;
      await this.removeRecomendation(favoriteId);
      this.recomendationList.splice(existingFavorite, 1);
      console.log("Favorito eliminado");
    }
  }

  // si una propiedad está en la lista
  isRecomended(propertyId: number): boolean {
    return this.recomendationList.some(rec => rec.id === propertyId);
  }
}
