"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TestimonialCarousel } from "@/components/social-proof/TestimonialCarousel";
import { TrustBadges } from "@/components/social-proof/TrustBadges";
import { SocialMediaProof } from "@/components/social-proof/SocialMediaProof";
import { CheckCircle, Award, Shield, TrendingUp, Users, Star } from "lucide-react";

export default function SocialProofPage() {
  return (
    <section className="flex-1">
      <div className="bg-gradient-to-br from-orange-50 to-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <Badge className="mb-2">Trusted by Professionals</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Join Thousands of Happy Users
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real estate developers, planners, and land acquisition teams rely on GeoSelect 
            to make faster, more confident decisions. 
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        <div>
          <TrustBadges />
        </div>

        <Separator />

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Customer Stories</h2>
            <p className="text-gray-600">Hear from professionals who transformed their workflow</p>
          </div>
          <TestimonialCarousel />
        </div>

        <Separator />

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Success Stories</h2>
            <p className="text-gray-600">Real results from real customers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-orange-500 mb-2" />
                <CardTitle className="text-lg">30% Faster Research</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Urban Properties reduced their average parcel research time from 4 hours to 2.8 hours 
                  per property using GeoSelect's integrated data sources.
                </p>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-semibold">Urban Properties</p>
                  <p className="text-xs text-muted-foreground">Commercial Development</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-orange-500 mb-2" />
                <CardTitle className="text-lg">Whole Team Onboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  BuildRight LLC got their entire 12-person acquisition team up and running in under 
                  a week, with mobile access for field research.
                </p>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-semibold">BuildRight LLC</p>
                  <p className="text-xs text-muted-foreground">Land Acquisition</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Award className="h-8 w-8 text-orange-500 mb-2" />
                <CardTitle className="text-lg">99.9% Data Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Metro Planning Department verified GeoSelect's jurisdiction and zoning data against 
                  official records with a 99.9% accuracy rate. 
                </p>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-semibold">Metro Planning</p>
                  <p className="text-xs text-muted-foreground">City Government</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        <div className="space-y-6">
          <SocialMediaProof />
        </div>

        <Separator />

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Why Professionals Trust Us</h2>
            <p className="text-gray-600">Built with security, accuracy, and reliability in mind</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <Shield className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="font-semibold text-sm md:text-base">Enterprise Security</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                SOC 2 compliant with end-to-end encryption
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <CheckCircle className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="font-semibold text-sm md:text-base">Verified Sources</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Data from official government records
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <Star className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="font-semibold text-sm md: text-base">4.9/5 Rating</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Based on 500+ verified reviews
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <Users className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="font-semibold text-sm md: text-base">10K+ Users</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Trusted by industry professionals
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Ready to Join Them?</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Start exploring with our free tier or create an account to unlock the full power of GeoSelect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/sign-up"
              className="inline-flex h-11 items-center justify-center rounded-full bg-orange-500 px-8 text-sm font-medium text-white hover:bg-orange-600"
            >
              Get Started Free
            </a>
            <a
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-full border border-gray-300 bg-white px-8 text-sm font-medium text-gray-700 hover: bg-gray-50"
            >
              View Pricing
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}