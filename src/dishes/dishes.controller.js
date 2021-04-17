const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// Middleware

function findDish(req, res, next) {
  const { dishId } = req.params;
  const dish = dishes.find(dish => dish.id === dishId);
  if (!dish) {
    return next({
      status: 404,
      message: `Dish does not exist: ${dishId}`
    });
  }

  res.locals.dish = dish;
  return next();
}

function validateData(req, res, next) {
  const dishData = req.body.data;

  if (!dishData.name) {
    return next({
      status: 400,
      message: `Dish must include a name`
    });
  }

  if (!dishData.description) {
    return next({
      status: 400,
      message: 'Dish must include a description'
    });
  }

  if (dishData.price === undefined) {
    return next({
      status: 400,
      message: 'Dish must include a price'
    });
  }

  if (!Number.isInteger(dishData.price) || dishData.price <= 0) {
    return next({
      status: 400,
      message: 'Dish must have a price that is an integer greater than 0'
    });
  }

  if (!dishData.image_url) {
    return next({
      status: 400,
      message: 'Dish must include a image_url'
    });
  }

  res.locals.dishData = dishData;
  return next();
}

function validateDishId(req, res, next) {
  const { dishId } = req.params;
  const { id } = res.locals.dishData;

  if (!id) {
    res.locals.dishData.id = dishId;
    return next();
  }

  if (id === dishId) {
    return next();
  }

  return next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
  });
}

// Routes

function list(req, res) {
  res.json({ data: dishes });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function create(req, res) {
  const newDish = {
    id: nextId(),
    ...res.locals.dishData
  };

  dishes.push(newDish);

  res.status(201).json({ data: newDish });
}

function update(req, res) {
  res.locals.dish = res.locals.dishData;

  res.json({ data: res.locals.dish });
}

module.exports = {
  list,
  read: [findDish, read],
  create: [validateData, create],
  update: [findDish, validateData, validateDishId, update]
}