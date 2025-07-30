
export interface FeatureSeller {
  storeName: string,
  description: string,
  imageUrl: string,
  userId: string,
  followers: string[],
  rating: number,
  numRatings: number,
  totalProducts: number
}

export interface Address {
  street: string,
  barangay: string,
  city: string,
  province: string,
  zipCode: string
}

export interface Seller extends FeatureSeller {
  address: Address
}

