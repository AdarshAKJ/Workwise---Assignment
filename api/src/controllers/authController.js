const User = require('../models/userModel');
const Seats = require('../models/seatModel');
const jwt = require('jsonwebtoken');
const seatModel = require('../models/seatModel');

// Register
exports.register = async (req, res) => {
    try {
        const { name, email, password, number } = req.body;
        // console.log(req.body);
        // validations 
        if (!name) {
            return res.status(400).json({ message: "Name is requried" });
        }
        if (!email)
            return res.status(400).json({ message: "Email is requried" });

        if (!password)
            return res.status(400).json({ message: "Password is requried" });

        if (!number)
            return res.status(400).json({ message: "Number is requried" });

        // checking the user is already exists or not 
        const isAvailable = await User.findOne({ email: email });
        if (isAvailable) {
            return res.status(400).json({ message: "User already exists" });
        }

        // create user 
        const user = await User.create({ name, email, password, number });

        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email)
            return res.status(400).json({ message: "Email is requried" });

        if (!password)
            return res.status(400).json({ message: "Password is requried" });

        const user = await User.findOne({ email });
        if (!user || (user && !(await user.matchPassword(password)))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.seatSelectHandler = async (req, res) => {
    try {
        const { numberOfSeat, array, vacantSeat } = req.body;

        let bookSeat = Math.min(7, vacantSeat, numberOfSeat);

        console.log(bookSeat);
        // Call reserveSeats function
        const reservedSeats = reserveSeats(array, bookSeat);

        if (numberOfSeat > vacantSeat && vacantSeat <= 7) {
            return res.status(200).json({ reservedSeats, message: `${vacantSeat} seat(s) are vacant.` });
        }

        if (numberOfSeat > 7) {
            return res.status(200).json({ reservedSeats, message: "You can only select less than 7 seats at a time." });
        }

        // Return the reserved seats
        res.status(200).json({ reservedSeats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.seatBookHandler = async (req, res) => {
    try {
        const { seatArray } = req.body;
        const seats = await Seats.findOne();
        const updatedSeatArray = JSON.parse(JSON.stringify(seats.seatArray));

        // Update seats logic...
        for (const [row, col] of seatArray) {
            if (updatedSeatArray[row][col] !== 0) {
                throw new Error(`Seat at row ${row}, col ${col} is already occupied`);
            }
            updatedSeatArray[row][col] = 1;
        }

        seats.seatArray = updatedSeatArray;
        seats.vacantSeat -= seatArray.length;
        await seats.save();

        const user = await User.findById(req.user._id);
        user.seatsOccupied = [...(user.seatsOccupied || []), ...seatArray];
        await user.save();

        // await session.commitTransaction();

        res.status(200).json({ message: 'Seats successfully booked', updatedSeats: seats.seatArray });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.seatDashboardHandler = async (req, res) => {
    try {
        const data = await seatModel.find();
        res.status(200).json({ array: data[0].seatArray, vacantSeat: data[0].vacantSeat, message: 'Seats successfully booked' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.resetBookingHandler = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const seatData = await Seats.findOne();
        if (!seatData) {
            return res.status(404).json({ message: "Seat data not found" });
        }

        const { seatsOccupied } = user;
        if (!seatsOccupied || seatsOccupied.length === 0) {
            return res.status(400).json({ message: "No seats to reset for this user" });
        }

        const updatedSeatArray = JSON.parse(JSON.stringify(seatData.seatArray));

        // Reset the occupied seats
        for (const [row, col] of seatsOccupied) {
            if (updatedSeatArray[row] && updatedSeatArray[row][col] !== undefined) {
                updatedSeatArray[row][col] = 0; // Reset the seat to vacant
            } else {
                console.log(`Invalid seat index: row=${row}, col=${col}`);
            }
        }

        // Update vacant seats count
        seatData.seatArray = updatedSeatArray;
        seatData.vacantSeat += seatsOccupied.length;
        await seatData.save();

        // Clear the user's occupied seats array
        user.seatsOccupied = [];
        await user.save();

        res.status(200).json({
            message: "Seats successfully reset",
            updatedSeats: seatData.seatArray,
            vacantSeat: seatData.vacantSeat
        });
    } catch (error) {
        console.error("Error resetting booking:", error);
        res.status(500).json({ error: error.message });
    }
};


function reserveSeats(seatingArrangement, seatsToReserve) {
    const rows = seatingArrangement.length;
    const cols = seatingArrangement[0].length;

    // Helper function to find all possible seat groups of size `seatsToReserve`
    function findAllPossibleSeats(seatsNeeded) {
        const possibleSeats = [];

        for (let row = 0; row < rows; row++) {
            let count = 0;
            let startIndex = -1;
            for (let col = 0; col < seatingArrangement[row].length; col++) {
                if (seatingArrangement[row][col] === 0) {
                    count++;
                    if (startIndex === -1) startIndex = col;
                    if (count === seatsNeeded) {
                        possibleSeats.push({
                            seats: Array.from({ length: seatsNeeded }, (_, i) => [row, startIndex + i]),
                            rowDiff: 0,
                            colDiff: Math.abs(startIndex - (startIndex + seatsNeeded - 1)),
                        });
                        count = 0;
                        startIndex = -1;
                    }
                } else {
                    count = 0;
                    startIndex = -1;
                }
            }
        }

        // Check for nearby seat groups across rows
        const nearbySeats = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (seatingArrangement[row][col] === 0) {
                    const tempSeats = [];
                    let filled = 0;
                    for (let r = row; r < rows && filled < seatsNeeded; r++) {
                        for (let c = 0; c < cols && filled < seatsNeeded; c++) {
                            if (seatingArrangement[r][c] === 0) {
                                tempSeats.push([r, c]);
                                filled++;
                            }
                        }
                    }
                    if (filled === seatsNeeded) {
                        const rowDiff = Math.max(...tempSeats.map(([r]) => r)) - Math.min(...tempSeats.map(([r]) => r));
                        const colDiff = Math.max(...tempSeats.map(([, c]) => c)) - Math.min(...tempSeats.map(([, c]) => c));
                        nearbySeats.push({ seats: tempSeats, rowDiff, colDiff });
                    }
                }
            }
        }

        return possibleSeats.concat(nearbySeats);
    }

    // Get all possible seat groups
    const allPossibleSeats = findAllPossibleSeats(seatsToReserve);

    // Sort by row difference first, then column difference
    allPossibleSeats.sort((a, b) => {
        if (a.rowDiff === b.rowDiff) {
            return a.colDiff - b.colDiff;
        }
        return a.rowDiff - b.rowDiff;
    });

    // Pick the best option
    if (allPossibleSeats.length > 0) {
        const bestSeats = allPossibleSeats[0].seats;

        // Mark the seats as reserved
        for (const [r, c] of bestSeats) {
            seatingArrangement[r][c] = 1;
        }

        return bestSeats;
    }

    // If no seats are available
    return [];
}

