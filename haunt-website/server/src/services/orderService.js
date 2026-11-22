import { HttpError } from '../utils/httpError.js'
import * as orderModel from '../models/orderModel.js'

export async function createGuestOrder(validatedBody) {
  return orderModel.createGuestOrder(validatedBody)
}

export async function getOrderByNumber(orderNumber, email) {
  const order = await orderModel.findOrderByNumber(orderNumber, email)
  if (!order) throw new HttpError(404, 'Order not found.')
  return order
}

export async function listMyOrders(email) {
  return orderModel.listOrdersByEmail(email)
}

export async function listAdminOrders(filters) {
  return orderModel.listOrdersAdmin(filters)
}

export async function changeOrderStatus(orderNumber, status) {
  if (!orderModel.isOrderStatus(status)) {
    throw new HttpError(400, 'status must be a valid order status.')
  }
  const affected = await orderModel.updateOrderStatus(orderNumber, status)
  if (!affected) throw new HttpError(404, 'Order not found.')
  return { orderNumber, status }
}
