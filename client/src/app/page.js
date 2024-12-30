"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useDebounce } from 'use-debounce';
import { toast } from 'react-toastify';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [seats, setSeats] = useState([]); // 2D array for seats
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [error, setError] = useState(null);
  const [bookingCount, setBookingCount] = useState('');
  const [vacantSeat, setVacantSeat] = useState(0);
  const [reservedSeatNumbers, setReservedSeatNumbers] = useState([]); // To display calculated seat numbers
  const [message, setMessage] = useState(''); // To store messages from the backend
  const [debounceBookingCount] = useDebounce(bookingCount, 400);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setIsLoggedIn(true);

    fetchSeatData();
  }, [router]);

  const fetchSeatData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/seat/dashboard",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSeats(response.data.array || []);
      setVacantSeat(response.data.vacantSeat || 0);
      setMessage(''); // Clear message when fetching new data
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (debounceBookingCount !== null && debounceBookingCount !== "") {
      handleSelectSeats();
    }
  }, [debounceBookingCount]);

  const handleSelectSeats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/seat/select",
        { numberOfSeat: debounceBookingCount, array: seats, vacantSeat },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const reservedSeats = response.data.reservedSeats || [];
      const calculatedSeatNumbers = reservedSeats.map(([row, col]) => row * 7 + col + 1);

      setReservedSeatNumbers(calculatedSeatNumbers);
      setSelectedSeats(reservedSeats);
      setMessage(response.data.message || '');
      fetchSeatData(); // Refresh seat data instantly
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    }
  };

  const handleBooking = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/seat/book",
        { seatArray: selectedSeats },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Booking Successful!');
      setSelectedSeats([]);
      setReservedSeatNumbers([]);
      setBookingCount('');
      fetchSeatData(); // Refresh seat data instantly
      setMessage(''); // Clear message after successful booking
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    }
  };

  const resetBooking = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/seat/reset-booking",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedSeats([]);
      setReservedSeatNumbers([]);
      setSeats(response.data.updatedSeats || []);
      setVacantSeat(response.data.vacantSeat || 0);
      setBookingCount('');
      setMessage(''); // Clear message after reset
      toast.success('Booking reset successfully.');
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    }
  };

  const bookedCount = seats.flat().filter((seat) => seat === 1).length || 0;
  const availableCount = seats.flat().filter((seat) => seat === 0).length || 0;

  if (!isLoggedIn) {
    return null; // Redirecting to login
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Ticket Booking</h1>

      {/* Render Seats Grid */}
      <div className="seats grid grid-cols-7 gap-2 mb-4">
        {seats.map((row, rowIndex) =>
          row.map((seat, colIndex) => {
            const seatId = `${rowIndex}-${colIndex}`;
            const isSelected = selectedSeats.some(([r, c]) => r === rowIndex && c === colIndex);
            return (
              <div
                key={seatId}
                className={`w-12 h-12 cursor-pointer block ${seat === 1
                  ? "bg-yellow-500" // Booked seats
                  : isSelected
                    ? "bg-blue-500" // Selected seats
                    : "bg-green-500" // Available seats
                  } border border-gray-300 flex items-center justify-center text-white font-bold`}
              >
                {(rowIndex * 7) + colIndex + 1}
              </div>
            );
          })
        )}
      </div>

      {/* Booking Controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="bookingCount" className="font-semibold">
            Book Seats:
          </label>
          <input
            id="bookingCount"
            type="number"
            min="1"
            max={vacantSeat}
            value={bookingCount}
            onChange={(e) => setBookingCount(e.target.value)}
            className="p-2 border rounded w-16 text-center"
          />
        </div>
        <button
          onClick={handleBooking}
          disabled={!selectedSeats.length}
          className="px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600"
        >
          Book
        </button>
        <button
          onClick={resetBooking}
          className="px-4 py-2 bg-gray-500 text-white font-bold rounded hover:bg-gray-600"
        >
          Reset Booking
        </button>
      </div>

      {/* Reserved Seat Numbers */}
      {reservedSeatNumbers.length > 0 && (
        <div className="mb-4 text-center">
          <h2 className="font-semibold">Selected Seats:</h2>
          <p className="text-blue-500">{reservedSeatNumbers.join(", ")}</p>
          {message && <p className="text-red-500 mt-4 text-center">{message}</p>}
        </div>
      )}

      {/* Stats */}
      <div className="flex justify-between">
        <p className="font-bold">
          <span className="text-yellow-500">Booked Seats = {bookedCount}</span>
        </p>
        <p className="font-bold">
          <span className="text-green-500">Available Seats = {availableCount}</span>
        </p>
      </div>

      {/* Logout Button */}
      <button
        onClick={() => {
          localStorage.removeItem("token");
          setIsLoggedIn(false);
          router.push("/login");
        }}
        className="mt-4 px-4 py-2 bg-red-500 text-white font-bold rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}
