import { useState } from 'react';
import { Search, Plus, MoreVertical, Users, Clock, DollarSign } from 'lucide-react';

const coursesData = [
  {
    id: 1,
    title: 'Makeup Artistry',
    description: 'Professional makeup techniques and application',
    duration: '12 weeks',
    students: 38,
    price: 'RM 3,800',
    status: 'Active',
    instructor: 'Farah Aziz',
  },
  {
    id: 2,
    title: 'Bridal Makeup Specialist',
    description: 'Wedding makeup and styling',
    duration: '8 weeks',
    students: 24,
    price: 'RM 2,850',
    status: 'Active',
    instructor: 'Aminah Tan',
  },
  {
    id: 3,
    title: 'Hair Styling & Coloring',
    description: 'Hair treatment and styling techniques',
    duration: '10 weeks',
    students: 19,
    price: 'RM 3,300',
    status: 'Active',
    instructor: 'Priya Kumar',
  },
  {
    id: 4,
    title: 'Skincare & Facial Treatment',
    description: 'Facial care and skin treatment',
    duration: '6 weeks',
    students: 31,
    price: 'RM 2,400',
    status: 'Active',
    instructor: 'Diana Wong',
  },
  {
    id: 5,
    title: 'Professional Nail Art',
    description: 'Nail design and application',
    duration: '8 weeks',
    students: 15,
    price: 'RM 2,250',
    status: 'Active',
    instructor: 'Shalini Nair',
  },
  {
    id: 6,
    title: 'Lash Extension',
    description: 'Eyelash extension techniques',
    duration: '4 weeks',
    students: 12,
    price: 'RM 1,950',
    status: 'Upcoming',
    instructor: 'Lisa Chong',
  },
];

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = coursesData.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 style={{ color: '#284342' }}>Course Management</h1>
          <p style={{ color: '#6b6b6b' }}>Manage courses and curriculum</p>
        </div>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all hover:opacity-90"
          style={{ background: '#284342', color: '#e9da95' }}
        >
          <Plus className="w-5 h-5" />
          Create New Course
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Total Courses</p>
          <h2 style={{ color: '#284342' }}>12</h2>
        </div>
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Active Courses</p>
          <h2 style={{ color: '#284342' }}>11</h2>
        </div>
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Total Enrollments</p>
          <h2 style={{ color: '#284342' }}>127</h2>
        </div>
        <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
          <p className="text-sm mb-2" style={{ color: '#6b6b6b' }}>Avg. Course Rating</p>
          <h2 style={{ color: '#284342' }}>4.7</h2>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6b6b6b' }} />
          <input
            type="text"
            placeholder="Search courses"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1"
            style={{ borderColor: 'rgba(40, 67, 66, 0.2)' }}
          />
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl border overflow-hidden hover:border-opacity-30 transition-all" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
            <div className="h-32 flex items-center justify-center" style={{ background: '#f8f8f6' }}>
              <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ background: '#284342' }}>
                <span className="text-xl" style={{ color: '#e9da95' }}>
                  {course.title.charAt(0)}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 style={{ color: '#284342' }}>{course.title}</h3>
                  <p className="text-sm mt-1" style={{ color: '#6b6b6b' }}>{course.description}</p>
                </div>
                <button className="p-2 rounded-lg hover:bg-opacity-10" style={{ color: '#284342' }}>
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm" style={{ color: '#6b6b6b' }}>
                <span>Instructor: {course.instructor}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: '#6b6b6b' }} />
                  <span className="text-sm" style={{ color: '#6b6b6b' }}>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: '#6b6b6b' }} />
                  <span className="text-sm" style={{ color: '#6b6b6b' }}>{course.students} students</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgba(40, 67, 66, 0.1)' }}>
                <span className="text-lg" style={{ color: '#284342' }}>{course.price}</span>
                <span
                  className="px-3 py-1 rounded-md text-sm"
                  style={{
                    background: course.status === 'Active' ? 'rgba(40, 67, 66, 0.1)' : 'rgba(233, 218, 149, 0.3)',
                    color: '#284342',
                  }}
                >
                  {course.status}
                </span>
              </div>

              <button
                className="w-full py-2.5 rounded-xl transition-all hover:opacity-90"
                style={{ background: '#284342', color: '#e9da95' }}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
