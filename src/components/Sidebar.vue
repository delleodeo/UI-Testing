<script setup lang="js">
import { ref, defineEmits, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStores';
import { useTheme } from '../composables/useTheme';
import {
  HomeIcon,
  ChatBubbleLeftIcon,
  WalletIcon,
  ClipboardDocumentListIcon,
  HeartIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline';

const emit = defineEmits(['handleClick'])
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { isDark } = useTheme();

const handleCl = () => {
  emit('handleClick')
  activeTab.value = "wallet"
}

// Compute active tab based on current route
const activeTab = computed(() => {
  if (route.path === '/orders') return 'orders';
  if (route.path === '/user/me') return 'dashboard';
  if (route.path.includes('/user')) return 'dashboard';
  return 'dashboard';
});

const navigateToOrders = () => {
  router.push('/orders');
};

const navigateToDashboard = () => {
  router.push('/user/me');
};

const isLoggingOut = ref(false);
const showLogoutModal = ref(false);

const showLogoutConfirmation = () => {
  showLogoutModal.value = true;
};

const cancelLogout = () => {
  showLogoutModal.value = false;
};

// Handle escape key to close modal
const handleKeyDown = (event) => {
  if (event.key === 'Escape' && showLogoutModal.value) {
    cancelLogout();
  }
};

// Add/remove event listener for escape key
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});

