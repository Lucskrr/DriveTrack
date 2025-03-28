const Trip = require('../models/tripsModel');

// Função para criar uma nova viagem
const createTrip = async (req, res) => {
    const { userId, distance, earnings, startTime, endTime } = req.body;

    try {
        const newTrip = await Trip.create({
            userId,
            distance,
            earnings,
            startTime,
            endTime,
        });

        res.status(201).json(newTrip);
    } catch (error) {
        res.status(500).json({ message: 'Error creating trip', error });
    }
};

module.exports = {
    createTrip,
};
