"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  User,
  Tag,
  Image as ImageIcon,
  FileIcon,
  Edit3,
  CheckCircle,
  X
} from "lucide-react";
import { toast } from "sonner";
import { TicketAPI } from "@/lib/api/ticket-api";
import { updateTicketStatus, updateTicketResolution, updateResolutionFeedback } from "@/app/actions/ticket-actions";

interface TicketUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Attachment {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

interface TicketDetailProps {
  ticket: {
    _id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    createdBy: TicketUser;
    assignedTo?: TicketUser;
    tags: string[];
    images: string[];
    attachments: Attachment[];
    relatedOrderId?: string;
    resolution?: string;
    resolutionFeedback?: 'satisfied' | 'not_satisfied';
    resolutionFeedbackAt?: string;
    createdAt: string;
    updatedAt: string;
  };
  currentUser?: any;
}

const statusColors = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  assigned: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
};

export function TicketDetail({ ticket: initialTicket, currentUser }: TicketDetailProps) {
  const t = useTranslations('callCenterSupport.ticketDetail');
  const tStatus = useTranslations('callCenterSupport.status');
  const tPriority = useTranslations('callCenterSupport.priority');
  const tCategory = useTranslations('callCenterSupport.category');

  const [ticket, setTicket] = useState(initialTicket);
  const [isEditing, setIsEditing] = useState(false);
  const [resolution, setResolution] = useState(ticket.resolution || "");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [resolutionFeedback, setResolutionFeedback] = useState<'satisfied' | 'not_satisfied' | null>(
    ticket.resolutionFeedback || null
  );
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === ticket.status) return; // No change needed

    setIsUpdatingStatus(true);
    try {
      // Use server action to update status
      await updateTicketStatus(ticket._id, newStatus);

      // Update local ticket state
      setTicket(prev => ({ ...prev, status: newStatus }));
      toast.success(t('toasts.statusUpdated', { status: tStatus(newStatus) }));
    } catch (error: any) {
      console.error('Error updating ticket status:', error);
      toast.error(error.message || t('toasts.statusUpdateFailed'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveResolution = async () => {
    if (!resolution || resolution.trim().length === 0) {
      toast.error(t('toasts.resolutionEmpty'));
      return;
    }

    try {
      const result = await updateTicketResolution(ticket._id, resolution);

      if (result.success) {
        // Update local ticket state with the saved resolution
        setTicket(prev => ({ ...prev, resolution: result.resolution }));
        toast.success(t('toasts.resolutionSaved'));
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error('Error saving resolution:', error);
      toast.error(error.message || t('toasts.resolutionSaveFailed'));
    }
  };

  const isImageFile = (filename: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const canUpdateStatus = () => {
    return currentUser && ['support', 'admin'].includes(currentUser.role);
  };

  const canEditResolution = () => {
    return currentUser && ['support', 'admin'].includes(currentUser.role);
  };

  const handleResolutionFeedback = async (feedback: 'satisfied' | 'not_satisfied') => {
    setIsSubmittingFeedback(true);
    try {
      const result = await updateResolutionFeedback(ticket._id, feedback);

      if (result.success) {
        setResolutionFeedback(result.feedback);
        setTicket(prev => ({
          ...prev,
          resolutionFeedback: result.feedback,
          resolutionFeedbackAt: new Date().toISOString(),
          status: result.status
        }));

        if (feedback === 'satisfied') {
          toast.success(t('toasts.feedbackSatisfied'));
        } else {
          toast.info(t('toasts.feedbackNotSatisfied'));
        }
      }
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error(error.message || t('toasts.feedbackSubmitFailed'));
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Bucket is public now, no need for presigned URLs

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{ticket.title}</h1>
            <div className="flex items-center gap-2 mb-4">
              <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                {tStatus(ticket.status)}
              </Badge>
              <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                {t('priorityLabel', { priority: tPriority(ticket.priority) })}
              </Badge>
              <Badge variant="outline">{tCategory(ticket.category)}</Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            {canUpdateStatus() ? (
              <>
                <Select onValueChange={handleStatusChange} value={ticket.status} disabled={isUpdatingStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">{t('statusSelect.open')}</SelectItem>
                    <SelectItem value="assigned">{t('statusSelect.assigned')}</SelectItem>
                    <SelectItem value="in_progress">{t('statusSelect.inProgress')}</SelectItem>
                    <SelectItem value="resolved">{t('statusSelect.resolved')}</SelectItem>
                    <SelectItem value="closed">{t('statusSelect.closed')}</SelectItem>
                  </SelectContent>
                </Select>
                {isUpdatingStatus && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary self-center"></div>
                )}
              </>
            ) : (
              <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                {tStatus(ticket.status)}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{t('createdBy')}</p>
              <p className="text-muted-foreground">
                {ticket.createdBy.name} ({ticket.createdBy.role})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{t('created')}</p>
              <p className="text-muted-foreground">{formatDate(ticket.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{t('lastUpdated')}</p>
              <p className="text-muted-foreground">{formatDate(ticket.updatedAt)}</p>
            </div>
          </div>
        </div>

        {ticket.assignedTo && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="font-medium">{t('assignedToLabel')}:</span> {ticket.assignedTo.name} ({ticket.assignedTo.email})
            </p>
          </div>
        )}

        {ticket.relatedOrderId && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="font-medium">{t('relatedOrder')}:</span> {ticket.relatedOrderId}
            </p>
          </div>
        )}
      </Card>

      {/* Description */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-3">{t('description')}</h2>
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap">{ticket.description}</p>
        </div>
      </Card>

      {/* Tags */}
      {ticket.tags && ticket.tags.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            {t('tags')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {ticket.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Images */}
      {ticket.images && ticket.images.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            {t('images')} ({ticket.images.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ticket.images.map((imageUrl, index) => {
              const filename = imageUrl.split('/').pop() || `image-${index}`;
              
              return (
                <div key={index} className="relative aspect-square border rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`Attachment ${index + 1}`}
                    className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(imageUrl, '_blank')}
                    onError={(e) => {
                      console.log('Image failed to load:', imageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                    <Button
                      variant="secondary"
                      size="sm"
                      asChild
                    >
                      <a href={imageUrl} target="_blank" rel="noopener noreferrer" download={filename}>
                        {t('download')}
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Attachments */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FileIcon className="h-4 w-4" />
            {t('attachments')} ({ticket.attachments.length})
          </h2>
          <div className="space-y-4">
            {ticket.attachments.map((attachment, index) => {
              const isImage = isImageFile(attachment.filename);
              
              return (
                <div key={index} className="border rounded-lg overflow-hidden">
                  {isImage ? (
                    <div className="space-y-3">
                      {/* Image Preview */}
                      <div className="relative h-48 bg-muted flex items-center justify-center">
                        <img
                          src={attachment.url}
                          alt={attachment.filename}
                          className="max-h-full max-w-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(attachment.url, '_blank')}
                          onError={(e) => {
                            console.log('Image attachment failed to load:', attachment.url);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      
                      {/* File Info */}
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{attachment.filename}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(attachment.size)} • {attachment.mimeType}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={attachment.url} target="_blank" rel="noopener noreferrer" download={attachment.filename}>
                            {t('download')}
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Non-image file */
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileIcon className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{attachment.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(attachment.size)} • {attachment.mimeType}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer" download={attachment.filename}>
                          {t('download')}
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Resolution */}
      {(ticket.status === 'resolved' || ticket.status === 'closed' || ticket.resolution) && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {t('resolution')}
            </h2>
            {!isEditing && canEditResolution() && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                {t('edit')}
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder={t('resolutionPlaceholder')}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveResolution}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('saveResolution')}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">
                  {ticket.resolution || t('noResolutionYet')}
                </p>
              </div>

              {/* Resolution Feedback Section */}
              {!canEditResolution() && ticket.resolution && (ticket.status === 'resolved' || ticket.status === 'in_progress') && (
                <div className="border-t pt-4 mt-4">
                  {/* Show existing feedback if present */}
                  {ticket.resolutionFeedback && ticket.resolutionFeedbackAt && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        {ticket.resolutionFeedback === 'satisfied' ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t('resolutionFeedback.customerSatisfied')}
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <X className="h-3 w-3 mr-1" />
                            {t('resolutionFeedback.customerNotSatisfied')}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(ticket.resolutionFeedbackAt)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Feedback buttons - always show for sellers to update */}
                  <Label className="text-sm font-medium mb-2 block">
                    {ticket.resolutionFeedback ? t('resolutionFeedback.updateQuestion') : t('resolutionFeedback.question')}
                  </Label>
                  <div className="flex gap-3">
                    <Button
                      variant={resolutionFeedback === 'satisfied' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleResolutionFeedback('satisfied')}
                      disabled={isSubmittingFeedback}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {isSubmittingFeedback && resolutionFeedback === 'satisfied' ? t('resolutionFeedback.submitting') : t('resolutionFeedback.yes')}
                    </Button>
                    <Button
                      variant={resolutionFeedback === 'not_satisfied' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleResolutionFeedback('not_satisfied')}
                      disabled={isSubmittingFeedback}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      {isSubmittingFeedback && resolutionFeedback === 'not_satisfied' ? t('resolutionFeedback.submitting') : t('resolutionFeedback.no')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Show existing feedback to admin/support (read-only) */}
              {canEditResolution() && ticket.resolutionFeedback && ticket.resolutionFeedbackAt && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2">
                    {ticket.resolutionFeedback === 'satisfied' ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('resolutionFeedback.customerSatisfied')}
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        <X className="h-3 w-3 mr-1" />
                        {t('resolutionFeedback.customerNotSatisfied')}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(ticket.resolutionFeedbackAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}