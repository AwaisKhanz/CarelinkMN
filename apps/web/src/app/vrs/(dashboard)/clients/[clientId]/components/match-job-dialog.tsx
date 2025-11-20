"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Briefcase } from "lucide-react";
import { vrsService, type VRSJob } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { getVRSJobStatusBadgeConfig } from "@/lib/utils/vrs";
import { JobStatus } from "@carelink/types";

interface MatchJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onMatchSuccess: () => void;
}

export function MatchJobDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  onMatchSuccess,
}: MatchJobDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<VRSJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [selectedJob, setSelectedJob] = useState<VRSJob | null>(null);
  const [placementDate, setPlacementDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [startDate, setStartDate] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (open && searchQuery) {
      searchJobs();
    }
  }, [open, searchQuery]);

  const searchJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const response = await vrsService.getJobs({
        search: searchQuery,
        status: JobStatus.OPEN,
        limit: 20,
      });

      if (response.success && response.data) {
        setJobs(response.data.jobs);
      } else {
        toast.error(response.message || "Failed to search jobs");
      }
    } catch (err) {
      console.error("Error searching jobs:", err);
      toast.error("Failed to search jobs");
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const handleMatch = async () => {
    if (!selectedJob) {
      toast.error("Please select a job");
      return;
    }

    setIsCreating(true);
    try {
      const response = await vrsService.createPlacement({
        clientId,
        jobId: selectedJob.id,
        placementDate,
        startDate: startDate || undefined,
      });

      if (response.success) {
        toast.success("Client matched with job successfully");
        onMatchSuccess();
        onOpenChange(false);
        // Reset form
        setSelectedJob(null);
        setPlacementDate(format(new Date(), "yyyy-MM-dd"));
        setStartDate("");
      } else {
        toast.error(response.message || "Failed to create placement");
      }
    } catch (err) {
      console.error("Error creating placement:", err);
      toast.error("Failed to create placement");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Match Client with Job</DialogTitle>
          <DialogDescription>
            Search for and select a job to match with {clientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Search */}
          <div className="space-y-2">
            <Label>Search Jobs</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by job title, description, or employer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={searchJobs}
                disabled={isLoadingJobs || !searchQuery}
              >
                {isLoadingJobs ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </div>

          {/* Job Results */}
          {jobs.length > 0 && (
            <div className="space-y-2">
              <Label>Select a Job</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {jobs.map((job) => {
                  const statusConfig = getVRSJobStatusBadgeConfig(job.status);
                  const isSelected = selectedJob?.id === job.id;

                  return (
                    <Card
                      key={job.id}
                      variant={isSelected ? "healthcare" : "default"}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedJob(job)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{job.title}</CardTitle>
                            <CardDescription>
                              {job.employer?.companyName || "Unknown Employer"}
                            </CardDescription>
                          </div>
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {job.description}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {job.employmentType}
                          </Badge>
                          {job.isRemote && (
                            <Badge variant="outline" className="text-xs">
                              Remote
                            </Badge>
                          )}
                          {job.location && (
                            <Badge variant="outline" className="text-xs">
                              {job.location}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {!isLoadingJobs && searchQuery && jobs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No open jobs found matching your search</p>
            </div>
          )}

          {/* Placement Details */}
          {selectedJob && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="placementDate">Placement Date *</Label>
                <Input
                  id="placementDate"
                  type="date"
                  value={placementDate}
                  onChange={(e) => setPlacementDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date (Optional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="healthcare"
              onClick={handleMatch}
              disabled={!selectedJob || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Placement"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

