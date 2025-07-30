import { useAuthStore } from "../stores/authStores";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function getAuthHeaders(): { Authorization: string } {
	const authStore = useAuthStore();
	return {
		Authorization: `Bearer ${authStore.token}`,
	};
}
