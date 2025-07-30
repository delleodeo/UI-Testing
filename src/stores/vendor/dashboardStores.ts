import { defineStore } from 'pinia'
import axios, { AxiosError } from 'axios'
import { Alert } from '../../components/composable/Alert'
import type { Vendor } from '../../types/vendor/vendor'
import { getAuthHeaders } from '../../types/shared'
import type { Product, ProductOption } from '../../types/product'


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const headers = getAuthHeaders()
type SortDirection = 'asc' | 'desc'

export interface NewOptionInput {
  _id?: string
  imageUrl?: string
  price: number
  label?: string | null
  stock?: number
  sold?: number
  isHot?: boolean
}

interface State {
  vendor: Vendor | null
  vendorProducts: Partial<Product>[]
  loading: boolean
  error: string | null
}

function capitalizeFirst(str?: string | null): string | null {
  if (!str) return null
  const t = str.trim()
  if (!t) return null
  return t.charAt(0).toUpperCase() + t.slice(1)
}

function normalizeNewOption(input: NewOptionInput): Required<NewOptionInput> {
  return {
    _id: input._id || '',
    imageUrl: input.imageUrl?.trim() || '',
    price: Number(input.price),
    label: capitalizeFirst(input.label ?? null),
    stock: input.stock != null ? Number(input.stock) : 0,
    sold: input.sold != null ? Number(input.sold) : 0,
    isHot: !!input.isHot
  }
}

function extractTimestamp(doc: any): number {
  if (!doc || typeof doc !== 'object') return 0
  if (doc.createdAt) {
    const t = Date.parse(doc.createdAt)
    if (!Number.isNaN(t)) return t
  }
  if (doc.updatedAt) {
    const t = Date.parse(doc.updatedAt)
    if (!Number.isNaN(t)) return t
  }
  if (doc._id && typeof doc._id === 'string' && doc._id.length >= 8) {
    const seconds = parseInt(doc._id.substring(0, 8), 16)
    if (!Number.isNaN(seconds)) return seconds * 1000
  }
  return 0
}

function sortByDate<T>(items: T[], dir: SortDirection = 'desc'): T[] {
  const mult = dir === 'asc' ? 1 : -1
  return [...items].sort(
    (a: any, b: any) => (extractTimestamp(a) - extractTimestamp(b)) * mult
  )
}

function recomputeAggregates(product: Product) {
  if (Array.isArray(product.option) && product.option.length > 0) {
    product.stock = product.option.reduce((s, o) => s + (o.stock || 0), 0)
    product.sold = product.option.reduce((s, o) => s + (o.sold || 0), 0)
    product.isOption = true
  } else {
    product.isOption = false
  }
}

/* ---------------- Image Helpers ----------------- */
function isDataUrl(v?: string) {
  return !!v && /^data:image\/[a-zA-Z]+;base64,/.test(v)
}

function dataURItoBlob(dataURI: string): Blob {
  const [meta, base64] = dataURI.split(',')
  const mime = meta.split(':')[1].split(';')[0]
  const binary = atob(base64)
  const len = binary.length
  const arr = new Uint8Array(len)
  for (let i = 0; i < len; i++) arr[i] = binary.charCodeAt(i)
  return new Blob([arr], { type: mime })
}


