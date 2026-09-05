export type MenuItem = {
  menu_item_id: string
  item_name: string
  description: string | null
  category: 'food' | 'drink'
  price: number
  availability_status: string
  expected_preparation_time: number
  menu_id: string
}

export type MenuGroup = {
  menu_id: string
  menu_name: string
  items: MenuItem[]
}

export type Customer = {
  customer_id: string
  first_name: string
  last_name: string | null
}

export type CartLine = { item: MenuItem; quantity: number }

export type Order = {
  order_id: string
  status: 'Pending' | 'Served'
  estimated_waiting_time: number
  total_order_amount: number
  is_paid: boolean
  customer_id: string
  customers?: { first_name: string; last_name: string | null }
  order_date: string
  order_time: string
}

export type OrderItem = {
  order_item_id: string
  order_id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  subtotal: number
  chef_id: string | null
  bartender_id: string | null
  menu_items?: { item_name: string; category: 'food' | 'drink' }
}

export type Staff = { chef_id?: string; bartender_id?: string; first_name: string; last_name: string | null }
