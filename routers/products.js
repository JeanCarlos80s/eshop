const {Product} = require('../models/product');
const {Category} = require('../models/category');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];

        let uploadErro = new Error('Invalid image type.');

        if (isValid) {
            uploadErro = null;
        }

        cb(uploadErro, 'public/uploads')
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];

        cb(null, `${fileName}-${Date.now()}.${extension}`);
    }
});

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) => {
    let filter = {};
    if (req.query.categories) {
        filter = {category: req.query.categories.split(',')};
    }
    const productList = await Product.find(filter).select('name price').populate('category');
    // const productList = await Product.find().select('name price -_id').populate('category'); // remove id
    // const productList = await Product.find(); // return all fields

    if (!productList) {
        res.status(500).json({ succes: false });
    }
    
    res.send(productList)
});

router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');

    if (!product) {
        res.status(500).json({ succes: false });
    }
    
    res.send(product)
});

router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid category!');

    const file = req.file;
    if (!file) return res.status(400).send('No image in the request!');

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    const product = new Product({
        name: req.body.name,
        descripetion: req.body.descripetion,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    });
    
    await product.save();

    if (!product)
        return res.status(500).send('The product cannot be created!')
    
    return res.send(product)
})

router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid product!');
    }
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid category!');
   
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send('Invalid Product!');

    const file = req.file;
    let imagePath;

    if (file) {
        const fileName = req.file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagePath = `${basePath}${fileName}`
    } else {
        imagePath = product.image;
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            descripetion: req.body.descripetion,
            richDescription: req.body.richDescription,
            image: imagePath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
        },
        { new: true }
    );
    if (!updatedProduct)
        return res.status(404).send('The product cannot be updated!');

    res.send(updatedProduct);
});

router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product id!');
    }

    const files = req.files;
    let imagesPath = [];
    
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    if (files) {
        files.map(file => {
            imagesPath.push(`${basePath}${file.fileName}`);
        })
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            images: imagesPath,
        },
        { new: true }
    );

    if (!product)
        return res.status(404).send('The product cannot be updated!');

    res.send(product);
    
});

router.delete(`/:id`, async (req, res) => {
    Product.findByIdAndRemove(req.params.id).then(product => {
        if (product) {
            return res.status(200).json({ success: true, message: 'The product is deleted!' });
        } else {
            return res.status(404).json({ success: false, message: 'Product not found!' })
        }
    }).catch(err => {
        return res.status(400).json({ success: false, erroor: err });
    });
});

router.get(`/get/count`, async (req, res) => {
    await Product.countDocuments().then(count => {
        if (count) {
            return res.status(200).json({ productCount: count });
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

router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    await Product.find({isFeatured: true}).limit(count).then(product => {
        if (product) {
            return res.status(200).json({ product: product });
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

module.exports = router;