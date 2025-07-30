export interface OrderItem {
  _id?: string
  imgUrl: string
  name: string
  label: string
  quantity: number,
  price: number,
  orderProductId: string // MongoDB ObjectId as string
}

export interface Address {
  street: string
  barangay: string
  city: string
  province: string
  zipCode: string
}

export type PaymentMethod = 'wallet' | 'gcash' | 'cod'
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'

export interface Order {
  _id: string,
  name: string,
  userId: string
  vendorId: string
  items: OrderItem[]
  subTotal: number
  orderId: string
  paymentStatus: string
  shippingAddress: Address
  trackingNumber: string
  createdAt: string
  updatedAt: string
  paymentMethod: PaymentMethod
  status: OrderStatus
  shippingFee: number
  shippingCarrier?: string;
  shippedAt?: string;
  shippingNotes?: string;
}
