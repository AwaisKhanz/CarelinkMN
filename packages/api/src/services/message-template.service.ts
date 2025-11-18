import { db } from "@carelink/database";
import { Prisma } from "@prisma/client";

export interface CreateMessageTemplateData {
  name: string;
  subject?: string;
  content: string;
  category?: string;
  variables?: string[];
  organizationId?: string;
}

export interface UpdateMessageTemplateData {
  name?: string;
  subject?: string;
  content?: string;
  category?: string;
  variables?: string[];
}

export interface MessageTemplate {
  id: string;
  userId: string;
  organizationId?: string;
  name: string;
  subject?: string;
  content: string;
  category?: string;
  variables?: string[];
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class MessageTemplateService {
  /**
   * Get all templates for a user (personal and organization)
   */
  async getTemplates(
    userId: string,
    includeOrganization: boolean = true
  ): Promise<MessageTemplate[]> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const where: Prisma.MessageTemplateWhereInput = {
        OR: [
          { userId },
          ...(includeOrganization && user.organizationId
            ? [{ organizationId: user.organizationId }]
            : []),
        ],
      };

      const templates = await db.messageTemplate.findMany({
        where,
        orderBy: [
          { lastUsedAt: "desc" },
          { usageCount: "desc" },
          { createdAt: "desc" },
        ],
      });

      return templates.map((t) => this.mapToType(t));
    } catch (error) {
      console.error("Get templates error:", error);
      throw new Error("Failed to retrieve message templates");
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(
    templateId: string,
    userId: string
  ): Promise<MessageTemplate> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const template = await db.messageTemplate.findFirst({
        where: {
          id: templateId,
          OR: [
            { userId },
            ...(user.organizationId
              ? [{ organizationId: user.organizationId }]
              : []),
          ],
        },
      });

      if (!template) {
        throw new Error("Template not found or access denied");
      }

      return this.mapToType(template);
    } catch (error) {
      console.error("Get template by ID error:", error);
      throw new Error("Failed to retrieve message template");
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(
    userId: string,
    data: CreateMessageTemplateData
  ): Promise<MessageTemplate> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const template = await db.messageTemplate.create({
        data: {
          userId,
          organizationId: data.organizationId || user.organizationId || null,
          name: data.name,
          subject: data.subject || null,
          content: data.content,
          category: data.category || null,
          variables: data.variables || [],
        },
      });

      return this.mapToType(template);
    } catch (error) {
      console.error("Create template error:", error);
      throw new Error("Failed to create message template");
    }
  }

  /**
   * Update a template
   */
  async updateTemplate(
    templateId: string,
    userId: string,
    data: UpdateMessageTemplateData
  ): Promise<MessageTemplate> {
    try {
      // Verify user has access
      await this.getTemplateById(templateId, userId);

      const updateData: Prisma.MessageTemplateUpdateInput = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.subject !== undefined) updateData.subject = data.subject;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.variables !== undefined) updateData.variables = data.variables;

      const template = await db.messageTemplate.update({
        where: { id: templateId },
        data: updateData,
      });

      return this.mapToType(template);
    } catch (error) {
      console.error("Update template error:", error);
      throw new Error("Failed to update message template");
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    try {
      // Verify user has access
      await this.getTemplateById(templateId, userId);

      await db.messageTemplate.delete({
        where: { id: templateId },
      });
    } catch (error) {
      console.error("Delete template error:", error);
      throw new Error("Failed to delete message template");
    }
  }

  /**
   * Increment usage count for a template
   */
  async incrementUsage(templateId: string): Promise<void> {
    try {
      await db.messageTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Increment template usage error:", error);
      // Don't throw - usage tracking failure shouldn't break message sending
    }
  }

  /**
   * Replace template variables with actual values
   */
  replaceVariables(
    template: string,
    variables: Record<string, string | number | undefined>
  ): string {
    let result = template;

    // Replace variables in format {variableName}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      result = result.replace(regex, String(value || ""));
    });

    return result;
  }

  /**
   * Map Prisma template to MessageTemplate type
   */
  private mapToType(
    template: Prisma.MessageTemplateGetPayload<{}>
  ): MessageTemplate {
    return {
      id: template.id,
      userId: template.userId,
      organizationId: template.organizationId || undefined,
      name: template.name,
      subject: template.subject || undefined,
      content: template.content,
      category: template.category || undefined,
      variables: (template.variables as string[]) || [],
      usageCount: template.usageCount,
      lastUsedAt: template.lastUsedAt?.toISOString(),
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }
}

