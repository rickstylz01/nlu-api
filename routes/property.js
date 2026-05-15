const express = require('express');
const router = express.Router();
const { getPropertyByAddress } = require('../controllers/propertyController');

//enpoints coming soon
router.get('/:address', getPropertyByAddress);

module.exports = router;