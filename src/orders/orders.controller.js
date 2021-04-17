const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// Middleware

function findOrder(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find(order => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }

  next({
    status: 404,
    message: `Order does not exist: ${orderId}`
  });
}

function validateBody(req, res, next) {
  const body = req.body.data;

  if (!body.deliverTo) {
    return next({
      status: 400,
      message: "Order must include a deliverTo"
    });
  }

  if (!body.mobileNumber) {
    return next({
      status: 400,
      message: "Order must include a mobileNumber"
    });
  }

  if (body.dishes === undefined) {
    return next({
      status: 400,
      message: "Order must include a dish"
    });
  }

  if (!Array.isArray(body.dishes) || body.dishes.length <= 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish"
    });
  }

  for (let i = 0; i < body.dishes.length; i++) {
    const dish = body.dishes[i];

    if (!dish.quantity || !Number.isInteger(dish.quantity) || dish.quantity < 1) {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`
      });
    }
  }

  res.locals.body = body;
  return next();
}

function validateId(req, res, next) {
  const { orderId } = req.params;
  const { id } = res.locals.body;

  if (!id) {
    res.locals.body.id = orderId;
    return next();
  }

  if (orderId === id) {
    return next();
  }

  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`
  });
}

function validateStatus(req, res, next) {
  const { status } = res.locals.body;
  const order = res.locals.order;
  const validStatus = ["pending", "preparing", "out-for-deliver", "delivered"];

  if (order.status === "delivered") {
    return next({
      status: 400,
      message: "A delived order cannot be changed"
    });
  }

  if (!status || !validStatus.includes(status)) {
    return next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
    });
  }

  next();
}

function validatePending(req, res, next) {
  const { status } = res.locals.order;

  if (status === "pending") {
    return next();
  }

  next({
    status: 400,
    message: "An order cannot be deleted unless it is pending"
  });
}

// Routes

function list(req, res) {
  res.json({ data: orders });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function create(req, res) {
  const newOrder = {
    id: nextId(),
    ...res.locals.body
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res) {
  res.locals.order = res.locals.body;

  res.json({ data: res.locals.order });
}

function destroy(req, res) {
  const { orderId } = req.params;
  foundIndex = orders.findIndex(order => order.id === orderId);

  orders.splice(foundIndex, 1);

  res.sendStatus(204);
}

module.exports = {
  list,
  read: [findOrder, read],
  create: [validateBody, create],
  update: [findOrder, validateBody, validateId, validateStatus, update],
  delete: [findOrder, validatePending, destroy]
}