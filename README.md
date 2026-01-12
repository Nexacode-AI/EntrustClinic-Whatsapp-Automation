# MediBot-AI - WhatsApp Clinic Appointment Booking System

A comprehensive WhatsApp-based chatbot for clinic appointment booking with automated reminders, follow-ups, and emergency detection.

## 🌟 Features

- **Multi-Department Support**: Dental Care, Dermatology, General Consultation
- **Doctor Selection**: Choose from available specialists
- **Smart Scheduling**: Real-time availability checking via Google Calendar
- **Automated Reminders**: 24-hour appointment reminders
- **Post-Appointment Follow-ups**: Next-day wellness checks
- **Emergency Detection**: Keyword-based emergency escalation
- **Receipt Generation**: PDF appointment confirmations
- **Data Export**: Google Sheets integration for analytics
- **Chat Logging**: Complete conversation history
- **Session Management**: Stateful conversation tracking

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Twilio Account with WhatsApp API access
- Google Cloud Project with Calendar and Sheets API enabled
- Google Service Account credentials

## 🚀 Installation

### 1. Clone the Repository

```bash
cd /Users/thiru-07/Documents/MediBot-AI/MediBot-AI
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Create a PostgreSQL database:

```bash
createdb medibot_ai
```

Run migrations:

```bash
npm run migrate
```

### 4. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

#### Twilio Configuration
- Get your Account SID and Auth Token from [Twilio Console](https://console.twilio.com)
- Set up WhatsApp Sandbox or get approved WhatsApp Business number
- Configure webhook URL: `https://your-domain.com/api/webhook`

#### Database Configuration
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medibot_ai
DB_USER=your_username
DB_PASSWORD=your_password
```

#### Google Calendar Setup
1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Calendar API
3. Create a Service Account
4. Download JSON credentials
5. Extract `client_email` and `private_key` to `.env`
6. Create a Google Calendar and share it with the service account email
7. Copy Calendar ID to `.env`

#### Google Sheets Setup
1. Enable Google Sheets API in your Google Cloud Project
2. Create a new Google Spreadsheet
3. Share it with your service account email (with edit permissions)
4. Copy Spreadsheet ID from URL to `.env`

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000`

## 📡 Webhook Configuration

### Twilio Webhook Setup

1. Go to Twilio Console → WhatsApp → Sandbox Settings
2. Set "When a message comes in" to: `https://your-domain.com/api/webhook`
3. Method: `POST`

### Ngrok for Local Development

```bash
ngrok http 3000
```

Use the ngrok URL as your webhook URL in Twilio.

## 🗂️ Project Structure

```
MediBot-AI/
├── src/
│   ├── config/
│   │   └── config.js              # Configuration management
│   ├── controllers/
│   │   └── chatbot.controller.js  # Main chatbot logic
│   ├── database/
│   │   ├── db.js                  # Database connection
│   │   ├── schema.sql             # Database schema
│   │   └── migrate.js             # Migration script
│   ├── jobs/
│   │   └── cron.jobs.js           # Scheduled tasks
│   ├── routes/
│   │   └── webhook.routes.js      # API routes
│   ├── services/
│   │   ├── calendar.service.js    # Google Calendar integration
│   │   ├── database.service.js    # Database operations
│   │   ├── pdf.service.js         # PDF generation
│   │   ├── session.service.js     # Session management
│   │   ├── sheets.service.js      # Google Sheets integration
│   │   └── whatsapp.service.js    # WhatsApp messaging
│   ├── utils/
│   │   ├── helpers.js             # Utility functions
│   │   └── logger.js              # Logging configuration
│   └── server.js                  # Main application entry
├── planning/                       # Project planning documents
├── logs/                          # Application logs
├── temp/                          # Temporary files (PDFs)
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore rules
├── package.json                   # Dependencies
└── README.md                      # This file
```

## 💬 Conversation Flow

