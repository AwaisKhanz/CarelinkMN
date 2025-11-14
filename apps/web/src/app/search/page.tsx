"use client";

import { Search, Filter, MapPin, Clock, Star } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProtectedRoute } from "@/components/protected-route";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    serviceType: "",
    location: "",
    availability: "",
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <div className="bg-background border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-foreground">Search Providers</h1>
            <p className="text-muted-foreground mt-2">
              Find the perfect care provider for your needs
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Bar */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      placeholder="Search for providers, services, or locations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 text-lg"
                    />
                  </div>
                </div>
                <Button size="lg" className="h-12 px-8">
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Filter className="w-5 h-5 mr-2" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Service Type</label>
                    <Select
                      value={selectedFilters.serviceType}
                      onValueChange={(value) =>
                        setSelectedFilters({ ...selectedFilters, serviceType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential Care</SelectItem>
                        <SelectItem value="day">Day Services</SelectItem>
                        <SelectItem value="employment">Employment Services</SelectItem>
                        <SelectItem value="transportation">Transportation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Location</label>
                    <Select
                      value={selectedFilters.location}
                      onValueChange={(value) =>
                        setSelectedFilters({ ...selectedFilters, location: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minneapolis">Minneapolis</SelectItem>
                        <SelectItem value="st-paul">St. Paul</SelectItem>
                        <SelectItem value="rochester">Rochester</SelectItem>
                        <SelectItem value="duluth">Duluth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Availability</label>
                    <Select
                      value={selectedFilters.availability}
                      onValueChange={(value) =>
                        setSelectedFilters({ ...selectedFilters, availability: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="within-week">Within a week</SelectItem>
                        <SelectItem value="within-month">Within a month</SelectItem>
                        <SelectItem value="waitlist">Waitlist available</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="outline" className="w-full">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Search Results</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Sort by:</span>
                    <Select defaultValue="relevance">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="distance">Distance</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                        <SelectItem value="availability">Availability</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Sample Results */}
              <div className="space-y-4">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Sunrise Care Center</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          Minneapolis, MN
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-warning fill-current" />
                          <span className="text-sm font-medium ml-1">4.8</span>
                        </div>
                        <Badge variant="secondary">Available</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Comprehensive residential care services with 24/7 support and 
                      specialized programs for individuals with developmental disabilities.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Immediate availability
                        </span>
                        <span>•</span>
                        <span>Licensed for 50 residents</span>
                      </div>
                      <Button size="sm">View Details</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Harmony Day Services</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          St. Paul, MN
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-warning fill-current" />
                          <span className="text-sm font-medium ml-1">4.6</span>
                        </div>
                        <Badge variant="outline">Waitlist</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Day programs focusing on skill development, community integration, 
                      and vocational training for adults with disabilities.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          2-3 week wait
                        </span>
                        <span>•</span>
                        <span>Monday-Friday programs</span>
                      </div>
                      <Button size="sm">View Details</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Pathways Employment</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          Rochester, MN
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-warning fill-current" />
                          <span className="text-sm font-medium ml-1">4.9</span>
                        </div>
                        <Badge variant="secondary">Available</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Employment services and job placement assistance with ongoing 
                      support for workplace success and career development.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Immediate availability
                        </span>
                        <span>•</span>
                        <span>VRS certified</span>
                      </div>
                      <Button size="sm">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pagination */}
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">1</Button>
                  <Button variant="outline" size="sm">2</Button>
                  <Button variant="outline" size="sm">3</Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
