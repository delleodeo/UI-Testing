import { defineStore } from 'pinia'
import axios from 'axios'
import type { Order } from '../types/order'
import { getAuthHeaders } from '../types/shared'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const headers = getAuthHeaders()

export const useOrderStore = defineStore('order', {
  state: () => ({
    orders: [] as Order[],
    isLoading: false,
    error: null as string | null,
    isFetch: false
  }),

  getters: {
    totalOrders: (state) => state.orders.length,
    ordersByStatus: (state) => {
      return (status: Order['status']) =>
        state.orders.filter(order => order.status === status)
    }
  },

  actions: {
    async fetchOrders() {
      if(this.isFetch) return

      this.isLoading = true
      this.error = null
      try {
        const res = await axios.get(`${API_BASE_URL}/order`, {
          headers
        })
        this.orders = res.data
        console.log(this.orders)
        this.isFetch = true
      } catch (err: any) {
        this.error = err?.response?.data?.message || 'Failed to fetch orders.'
      } finally {
        this.isLoading = false
      }
    },

    async createOrder(orderData) {
      try {
        const response = await axios.post(`${API_BASE_URL}/order`, orderData, { headers })
        console.log('Order created successfully:', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to create order:', error.response?.data || error.message)
        throw error
      }
    }

  }
})