1. **Welcome**: User greets the bot
2. **Department Selection**: Choose medical department
3. **Doctor Selection**: Select preferred doctor
4. **Date Selection**: Pick appointment date
5. **Time Selection**: Choose from available slots
6. **Information Collection**:
   - Full Name
   - Contact Number
   - Email Address
   - National ID
   - Reason for visit
7. **Confirmation**: Receive booking confirmation with PDF receipt
8. **Automated Follow-ups**:
   - 24h reminder before appointment
   - Next-day wellness check

## 🚨 Emergency Detection

The bot automatically detects emergency keywords:
- pain, severe, bleeding, blood, fever
- swelling, urgent, emergency, serious, help

When detected, it immediately provides emergency contact information.

## 📊 Cron Jobs

### Appointment Reminders
- **Schedule**: Every hour
- **Function**: Send reminders 24 hours before appointments

### Follow-up Messages
- **Schedule**: Daily at 10:00 AM
- **Function**: Send wellness checks after appointments

### Session Cleanup
- **Schedule**: Daily at 2:00 AM
- **Function**: Remove expired sessions

## 🔧 API Endpoints

### Webhook
- `POST /api/webhook` - Receive WhatsApp messages
- `GET /api/webhook` - Webhook verification

### Health Checks
- `GET /api/health` - Service health status
- `GET /api/status` - Detailed service status
- `GET /` - Root endpoint

## 📝 Database Schema

### Tables
- `departments` - Medical departments
- `doctors` - Doctor information
- `patients` - Patient records
- `appointments` - Appointment bookings
- `conversation_sessions` - Chat sessions
- `chat_logs` - Message history
- `waitlist` - Appointment waitlist
- `emergency_contacts` - Emergency escalations

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit `.env` file
2. **API Keys**: Rotate keys regularly
3. **Database**: Use strong passwords
4. **HTTPS**: Always use HTTPS in production
5. **Input Validation**: All user inputs are validated
6. **SQL Injection**: Using parameterized queries
7. **Rate Limiting**: Consider adding rate limiting in production

## 🚀 Deployment

### Recommended Platforms
- **Railway.app** (Easiest)
- **Render**
- **AWS EC2**
- **Heroku**
- **DigitalOcean**

### Deployment Steps

1. Set up PostgreSQL database on your platform
2. Configure environment variables
3. Deploy the application
4. Run database migrations
5. Configure Twilio webhook with your production URL
6. Test the complete flow

### Environment Variables for Production

Ensure all these are set:
- `NODE_ENV=production`
- All Twilio credentials
- Database connection details
- Google API credentials
- Clinic configuration

## 📈 Monitoring & Logs

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

## 🧪 Testing

### Manual Testing

1. Send "Hi" to your WhatsApp bot number
2. Follow the conversation flow
3. Book a test appointment
4. Verify:
   - Database entry created
   - Google Calendar event created
   - Google Sheets updated
   - PDF receipt generated

### Test Emergency Detection

Send a message with emergency keywords like "severe pain" and verify the emergency response.

## 🛠️ Troubleshooting

### Common Issues

**Database Connection Failed**
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Ensure database exists

**Twilio Webhook Not Working**
- Verify webhook URL is publicly accessible
- Check Twilio webhook configuration
- Review server logs for errors

**Google Calendar API Errors**
- Verify service account credentials
- Check calendar is shared with service account
- Ensure Calendar API is enabled

**Messages Not Sending**
- Check Twilio account balance
- Verify WhatsApp number is approved
- Review Twilio logs in console

## 📞 Support

For issues or questions:
- Check logs in `logs/` directory
- Review error messages
- Verify all environment variables are set correctly

## 🎯 Future Enhancements

- [ ] LLM integration for natural language understanding
- [ ] Multi-language support
- [ ] Payment integration
- [ ] Video consultation scheduling
- [ ] Patient medical history tracking
- [ ] Prescription management
- [ ] Insurance verification
- [ ] Admin dashboard
- [ ] Mobile app
- [ ] SMS fallback

## 📄 License

ISC

## 👥 Contributors

Built with ❤️ for modern healthcare clinics

---

**Version**: 1.0.0  
**Last Updated**: January 2026
