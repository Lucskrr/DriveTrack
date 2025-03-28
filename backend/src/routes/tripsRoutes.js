const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripsController');

// Criar uma viagem
router.post('/create', tripController.createTrip);

module.exports = router;
