import express from "express";
import {
  createUser,
  getAllUsers,
  deleteUserByEmail,
  forgetPassword,
  signIn,
} from "../controller/users.js";

const router = express.Router();

// Create a new user
router.post("/signup", createUser);

// Sign in (POST standard, GET fallback)
router.post("/signin", signIn);
router.get("/signin", signIn);

// Get all users
router.get("/", getAllUsers);

// Delete a specific user by email
router.delete("/", deleteUserByEmail);

router.put("/forgetpassword", forgetPassword);

export default router;
