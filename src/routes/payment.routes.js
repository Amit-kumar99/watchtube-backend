const { Router } = require("express");
const { authenticateJwt } = require("../middlewares/auth.middleware");
const { createOrder, confirmPayment } = require("../controllers/payment.controller");

const router = Router();

router.post("/createOrder", authenticateJwt, createOrder);

router.post("/confirmPayment", authenticateJwt, confirmPayment);

module.exports = router;
