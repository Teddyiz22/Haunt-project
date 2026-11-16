import * as orderService from '../services/orderService.js'

export async function createOrder(request, response) {
  const order = await orderService.createGuestOrder(request.validatedBody)
  response.status(201).json({ success: true, data: order })
}

export async function getOrder(request, response) {
  const order = await orderService.getOrderByNumber(
    request.validatedParams.orderNumber,
    request.validatedQuery.email,
  )
  response.json({ success: true, data: order })
}
