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

export async function listMyOrders(request, response) {
  const orders = await orderService.listMyOrders(request.user.email)
  response.json({ success: true, data: orders })
}

export async function listAdminOrders(request, response) {
  const { orders, total } = await orderService.listAdminOrders(request.validatedQuery)
  const { page, limit } = request.validatedQuery
  response.json({
    success: true,
    data: orders,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    },
  })
}

export async function changeOrderStatus(request, response) {
  const result = await orderService.changeOrderStatus(
    request.validatedParams.orderNumber,
    request.validatedBody.status,
  )
  response.json({ success: true, data: result })
}
