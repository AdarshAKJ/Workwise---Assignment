import './global.css'
import { ToastContainer, toast } from 'react-toastify';
const { io } = require("socket.io-client");

export const socket = io("http://localhost:5000");

export const metadata = {
  title: 'Ticket Booking App',
  description: 'Login and signup system for ticket booking',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}
        <ToastContainer />
      </body>
    </html>
  );
}
