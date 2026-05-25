'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Modal,
} from '@massage/ui';
import { Plus, Search, Edit, Trash2, Eye, Mail, MessageSquare, Smartphone } from 'lucide-react';
import {
  useMessageTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  usePreviewTemplate,
} from '@/lib/hooks';
import { useBusinessId } from '@/lib/hooks/use-business-id';
import { MessageTemplate, MessageType, TemplateCategory } from '@massage/types';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="h-3.5 w-3.5" />,
  SMS: <MessageSquare className="h-3.5 w-3.5" />,
  WHATSAPP: <Smartphone className="h-3.5 w-3.5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  REMINDER: '#EDE5F4',
  CONFIRMATION: '#E8F5E9',
  FOLLOW_UP: '#FFF3E0',
  MARKETING: '#E3F2FD',
  CUSTOM: '#F3F4F6',
};

export default function TemplatesPage() {
  const businessId = useBusinessId();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState({ subject: '', content: '' });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'SMS' as MessageType,
    category: 'CUSTOM' as TemplateCategory | string,
    subject: '',
    content: '',
    isDefault: false,
  });

  const { data: templatesData, isLoading } = useMessageTemplates(businessId, {
    search: searchTerm,
  });

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
      setFormData({ name: '', description: '', type: 'SMS', category: 'CUSTOM', subject: '', content: '', isDefault: false });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await updateTemplateMutation.mutateAsync({ templateId: editingTemplate.id, data: formData });
      } else {
        await createTemplateMutation.mutateAsync({ businessId: businessId!, ...formData });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (confirm('Delete this template?')) {
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#5D4AA8', letterSpacing: '1.4px' }}>Communications</p>
          <h1 className="text-2xl font-semibold font-display" style={{ color: '#1E1830', letterSpacing: '-0.4px' }}>Message Templates</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7A7090' }}>Reusable templates with merge tags for client communications</p>
        </div>
        <Button size="sm" variant="primary" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-1" />
          New Template
        </Button>
      </div>

      {/* Merge tags hint */}
      <div
        className="rounded-xl px-4 py-3 text-sm"
        style={{ background: 'rgba(93,74,168,0.06)', border: '1px solid rgba(93,74,168,0.12)' }}
      >
        <span className="font-medium" style={{ color: '#5D4AA8' }}>Available merge tags: </span>
        <span style={{ color: '#3D3450' }}>
          {['{{clientName}}', '{{appointmentDate}}', '{{appointmentTime}}', '{{therapistName}}', '{{businessName}}'].map((tag, i) => (
            <code
              key={tag}
              className="font-mono text-xs px-1.5 py-0.5 rounded mx-0.5"
              style={{ background: 'rgba(93,74,168,0.1)', color: '#5D4AA8' }}
            >
              {tag}
            </code>
          ))}
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading templates...</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-sm" style={{ color: '#1E1830' }}>No templates yet</p>
            <p className="text-xs mt-1" style={{ color: '#7A7090' }}>Create your first template to speed up client communications</p>
            <Button size="sm" variant="primary" className="mt-4" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template: MessageTemplate) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-sm font-semibold leading-tight" style={{ color: '#1E1830' }}>
                    {template.name}
                  </CardTitle>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handlePreview(template)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#F3EFFD]"
                      title="Preview"
                    >
                      <Eye className="h-3.5 w-3.5" style={{ color: '#7A7090' }} />
                    </button>
                    <button
                      onClick={() => handleOpenDialog(template)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[#F3EFFD]"
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5" style={{ color: '#7A7090' }} />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: '#EDE5F4', color: '#5D4AA8' }}
                  >
                    {TYPE_ICONS[template.type]}
                    {template.type}
                  </span>
                  {template.category && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: CATEGORY_COLORS[template.category] ?? '#F3F4F6', color: '#3D3450' }}
                    >
                      {template.category}
                    </span>
                  )}
                  {template.isDefault && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EDE5F4', color: '#5D4AA8' }}>
                      Default
                    </span>
                  )}
                </div>
                {template.description && (
                  <p className="text-xs mb-1.5" style={{ color: '#7A7090' }}>{template.description}</p>
                )}
                <p className="text-xs line-clamp-3" style={{ color: '#7A7090' }}>
                  {template.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingTemplate ? 'Edit Template' : 'New Template'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. 24h Appointment Reminder"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional — describe when this template is used"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Channel</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as MessageType })}
              >
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
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
              <label className="block text-sm font-medium mb-1.5">Subject</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject line"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">Content *</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[140px] resize-none focus:outline-none focus:ring-2 focus:ring-[#5D4AA8]"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Hi {{clientName}}, this is a reminder about your appointment on {{appointmentDate}} at {{appointmentTime}}..."
            />
            <p className="text-xs mt-1" style={{ color: '#7A7090' }}>
              Merge tags: <code className="font-mono bg-gray-100 px-1 rounded">{'{{clientName}}'}</code>{' '}
              <code className="font-mono bg-gray-100 px-1 rounded">{'{{appointmentDate}}'}</code>{' '}
              <code className="font-mono bg-gray-100 px-1 rounded">{'{{appointmentTime}}'}</code>{' '}
              <code className="font-mono bg-gray-100 px-1 rounded">{'{{therapistName}}'}</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isDefault" className="text-sm" style={{ color: '#3D3450' }}>
              Set as default template for {formData.type}
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.content}
              style={{ background: 'linear-gradient(135deg, #5D4AA8, #3F2F87)', color: '#fff' }}
            >
              {editingTemplate ? 'Save Changes' : 'Create Template'}
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
              <label className="block text-sm font-medium mb-1.5">Subject</label>
              <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#F9F8FF', border: '1px solid #EFE9F2' }}>
                {previewContent.subject}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">Message</label>
            <div
              className="px-4 py-3 rounded-xl text-sm whitespace-pre-wrap"
              style={{ background: '#F3EFFD', border: '1px solid rgba(93,74,168,0.12)', color: '#1E1830' }}
            >
              {previewContent.content}
            </div>
          </div>
          <p className="text-xs" style={{ color: '#7A7090' }}>
            Preview uses sample data: John Doe, Jane Smith, Wellness Spa
          </p>
          <div className="flex justify-end pt-2 border-t border-gray-100">
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
