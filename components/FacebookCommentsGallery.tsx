'use client';

import { Heart } from 'lucide-react';

interface Comment {
  id: string;
  name: string;
  avatar: string;
  text: string;
  likes: number;
  timeAgo: string;
}

const comments: Comment[] = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    text: "This tool saved us thousands in property assessment fees! Highly recommend to any real estate professional.",
    likes: 342,
    timeAgo: '2 days ago'
  },
  {
    id: '2',
    name: 'James Rodriguez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    text: "The accuracy is insane. We've been using this for 6 months and haven't had a single dispute.",
    likes: 287,
    timeAgo: '1 week ago'
  },
  {
    id: '3',
    name: 'Emily Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    text: "Finally a platform that understands the real estate market. Customer support is top-notch too!",
    likes: 421,
    timeAgo: '3 days ago'
  },
  {
    id: '4',
    name: 'Michael Torres',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    text: "Been in real estate for 20 years. This is the best innovation I've seen in our industry.",
    likes: 512,
    timeAgo: '5 days ago'
  },
  {
    id: '5',
    name: 'Jessica Wong',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
    text: "The reports are so detailed and easy to understand. My clients are impressed every time.",
    likes: 198,
    timeAgo: '1 week ago'
  },
  {
    id: '6',
    name: 'David Patterson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    text: "Worth every penny. Our sales cycle has cut in half since we started using their platform.",
    likes: 356,
    timeAgo: '4 days ago'
  }
];

export function FacebookCommentsGallery() {
  return (
    <div className="w-full">
      {/* Social Media Header */}
      <div className="mb-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300">Follow Us & Share</h3>
        <div className="flex items-center justify-between">
          {/* Facebook */}
          <a
            href="https://facebook.com/geoselect"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600 transition-colors cursor-pointer"
          >
            <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="text-xs text-gray-300">12.5K</span>
          </a>

          {/* Share Button */}
          <button className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600 transition-colors">
            <svg className="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C7.539 14.487 7 15.93 7 17.5c0 3.314 2.686 6 6 6 1.57 0 3.013-.539 4.158-1.684m0 0l2.828-2.829m-2.828 2.829l-2.828-2.829M7 17.5A6 6 0 1 0 19 11.5m-2.828 2.829l2.828 2.829" />
            </svg>
            <span className="text-xs text-gray-300">Share</span>
          </button>

          {/* Twitter/X */}
          <a
            href="https://twitter.com/geoselect"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600 transition-colors cursor-pointer"
          >
            <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7" />
            </svg>
            <span className="text-xs text-gray-300">8.2K</span>
          </a>

          {/* LinkedIn */}
          <a
            href="https://linkedin.com/company/geoselect"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600 transition-colors cursor-pointer"
          >
            <svg className="h-6 w-6 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.418-.103.249-.129.597-.129.946v5.441h-3.554s.05-8.836 0-9.755h3.554v1.381c.43-.664 1.195-1.61 2.905-1.61 2.121 0 3.71 1.388 3.71 4.369v5.615zM5.337 8.855c-1.144 0-1.915-.762-1.915-1.715 0-.956.77-1.715 1.958-1.715 1.187 0 1.927.759 1.927 1.715 0 .953-.74 1.715-1.97 1.715zm1.946 11.597H3.392V9.552h3.891v10.9zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
            </svg>
            <span className="text-xs text-gray-300">5.9K</span>
          </a>
        </div>
      </div>

      {/* Comments Section */}
      <h3 className="text-sm font-semibold text-gray-300 mb-4 px-0">What professionals are saying</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50 hover:border-orange-500/50 transition-colors"
          >
            {/* Header with Avatar and Name */}
            <div className="flex items-center gap-2 mb-2">
              <img
                src={comment.avatar}
                alt={comment.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {comment.name}
                </p>
                <p className="text-xs text-gray-400">{comment.timeAgo}</p>
              </div>
            </div>

            {/* Comment Text */}
            <p className="text-sm text-gray-200 mb-2 line-clamp-3">
              {comment.text}
            </p>

            {/* Like Count */}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Heart className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
              <span className="text-orange-500 font-medium">{comment.likes.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
