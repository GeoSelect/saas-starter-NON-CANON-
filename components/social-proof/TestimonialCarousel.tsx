"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

type Testimonial = {
  name: string;
  role: string;
  company: string;
  avatar?: string;
  quote: string;
  verified?: boolean;
};

// 🎯 POST-LAUNCH: Replace with real customer testimonials
// Consider using a CMS or database to manage these dynamically
const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Real Estate Developer",
    company: "Urban Properties",
    quote: "GeoSelect saved us weeks of research. The parcel data is incredibly accurate and the Street View integration is a game-changer.",
    verified: true,
  },
  {
    name: "Mike Rodriguez",
    role: "Land Acquisition Manager",
    company: "BuildRight LLC",
    quote: "Finally, a tool that makes zoning research actually enjoyable. The mobile interface is perfect for site visits.",
    verified: true,
  },
  {
    name: "Emily Thompson",
    role: "City Planner",
    company: "Metro Planning Dept",
    quote: "We use GeoSelect for preliminary site analysis. The jurisdiction data and source tracking give us confidence in our decisions.",
    verified: true,
  },
];

export function TestimonialCarousel() {
  const [current, setCurrent] = React.useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrent((p) => (p - 1 + testimonials.length) % testimonials.length);

  const testimonial = testimonials[current];

  return (
    <div className="w-full space-y-4">
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Quote */}
            <div className="flex items-start gap-3">
              <Quote className="h-6 w-6 sm:h-8 sm:w-8 text-primary/30 flex-shrink-0" />
              <p className="text-sm sm:text-base text-foreground leading-relaxed">
                "{testimonial.quote}"
              </p>
            </div>

            {/* Author - Mobile optimized */}
            <div className="flex items-center gap-3 pt-3 border-t">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                <AvatarFallback className="text-sm">
                  {testimonial.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold truncate">{testimonial.name}</p>
                  {testimonial.verified && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {testimonial.role}
                </p>
                <p className="text-xs text-muted-foreground truncate sm:hidden">
                  {testimonial.company}
                </p>
                <p className="hidden sm:block text-xs text-muted-foreground">
                  {testimonial.role} at {testimonial.company}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation - Mobile optimized */}
      <div className="flex items-center justify-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={prev}
          className="h-8 w-8 p-0 shrink-0"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex gap-1.5">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === current ? "w-6 bg-primary" : "w-2 bg-muted"
              }`}
              aria-label={`Go to testimonial ${idx + 1}`}
            />
          ))}
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={next}
          className="h-8 w-8 p-0 shrink-0"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
