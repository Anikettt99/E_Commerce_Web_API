const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const Category = require("../models/category");
const mongoose = require("mongoose");
const multer = require("multer");

const FILE_TYPE_MAP = {
  // mimetype format
  "image/png": "png",
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");
    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "Public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res, next) => {
  //localhost:3000/api/v1/products?categories=2342132,2345342
  let filter = {};
  if (req.query.categories) {
    filter = { category: req.query.categories.split(",") };
  }

  const productList = await Product.find(filter);

  // const productList = await Product.find().select('<field name>');  // to return specific fields of products

  if (!productList) {
    return res.status(500).json({ success: false });
  }

  res.send(productList);
});

router.get(`/:id`, async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate("category");

  if (!product) {
    return res.status(500).send("no product found");
  }

  res.send(product);
});

router.post(`/`, uploadOptions.single("image"), async (req, res, next) => {
  const category = await Category.findById(req.body.category);

  if (!category) {
    return res.status(404).send("the category not found");
  }
  const file = req.file;
  if (!file) {
    return res.status(400).send("No Image in the request");
  }
  const fileName = req.file.filename; //filename is a keyword
  const basePath = `${req.protocol}://${req.get("host")}/public/upload/`;
  let product = new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: `${basePath}${fileName}`, // e.g http://localhost:3000/public/upload/(fileName)
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInstock: req.body.countInstock,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
  });

  product = await product.save();

  if (!product) {
    return res.status(500).send("The prodyct cant create");
  }

  res.send(product);
});

router.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send("Invalid Product Id");
  }
  const category = await Category.findById(req.body.category);

  if (!category) {
    return res.status(404).send("the category not found");
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: req.body.image,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInstock: req.body.countInstock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    {
      new: true, // it is used so that in return we got updated data
    }
  );

  if (!product) {
    return res
      .status(404)
      .send("the category cannnot be createdproducts cant be updated");
  }
  res.send(product);
});

router.delete("/:id", (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send("Invalid Product Id");
  }
  Product.findByIdAndRemove(req.params.id)
    .then((product) => {
      if (product) {
        return res
          .status(200)
          .json({ success: true, message: "Deleted successfull" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

router.get("/get/count", async (req, res) => {
  const productCount = await Product.countDocuments((count) => count);

  if (!productCount) {
    return res.status(500).json({ sucess: false });
  }
  res.send({
    count: productCount,
  });
});

router.get("/get/count/featured", async (req, res) => {
  const productCount = await Product.countDocuments({ isFeatured: true });

  if (!productCount) {
    return res.status(500).json({ sucess: false });
  }
  res.send({
    count: productCount,
  });
});

router.put(
  '/gallery-images/:id',
  uploadOptions.array('images', 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).send("Invalid Product Id");
    }
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get("host")}/public/upload/`;

    if (files) {
      files.map((file) => {
       // console.log(file.filename);
        imagesPaths.push(`${basePath}${file.filename}`);
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        images: imagesPaths,
      },
      {
        new: true, // it is used so that in return we got updated data
      }
    );

    if (!product) {
      return res
        .status(404)
        .send("the category cannnot be createdproducts cant be updated");
    }
    res.send(product);
  }
);

module.exports = router;
