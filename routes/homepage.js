const express = require('express');
const parkingMeterInformation = require('../controllers/parkingMeterInformation');
const router = express.Router();
router.get('/', parkingMeterInformation.getTable);
router.post('/information', parkingMeterInformation.setRange);
module.exports = router;
