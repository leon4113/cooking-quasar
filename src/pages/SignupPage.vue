<template>
  <q-page class="q-pa-md">
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Sign Up</div>
        <q-form @submit.prevent="signup">
          <q-input v-model="username" label="Username" required />
          <q-input v-model="password" label="Password" type="password" required />
          <q-input v-model="confirmPassword" label="Confirm Password" type="password" required />
          <q-btn type="submit" label="Sign Up" color="primary" class="q-mt-md" />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import api from 'src/api';
import { useQuasar } from 'quasar';

export default {
  data() {
    return {
      username: '',
      password: '',
      confirmPassword: ''
    };
  },
  methods: {
    async signup() {
      if (this.password !== this.confirmPassword) {
        this.$q.notify({ type: 'negative', message: 'Passwords do not match!' });
        return;
      }

      try {
        const response = await api.post('/register', {
          username: this.username,
          password: this.password
        });

        if (response.data.success) {
          // Persist auth data so the user is effectively logged in after signup
          if (response.data.token) {
            this.$q.localStorage.setItem('token', response.data.token);
          }
          if (response.data.user) {
            this.$q.localStorage.setItem('user', response.data.user);
            this.$q.localStorage.setItem('userId', response.data.user.id);
          }

          this.$q.notify({ type: 'positive', message: 'Signup successful!' });
          this.$router.push('/home');
        } else {
          this.$q.notify({ type: 'negative', message: response.data.message });
        }
      } catch (error) {
        console.error('Signup error:', error);
        this.$q.notify({ type: 'negative', message: 'Signup failed. Please try again.' });
      }
    }
  },
  setup() {
    const $q = useQuasar();
  },
};
</script>
