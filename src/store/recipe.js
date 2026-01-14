import { defineStore } from 'pinia';
import api from 'src/api';

export const useRecipeStore = defineStore('recipe', {
  state: () => ({
    recipes: [],
    generatedRecipe: null,
  }),
  actions: {
    async generateRecipe(userId, ingredients) {
      try {
        const response = await api.post('/generate-recipe', { userId, ingredients });
        const recipes = response.data.recipes || [];
        this.recipes = recipes;
        this.generatedRecipe = recipes.length > 0 ? recipes[0] : null;
        return recipes;
      } catch (error) {
        console.error('Generate recipe error:', error);
        throw error;
      }
    },
    async fetchUserRecipes(userId) {
      try {
        const response = await api.get(`/user/${userId}/recipes`);
        this.recipes = response.data.recipes;
        return response.data.recipes;
      } catch (error) {
        console.error('Fetch user recipes error:', error);
        throw error;
      }
    },
    async deleteRecipe(userId, recipeId) {
      try {
        const response = await api.delete(`/user/${userId}/recipes/${recipeId}`);
        this.recipes = this.recipes.filter(recipe => recipe.id !== recipeId);
        return response.data;
      } catch (error) {
        console.error('Delete recipe error:', error);
        throw error;
      }
    },
  },
});
