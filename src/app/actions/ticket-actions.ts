"use server";

import { getServerSession } from "next-auth";
import { Ticket } from "@/lib/db/models/ticket";
import { TicketMessage } from "@/lib/db/models/ticket-message";
import { revalidatePath } from "next/cache";
import { uploadToS3 } from "@/lib/utils/s3-upload";
import { connectToDatabase } from "@/lib/db/mongoose";
import { authOptions } from "@/config/auth";
import { getLoginUserRole } from "./auth";
import { UserRole } from "../dashboard/_constant/user";

export async function createTicket(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const priority = formData.get("priority") as string;
  const relatedOrderId = formData.get("relatedOrderId") as string;
  const tagsString = formData.get("tags") as string;
  const imageCount = parseInt(formData.get("imageCount") as string || "0");
  const attachmentCount = parseInt(formData.get("attachmentCount") as string || "0");

  // Simple validation
  if (!title || title.length < 5) {
    throw new Error("Title must be at least 5 characters");
  }
  if (!description || description.length < 10) {
    throw new Error("Description must be at least 10 characters");
  }
  if (!["technical", "billing", "account", "order", "general"].includes(category)) {
    throw new Error("Invalid category");
  }
  if (!["low", "medium", "high", "critical"].includes(priority)) {
    throw new Error("Invalid priority");
  }

  const tags = tagsString ? JSON.parse(tagsString) : [];

  // Process image uploads
  const images: string[] = [];
  for (let i = 0; i < imageCount; i++) {
    const imageFile = formData.get(`image_${i}`) as File;
    if (imageFile) {
      try {
        const imageUrl = await uploadToS3(imageFile, `support-tickets/images/${Date.now()}-${imageFile.name}`);
        images.push(imageUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
  }

  // Process attachment uploads
  const attachments: any[] = [];
  for (let i = 0; i < attachmentCount; i++) {
    const attachmentFile = formData.get(`attachment_${i}`) as File;
    if (attachmentFile) {
      try {
        const attachmentUrl = await uploadToS3(attachmentFile, `support-tickets/attachments/${Date.now()}-${attachmentFile.name}`);
        attachments.push({
          filename: attachmentFile.name,
          url: attachmentUrl,
          size: attachmentFile.size,
          mimeType: attachmentFile.type,
        });
      } catch (error) {
        console.error("Error uploading attachment:", error);
      }
    }
  }

  await connectToDatabase();

  const ticket = new Ticket({
    title: title.trim(),
    description: description.trim(),
    category,
    priority,
    status: "open",
    createdBy: session.user.id,
    relatedOrderId: relatedOrderId || undefined,
    tags,
    images,
    attachments,
  });

  await ticket.save();
  
  revalidatePath("/dashboard");
  return { success: true, ticketId: ticket._id.toString() };
}

export async function getMyTickets() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return [];
  }

  await connectToDatabase();
  
  const tickets = await Ticket.find({ createdBy: session.user.id })
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(tickets));
}

export async function getAllTickets() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = session.user as any;
  const role = await getLoginUserRole()
  if (role!==UserRole.SUPPORT) {
    throw new Error("Access denied");
  }

  await connectToDatabase();
  
  const tickets = await Ticket.find()
    .populate("createdBy", "name email role")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(tickets));
}

export async function assignTicket(ticketId: string, assignToId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const role = await getLoginUserRole();
  if (![UserRole.SUPPORT, UserRole.ADMIN].includes(role)) {
    throw new Error("Access denied");
  }

  await connectToDatabase();
  
  await Ticket.findByIdAndUpdate(
    ticketId,
    { 
      assignedTo: assignToId,
      status: "assigned"
    },
    { new: true }
  );

  revalidatePath("/dashboard/support");
  return { success: true };
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const role = await getLoginUserRole();
  if (![UserRole.SUPPORT, UserRole.ADMIN].includes(role)) {
    throw new Error("Access denied");
  }

  if (!["open", "assigned", "in_progress", "resolved", "closed"].includes(status)) {
    throw new Error("Invalid status");
  }

  await connectToDatabase();
  
  const updateData: any = { status };
  if (status === "closed") {
    updateData.closedAt = new Date();
  }

  await Ticket.findByIdAndUpdate(ticketId, updateData);
  
  revalidatePath("/dashboard/support");
  return { success: true };
}

export async function addTicketMessage(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const ticketId = formData.get("ticketId") as string;
  const message = formData.get("message") as string;
  const isInternal = formData.get("isInternal") === "true";
  const imagesString = formData.get("images") as string;
  const attachmentsString = formData.get("attachments") as string;

  if (!message || message.length < 1) {
    throw new Error("Message cannot be empty");
  }

  const images = imagesString ? JSON.parse(imagesString) : [];
  const attachments = attachmentsString ? JSON.parse(attachmentsString) : [];

  await connectToDatabase();

  // Verify user can access this ticket
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const role = await getLoginUserRole();
  const canAccess = ticket.createdBy.toString() === session.user.id || 
                   [UserRole.SUPPORT, UserRole.ADMIN].includes(role);

  if (!canAccess) {
    throw new Error("Access denied");
  }

  const ticketMessage = new TicketMessage({
    ticketId,
    senderId: session.user.id,
    message: message.trim(),
    messageType: images.length > 0 ? "image" : (attachments.length > 0 ? "file" : "text"),
    images,
    attachments,
    isInternal: isInternal && [UserRole.SUPPORT, UserRole.ADMIN].includes(role),
  });

  await ticketMessage.save();
  
  // Update ticket status if it's closed and someone is responding
  if (ticket.status === "closed") {
    ticket.status = "in_progress";
    await ticket.save();
  }

  revalidatePath(`/dashboard/support`);
  return { success: true };
}

export async function getTicketMessages(ticketId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return [];
  }

  await connectToDatabase();
  
  // Verify user can access this ticket
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    return [];
  }

  const role = await getLoginUserRole();
  const canAccess = ticket.createdBy.toString() === session.user.id || 
                   [UserRole.SUPPORT, UserRole.ADMIN].includes(role);

  if (!canAccess) {
    return [];
  }

  // Filter internal messages for non-support users
  const query: any = { ticketId };
  if (![UserRole.SUPPORT, UserRole.ADMIN].includes(role)) {
    query.isInternal = false;
  }

  const messages = await TicketMessage.find(query)
    .populate("senderId", "name email role")
    .sort({ createdAt: 1 })
    .lean();

  return JSON.parse(JSON.stringify(messages));
}