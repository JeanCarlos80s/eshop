const express = require('express');
const router = express.Router();

const {Order} = require('../models/order');
const {OrderItem} = require('../models/order-item');

router.get(`/`, async (req, res) => {
    const orderList = await Order.find().populate('user', 'name').sort('dateOrdered');
    // const orderList = await Order.find().populate('user', 'name').sort({'dateOrdered': -1});

    if (!orderList) {
        res.status(500).json({ success: false });
    }

    res.send(orderList);
});

router.get(`/:id`, async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name')
        .populate('orderItems');
        // .populate({ path: 'orderItems', populate: { path: 'product', populate: 'category' } });

    if (!order) {
        res.status(500).json({ success: false });
    }

    res.send(order);
});

router.post(`/`, async (req, res) => {
    const orderItemsIds = Promise.all(req.body.orderItems.map(async orderItem => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        });

        newOrderItem = await newOrderItem.save();

        return newOrderItem._id;
    }));

    const orderItemsIdsResolve = await orderItemsIds;

    const totalPrices = await Promise.all(orderItemsIdsResolve.map(async (orderItemsId) => {
        const orderItem = await OrderItem.findById(orderItemsId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice;
    }))

    const totalPrice = totalPrices.reduce((a ,b) => a + b, 0);

    let order = new Order({
        orderItems: orderItemsIdsResolve,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user
    });
    order = await order.save();

    if (!order)
        return res.status(404).send('The order cannot be created!');

    res.send(order);
});

router.put('/:id', async (req, res) => {
    const order = await  Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status,
        },
        { new: true }
    );
    if (!order)
        return res.status(404).send('The order cannot be updated!');

    res.send(order);
});

router.delete(`/:id`, async (req, res) => {
    Order.findByIdAndRemove(req.params.id).then(async order => {
        if (order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem);
            });
            return res.status(200).json({ success: true, message: 'The order is deleted!' });
        } else {
            return res.status(404).json({ success: false, message: 'Order not found!' })
        }
    }).catch(err => {
        return res.status(400).json({ success: false, erroor: err });
    });
});

router.get(`/get/totalsales`, async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } }
    ]);

    if (!totalSales) {
        return res.status(404).send('The order sales cannot be generated!')
    }

    // res.send({ totalsales: totalSales });
    res.send({ totalsales: totalSales.pop().totalsales });
});

router.get(`/get/count`, async (req, res) => {
    await Order.countDocuments().then(count => {
        if (count) {
            return res.status(200).json({ orderCount: count });
        } else {
            return res.status(500).json({ success: false });
        }
    }).catch(err => {
        return res.status(400).json({
            success: false,
            error: err
        })
    });
});

router.get(`/get/userorders/:userid`, async (req, res) => {
    const userOrderList = await Order.find({ user: req.params.userid })
        .populate({ path: 'orderItems', populate: { path: 'product', populate: 'category' } }).sort('dateOrdered');

    if (!userOrderList) {
        res.status(500).json({ success: false });
    }

    res.send(userOrderList);
});

module.exports = router;