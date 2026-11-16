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
