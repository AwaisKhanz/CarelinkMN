"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building,
  Users,
  FileText,
  History,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { apiService } from "@/lib/api/config";
import { toast } from "sonner";
import { usePageMetadata } from "../../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import { getUserDisplayName } from "@/lib/utils/admin";
import { USER_ROLE_LABELS } from "@/lib/constants";

interface OrganizationDetails {
  organization: {
    id: string;
    name: string;
    type: string;
    status: string;
    email: string;
    phone: string;
    fax?: string;
    website?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    county: string;
    ein?: string;
    npi?: string;
    verifiedAt?: string;
    createdAt: string;
    providers?: Array<{
      id: string;
      subscriptionTier: string;
      verified: boolean;
      services: Array<{
        id: string;
        serviceId: string;
      }>;
    }>;
  };
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: string;
    lastLoginAt?: string;
  }>;
  licenses: Array<{
    id: string;
    licenseType: string;
    licenseNumber: string;
    issueDate: string;
    expirationDate: string;
    status: string;
    verifiedAt?: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    resourceType: string;
    result: string;
    timestamp: string;
    user?: {
      email: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

function OrganizationDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const [data, setData] = useState<OrganizationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTitle("Organization Details");
    setDescription("View and manage organization profile");
    if (params.id) {
      fetchOrganizationDetails(params.id as string);
    }
  }, [params.id, setTitle, setDescription]);

  const fetchOrganizationDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.get<OrganizationDetails>(
        `/api/admin/organizations/${id}/details`
      );

      if (response.success && response.data) {
        setData(response.data);
      } else {
        toast.error("Failed to load organization details");
      }
    } catch (error) {
      console.error("Error fetching organization details:", error);
      toast.error("Failed to load organization details");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      VERIFIED: { variant: "default" as const, label: "Verified", icon: CheckCircle },
      PENDING: { variant: "secondary" as const, label: "Pending", icon: AlertCircle },
      SUSPENDED: { variant: "destructive" as const, label: "Suspended", icon: XCircle },
      DEACTIVATED: { variant: "outline" as const, label: "Deactivated", icon: XCircle },
    };
    return config[status as keyof typeof config] || config.PENDING;
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading organization details...</div>;
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium">Organization not found</h3>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/admin/organizations")}
        >
          Back to List
        </Button>
      </div>
    );
  }

  const { organization, users, licenses, recentActivity } = data;
  const statusConfig = getStatusBadge(organization.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/organizations")}
          className="pl-0 hover:bg-transparent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Button>
        <div className="flex items-center gap-3">
          <Badge variant={statusConfig.variant} className="text-sm px-3 py-1">
            <StatusIcon className="mr-1 h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Organization Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{organization.name}</CardTitle>
                <CardDescription className="text-base mt-1">
                  <Badge variant="outline" className="capitalize">
                    {organization.type.replace("_", " ")}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </p>
                <p className="font-medium">{organization.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Phone
                </p>
                <p className="font-medium">{organization.phone}</p>
              </div>
              {organization.website && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Website
                  </p>
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {organization.website}
                  </a>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Address
                </p>
                <p className="font-medium">
                  {organization.addressLine1}
                  {organization.addressLine2 && <>, {organization.addressLine2}</>}
                  <br />
                  {organization.city}, {organization.state} {organization.zipCode}
                  <br />
                  {organization.county} County
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {organization.ein && (
                <div>
                  <p className="text-sm text-muted-foreground">EIN</p>
                  <p className="font-medium font-mono">{organization.ein}</p>
                </div>
              )}
              {organization.npi && (
                <div>
                  <p className="text-sm text-muted-foreground">NPI</p>
                  <p className="font-medium font-mono">{organization.npi}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Created
                </p>
                <p className="font-medium">
                  {format(new Date(organization.createdAt), "MMMM d, yyyy")}
                </p>
              </div>
              {organization.verifiedAt && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Verified
                  </p>
                  <p className="font-medium">
                    {format(new Date(organization.verifiedAt), "MMMM d, yyyy")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members ({users.length})
          </TabsTrigger>
          <TabsTrigger value="licenses">
            <FileText className="mr-2 h-4 w-4" />
            Licenses ({licenses.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            <History className="mr-2 h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Organization Members</CardTitle>
              <CardDescription>Users associated with this organization</CardDescription>
            </CardHeader>
            <CardContent>
              {users.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {getUserDisplayName(user)}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {USER_ROLE_LABELS[user.role as keyof typeof USER_ROLE_LABELS] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.status === "ACTIVE" ? "default" : "secondary"
                            }
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt
                            ? format(new Date(user.lastLoginAt), "MMM d, yyyy")
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No members found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Licenses Tab */}
        <TabsContent value="licenses">
          <Card>
            <CardHeader>
              <CardTitle>Licenses</CardTitle>
              <CardDescription>Professional licenses for this organization</CardDescription>
            </CardHeader>
            <CardContent>
              {licenses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>License Number</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenses.map((license) => {
                      const isExpired = new Date(license.expirationDate) < new Date();
                      const isExpiringSoon =
                        new Date(license.expirationDate) <
                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                      return (
                        <TableRow key={license.id}>
                          <TableCell className="font-medium">
                            {license.licenseType}
                          </TableCell>
                          <TableCell className="font-mono">
                            {license.licenseNumber}
                          </TableCell>
                          <TableCell>
                            {format(new Date(license.issueDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {format(new Date(license.expirationDate), "MMM d, yyyy")}
                              {isExpired && (
                                <Badge variant="destructive" className="text-xs">
                                  Expired
                                </Badge>
                              )}
                              {!isExpired && isExpiringSoon && (
                                <Badge variant="secondary" className="text-xs">
                                  Expiring Soon
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                license.status === "ACTIVE"
                                  ? "default"
                                  : license.status === "EXPIRED"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {license.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/licenses/${license.id}`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No licenses found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Last 10 actions related to this organization</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium text-sm">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.resourceType}
                          {log.user && (
                            <> • by {getUserDisplayName(log.user)}</>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            log.result === "SUCCESS" ? "outline" : "destructive"
                          }
                          className="mb-1"
                        >
                          {log.result}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No recent activity found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function OrganizationDetailPage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.ORGANIZATIONS_MANAGE}
      title="Access Restricted"
      description="You don't have permission to view organization details."
    >
      <OrganizationDetailPageContent />
    </RequirePermission>
  );
}
