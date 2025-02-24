# CareAnywhere 🏥

Link: https://careanywhere.onrender.com

Figma: https://www.figma.com/design/W2C6hZ2jeWZdqNEqqsVO9O/PROJECT_LAYOUT?m=auto&t=V73BpDgb0CpPMPIx-6

Project Demo: https://youtu.be/cQxyBxZzVvI

> A modern healthcare platform connecting patients with medical services, featuring real-time translation and transcription for inclusive healthcare communication.

## ✨ Key Features

- 🎥 **Virtual Consultations**

  - Real-time speech-to-text transcription
  - Multi-language support (120+ languages)
  - Automatic dialect detection
  - Medical vocabulary recognition

- 🏥 **Healthcare Services**

  - Nearby hospitals locator
  - Pharmacy finder
  - Online appointment booking
  - Digital prescriptions

- 📋 **Patient Management**
  - Secure medical records
  - Appointment history
  - Prescription tracking
  - Health monitoring

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Template Engine**: EJS
- **APIs**:
  - Google Maps
  - Google Cloud Speech-to-Text
  - Stripe Payment
- **Real-time**: WebRTC, Socket.io, PeerJS

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Google Cloud Platform account
- Stripe account

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/shauryabhat2003/CareAnywhere.git
cd CareAnywhere
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
# Create .env file
copy .env.example .env

# Add your credentials
PORT=3000
MONGODB_URI=your_mongodb_uri
GOOGLE_MAPS_API_KEY=your_google_maps_key
GOOGLE_CLOUD_SPEECH_KEY=your_speech_to_text_key
STRIPE_SECRET_KEY=your_stripe_key
```

4. **Start the application**

```bash
npm start
```

Visit `http://localhost:3000` in your browser.

## 📁 Project Structure

```
CareAnywhere/
├── Backend/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── models/        # Database models
│   ├── public/        # Static files
│   ├── routes/        # API routes
│   └── views/         # EJS templates
├── docs/              # Documentation
├── tests/             # Test suites
├── .env              # Environment variables
├── .gitignore
└── package.json
```

## 🌍 Supported Languages

The platform supports real-time transcription for:

- English (US, UK, AU, IN)
- Spanish (ES, MX, AR)
- Mandarin (CN, TW)
- Hindi
- Arabic
- And 115+ more languages

## 🔒 Security

- HIPAA compliant data handling
- End-to-end encryption
- Secure socket connections
- Rate limiting

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch

```bash
git checkout -b feature/AmazingFeature
```

3. Commit your changes

```bash
git commit -m 'Add some AmazingFeature'
```

4. Push to the branch

```bash
git push origin feature/AmazingFeature
```

5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📬 Contact

- Project Link: [https://github.com/shauryabhat2003/CareAnywhere](https://github.com/shauryabhat2003/CareAnywhere)

## 🙏 Acknowledgments

- Google Cloud Platform
- Bootstrap
- Font Awesome
- MongoDB
