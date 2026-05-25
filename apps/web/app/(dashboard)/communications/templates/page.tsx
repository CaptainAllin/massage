'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Modal,
} from '@massage/ui';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import {
  useMessageTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  usePreviewTemplate,
} from '@/lib/hooks';
import { MessageTemplate, MessageType, TemplateCategory } from '@massage/types';

function TemplatesPageContent() {
  const searchParams = useSearchParams();
  const businessId = searchParams?.get('businessId') || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState({ subject: '', content: '' });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'SMS' as MessageType,
    category: 'CUSTOM' as TemplateCategory | string,
    subject: '',
    content: '',
    isDefault: false,
  });

  // Fetch templates
  const { data: templatesData, isLoading } = useMessageTemplates(businessId, {
    search: searchTerm,
  });

  // Mutations
  const createTemplateMutation = useCreateTemplate(businessId);
  const updateTemplateMutation = useUpdateTemplate(businessId);
  const deleteTemplateMutation = useDeleteTemplate(businessId);
  const previewMutation = usePreviewTemplate(businessId);

  const templates = templatesData?.data || [];

  const handleOpenDialog = (template?: MessageTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        type: template.type as MessageType,
        category: template.category || 'CUSTOM',
        subject: template.subject || '',
        content: template.content,
        isDefault: template.isDefault,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        type: 'SMS' as MessageType,
        category: 'CUSTOM',
        subject: '',
        content: '',
        isDefault: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await updateTemplateMutation.mutateAsync({
          templateId: editingTemplate.id,
          data: formData,
        });
      } else {
        await createTemplateMutation.mutateAsync({
          businessId,
          ...formData,
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplateMutation.mutateAsync(templateId);
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const handlePreview = async (template: MessageTemplate) => {
    try {
      const result = await previewMutation.mutateAsync({
        templateId: template.id,
        variables: {
          clientName: 'John Doe',
          clientFirstName: 'John',
          appointmentDate: new Date(),
          appointmentTime: new Date(),
          therapistName: 'Jane Smith',
          businessName: 'Wellness Spa',
        },
      });
      setPreviewContent(result);
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Failed to preview template:', error);
    }
  };

  if (!businessId) {
    return <div>Please select a business first</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">Message Templates</h1>
          <p className="text-muted-foreground mt-2">
            Create reusable templates for common communications
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading templates...</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No templates found. Create your first template!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template: MessageTemplate) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      {template.type}
                    </span>
                    {template.category && (
                      <span className="px-2 py-1 bg-accent text-xs rounded">
                        {template.category}
                      </span>
                    )}
                    {template.isDefault && (
                      <span className="px-2 py-1 bg-[#EDE5F4] text-[#5D4AA8] text-xs rounded">
                        Default
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {template.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingTemplate ? 'Edit Template' : 'Create Template'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Template name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as MessageType })}
              >
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="REMINDER">Reminder</option>
                <option value="CONFIRMATION">Confirmation</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="MARKETING">Marketing</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          </div>
          {formData.type === 'EMAIL' && (
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[150px]"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Use {{clientName}}, {{appointmentDate}}, etc."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Available variables: {'{{clientName}}'}, {'{{appointmentDate}}'}, {'{{appointmentTime}}'}, {'{{therapistName}}'}
            </p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isDefault" className="text-sm">Set as default template for this type</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.content}>
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Dialog */}
      <Modal
        isOpen={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        title="Template Preview"
      >
        <div className="space-y-4">
          {previewContent.subject && (
            <div>
              <label className="block text-sm font-medium mb-2">Subject:</label>
              <p className="text-sm">{previewContent.subject}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">Content:</label>
            <div className="bg-accent p-4 rounded whitespace-pre-wrap text-sm">
              {previewContent.content}
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading templates...</div>}>
      <TemplatesPageContent />
    </Suspense>
  );
}
