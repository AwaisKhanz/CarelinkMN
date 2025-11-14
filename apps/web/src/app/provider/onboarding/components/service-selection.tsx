"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Check, Search, Users, Heart, Home, Shield, Loader2 } from "lucide-react";
import { homeService, Service } from "@/lib/api";
import { toast } from "sonner";

interface ServiceSelectionProps {
  data: {
    selectedServices: string[];
    description: string;
    acceptsReferrals: boolean;
    responseTimeHours: number;
  };
  onComplete: (data: any) => void;
  onValidateRequest?: (validate: () => boolean) => void;
}

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, typeof Home> = {
  "Daily Living": Home,
  "Medical": Heart,
  "Support Services": Users,
  "Specialized Care": Shield,
  "Physical Support": Users,
  "Personal Care": Users,
  "Health Support": Heart,
};

// Default icon if category not found
const DefaultIcon = Home;

export function ServiceSelection({ data, onComplete, onValidateRequest }: ServiceSelectionProps) {
  const [formData, setFormData] = useState(data);
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const onCompleteRef = useRef(onComplete);
  const onValidateRequestRef = useRef(onValidateRequest);
  
  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoadingServices(true);
        const response = await homeService.getAvailableServices();
        if (response.success && response.data) {
          setServices(response.data);
        } else {
          toast.error("Failed to load services");
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        toast.error("Failed to load services. Please refresh the page.");
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []);
  
  // Sync formData with data prop when it changes
  useEffect(() => {
    setFormData(data);
  }, [data]);
  
  // Update refs when callbacks change
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onValidateRequestRef.current = onValidateRequest;
  }, [onComplete, onValidateRequest]);

  // Group services by category
  const serviceCategories = services.reduce((acc, service) => {
    const category = service.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.selectedServices.length === 0) {
      newErrors.selectedServices = "Please select at least one service";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 50) {
      newErrors.description = "Description must be at least 50 characters";
    }

    if (formData.responseTimeHours < 1 || formData.responseTimeHours > 168) {
      newErrors.responseTimeHours = "Response time must be between 1 and 168 hours";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId]
    }));

    // Clear error when user selects a service
    if (errors.selectedServices) {
      setErrors(prev => ({ ...prev, selectedServices: "" }));
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Filter services by search term and group by category
  const filteredCategories = Object.entries(serviceCategories)
    .map(([categoryName, categoryServices]) => {
      const filtered = categoryServices.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        categoryName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filtered.length === 0) return null;
      
      const Icon = CATEGORY_ICONS[categoryName] || DefaultIcon;
      
      return {
        id: categoryName.toLowerCase().replace(/\s+/g, "_"),
        name: categoryName,
        icon: Icon,
        description: `Services in the ${categoryName} category`,
        services: filtered,
      };
    })
    .filter((cat): cat is NonNullable<typeof cat> => cat !== null);

  const handleSubmit = () => {
    if (validateForm()) {
      onComplete(formData);
    }
  };

  // Expose validation function to parent
  useEffect(() => {
    if (onValidateRequestRef.current) {
      onValidateRequestRef.current(() => {
        if (validateForm()) {
          onCompleteRef.current(formData);
          return true;
        }
        return false;
      });
    }
  }, [formData]); // Only re-register when formData changes

  return (
    <div className="space-y-6">
      {/* Service Selection */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            Select Services
          </CardTitle>
          <CardDescription>
            Choose the services your organization provides
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Service Categories */}
          {isLoadingServices ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading services...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? `No services found matching "${searchTerm}"` : "No services available"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCategories.map((category) => (
                <div key={category.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <category.icon className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.services.map((service) => (
                      <div
                        key={service.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          formData.selectedServices.includes(service.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => handleServiceToggle(service.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={formData.selectedServices.includes(service.id)}
                            onChange={() => handleServiceToggle(service.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{service.name}</h4>
                            {service.description && (
                              <p className="text-sm text-muted-foreground">{service.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {errors.selectedServices && (
            <p className="text-sm text-destructive">{errors.selectedServices}</p>
          )}

          {/* Selected Services Summary */}
          {formData.selectedServices.length > 0 && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Selected Services ({formData.selectedServices.length})</h4>
              <div className="flex flex-wrap gap-2">
                {formData.selectedServices.map((serviceId) => {
                  const service = services.find(s => s.id === serviceId);
                  return service ? (
                    <Badge key={serviceId} variant="healthcarePrimary" className="text-xs">
                      {service.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider Details */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Provider Details</CardTitle>
          <CardDescription>
            Additional information about your provider profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">Provider Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your organization, services, and what makes you unique..."
              rows={4}
              className={errors.description ? "border-destructive" : ""}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description ? (
                <p className="text-sm text-destructive">{errors.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {formData.description.length}/2000 characters
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="responseTimeHours">Response Time (Hours) *</Label>
              <Input
                id="responseTimeHours"
                type="number"
                min="1"
                max="168"
                value={formData.responseTimeHours}
                onChange={(e) => handleInputChange("responseTimeHours", parseInt(e.target.value))}
                placeholder="24"
                className={errors.responseTimeHours ? "border-destructive" : ""}
              />
              {errors.responseTimeHours && (
                <p className="text-sm text-destructive mt-1">{errors.responseTimeHours}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                How quickly do you typically respond to referrals?
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="acceptsReferrals"
                checked={formData.acceptsReferrals}
                onCheckedChange={(checked) => handleInputChange("acceptsReferrals", checked as boolean)}
              />
              <Label htmlFor="acceptsReferrals" className="text-sm">
                Currently accepting new referrals
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
