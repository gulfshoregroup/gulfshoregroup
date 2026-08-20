import React from 'react';

export default function GolfCourseCard({ course }: { course: any }) {
  if (!course) return null;

  return (
    <div className="bg-white border border-gray-200 shadow-sm overflow-hidden mb-6 w-full">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-2 text-center text-sm text-gray-500 tracking-wide">
        gulfshoregroup.com
      </div>
      <div className="p-6 md:p-8">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-serif">
          {course.name || "Golf Course"}
        </h3>
        
        {course.opened && (
          <div className="flex justify-between items-center py-4 border-b border-gray-200">
            <span className="text-gray-600 text-lg">Opened</span>
            <span className="text-gray-900 font-medium text-lg">{course.opened}</span>
          </div>
        )}
        
        {course.architect && (
          <div className="flex justify-between items-center py-4 border-b border-gray-200">
            <span className="text-gray-600 text-lg">Architect</span>
            <span className="text-gray-900 text-lg text-right">{course.architect}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 text-gray-600 gap-4">
          <div className="flex gap-6">
            <span className="text-lg">Par: <span className="text-gray-900">{course.par || "-"}</span></span>
            <span className="text-lg">Holes: <span className="text-gray-900">{course.holes || "-"}</span></span>
          </div>
          <div className="flex gap-4 flex-wrap">
            {course.yards && <span className="text-lg">Yards: <span className="text-gray-900 font-medium">{course.yards}</span></span>}
            {course.rating && <span className="text-lg">Rating: <span className="text-gray-900 font-medium">{course.rating}</span></span>}
            {course.slope && <span className="text-lg">Slope: <span className="text-gray-900 font-medium">{course.slope}</span></span>}
          </div>
        </div>
      </div>
    </div>
  );
}