async function uploadImageDataUrl(dataUrl: string, productId: string, optionId?: string) {
  const fd = new FormData()
  fd.append('images', dataURItoBlob(dataUrl), 'option-image.png')
  if (productId) fd.append('productId', productId)
  if (optionId) fd.append('optionId', optionId)

  const { data } = await axios.post(
    `${API_BASE_URL}/upload`,
    fd,
    {
      headers: {
        Authorization: headers.Authorization,
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  return data
}


function extractUploadedUrl(resp: any): string | null {
  return (
    resp?.secureUrl ||
    resp?.secure_url ||
    resp?.url ||
    resp?.imageUrl ||
    resp?.imageURL ||
    resp?.images?.[0]?.secureUrl ||
    resp?.images?.[0]?.secure_url ||
    resp?.images?.[0]?.url ||
    null
  )
}

export const useVendorDashboardStore = defineStore('vendor', {
  state: (): State => ({
    vendor: null,
    vendorProducts: [],
    loading: false,
    error: null,
  }),

  getters: {
    isApproved: (state) => state.vendor?.isApproved ?? false,
    vendorName: (state) => state.vendor?.storeName ?? '',
    revenueThisMonth: (state) => state.vendor?.currentMonthlyRevenue ?? 0,
    revenueComparison: (state) => state.vendor?.monthlyRevenueComparison ?? []
  },

  actions: {
    normalizeProduct(raw: any): Product {
      const imageUrls: string[] = Array.isArray(raw.imageUrls)
        ? raw.imageUrls
        : Array.isArray(raw.imgurl)
          ? raw.imgurl
          : raw.imgurl
            ? [raw.imgurl]
            : []

      const categories: string[] = Array.isArray(raw.categories)
        ? raw.categories
          .map((c: any) => (typeof c === 'string' ? c.trim() : ''))
          .filter(Boolean)
        : []

      const options: ProductOption[] = Array.isArray(raw.option)
        ? sortByDate(
          raw.option.map((o: any) => ({
            _id: String(o._id || ''),
            imageUrl: o.imageUrl ? String(o.imageUrl) : '',
            price: Number(o.price ?? 0),
            label: o.label != null ? String(o.label) : '',
            isHot: !!o.isHot,
            stock: Number(o.stock ?? 0),
            sold: Number(o.sold ?? 0),
            createdAt: o.createdAt,
            updatedAt: o.updatedAt
          })),
          'desc'
        )
        : []

      const product: Product | any = {
        _id: String(raw._id || ''),
        vendorId: raw.vendorId ? String(raw.vendorId) : undefined,
        name: raw.name ? String(raw.name) : '',
        description: raw.description ? String(raw.description) : '',
        price: Number(raw.price ?? 0),
        stock: Number(raw.stock ?? 0),
        sold: Number(raw.sold ?? 0),
        option: options,
        categories,
        isOption: !!raw.isOption,
        imageUrls,
        isNew: !!raw.isNew,
        isHot: !!raw.isHot,
        isApproved: !!raw.isApproved,
        averageRating: Number(raw.averageRating ?? 0),
        numReviews: Number(raw.numReviews ?? 0),
        municipality: raw.municipality ? String(raw.municipality) : '',
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt
      }

      recomputeAggregates(product)
      return product
    },

    async syncProductDerivedFields(productId: string, persist = true) {
      const prod = this.vendorProducts.find(p => p._id === productId)
      if (!prod) return
      recomputeAggregates(prod)
      if (persist) {
        try {
          await axios.put(
            `${API_BASE_URL}/products/${productId}`,
            {
              stock: prod.stock,
              sold: prod.sold
            },
            { headers }
          )
        } catch (e) {
          console.warn('[syncProductDerivedFields] Persist failed', e)
        }
      }
    },

    async fetchVendor(sortDir: SortDirection = 'desc') {
      this.loading = true
      this.error = null
      try {
        const { data: vendorData } = await axios.get(`${API_BASE_URL}/vendor`, { headers })
        this.vendor = vendorData
        if (!vendorData?.userId) {
          this.vendorProducts = []
          return
        }

        const { data: rawProducts } = await axios.get(
          `${API_BASE_URL}/products/vendor/${vendorData.userId}`,
          { headers }
        )

        const normalized: Product[] = rawProducts.map((p: any) => this.normalizeProduct(p))
        this.vendorProducts = sortByDate(normalized, sortDir)
      } catch (err) {
        const e = err as AxiosError<any>
        this.error = e.response?.data?.message || 'Failed to load vendor'
      } finally {
        this.loading = false
      }
    },

    async updateBaseProduct(productId: string, updated: Partial<Product>) {
      try {
        await axios.put(`${API_BASE_URL}/products/${productId}`, updated, { headers })
        await this.refreshSingleProduct(productId)
        Alert('Product successfully updated!', 'success', 'var(--primary-color)')
      } catch (error: any) {
        Alert(`Product update failed! ${error?.response?.status || ''}`, 'error', 'var(--secondary-color)')
        console.error(error)
      }
    },

    async uploadProducts(data: any) {
      try {
        data.imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : []
        if (Array.isArray(data.option) && data.option.length > 0) {
          data.imageUrls = []
          data.stock = 0
          data.sold = 0
          data.option.forEach((opt: any) => {
            if (opt.imageUrl) data.imageUrls.push(opt.imageUrl)
            data.stock += opt.stock || 0
            data.sold += opt.sold || 0
          })
        }
        await axios.post(`${API_BASE_URL}/products`, data, { headers })
        await this.fetchVendor()
      } catch (error) {
        console.error(error)
      }
    },

    /* ------------------ Delete Product / Variant ------------------ */
    async deleteProduct(productId: string, variantId: string) {
      try {
        const deletingVariant = variantId && variantId !== null

        if (deletingVariant) {
          await axios.delete(
            `${API_BASE_URL}/products/${productId}/options/${variantId}`,
            { headers }
          )

          const idx = this.vendorProducts.findIndex(p => p._id === productId)
          if (idx > -1) {
            const prod = this.vendorProducts[idx]
            prod.option = prod.option.filter(o => o._id !== variantId)
            await this.syncProductDerivedFields(productId, true)
          }

          await this.refreshSingleProduct(productId)
        } else {
          await axios.delete(`${API_BASE_URL}/products/${productId}`, { headers })
          this.vendorProducts = this.vendorProducts.filter(p => p._id !== productId)
        }

        Alert('Product Successfully Deleted!', 'success', 'var(--primary-color)')
      } catch (error) {
        Alert('Product Delete Failed!', 'error', 'var(--secondary-color)')
        console.error(error)
      }
    },

    /* ------------------ Update Option ------------------ */
    async updateOptionedProduct(productId: string, variantId: string, updated: Partial<ProductOption>) {
      try {
        if (updated.label != null) {
          updated.label = capitalizeFirst(updated.label)
        }

        if (updated.imageUrl && isDataUrl(updated.imageUrl)) {
          try {
            const resp = await uploadImageDataUrl(updated.imageUrl, productId, variantId)
            const finalUrl = extractUploadedUrl(resp)
            if (!finalUrl) {
              Alert('Image upload failed (no URL).', 'error', 'var(--secondary-color)')
              return
            }
            updated.imageUrl = finalUrl
          } catch (uploadErr: any) {
            Alert('Image upload failed. Update aborted.', 'error', 'var(--secondary-color)')
            console.error('Image upload failed:', uploadErr)
            return
          }
        }

        // Optimistic local merge
        const productIdx = this.vendorProducts.findIndex(p => p._id === productId)
        if (productIdx > -1) {
          const prod = this.vendorProducts[productIdx]
          const optIdx = prod.option.findIndex(o => o._id === variantId)
          if (optIdx > -1) {
            prod.option[optIdx] = {
              ...prod.option[optIdx],
              ...updated,
              updatedAt: new Date().toISOString()
            }
            // Sync derived locally (no persist yet)
            await this.syncProductDerivedFields(productId, false)
          }
        }

        await axios.patch(
          `${API_BASE_URL}/products/${productId}/options/${variantId}`,
          updated,
          { headers }
        )

        await this.syncProductDerivedFields(productId, true)

        // Authoritative refresh
        await this.refreshSingleProduct(productId)

        Alert('Product option updated!', 'success', 'var(--primary-color)')
      } catch (error: any) {
        Alert(`Product option update failed! ${error?.response?.status || ''}`, 'error', 'var(--secondary-color)')
        console.error(error)
        await this.refreshSingleProduct(productId)
      }
    },

    /* ------------------ Add Option ------------------ */
    async addOption(productId: string, newOption: NewOptionInput) {
      const product = this.vendorProducts.find(p => p._id === productId)
      if (!product) throw new Error('Product not found in store.')

      if (newOption.imageUrl && isDataUrl(newOption.imageUrl)) {
        try {
          const resp = await uploadImageDataUrl(newOption.imageUrl, productId)
          const finalUrl = extractUploadedUrl(resp)
          if (!finalUrl) {
            Alert('Option image upload failed (no URL).', 'error', 'var(--secondary-color)')
            return
          }
          newOption.imageUrl = finalUrl
        } catch (e) {
          Alert('Option image upload failed.', 'error', 'var(--secondary-color)')
          throw e
        }
      }

      const payload = normalizeNewOption({
        ...newOption,
        _id: '',
        sold: newOption.sold ?? 0,
        isHot: newOption.isHot ?? false
      })

      // Optimistic
      const snapshot = [...product.option]
      product.option.push({
        _id: `temp-${Date.now()}`,
        imageUrl: payload.imageUrl,
        price: payload.price,
        label: payload.label,
        isHot: payload.isHot,
        stock: payload.stock,
        sold: payload.sold,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any)

      await this.syncProductDerivedFields(productId, false)

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/products/${productId}/options`,
          payload,
          { headers }
        )

        // Persist parent derived fields (imageUrls / stock / sold)
        await this.syncProductDerivedFields(productId, true)

        if (data?.product) {
          const idx = this.vendorProducts.findIndex(p => p._id === productId)
          if (idx > -1) {
            this.vendorProducts[idx] = this.normalizeProduct(data.product)
          }
        } else {
          await this.refreshSingleProduct(productId)
        }

        Alert('Option added successfully!', 'success', 'var(--primary-color)')
      } catch (err: any) {
        product.option = snapshot
        await this.syncProductDerivedFields(productId, false)
        Alert('Failed to add option. Please try again!', 'error', 'var(--secondary-color)')
        console.error('addOption failed:', err)
        throw new Error(err.response?.data?.message || 'Failed to add option')
      }
    },

    /* ------------------ Refresh Single Product ------------------ */
    async refreshSingleProduct(productId: string) {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/products/${productId}`, { headers })
        const normalized = this.normalizeProduct(data)
        const idx = this.vendorProducts.findIndex(p => p._id === productId)
        if (idx > -1) {
          this.vendorProducts[idx] = normalized
        } else {
          this.vendorProducts.push(normalized)
          this.vendorProducts = sortByDate(this.vendorProducts, 'desc')
        }
      } catch (e) {
        console.warn('Failed to refresh product', e)
      }
    },

    async adjustProductStock(productId, optionId, delta) {
      try {
        const updated = await axios.patch(
          `${API_BASE_URL}/products/${productId}/${optionId}/stock`,
          { delta }
        );
        return updated.data;
      } catch (error) {
        console.error("Error adjusting product stock:", error.response?.data || error.message);
        throw error;
      }
    },


    /* ------------------ Resort ------------------ */
    resortProducts(order: SortDirection = 'desc') {
      this.vendorProducts = sortByDate(this.vendorProducts, order)
      this.vendorProducts.forEach(p => {
        p.option = sortByDate(p.option, order)
      })
    },

    /* ------------------ Clear ------------------ */
    clearVendor() {
      this.vendor = null
      this.vendorProducts = []
    }
  }
})
