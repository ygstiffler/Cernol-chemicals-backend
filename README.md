# Cernol Chemicals Backend

A Node.js/Express backend for the Cernol Chemicals website that handles contact form submissions with MongoDB storage and email notifications.

## Features

- ✅ Contact form data storage in MongoDB
- ✅ Email notifications to admin
- ✅ Confirmation emails to users
- ✅ Form validation and error handling
- ✅ Admin endpoints for contact management
- ✅ Health check endpoint

## Setup Instructions

### Prerequisites

1. **Node.js** (v14 or higher)
2. **MongoDB** (local installation or MongoDB Atlas)
3. **Gmail account** for email notifications (or configure other SMTP)

### Installation

1. **Install dependencies:**
   ```bash
   cd back_end
   npm install
   ```

2. **Configure environment variables:**
   Edit the `.env` file in the `back_end` directory:

   ```env
   # Server Configuration
   PORT=5000

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/cernol
   # For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/cernol

   # Email Configuration (Gmail example)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # Admin Email (where notifications should be sent)
   ADMIN_EMAIL=admin@cernolchemicals.co.zw
   ```

3. **Set up Gmail (if using Gmail):**
   - Enable 2-factor authentication on your Gmail account
   - Generate an "App Password" for this application
   - Use the app password in the `EMAIL_PASS` field

4. **Start MongoDB:**
   - For local MongoDB: `mongod`
   - For MongoDB Atlas: The connection string should be in your `.env`

5. **Start the server:**
   ```bash
   cd back_end
   npm start
   ```

   The server should start on `http://localhost:5000`

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact` | Submit contact form |
| GET | `/api/contacts` | Get all contacts (admin) |
| PATCH | `/api/contacts/:id` | Update contact status (admin) |
| GET | `/api/health` | Health check |
| GET | `/` | API info |

### Testing the Setup

1. **Start the backend server:**
   ```bash
   cd back_end
   npm start
   ```

2. **Open the frontend:**
   Open `front_end/contact.html` in your browser

3. **Submit the contact form:**
   - Fill out the form with test data
   - Check that the submission works
   - Verify emails are sent (check both sender and admin email)

4. **Check MongoDB:**
   - Connect to your MongoDB instance
   - Verify contact data is stored in the `contacts` collection

### Troubleshooting

**Email not sending:**
- Verify Gmail app password is correct
- Check that "Less secure app access" is enabled or use app password
- Check spam folder

**MongoDB connection issues:**
- Ensure MongoDB is running locally or connection string is correct for Atlas
- Check network connectivity

**Form submission fails:**
- Verify backend server is running on port 5000
- Check browser console for error messages
- Ensure CORS is properly configured

### File Structure

```
back_end/
├── models/
│   └── Contact.js          # Contact schema
├── services/
│   └── emailService.js     # Email functionality
├── server.js               # Main server file
├── package.json            # Dependencies
├── .env                    # Environment variables
└── README.md              # This file
```

### Next Steps

- Add authentication for admin endpoints
- Implement contact status management UI
- Add file upload for contact attachments
- Set up production deployment
- Add rate limiting for form submissions

## Support

For issues or questions, please check the troubleshooting section above or contact the development team.
