const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

// Rota para criar uma viagem
router.post('/create', tripController.createTrip);

module.exports = router;
