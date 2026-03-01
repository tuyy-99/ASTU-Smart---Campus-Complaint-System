import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Map as MapIcon, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { PageHero } from '../components/ui/PageHero';
import { ComplaintMap, CAMPUS_LOCATIONS } from '../components/ComplaintMap';
import api from '../api/client';
import { mapComplaint } from '../api/mappers';
import { Complaint } from '../types';

const MapPage: React.FC = () => {
  const { isStudent, isStaff, isAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');

  const { data: complaints, isLoading } = useQuery({
    queryKey: ['complaints', 'map'],
    queryFn: async () => {
      const response = await api.get('/api/complaints');
      return (response.data.data || []).map(mapComplaint) as Complaint[];
    },
  });

  // Filter and prepare complaints for map
  const mapComplaints = React.useMemo(() => {
    if (!complaints) return [];
    
    return complaints
      .filter(c => {
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
        return matchesStatus && matchesCategory;
      })
      .map((c, index) => {
        // Assign random campus locations for demo (in production, use actual complaint locations)
        const buildings = Object.keys(CAMPUS_LOCATIONS);
        const randomBuilding = buildings[index % buildings.length];
        const coords = CAMPUS_LOCATIONS[randomBuilding as keyof typeof CAMPUS_LOCATIONS];
        
        return {
          id: c.id,
          title: c.title,
          category: c.category,
          status: c.status,
          coordinates: coords,
          buildingName: randomBuilding
        };
      });
  }, [complaints, statusFilter, categoryFilter]);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHero
          icon={MapIcon}
          title="Campus Complaint Map"
          subtitle="Visualize complaints across ASTU campus locations"
          iconWrapClassName="bg-blue-600"
        />
      </motion.div>

      <Card className="card-modern p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Filter className="text-slate-500 dark:text-slate-400" size={20} />
          
          <select
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending_review">Pending Review</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="academic">Academic</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="hostel">Hostel</option>
            <option value="library">Library</option>
            <option value="cafeteria">Cafeteria</option>
            <option value="transport">Transport</option>
            <option value="other">Other</option>
          </select>

          <div className="ml-auto flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span>Open</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span>Resolved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span>Campus Buildings</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="card-modern p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex h-[500px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <ComplaintMap mapKey="map-page-map" complaints={mapComplaints} height="600px" />
        )}
      </Card>

      <Card className="card-modern p-6">
        <h3 className="text-lg font-bold mb-4">Campus Locations</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.keys(CAMPUS_LOCATIONS).map((building) => (
            <div key={building} className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span>{building}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default MapPage;
