const Order = require("../models/order");
const OrderItem = require("../models/order-items");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  const orderList = await Order.find();

  if (!orderList) {
    res.status(500).json({ success: false });
  }

  res.send(orderList);
});

router.post("/", async (req, res) => {
  const orderItemsIds = Promise.all(
    req.body.orderItems.map(async (orderItem) => {
      // "Promise.all" is used coz it returning array of promises not a single promie....and await wait for one promise(shyd)
      let newOrderItem = new OrderItem({
        quantity: orderItem.quantity,
        product: orderItem.product,
      });

      newOrderItem = await newOrderItem.save();

      return newOrderItem._id;
    })
  );

  const orderItemsIdsResolved = await orderItemsIds; // we use this coz promise is resolved here after awaiting .. or directly put await in front of "Promise.all" in above line

  const totalPrices = await Promise.all(
    orderItemsIdsResolved.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate(
        "product",
        "price"
      );
      const totalPrice = orderItem.product.price * orderItem.quantity;
      return totalPrice;
    })
  );

  //console.log(totalPrices);

  const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

  let order = new Order({
    orderItems: orderItemsIdsResolved,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: totalPrice,
    user: req.body.user,
    dateOrdered: req.body.dateOrdered,
  });

  order = await order.save();

  if (!order) {
    return res.status(400).send("The order cannot be created");
  }

  res.send(order);
});

router.get("/", async (req, res) => {
  const orderList = await Order.find()
    .populate("user", "name")
    .sort({ dateOrdered: -1 }); // populate user id with with user data...which only consist name

  if (!orderList) {
    res.status(500).json({ success: false });
  }
  res.send(orderList);
});

router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    }); // used to populate the array of order item

  if (!order) {
    res.status(500).json({ success: false });
  }
  res.send(order);
});

router.put("/:id", async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    {
      new: true, // it is used so that in return we got updated data
    }
  );

  if (!order) {
    return res.status(404).send("the order cannnot be updated");
  }

  res.send(order);
});

router.delete("/:id", async (req, res) => {
  const order = await Order.findByIdAndRemove(req.params.id);

  if (order) {
    let orderItems = order.orderItems;

    orderItems.forEach(async (orderItem) => {
      await OrderItem.findByIdAndRemove(orderItem);
    });

    return res
      .status(200)
      .json({ success: true, message: "orders  Deleted successfull" });
  } else {
    return res.status(404).json({ success: false, message: "order not found" });
  }
});

router.get("/get/totalsales", async (req, res) => {
  const totalsales = await Order.find({ status: "Paid" });
  /* const totalSales = await Order.aggregate([
    {
      $group: {_id: null , totalsales: {$sum: '$totalPrice'}}
    }
  ])

  if(!totalSales)
  {
    return res.status(400).send('The order sales cannot be generated')
  }
   res.send({totalsales: totalSales.pop().totalsales});*/
  // res.send(totalsales);
  let total_Price = 0;
  totalsales.forEach((totalsale) => {
    total_Price = total_Price + totalsale.totalPrice;
  });

  res.send({ totalSalesPrice: total_Price });
});

//---------------------- API ENDPOINT TO RETRIEVE USER ORDER HISTORY-----------------------------------//
router.get("/get/userorders/:userid", async (req, res) => {
  const userorderList = await Order.find({ user: req.params.userid })
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    })
    .sort({ 'dateOrdered': -1 }); // populate user id with with user data...which only consist name

  if (!userorderList) {
    res.status(500).json({ success: false });
  }
  res.send(userorderList);
});

module.exports = router;
