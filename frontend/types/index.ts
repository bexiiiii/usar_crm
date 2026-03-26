export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface ApiResponse<T> {
  data: T
  error?: string
  details?: string[]
}

export interface Client {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string | null
  phone: string
  passportNumber: string | null
  passportExpiry: string | null
  dateOfBirth: string | null
  status: 'NEW' | 'ACTIVE' | 'VIP' | 'INACTIVE'
  tags: string[] | null
  preferences: string | null
  source: string | null
  assignedManagerId: string | null
  assignedManagerName: string | null
  notes: string | null
  totalBookings: number
  totalRevenue: number
  createdAt: string
  updatedAt: string
}

export interface Lead {
  id: string
  clientId: string | null
  clientName: string | null
  title: string
  stage: 'NEW' | 'CONTACTED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'WON' | 'LOST'
  source: string | null
  destination: string | null
  travelDatesFrom: string | null
  travelDatesTo: string | null
  paxAdults: number
  paxChildren: number
  budgetMin: number | null
  budgetMax: number | null
  assignedManagerId: string | null
  assignedManagerName: string | null
  lostReason: string | null
  probability: number
  expectedCloseDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface Booking {
  id: string
  bookingNumber: string
  clientId: string
  clientName: string
  assignedManagerId: string | null
  assignedManagerName: string | null
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  type: 'TOUR' | 'HOTEL' | 'FLIGHT' | 'TRANSFER' | 'VISA' | 'INSURANCE' | 'CUSTOM'
  destination: string
  country: string | null
  departureCity: string | null
  departureDate: string
  returnDate: string | null
  paxAdults: number
  paxChildren: number
  hotelName: string | null
  hotelStars: number | null
  mealPlan: string | null
  flightNumber: string | null
  tourOperator: string | null
  supplierRef: string | null
  totalPrice: number
  costPrice: number | null
  margin: number | null
  currency: string
  supplierPaymentDeadline: string | null
  supplierPaid: boolean
  notes: string | null
  specialRequests: string | null
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  bookingId: string
  bookingNumber: string
  clientId: string
  clientName: string
  amount: number
  currency: string
  type: 'DEPOSIT' | 'FULL_PAYMENT' | 'PARTIAL' | 'REFUND'
  direction: 'INCOMING' | 'OUTGOING'
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE'
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  paidAt: string | null
  dueDate: string | null
  reference: string | null
  notes: string | null
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignedToId: string | null
  assignedToName: string | null
  relatedBookingId: string | null
  relatedBookingNumber: string | null
  relatedClientId: string | null
  relatedClientName: string | null
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  fullName: string
  role: 'SUPER_ADMIN' | 'MANAGER'
  active: boolean
  createdAt: string
  bookingCount: number
}

export interface Tour {
  id: string
  name: string
  description: string | null
  country: string
  resort: string | null
  hotelName: string | null
  hotelStars: number | null
  tourOperator: string | null
  category: string
  departureCity: string | null
  durationDays: number | null
  mealPlan: string | null
  transport: string | null
  priceNetto: number | null
  priceBrutto: number
  currency: string
  maxSeats: number | null
  bookedSeats: number
  status: 'ACTIVE' | 'DRAFT' | 'SOLD_OUT' | 'ARCHIVED'
  imageUrl: string | null
  departureDate: string | null
  returnDate: string | null
  visaRequired: boolean
  insuranceIncluded: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string | null
  clientName: string | null
  bookingId: string | null
  bookingNumber: string | null
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  amount: number
  taxAmount: number
  totalAmount: number
  taxPercent: number
  currency: string
  dueDate: string | null
  paidAt: string | null
  items: InvoiceItem[] | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface InvoiceStats {
  total: number
  unpaid: number
  overdue: number
  paidThisMonth: number
}

export interface Document {
  id: string
  bookingId: string | null
  bookingNumber: string | null
  clientId: string | null
  clientName: string | null
  type: string
  fileName: string
  filePath: string | null
  generatedAt: string
  generatedById: string | null
  generatedByName: string | null
}

export interface DashboardStats {
  revenueCurrentMonth: number
  revenuePreviousMonth: number
  revenueTrend: number
  bookingsCurrentMonth: number
  bookingsPreviousMonth: number
  bookingsTrend: number
  newLeadsCurrentMonth: number
  newLeadsPreviousMonth: number
  leadsTrend: number
  conversionRate: number
  conversionRatePrevious: number
  conversionTrend: number
}
