<template>
  <q-page padding>
    <q-uploader
      label="Upload an image"
      @added="onImageAdded"
      accept="image/*"
    />
    <div v-if="detectedIngredients.length">
      <h3>Detected Ingredients:</h3>

      <!-- Group by category -->
      <div v-for="(items, category) in groupedIngredients" :key="category" class="q-mb-md">
        <h5 class="text-capitalize q-mb-sm">{{ category }}</h5>
        <q-list bordered separator>
          <q-item v-for="ingredient in items" :key="ingredient.class">
            <q-item-section>
              <q-item-label>
                {{ ingredient.class }}
                <q-badge
                  v-if="ingredient.uncertain"
                  color="orange"
                  class="q-ml-sm"
                >
                  Uncertain
                </q-badge>
              </q-item-label>
              <q-item-label caption>
                Confidence: {{ (ingredient.confidence * 100).toFixed(0) }}%
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <q-btn
        @click="generateRecipe"
        label="Generate Recipe"
        color="primary"
        class="q-mt-md"
      />
    </div>
  </q-page>
</template>

<script>
import { ref, computed } from 'vue';
import api from 'src/api';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const detectedIngredients = ref([]);
    const $q = useQuasar();
    const router = useRouter();

    // Group ingredients by category
    const groupedIngredients = computed(() => {
      const groups = {};
      detectedIngredients.value.forEach(ingredient => {
        const category = ingredient.category || 'other';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(ingredient);
      });
      return groups;
    });

    const toBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = (error) => reject(error);
      });

    const onImageAdded = async (files) => {
      try {
        const image = files[0];
        const imageBase64 = await toBase64(image);

        const detectionResult = await api.post("/detect-ingredients", {
          imageBase64: imageBase64,
        });

        detectedIngredients.value = detectionResult.data.predictions;
      } catch (error) {
        console.error("Error detecting ingredients:", error);
        $q.notify({
          type: "negative",
          message: "Failed to detect ingredients. Please try again.",
        });
      }
    };

    const generateRecipe = async () => {
      try {
        const ingredients = detectedIngredients.value.map(ingredient => ingredient.class);
        console.log('Ingredients:', ingredients);
        //ensure userId is int type

        const rawUserId = $q.localStorage.getItem('userId');
        const userId = parseInt(rawUserId);
        console.log('User ID:', userId);
        if (!userId) {
          throw new Error('User is not logged in');
        }

        const response = await api.post('/generate-recipe', { userId, ingredients });
        console.log('Recipe generated:', response.data.recipes);  // Log the response
        sessionStorage.setItem('recipes', JSON.stringify(response.data.recipes));
        router.push({ name: 'recipes'});
      } catch (error) {
        console.error('Error generating recipe:', error);
        $q.notify({
          type: "negative",
          message: "Failed to generate recipe. Please try again.",
        });
      }
    };

    return {
      onImageAdded,
      detectedIngredients,
      groupedIngredients,
      generateRecipe,
    };
  }
};
</script>
