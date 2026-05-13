const express = require('express');
const router = express.Router();

//enpoints coming soon
router.get('/test', (req, res) => {
  res.json({ message: 'Property route is working!' });
});

module.exports = router;