const User = require("../models/userModel");
const { json } = require("body-parser");
const jwt = require("jsonwebtoken");
const Product = require("../models/productModel");
const Rating = require("../models/ratingModel");


//add rating

exports.addRating = async (req, res) => {
  try {
    const token = req.headers.authentication;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const key = process.env.JWT_SEC;
    const decoded = jwt.verify(token, key);
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }
    const product = await Product.findById({ _id: req.body.id });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }
    const rating = req.body.rating;
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be from 1 to 5",
      });
    }
    const foundRating = await Rating.findOne({ productId: req.body.id });
    if (!foundRating && req.body.rating) {
      const newRating = new Rating({
        productId: req.body.id,
        users: [
          {
            id: user.id,
            name: user.name,
            email: user.email,
            rating: rating,
          },
        ],
        avgRating: req.body.rating,
        total: 1
      })
      await newRating.save();
      return res.status(200).json({
        success: true,
        data: newRating,
      });
    } else {
      const checkUser = foundRating.users.findIndex(
        (u) => u.id.toString() === user.id.toString()
      );
      if (checkUser >= 0) {
        const updatedUsers = [...foundRating.users];
        updatedUsers[checkUser].rating = req.body.rating;
        const sumOfRatings = updatedUsers.reduce((acc, cur) => acc + cur.rating, 0);
        const totalRating = updatedUsers.length;
        await foundRating.updateOne({ users: updatedUsers, avgRating: Number((sumOfRatings / totalRating).toFixed(1)), total: totalRating });
      } else {
        const newRating = {
          id: user.id,
          name: user.name,
          email: user.email,
          rating: rating,
        };
        const updatedUsers = [...foundRating.users, newRating];
        const sumOfRatings = updatedUsers.reduce((acc, cur) => acc + cur.rating, 0);
        const totalRating = updatedUsers.length;
        await foundRating.updateOne({ users: updatedUsers, avgRating: Number((sumOfRatings / totalRating).toFixed(1)), total: totalRating });
      }
      return res.status(200).json({
        success: true,
        data: await Rating.findOne({ productId: product._id }),
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "something went wrong" });
  }
};


