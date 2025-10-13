// src/stores/auth.js
import { defineStore } from "pinia";
import axios from "axios";
import { getAuthHeaders } from "../types/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: null,
    isAuthenticated: false,
    user: null,
    userId: '',
    userRole: '',
    authChecked: false,
    loading: false,
    error: null,
    _sessionPromise: null,
    loginError: null,
    registerError: null,
    verifyError: null
  }),

  actions: {

    async fetchSession(force = false) {
      if (this.authChecked && !force) {
        return this.isAuthenticated;
      }
      // collapse concurrent calls
      if (this._sessionPromise && !force) {
        return this._sessionPromise;
      }

      this.loading = true;
      this.error = null;

      const url = `${API_BASE_URL}/user/session`;
      this._sessionPromise = axios
        .get(url, { withCredentials: true })
        .then(({ data }) => {
          if (data.auth) {
            this.user = data.user || null;
            this.token = data.token;
            this.isAuthenticated = true;
            this.userId = data.user.id
            this.userRole = data.user.role
          } else {
            this.token = null;
            this.isAuthenticated = false;
          }
          this.authChecked = true;
          return this.isAuthenticated;
        })
        .catch((err) => {
          console.error("fetchSession error:", err);
          this.token = null;
          this.isAuthenticated = false;
          this.error = err;
          this.authChecked = true;
          return false;
        })
        .finally(() => {
          this.loading = false;
          this._sessionPromise = null;
        });

      return this._sessionPromise;
    },

    async loginUser(email: string, password: string) {
      this.loading = true
      this.loginError = null
      try {
        const response = await axios.post(
          `${API_BASE_URL}/user/login`,
          { email, password },
          {
            withCredentials: true,
          }
        );

        console.log(response)
        this.loading = false
        if (response.statusText === 'OK') {
          window.location.assign("/products")
        }

        return response.data;
      } catch (error: any) {
        this.loginError = 'User Not Found, Please check your email or password!'

        const message =
          error.response?.data?.error || "Login failed. Please try again.";
        throw new Error(message);
      } finally {
        this.loading = false
      }
    },

    async logout() {
      console.log('🔄 Auth Store: Starting logout process...');
      
      // Try the protected logout endpoint first
      try {
        console.log('📡 Attempting protected logout with token...');
        
        // Get proper auth headers
        const authHeaders = this.token ? getAuthHeaders() : {};
        
        await axios.post(
          `${API_BASE_URL}/user/logout`,
          {},
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders
            }
          }
        );
        console.log('✅ Protected logout successful');
        
      } catch (err) {
        console.warn("❌ Protected logout failed, trying cookie logout:", err.response?.status, err.response?.data);
        
        // Try the cookie-based logout as fallback
        try {
          console.log('🍪 Attempting cookie-based logout...');
          await axios.post(
            `${API_BASE_URL}/user/logout-cookie`,
            {},
            { withCredentials: true }
          );
          console.log('✅ Cookie logout successful');
          
        } catch (cookieErr) {
          console.warn("❌ Cookie logout also failed (continuing anyway):", cookieErr.response?.status, cookieErr.response?.data);
        }
      }

      // Clear all authentication-related state
      console.log('🧹 Clearing auth state...');
      this.token = null;
      this.isAuthenticated = false;
      this.userId = '';
      this.userRole = '';
      this.user = null;
      this.authChecked = true;
      this.loading = false;
      this.error = null;
      this._sessionPromise = null;
      this.loginError = null;
      this.registerError = null;
      this.verifyError = null;
      
      console.log('✨ Auth store logout completed');
    },

    // Method to verify logout was successful by checking session
    async verifyLogout() {
      try {
        console.log('🔍 Verifying logout by checking session...');
        const response = await axios.get(`${API_BASE_URL}/user/session`, { 
          withCredentials: true 
        });
        
        if (response.data.auth) {
          console.warn('⚠️ Session still active after logout:', response.data);
          return false;
        } else {
          console.log('✅ Session successfully destroyed');
          return true;
        }
      } catch (error) {
        console.log('✅ Session check failed (expected after logout):', error.response?.status);
        return true; // 401/403 errors are expected after successful logout
      }
    },

    // send otp
    async requestOtp(email: string) {
      this.registerError = null
      try {
        this.loading = true
        const res = await axios.post(`${API_BASE_URL}/user/request-otp`, ({ email }), {
          headers: { "Content-Type": "application/json" },
        });
        this.loading = false
        console.log(res.data)
      } catch (err) {
        this.registerError = err.response.data.message
        console.error(err);
      } finally {
        this.loading = false
      }
    },

    async verifyAndRegister(userData: any) {
      this.verifyError = null
      this.loading = true
      try {
        const res = await axios.post(`${API_BASE_URL}/user/register`,
          { ...userData },
          {
            headers: { "Content-Type": "application/json" },
          });
        this.loading = false
      } catch (err) {
        this.verifyError = err.response.data.error
      }finally{
        this.loading = false
      }
    }

  },
});
