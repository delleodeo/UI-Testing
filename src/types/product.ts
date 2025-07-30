// types/product.ts
export interface SelectedItems {
  price: number;
  label: string;
  img: string;
  productId: string,
  optionId: string
}

export interface CategorySelectedEvent {
  type: "municipality" | "product" | "filter";
  value: string;
}

export interface ProductOption {
  imageUrl: string;
  price: number;
  label: string | null;
  isHot: boolean;
  _id: string;
  stock: number;
  sold: number;
  updatedAt: string
}

export interface ProductReview {
  _id: string,
  reviewerName: string,
  // userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Product {
  _id: string;
  vendorId: string | undefined;
  name: string;
  price: number;
  description: string;
  stock: number;
  sold: number;
  storeName: string | undefined,
  option: ProductOption[];
  categories: string[];
  imageUrls: string[];
  isNew: boolean;
  isHot: boolean;
  isApproved: boolean;
  reviews: ProductReview[] | undefined;
  averageRating: number;
  numReviews: number;
  createdAt: string;
  municipality: string;
  updatedAt: string;
  isOption: boolean
}
