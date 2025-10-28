# BoothNow - On-Demand Micro-Workspaces

BoothNow is a web-based platform for on-demand, soundproof micro-workspaces embedded within high-traffic convenience stores, starting with 7-Eleven in Stockholm.

## 🚀 Features

- **Real-time Booth Discovery** - Find available booths using Google Maps integration
- **QR Code Scanning** - Unlock booths with your phone's camera
- **Mobile-Responsive Design** - Optimized for mobile with Voi-inspired UI
- **Session Management** - Track your workspace sessions and bookings
- **Secure Authentication** - Powered by Clerk for seamless user experience

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework for web dashboard
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Google Maps API** - Location services and mapping

### Backend
- **Node.js + Express** - API server
- **TypeScript** - Type-safe development
- **Socket.io** - Real-time communication

### Services
- **Clerk** - Authentication and user management
- **Supabase** - Database and storage
- **Creem** - Payment processing and subscription management

## 📱 Web App Features

- **Full-Screen Map** - Voi-style interface with booth locations
- **QR Code Scanner** - Real-time camera integration for booth unlocking
- **Session Tracking** - Monitor your workspace usage
- **Booking Management** - Reserve and manage booth sessions

## 🗺 Map Integration

- **7-Eleven Locations** - Real-time discovery of partner locations
- **Custom Markers** - BoothNow-enabled locations with availability status
- **Place Details** - Opening hours, contact info, and directions
- **Distance Calculation** - Find the nearest available booth

## 🔐 Authentication

- **Email + Social Login** - Google, Apple, and email authentication
- **JWT Tokens** - Secure session management
- **Role-Based Access** - User, partner, and admin roles

## 💳 Payments

- **Per-Minute Billing** - Pay only for the time you use
- **Subscription Plans** - Monthly passes for regular users
- **Pre-authorization** - Secure payment processing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Maps API key
- Clerk account
- Supabase project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/boothnow.git
   cd boothnow
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Web Dashboard
   cd ../web
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Create environment files
   cp .env.example .env
   cp web/.env.example web/.env.local
   ```

4. **Start Development Servers**
   ```bash
   # Backend (Port 3001)
   cd backend
   npm run dev
   
   # Web Dashboard (Port 3000)
   cd web
   npm run dev
   ```

## 📁 Project Structure

```
BoothNow/
├── backend/           # Node.js API server
├── web/              # Next.js web dashboard
├── frontend/         # React Native mobile app
├── docs/            # Documentation
└── README.md
```

## 🔧 Configuration

### Google Maps API
1. Enable Maps JavaScript API
2. Enable Places API
3. Add your domain to API restrictions
4. Set up billing account

### Clerk Authentication
1. Create Clerk application
2. Configure social providers
3. Set up redirect URLs
4. Add environment variables

### Supabase Database
1. Create Supabase project
2. Set up database schema
3. Configure storage buckets
4. Add API keys

## 📊 Analytics

Analytics capabilities:
- User behavior tracking
- Session analytics
- Conversion funnels
- A/B testing capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact: support@boothnow.com
- Documentation: [docs.boothnow.com](https://docs.boothnow.com)

---

**BoothNow** - Where silence meets simplicity. 🎯