// Function to clear specific cookie
const clearCookie = (name) => {
  // Clear cookie for current path
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  
  // Clear cookie for current domain
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
  
  // Clear cookie for root domain (if applicable)
  const hostParts = window.location.hostname.split('.');
  if (hostParts.length > 1) {
    const rootDomain = hostParts.slice(-2).join('.');
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${rootDomain}`;
  }
  
  // Also clear with secure and samesite attributes (common in modern apps)
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;secure;samesite=strict`;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};secure;samesite=strict`;
};

// Function to clear all cookies
const clearAllCookies = () => {
  // Common authentication cookie names to specifically target
  const authCookies = [
    'token', 'auth-token', 'authToken', 'access_token', 'accessToken',
    'jwt', 'JWT', 'session', 'sessionId', 'session_id',
    'connect.sid', 'PHPSESSID', 'JSESSIONID', 'ASP.NET_SessionId',
    'refresh_token', 'refreshToken', 'user', 'userId', 'user_id'
  ];
  
  // Clear known authentication cookies first
  authCookies.forEach(cookieName => {
    clearCookie(cookieName);
  });
  
  // Get all existing cookies and clear them
  const cookies = document.cookie.split(";");
  
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    if (name) {
      clearCookie(name);
    }
  });
  
  console.log('All cookies cleared including:', authCookies.join(', '));
};

const confirmLogout = async () => {
  showLogoutModal.value = false;

  try {
    isLoggingOut.value = true;
    console.log('🚀 Starting logout process...');
    console.log('📊 Current auth state:', { 
      isAuthenticated: authStore.isAuthenticated, 
      userId: authStore.userId,
      hasToken: !!authStore.token 
    });
    
    // Call the logout method from the auth store
    console.log('📡 Calling server logout...');
    await authStore.logout();
    
    // Verify the logout was successful
    console.log('🔍 Verifying logout...');
    const logoutSuccess = await authStore.verifyLogout();
    console.log('✅ Logout verification:', logoutSuccess ? 'SUCCESS' : 'FAILED');
    
    // Clear all stored data
    console.log('🧹 Clearing local storage...');
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies
    console.log('🍪 Clearing cookies...');
    clearAllCookies();
    
    // Double-check auth state is cleared
    console.log('✅ Final auth state:', { 
      isAuthenticated: authStore.isAuthenticated, 
      userId: authStore.userId,
      hasToken: !!authStore.token 
    });
    
    // Show success message
    console.log('✨ Logout completed successfully');
    
    // Force a small delay to ensure state updates
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Force reactive update
    authStore.authChecked = true;
    
    // Redirect to login page
    console.log('🔄 Redirecting to login...');
    await router.push('/login');
    
  } catch (error) {
    console.error('❌ Logout failed:', error);
    
    // Force complete logout even if server fails
    console.log('🔧 Forcing manual logout...');
    
    // Manually clear all auth store properties
    authStore.token = null;
    authStore.isAuthenticated = false;
    authStore.userId = '';
    authStore.userRole = '';
    authStore.user = null;
    authStore.authChecked = true;
    authStore.loading = false;
    authStore.error = null;
    authStore._sessionPromise = null;
    authStore.loginError = null;
    authStore.registerError = null;
    authStore.verifyError = null;
    
    // Clear all stored data
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies even if server logout fails
    clearAllCookies();
    
    console.log('🔧 Forced logout state:', { 
      isAuthenticated: authStore.isAuthenticated, 
      userId: authStore.userId,
      hasToken: !!authStore.token 
    });
    
    // Still redirect to login
    await router.push('/login');
  } finally {
    isLoggingOut.value = false;
    showLogoutModal.value = false;
    
    // Final verification
    console.log('🏁 Logout process completed. Final check:', {
      isLoggingOut: isLoggingOut.value,
      showModal: showLogoutModal.value,
      isAuthenticated: authStore.isAuthenticated
    });
  }
};
</script>

<template>
  <aside class="account-sidebar">
    <h2 class="sidebar-title">My Account</h2>
    <nav class="sidebar-nav">
      <button class="sidebar-link" :class="{ active: activeTab === 'dashboard' }" @click="navigateToDashboard">
        <HomeIcon class="sidebar-icon" />
        Dashboard
      </button>

      <button class="sidebar-link" :class="{ active: activeTab === 'orders' }" @click="navigateToOrders">
        <ClipboardDocumentListIcon class="sidebar-icon" />
        Orders
      </button>

      <!-- <button class="sidebar-link" :class="{ active: activeTab === 'message' }" @click="activeTab = 'message'">
        <ChatBubbleLeftIcon class="sidebar-icon" />
        Message
      </button> -->

      <button @click="handleCl" class="sidebar-link" :class="{ active: activeTab === 'wallet' }">
        <WalletIcon class="sidebar-icon"/>
        Wallets
      </button>

      <!-- <button class="sidebar-link" :class="{ active: activeTab === 'wishlist' }" @click="activeTab = 'wishlist'">
        <HeartIcon class="sidebar-icon" />
        Wishlist
      </button> -->

      <button class="sidebar-link" :class="{ active: activeTab === 'settings' }" @click="navigateToDashboard">
        <Cog6ToothIcon class="sidebar-icon" />
        Update My Info
      </button>

      <button class="sidebar-link logout" @click="showLogoutConfirmation" :disabled="isLoggingOut">
        <ArrowRightOnRectangleIcon v-if="!isLoggingOut" class="sidebar-icon" />
        <div v-else class="loading-spinner"></div>
        {{ isLoggingOut ? 'Logging out...' : 'Logout' }}
      </button>
    </nav>

    <!-- Logout Confirmation Modal -->
    <div v-if="showLogoutModal" class="modal-overlay" @click="cancelLogout">
      <div class="logout-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-icon">
            <ArrowRightOnRectangleIcon class="logout-icon" />
          </div>
          <h3 class="modal-title">Confirm Logout</h3>
          <p class="modal-message">Are you sure you want to logout? You'll need to sign in again to access your account.</p>
        </div>
        
        <div class="modal-actions">
          <button @click="cancelLogout" class="btn-cancel">
            Cancel
          </button>
          <button @click="confirmLogout" class="btn-confirm" :disabled="isLoggingOut">
            <span v-if="!isLoggingOut">Logout</span>
            <span v-else class="logout-loading">
              <div class="mini-spinner"></div>
              Logging out...
            </span>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.account-sidebar {
  width: 100%;
  max-width: 18rem;
  min-width: 18rem;
  background-color: var(--surface);
  border-radius: 0 0 1rem 1rem;
  box-shadow: var(--shadow-large);
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  z-index: 10;
  border-bottom: 5px solid var(--primary-color);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  transition: all var(--transition-fast);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  color: var(--text-primary);
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.sidebar-link:hover {
  background-color: var(--surface-hover);
  transform: translateX(4px);
}

.sidebar-link.active {
  background-color: var(--primary-color);
  color: white;
  font-weight: 600;
}

.sidebar-link.logout {
  margin-top: 1rem;
  color: #dc2626;
}

.sidebar-link.logout:hover:not(:disabled) {
  background-color: rgba(220, 38, 38, 0.1);
}

.sidebar-link.logout:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.loading-spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid transparent;
  border-top: 2px solid #dc2626;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Logout Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.logout-modal {
  background: var(--surface);
  border-radius: 1rem;
  box-shadow: var(--shadow-large);
  max-width: 400px;
  width: 90%;
  padding: 1.5rem;
  animation: scaleIn 0.2s ease;
  position: relative;
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

@keyframes scaleIn {
  from { 
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to { 
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.modal-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1rem;
  background: rgba(220, 38, 38, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-fast);
}

.logout-icon {
  width: 2rem;
  height: 2rem;
  color: #dc2626;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  transition: color var(--transition-fast);
}

.modal-message {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
  transition: color var(--transition-fast);
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-cancel:hover {
  background: var(--surface-hover);
}

.btn-confirm {
  background: #dc2626;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-confirm:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.logout-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mini-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Mobile Responsive */
@media (max-width: 540px) {
  .logout-modal {
    margin: 1rem;
    padding: 1.25rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .btn-cancel,
  .btn-confirm {
    width: 100%;
  }
}

.sidebar-icon {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
}

@media (max-width: 820px) {

  .account-sidebar {
    top: 4.2rem;
  }
}

@media (max-width: 540px) {
  .account-sidebar {
    display: none;
  }
}
</style>
