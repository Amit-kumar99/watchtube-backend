const { Router } = require("express");
const { getHealthCheck } = require("../controllers/healthcheck.controller");

const router = Router();

router.get('/health', getHealthCheck);

module.exports = router;