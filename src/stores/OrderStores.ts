import { defineStore } from 'pinia'
import axios from 'axios'
import type { Order } from '../types/order'
import { getAuthHeaders } from '../types/shared'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

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
        const headers = getAuthHeaders()
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
        const headers = getAuthHeaders()
        const response = await axios.post(`${API_BASE_URL}/order`, orderData, { headers })
        console.log('Order created successfully:', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to create order:', error.response?.data || error.message)
        throw error
      }
    },

    async cancelOrder(orderId: string) {
      try {
        this.isLoading = true
        this.error = null
        
        if (!orderId) {
          throw new Error('Order ID is required')
        }
        
        // Get fresh auth headers for the request
        const authHeaders = getAuthHeaders()
        
        console.log('📡 Cancelling order:', orderId)
        
        const response = await axios.put(
          `${API_BASE_URL}/order/cancel/${orderId}`,
          {},
          { headers: authHeaders }
        )
        
        console.log('Order cancelled successfully:', response.data)
        
        // Update local order status if the order exists in our store
        const orderIndex = this.orders.findIndex(order => order._id === orderId || order.orderId === orderId)
        if (orderIndex !== -1) {
          this.orders[orderIndex].status = 'cancelled'
        }
        
        return response.data
      } catch (error) {
        console.error('Failed to cancel order:', error)
        this.error = error?.response?.data?.message || 'Failed to cancel order.'
        throw error
      } finally {
        this.isLoading = false
      }
    }

  }
})
