const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    seatArray: { type: Array, require: true },
    vacantSeat: { type: Number, require: true, default: 80 },
});

module.exports = mongoose.model('Seats', seatSchema);
