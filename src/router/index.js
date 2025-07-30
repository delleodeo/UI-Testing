// router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStores";

// Eager import
import ChatView from "../pages/ChatView.vue";

// Lazy imports
const Home = () => import("../pages/Home.vue");
const Cart = () => import("../pages/Cart.vue");
const Search = () => import("../pages/Search.vue");
const ProductSearchResult = () => import("../pages/ProductSearchResult.vue");
const ViewProduct = () => import("../pages/ViewProduct.vue");
const ViewSeller = () => import("../pages/ViewSeller.vue");
const Profile = () => import("../pages/Profile.vue");
const Message = () => import("../pages/Message.vue");
const Orders = () => import("../pages/Orders.vue");
const AuthPage = () => import("../pages/Auth.vue");
const Dashboard = () => import("../pages/vendor/Dashboard.vue");

const routes = [
	{ path: "/", redirect: "/products" },
	{ path: "/products", component: Home },

	// Public auth page (signup/login)
	{
		path: "/signup",
		component: AuthPage,
		meta: { public: true, authPage: true },
	},
	{
		path: "/login",
		component: AuthPage,
		meta: { public: true, authPage: true },
	},

	// Authenticated user routes
	{ path: "/user/me", component: Profile, meta: { requiresAuth: true } },
	// { path: "/message", component: Message, meta: { requiresAuth: true } },
	// {
	// 	path: "/message/:chatId",
	// 	component: ChatView,
	// 	meta: { requiresAuth: true },
	// },
	{ path: "/cart", component: Cart, meta: { requiresAuth: true } },
	{ path: "/orders", component: Orders, meta: { requiresAuth: true } },
	{ path: "/products/search", component: Search, meta: { requiresAuth: true } },
	{
		path: "/search/result",
		component: ProductSearchResult,
		meta: { requiresAuth: true },
	},
	{
		path: "/product/:id",
		component: ViewProduct,
		meta: { requiresAuth: true },
	},
	{
		path: "/view/vendor/:id",
		component: ViewSeller,
		meta: { requiresAuth: true },
	},
	{
		path: "/vendor/dashboard",
		component: Dashboard,
		meta: { requiresAuth: true },
	},

	// Optional 404
	// { path: "/:pathMatch(.*)*", component: NotFound }
];

const router = createRouter({
	history: createWebHistory(),
	routes,
	scrollBehavior() {
		return { top: 0 };
	},
});

router.beforeEach(async (to, from, next) => {
	const auth = useAuthStore();

	// Lazy-load session if not yet checked
	if (!auth.authChecked) {
		await auth.fetchSession();
	}

	// 🔒 Block access to auth pages if already logged in
	if (to.meta.authPage && auth.isAuthenticated) {
		return next("/");
	}

	// ✅ Allow public pages or pages that don't require auth
	if (to.meta.public || !to.meta.requiresAuth) {
		return next();
	}

	// ❌ Not authenticated → redirect to signup
	if (!auth.isAuthenticated) {
		return next("/signup");
	}

	// 🛑 Check for vendor-only route
	if (to.path.startsWith("/vendor") && auth.user?.role !== "vendor") {
		return next("/"); // Redirect to home or some access denied page
	}

	// ✅ All checks passed
	return next();
});

export default router;
