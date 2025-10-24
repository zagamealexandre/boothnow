# Enhanced Booth Locator - Live Booking Interface

## Overview

The Booth Locator has been transformed from a static map into a dynamic, real-time booking interface that shows live booth availability, status indicators, and adaptive booking actions.

## 🎯 Key Features

### 1. **Live Status Indicators**
- **🟢 Available**: Green markers for booths that can be booked immediately
- **🟡 Busy**: Yellow markers showing time remaining for occupied booths
- **🔴 Pre-booked**: Red markers for booths reserved for future slots
- **🔧 Maintenance**: Gray markers for booths under maintenance

### 2. **Dynamic Info Windows**
Each booth marker displays:
- Booth name and partner (e.g., "7-Eleven Sveavägen")
- Address and distance from user
- Live status with time remaining
- Adaptive action buttons based on availability

### 3. **Smart Booking Actions**
- **"Book this booth"** - For available booths
- **"Pre-book slot"** - For busy booths
- **"Join waitlist"** - For pre-booked booths
- **"Notify when ready"** - For maintenance booths

### 4. **Real-time Updates**
- Auto-refresh every 30 seconds
- Supabase realtime subscriptions for instant updates
- Animated status changes with visual feedback

### 5. **Filter System**
Toggle between booth statuses:
- **All** - Show all booths
- **Available** - Only available booths
- **Busy** - Only occupied booths
- **Pre-booked** - Only reserved booths

## 🏗️ Technical Implementation

### Database Schema Updates

```sql
-- Enhanced booths table with status tracking
ALTER TABLE booths ADD COLUMN status TEXT DEFAULT 'available' 
  CHECK (status IN ('available', 'busy', 'prebooked', 'maintenance'));
ALTER TABLE booths ADD COLUMN next_available_at TIMESTAMPTZ;
ALTER TABLE booths ADD COLUMN current_session_id UUID REFERENCES sessions(id);
```

### API Endpoints

#### GET `/api/booths`
- **Query Parameters**: `status`, `lat`, `lng`, `radius`
- **Response**: Array of booths with live status and timing data
- **Features**: Status filtering, distance calculation, time remaining

#### POST `/api/booths/:id/reserve`
- **Body**: `{ duration_minutes: number }`
- **Response**: Reservation confirmation
- **Updates**: Booth status to 'busy'

#### POST `/api/booths/:id/prebook`
- **Body**: `{ start_time: string, duration_minutes: number }`
- **Response**: Pre-booking confirmation
- **Updates**: Booth status to 'prebooked'

#### POST `/api/booths/:id/waitlist`
- **Body**: None
- **Response**: Waitlist confirmation
- **Updates**: Creates waitlist entry

### Frontend Components

#### MapSection.tsx
- **Real-time marker rendering** with status-based colors
- **Dynamic info windows** with adaptive content
- **Filter system** for booth status
- **Animation system** for status changes
- **Loading states** and error handling

#### boothService.ts
- **Supabase integration** for real-time data
- **WebSocket subscriptions** for live updates
- **Booking action handlers** for all booth interactions
- **Error handling** and fallback mechanisms

## 🎨 UI/UX Enhancements

### Visual Design
- **Color-coded markers**: Intuitive status representation
- **Status legend**: Clear explanation of marker colors
- **Loading animations**: Smooth user experience
- **Hover effects**: Interactive marker feedback

### User Experience
- **One-click booking**: Streamlined reservation process
- **Real-time feedback**: Instant status updates
- **Distance calculation**: User location awareness
- **Mobile responsive**: Works on all devices

## 🔄 Real-time Data Flow

1. **Initial Load**: Fetch booth data with current status
2. **Supabase Subscription**: Listen for database changes
3. **Status Updates**: Automatically update markers and info windows
4. **User Actions**: Handle bookings, pre-bookings, and waitlist
5. **Visual Feedback**: Animate status changes and confirmations

## 🚀 Deployment Notes

### Environment Variables
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Migration
Run the schema updates to add status tracking columns:
```sql
-- Add status columns to booths table
ALTER TABLE booths ADD COLUMN status TEXT DEFAULT 'available';
ALTER TABLE booths ADD COLUMN next_available_at TIMESTAMPTZ;
ALTER TABLE booths ADD COLUMN current_session_id UUID;
```

### Supabase Realtime
Enable realtime for the booths table:
```sql
-- Enable realtime for booths table
ALTER PUBLICATION supabase_realtime ADD TABLE booths;
```

## 📊 Analytics Integration

The system tracks user interactions:
- **booths_viewed**: When users view the map
- **booth_viewed**: When users click on specific booths
- **booth_reserved**: When users book booths
- **booth_prebooked**: When users pre-book booths
- **booth_waitlist_joined**: When users join waitlists

## 🔧 Customization Options

### Marker Colors
```typescript
const colors = {
  available: '#2ECC71', // Green
  busy: '#F1C40F',      // Yellow
  prebooked: '#E74C3C', // Red
  maintenance: '#95A5A6' // Gray
}
```

### Status Messages
```typescript
const statusMessages = {
  available: '🟢 Available now',
  busy: '🕓 Busy, free in X min',
  prebooked: '🔒 Pre-booked for later',
  maintenance: '🔧 Under maintenance'
}
```

### Animation Settings
- **Bounce duration**: 1000ms on hover
- **Status change flash**: 2000ms for availability changes
- **Auto-refresh interval**: 30 seconds

## 🎯 Future Enhancements

1. **Push Notifications**: Alert users when booths become available
2. **Advanced Filtering**: Filter by distance, partner, amenities
3. **Booking Calendar**: Visual timeline for pre-bookings
4. **User Preferences**: Save favorite locations and settings
5. **Integration**: Connect with payment systems and user accounts

## 🐛 Troubleshooting

### Common Issues
1. **Markers not showing**: Check Google Maps API key
2. **Real-time updates not working**: Verify Supabase connection
3. **Booking actions failing**: Check authentication and API endpoints
4. **Status not updating**: Ensure database triggers are working

### Debug Mode
Enable console logging for development:
```typescript
// In boothService.ts
console.log('Booth status changed:', payload)
console.log('Real-time update received:', updatedBooths)
```

This enhanced booth locator provides a seamless, real-time booking experience that adapts to user needs and provides instant feedback on booth availability.
