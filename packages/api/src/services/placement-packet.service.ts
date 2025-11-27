import PDFDocument from "pdfkit";
import { db } from "@carelink/database";
import { format } from "date-fns";

export class PlacementPacketService {
  /**
   * Generate a comprehensive PDF packet for a placement
   */
  async generatePacketPDF(placementId: string): Promise<Buffer> {
    // Fetch all placement data
    const placementData = await this.fetchPlacementData(placementId);

    // Generate PDF
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "LETTER",
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];

        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Generate PDF content
        this.generatePDFContent(doc, placementData);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Fetch all placement data needed for the packet
   */
  private async fetchPlacementData(placementId: string) {
    const placement = await db.placement.findUnique({
      where: { id: placementId },
      include: {
        referral: {
          select: {
            id: true,
            referralNumber: true,
            clientAge: true,
            clientGender: true,
            clientInitials: true,
            careLevels: true,
            servicesNeeded: true,
            primaryPayer: true,
            targetMoveDate: true,
            urgency: true,
            status: true,
            caseManager: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        dischargeCase: {
          select: {
            id: true,
            caseNumber: true,
            patientAge: true,
            patientGender: true,
            patientInitials: true,
            diagnosisCodes: true,
            mobilityStatus: true,
            targetDischargeDate: true,
            primaryInsurance: true,
            status: true,
            hospitalId: true,
          },
        },
        opening: {
          include: {
            home: {
              select: {
                id: true,
                name: true,
                city: true,
                state: true,
                addressLine1: true,
                addressLine2: true,
                zipCode: true,
                capacity: true,
                currentOccupancy: true,
              },
            },
          },
        },
        provider: {
          select: {
            id: true,
            organization: {
              select: {
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        followUps: {
          orderBy: { scheduledAt: "asc" },
        },
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
        familyContacts: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!placement) {
      throw new Error("Placement not found");
    }

    return placement;
  }

  /**
   * Generate the PDF content
   */
  private generatePDFContent(doc: any, placement: any) {
    // Header
    this.addHeader(doc);

    // Placement Information
    this.addPlacementInfo(doc, placement);

    // Client/Patient Information
    if (placement.referral) {
      this.addReferralInfo(doc, placement.referral);
    } else if (placement.dischargeCase) {
      this.addDischargeCaseInfo(doc, placement.dischargeCase);
    }

    // Provider and Home Information
    this.addProviderInfo(doc, placement);

    // Follow-ups
    if (placement.followUps && placement.followUps.length > 0) {
      this.addFollowUps(doc, placement.followUps);
    }

    // Documents
    if (placement.documents && placement.documents.length > 0) {
      this.addDocuments(doc, placement.documents);
    }

    // Family Contacts
    if (placement.familyContacts && placement.familyContacts.length > 0) {
      this.addFamilyContacts(doc, placement.familyContacts);
    }

    // Footer
    this.addFooter(doc);
  }

  private addHeader(doc: any) {
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("Placement Packet", { align: "center" });

    doc.moveDown();
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Generated: ${format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}`, {
        align: "center",
      });

    doc.moveDown(2);
    this.addSeparator(doc);
  }

  private addPlacementInfo(doc: any, placement: any) {
    this.addSectionTitle(doc, "Placement Information");

    const data = [
      ["Placement Date", placement.placementDate ? format(new Date(placement.placementDate), "MM/dd/yyyy") : "N/A"],
      ["Move-In Date", placement.moveInDate ? format(new Date(placement.moveInDate), "MM/dd/yyyy") : "Not set"],
      ["Status", this.formatStatus(placement.status)],
      ["Created", format(new Date(placement.createdAt), "MM/dd/yyyy")],
    ];

    this.addTable(doc, data);
    doc.moveDown();
  }

  private addReferralInfo(doc: any, referral: any) {
    this.addSectionTitle(doc, "Client Information (Referral)");

    const data = [
      ["Referral Number", referral.referralNumber],
      ["Client Initials", referral.clientInitials || "N/A"],
      ["Age", referral.clientAge?.toString() || "N/A"],
      ["Gender", referral.clientGender || "N/A"],
      ["Care Levels", (referral.careLevels || []).join(", ") || "N/A"],
      ["Services Needed", (referral.servicesNeeded || []).join(", ") || "N/A"],
      ["Primary Payer", referral.primaryPayer || "N/A"],
      ["Urgency", referral.urgency || "N/A"],
    ];

    if (referral.caseManager) {
      data.push([
        "Case Manager",
        `${referral.caseManager.firstName} ${referral.caseManager.lastName}`,
      ]);
      data.push(["CM Email", referral.caseManager.email]);
      if (referral.caseManager.phone) {
        data.push(["CM Phone", referral.caseManager.phone]);
      }
    }

    this.addTable(doc, data);
    doc.moveDown();
  }

  private addDischargeCaseInfo(doc: any, dischargeCase: any) {
    this.addSectionTitle(doc, "Patient Information (Discharge Case)");

    const data = [
      ["Case Number", dischargeCase.caseNumber],
      ["Patient Initials", dischargeCase.patientInitials || "N/A"],
      ["Age", dischargeCase.patientAge?.toString() || "N/A"],
      ["Gender", dischargeCase.patientGender || "N/A"],
      ["Diagnosis Codes", (dischargeCase.diagnosisCodes || []).join(", ") || "N/A"],
      ["Mobility Status", dischargeCase.mobilityStatus || "N/A"],
      ["Primary Insurance", dischargeCase.primaryInsurance || "N/A"],
    ];

    // Note: Hospital SW information would need to be fetched separately if needed

    this.addTable(doc, data);
    doc.moveDown();
  }

  private addProviderInfo(doc: any, placement: any) {
    this.addSectionTitle(doc, "Provider & Home Information");

    const home = placement.opening?.home;
    const provider = placement.provider;

    const data = [
      ["Provider", provider?.organization?.name || "N/A"],
      ["Provider Email", provider?.organization?.email || "N/A"],
      ["Provider Phone", provider?.organization?.phone || "N/A"],
    ];

    if (home) {
      data.push(["Home Name", home.name]);
      data.push([
        "Address",
        `${home.addressLine1}${home.addressLine2 ? ", " + home.addressLine2 : ""}, ${home.city}, ${home.state} ${home.zipCode}`,
      ]);
      data.push(["Capacity", `${home.currentOccupancy || 0}/${home.capacity || 0}`]);
    }

    this.addTable(doc, data);
    doc.moveDown();
  }

  private addFollowUps(doc: any, followUps: any[]) {
    this.addSectionTitle(doc, `Follow-Ups (${followUps.length})`);

    followUps.forEach((followUp, index) => {
      doc.fontSize(10).font("Helvetica-Bold").text(`${index + 1}. ${followUp.type}`);

      doc.fontSize(9).font("Helvetica");
      doc.text(`Scheduled: ${format(new Date(followUp.scheduledAt), "MM/dd/yyyy h:mm a")}`);

      if (followUp.completedAt) {
        doc.text(`Completed: ${format(new Date(followUp.completedAt), "MM/dd/yyyy h:mm a")}`);
        doc.text(`Outcome: ${followUp.outcome || "N/A"}`);
      } else {
        doc.text("Status: Pending");
      }

      if (followUp.notes) {
        doc.text(`Notes: ${followUp.notes}`);
      }

      doc.moveDown(0.5);
    });

    doc.moveDown();
  }

  private addDocuments(doc: any, documents: any[]) {
    this.addSectionTitle(doc, `Documents (${documents.length})`);

    documents.forEach((document, index) => {
      doc.fontSize(10).font("Helvetica-Bold").text(`${index + 1}. ${document.fileName}`);

      doc.fontSize(9).font("Helvetica");
      doc.text(`Category: ${document.category}`);
      doc.text(`Uploaded: ${format(new Date(document.uploadedAt), "MM/dd/yyyy")}`);
      doc.text(`Size: ${this.formatFileSize(document.fileSize)}`);

      if (document.notes) {
        doc.text(`Notes: ${document.notes}`);
      }

      doc.moveDown(0.5);
    });

    doc.moveDown();
  }

  private addFamilyContacts(doc: any, contacts: any[]) {
    this.addSectionTitle(doc, `Family Contacts (${contacts.length})`);

    contacts.forEach((contact, index) => {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`${index + 1}. ${contact.name}${contact.isPrimary ? " (Primary)" : ""}`);

      doc.fontSize(9).font("Helvetica");
      doc.text(`Relationship: ${contact.relationship}`);
      doc.text(`Email: ${contact.email}`);
      if (contact.phone) {
        doc.text(`Phone: ${contact.phone}`);
      }
      doc.text(`Can Receive Updates: ${contact.canReceiveUpdates ? "Yes" : "No"}`);

      doc.moveDown(0.5);
    });

    doc.moveDown();
  }

  private addFamilyUpdates(doc: any, updates: any[]) {
    this.addSectionTitle(doc, `Recent Family Updates (${updates.length})`);

    updates.forEach((update, index) => {
      doc.fontSize(10).font("Helvetica-Bold").text(`${index + 1}. ${update.title}`);

      doc.fontSize(9).font("Helvetica");
      doc.text(`Date: ${format(new Date(update.createdAt), "MM/dd/yyyy")}`);
      doc.text(`Category: ${update.category}`);
      doc.text(`Message: ${update.message}`);

      if (update.photos && update.photos.length > 0) {
        doc.text(`Photos: ${update.photos.length} attached`);
      }

      doc.moveDown(0.5);
    });

    doc.moveDown();
  }

  private addFooter(doc: any) {
    // Add footer to the current (last) page only
    // Note: For multi-page support, this would need to be called after each page is added
    const y = doc.page.height - 50;
    
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(
        "CareLinkMN Placement Packet | Confidential",
        50,
        y,
        { align: "center" }
      );
  }

  // Helper methods
  private addSectionTitle(doc: any, title: string) {
    doc.fontSize(14).font("Helvetica-Bold").text(title);
    doc.moveDown(0.5);
  }

  private addSeparator(doc: any) {
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke();
    doc.moveDown();
  }

  private addTable(doc: any, data: string[][]) {
    const startY = doc.y;
    const labelWidth = 150;
    const valueX = 50 + labelWidth + 20;

    data.forEach(([label, value]) => {
      doc.fontSize(9).font("Helvetica-Bold").text(label + ":", 50, doc.y);
      doc.fontSize(9).font("Helvetica").text(value, valueX, doc.y);
      doc.moveDown(0.3);
    });
  }

  private formatStatus(status: string): string {
    return status
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
}
