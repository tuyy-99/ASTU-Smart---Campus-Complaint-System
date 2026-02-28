const Complaint = require('../models/Complaint');

class AnalyticsService {
  async getComplaintStats() {
    const totalComplaints = await Complaint.countDocuments();
    
    const complaintsByStatus = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const complaintsByCategory = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
    const resolutionRate = totalComplaints > 0 
      ? ((resolvedComplaints / totalComplaints) * 100).toFixed(2) 
      : 0;

    const avgResolutionTime = await Complaint.aggregate([
      {
        $match: { status: 'resolved', resolutionTime: { $exists: true } }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$resolutionTime' }
        }
      }
    ]);

    return {
      totalComplaints,
      complaintsByStatus: complaintsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      complaintsByCategory: complaintsByCategory.map(item => ({
        category: item._id,
        count: item.count
      })),
      resolutionRate: parseFloat(resolutionRate),
      averageResolutionTime: avgResolutionTime.length > 0 
        ? parseFloat(avgResolutionTime[0].avgTime.toFixed(2)) 
        : 0
    };
  }

  async getDepartmentStats(department) {
    const totalComplaints = await Complaint.countDocuments({ department });
    
    const complaintsByStatus = await Complaint.aggregate([
      { $match: { department } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      department,
      totalComplaints,
      complaintsByStatus: complaintsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  }
}

module.exports = new AnalyticsService();
