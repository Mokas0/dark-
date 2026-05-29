import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { Landing } from './pages/Landing.jsx';
import { Hub } from './pages/Hub.jsx';
import { Kennel } from './pages/Kennel.jsx';
import { Breeding } from './pages/Breeding.jsx';
import { Inventory } from './pages/Inventory.jsx';
import { Market } from './pages/Market.jsx';
import { BlackMarket } from './pages/BlackMarket.jsx';
import { Bounties } from './pages/Bounties.jsx';
import { Arena } from './pages/Arena.jsx';
import { World } from './pages/World.jsx';
import { Profile } from './pages/Profile.jsx';
import { GrimkinDetail } from './pages/GrimkinDetail.jsx';
import { Syndicate } from './pages/Syndicate.jsx';
import { Shop } from './pages/Shop.jsx';
import { Loans } from './pages/Loans.jsx';
import { Raids } from './pages/Raids.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route path="/hub" element={<Hub />} />
        <Route path="/hub/kennel" element={<Kennel />} />
        <Route path="/hub/breeding" element={<Breeding />} />
        <Route path="/hub/inventory" element={<Inventory />} />
        <Route path="/hub/syndicate" element={<Syndicate />} />
        <Route path="/hub/shop" element={<Shop />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/raids" element={<Raids />} />
        <Route path="/market" element={<Market />} />
        <Route path="/market/listings" element={<Market />} />
        <Route path="/black-market" element={<BlackMarket />} />
        <Route path="/black-market/floor" element={<BlackMarket />} />
        <Route path="/bounties" element={<Bounties />} />
        <Route path="/arena" element={<Arena />} />
        <Route path="/world" element={<World />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/grimkin/:id" element={<GrimkinDetail />} />
        <Route path="*" element={<Navigate to="/hub" replace />} />
      </Route>
    </Routes>
  );
}
