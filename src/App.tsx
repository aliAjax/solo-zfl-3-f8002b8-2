import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '@/components/Layout/Navbar';
import CompareTray from '@/components/CompareTray/CompareTray';
import ListPage from '@/pages/ListPage/ListPage';
import MapPage from '@/pages/MapPage/MapPage';
import RankingPage from '@/pages/RankingPage/RankingPage';
import BenchDetail from '@/pages/BenchDetail/BenchDetail';
import AddEditPage from '@/pages/AddEditPage/AddEditPage';
import ComparePage from '@/pages/ComparePage/ComparePage';
import { useBenchStore } from '@/store/useBenchStore';

export default function App() {
  const compareCount = useBenchStore((state) => state.compareIds.length);

  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
        <main className={compareCount > 0 ? 'pb-28' : 'pb-12'}>
          <Routes>
            <Route path="/" element={<ListPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/bench/:id" element={<BenchDetail />} />
            <Route path="/add" element={<AddEditPage />} />
            <Route path="/edit/:id" element={<AddEditPage />} />
          </Routes>
        </main>
        <CompareTray />
      </div>
    </Router>
  );
}
