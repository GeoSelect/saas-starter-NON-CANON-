import React from 'react'

interface CardProps {
  title: string
  description?: string
  footer?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function Card({ title, description, footer, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      </div>
      
      {children && (
        <div className="px-6 py-4">
          {children}
        </div>
      )}
      
      {footer && (
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
          {footer}
        </div>
      )}
    </div>
  )
}
