const express = require('express');
const router = express.Router();
const { getPropertyByAddress, postComment, getScofflawsWithViolations } = require('../controllers/propertyController');

//enpoints coming soon
router.get('/scofflaws/violations', getScofflawsWithViolations);
router.get('/:address', getPropertyByAddress);
router.post('/:address/comments', postComment);

module.exports = router;