import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Complaint } from '../types';
import { mapComplaint } from '../api/mappers';

export const useComplaints = (filter?: string) => {
  return useQuery({
    queryKey: ['complaints', filter],
    queryFn: async () => {
      const response = await api.get('/api/complaints');
      return (response.data.data || []).map(mapComplaint) as Complaint[];
    },
  });
};
