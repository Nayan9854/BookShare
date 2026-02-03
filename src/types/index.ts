// src/types/index.ts - Add proper type definitions

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'USER' | 'AGENT' | 'ADMIN';
  points: number;
  profilePicture?: string;
  createdAt: string | Date;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  description?: string;
  genre?: string;
  condition?: string;
  coverImage?: string;
  ownerId: number;
  owner?: User;
  isAvailable: boolean;
  availableFrom?: string | Date;
  availableTo?: string | Date;
  categories?: Category[];
  createdAt: string | Date;
}

export interface BorrowRequest {
  id: number;
  bookId: number;
  book?: Book;
  borrowerId: number;
  borrower?: User;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'COMPLETED';
  requestedAt: string | Date;
  approvedAt?: string | Date;
  returnedAt?: string | Date;
  deliveries?: Delivery[];
  pointsDeducted?: number;
}

export interface Delivery {
  id: number;
  borrowRequestId: number;
  borrowRequest?: BorrowRequest;
  agentId?: number;
  agent?: User;
  pickupAddress: string;
  deliveryAddress: string;
  deliveryFee: number;
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPLETED';
  type: 'FORWARD' | 'RETURN';
  verificationCode?: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string | Date;
  pickedUpAt?: string | Date;
  deliveredAt?: string | Date;
  createdAt: string | Date;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string | Date;
}

export interface AgentEarnings {
  totalEarnings: number;
  pendingEarnings: number;
  completedDeliveries: number;
  activeDeliveries: number;
  recentEarnings: Array<{
    date: string;
    amount: number;
    type: string;
  }>;
}

export interface AnalyticsData {
  totalBooks?: number;
  activeRequests?: number;
  totalUsers?: number;
  completedDeliveries?: number;
  totalBorrowedBooks?: number;
  activeBorrows?: number;
  pointsEarned?: number;
  booksShared?: number;
  recentActivity?: Array<{
    date: string;
    activity: string;
  }>;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

// Form Data Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface BookFormData {
  title: string;
  author: string;
  description?: string;
  genre?: string;
  condition?: string;
  availableFrom?: string;
  availableTo?: string;
  categories?: number[];
}

// Razorpay Types
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}