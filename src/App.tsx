import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './layout/AppShell'
import DemoBanner from './components/DemoBanner'
import PaymentSimulation from './screens/PaymentSimulation'
import { About, Privacy, Terms } from './screens/Legal'
import RequireAuth from './layout/RequireAuth'
import LogIn from './screens/LogIn'
import ListingDetail from './screens/ListingDetail'
import MyListings from './screens/MyListings'
import SavedListings from './screens/SavedListings'
import Account from './screens/Account'
import Checkout from './screens/Checkout'
import Community from './screens/Community'
import Explore from './screens/Explore'
import Inbox from './screens/Inbox'
import Onboarding from './screens/Onboarding'
import Orders from './screens/Orders'
import Sell from './screens/Sell'
import SettingsScreen from './screens/SettingsScreen'
import SignUp from './screens/SignUp'
import Splash from './screens/Splash'
import TrackOrder from './screens/TrackOrder'

export default function App() {
  return (
    <>
      <DemoBanner />
        <Routes>
      {/* Pre-auth screens run outside the shell: no tab bar, no sidebar. */}
        <Route path="/" element={<Splash />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/about" element={<About />} />

        <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/explore" element={<Explore />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/account/listings" element={<MyListings />} />
          <Route path="/account/saved" element={<SavedListings />} />
          <Route path="/community" element={<Community />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/pay" element={<PaymentSimulation />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/track" element={<TrackOrder />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/inbox/:id" element={<Inbox />} />
          <Route path="/account" element={<Account />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Route>
        </Route>

        <Route path="*" element={<Navigate to="/explore" replace />} />
      </Routes>
    </>
  )
}
