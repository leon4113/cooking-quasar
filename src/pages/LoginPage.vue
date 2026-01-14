<template>
  <q-page class="q-pa-md">
    <q-card class="q-mb-md">
      <q-card-section>
        <q-form @submit.prevent="login">
          <q-input v-model="username" label="Username" required />
          <q-input
            v-model="password"
            label="Password"
            type="password"
            required
          />
          <q-btn type="submit" label="Login" color="primary" class="q-mt-md" />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { useQuasar } from "quasar";
import api from "src/api";
import { jwtDecode } from "jwt-decode";

export default {
  data() {
    return {
      username: "",
      password: "",
    };
  },
  methods: {
    async login() {
      try {
        const response = await api.post("/login", {
          username: this.username,
          password: this.password,
        });

        const token = response.data.token;
        this.$q.localStorage.setItem("token", token);

        // Persist user object for other parts of the app (if needed)
        if (response.data.user) {
          this.$q.localStorage.setItem("user", response.data.user);
        }

        const decodedToken = jwtDecode(token);
        const userId = decodedToken.userId;
        this.$q.localStorage.setItem("userId", userId);
        console.log(
          "from local storage:",
          this.$q.localStorage.getItem("userId")
        );

        this.$router.push("/home");
      } catch (error) {
        console.error("Login error:", error);
      }
    },
  },
  setup() {
    const $q = useQuasar();
  },
};
</script>
