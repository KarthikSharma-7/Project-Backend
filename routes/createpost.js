const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const postModel = require("../database/post");
const userModel = require("../database/user");
const { loginRequest } = require("../middleware/loginMiddleware");

router.get("/allposts", loginRequest, (req, res) => {
  postModel
    .find()
    .populate("postedBy", "_id name")
    .then((posts) => {
      res.status(200).json({ posts });
    });
});

router.get("/myposts", loginRequest, (req, res) => {
  postModel
    .find({ postedBy: req.user._id })
    .then((posts) => {
      res.status(200).json({ posts });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.post("/createpost", loginRequest, (req, res) => {
  const { title, body, photo } = req.body;
  if (!title || !body || !photo) {
    return res.status(400).json({ Error: "All fields required" });
  }
  const newPost = new postModel({
    title,
    body,
    photo,
    postedBy: req.user,
  });
  newPost
    .save()
    .then((result) => {
      res.status(201).json({ Message: "Post created" });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.put("/likes/:postId", loginRequest, (req, res) => {
  postModel
    .findOne({ _id: req.params.postId, likes: req.user._id })
    .then((post) => {
      if (post != null) {
        postModel
          .updateOne(
            { _id: req.params.postId },
            { $pull: { likes: req.user._id } }
          )
          .then((updatedPost) => {
            res.status(201).json(updatedPost);
          });
      } else {
        postModel
          .updateOne(
            { _id: req.params.postId },
            { $push: { likes: req.user._id } }
          )
          .then((updatedPost) => {
            res.status(201).json(updatedPost);
          });
      }
    })
    .catch((err) => {
      res.status(400).json({ err });
    });
});

router.delete("/delete/:postId", loginRequest, (req, res) => {
  postModel
    .findOne({ _id: req.params.postId })
    .populate("postedBy", "_id")
    .exec((err, post) => {
      if (err || !post) {
        return res.status(422).json({ Error: "Post not found" });
      } else if (post.postedBy._id.toString() === req.user._id.toString()) {
        post
          .remove()
          .then((result) => {
            res.status(201).json(result);
          })
          .catch((err) => console.log(err));
      }
    });
});

router.put("/follow/:userId", loginRequest, (req, res) => {
  userModel
    .findOne({ _id: req.params.userId, followers: req.user._id })
    .then((user) => {
      console.log(user);
      if (user != null) {
        userModel
          .updateOne(
            { _id: req.params.userId },
            { $push: { followers: req.user._id } }
          )
          .then((updatedUser) => {
            const followers = user.followers.length;
            return res.status(201).json({ updatedUser, followers, flag: 1 });
          })
          .catch((e) => {
            return res.status(400).json(e);
          });
      } else {
        userModel
          .updateOne(
            { _id: req.params.userId },
            { $pull: { followers: req.user._id } }
          )
          .then((updatedUser) => {
            const followers = user.followers.length;
            return res.status(201).json({ updatedUser, followers, flag: 0 });
          })
          .catch((e) => {
            return res.status(400).json(e);
          });
      }
    })
    .catch((e) => {
      return res.status(400).json(e);
    })
    .catch((err) => {
      return res.status(401).json(err);
    });
});

module.exports = router;
