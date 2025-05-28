'use client';

import { Star } from 'lucide-react';

type Testimonial = {
  name: string;
  company: string;
  avatar?: string;
  rating: number;
  content: string;
};

export default function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const { name, company, avatar, rating, content } = testimonial;
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all h-full flex flex-col">
      <div className="flex items-center mb-4">
        <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 mr-4">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#1c2d51]/20 flex items-center justify-center">
              <span className="text-[#1c2d51] font-semibold">{name.charAt(0)}</span>
            </div>
          )}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{name}</h4>
          <p className="text-sm text-gray-600">{company}</p>
        </div>
      </div>
      
      <div className="flex mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${
              i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      
      <p className="text-gray-700 italic flex-grow">{content}</p>
    </div>
  );
}