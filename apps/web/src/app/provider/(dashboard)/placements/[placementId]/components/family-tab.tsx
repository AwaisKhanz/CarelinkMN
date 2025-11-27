"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  Plus,
  Mail,
  Phone,
  Star,
  Trash2,
  Loader2,
  Edit,
} from "lucide-react";
import { placementService } from "@/lib/api";
import { toast } from "sonner";

import { PlacementFamilyContact } from "@carelink/types";

interface FamilyTabProps {
  placementId: string;
  readOnly?: boolean;
}

export function FamilyTab({ placementId, readOnly = false }: FamilyTabProps) {
  const [contacts, setContacts] = useState<PlacementFamilyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editContactDialogOpen, setEditContactDialogOpen] = useState(false);
  const [deleteContactDialogOpen, setDeleteContactDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContact, setSelectedContact] = useState<PlacementFamilyContact | null>(null);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: "",
    relationship: "",
    email: "",
    phone: "",
    isPrimary: false,
    canReceiveUpdates: true,
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await placementService.getFamilyContacts(placementId);

      if (response.success && response.data) {
        setContacts(response.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load family data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [placementId]);

  const handleAddContact = async () => {
    if (!contactForm.name || !contactForm.relationship || !contactForm.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await placementService.addFamilyContact(placementId, contactForm);

      if (response.success) {
        toast.success("Family contact added successfully");
        setContactDialogOpen(false);
        setContactForm({
          name: "",
          relationship: "",
          email: "",
          phone: "",
          isPrimary: false,
          canReceiveUpdates: true,
        });
        await fetchData();
      } else {
        toast.error(response.message || "Failed to add contact");
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      toast.error("Failed to add contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (contact: PlacementFamilyContact) => {
    setSelectedContact(contact);
    setContactForm({
      name: contact.name,
      relationship: contact.relationship,
      email: contact.email,
      phone: contact.phone || "",
      isPrimary: contact.isPrimary,
      canReceiveUpdates: contact.canReceiveUpdates,
    });
    setEditContactDialogOpen(true);
  };

  const handleEditContact = async () => {
    if (!selectedContact) return;
    if (!contactForm.name || !contactForm.relationship || !contactForm.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await placementService.updateFamilyContact(
        selectedContact.id,
        contactForm
      );

      if (response.success) {
        toast.success("Contact updated successfully");
        setEditContactDialogOpen(false);
        setSelectedContact(null);
        setContactForm({
          name: "",
          relationship: "",
          email: "",
          phone: "",
          isPrimary: false,
          canReceiveUpdates: true,
        });
        await fetchData();
      } else {
        toast.error(response.message || "Failed to update contact");
      }
    } catch (error) {
      console.error("Error updating contact:", error);
      toast.error("Failed to update contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (contact: PlacementFamilyContact) => {
    setSelectedContact(contact);
    setDeleteContactDialogOpen(true);
  };

  const confirmDeleteContact = async () => {
    if (!selectedContact) return;

    try {
      const response = await placementService.deleteFamilyContact(selectedContact.id);
      if (response.success) {
        toast.success("Contact removed successfully");
        setDeleteContactDialogOpen(false);
        setSelectedContact(null);
        await fetchData();
      } else {
        toast.error(response.message || "Failed to remove contact");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to remove contact");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Family Contacts Section */}
      <Card variant="healthcare">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Family Contacts</CardTitle>
              <CardDescription>
                Manage family members who receive updates
              </CardDescription>
            </div>
            {!readOnly && (
              <Button
                variant="healthcare"
                size="sm"
                onClick={() => setContactDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No family contacts added yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{contact.name}</p>
                        {contact.isPrimary && (
                          <Badge variant="healthcareWarning" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Primary
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </span>
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(contact)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(contact)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Family Contact</DialogTitle>
            <DialogDescription>
              Add a family member who will receive updates about the resident.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">
                Relationship <span className="text-destructive">*</span>
              </Label>
              <Input
                id="relationship"
                value={contactForm.relationship}
                onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                placeholder="e.g., Daughter, Son, Spouse"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrimary"
                checked={contactForm.isPrimary}
                onCheckedChange={(checked) =>
                  setContactForm({ ...contactForm, isPrimary: checked as boolean })
                }
              />
              <Label htmlFor="isPrimary" className="font-normal">
                Set as primary contact
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setContactDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="healthcare"
              onClick={handleAddContact}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={editContactDialogOpen} onOpenChange={setEditContactDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Family Contact</DialogTitle>
            <DialogDescription>
              Update contact information for this placement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-relationship">
                Relationship <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-relationship"
                value={contactForm.relationship}
                onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                placeholder="e.g., Daughter, Son, Spouse"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone (Optional)</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isPrimary"
                checked={contactForm.isPrimary}
                onCheckedChange={(checked) =>
                  setContactForm({ ...contactForm, isPrimary: checked as boolean })
                }
              />
              <Label htmlFor="edit-isPrimary" className="font-normal">
                Set as primary contact
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-canReceiveUpdates"
                checked={contactForm.canReceiveUpdates}
                onCheckedChange={(checked) =>
                  setContactForm({ ...contactForm, canReceiveUpdates: checked as boolean })
                }
              />
              <Label htmlFor="edit-canReceiveUpdates" className="font-normal">
                Can receive updates
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditContactDialogOpen(false);
                setSelectedContact(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="healthcare"
              onClick={handleEditContact}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Confirmation Dialog */}
      <Dialog open={deleteContactDialogOpen} onOpenChange={setDeleteContactDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Remove Family Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedContact?.name} from family contacts?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteContactDialogOpen(false);
                setSelectedContact(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteContact}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
