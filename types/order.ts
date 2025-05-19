import { User } from "@prisma/client";

export interface Order {
  id: string;
  orderNumber: string | null;
  userId: string;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  serviceId: string | null;
  quantity: number;
  price: number;
  name: string;
  description: string | null;
} 