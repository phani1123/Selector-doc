'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
// Dialog imports removed - not used in this component
import { Trash2, Edit, Save, X, Copy, Check } from 'lucide-react';
import { Annotation, AnnotationFormData } from '@/types/annotation';

interface AnnotationEditorProps {
  annotation: Annotation | null;
  onUpdate: (id: string, data: AnnotationFormData) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function AnnotationEditor({
  annotation,
  onUpdate,
  onDelete,
  onClose,
}: AnnotationEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AnnotationFormData>({
    componentLabel: '',
    cssSelector: '',
    description: '',
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (annotation) {
      setFormData({
        componentLabel: annotation.componentLabel,
        cssSelector: annotation.cssSelector,
        description: annotation.description || '',
      });
      setIsEditing(!annotation.componentLabel && !annotation.cssSelector);
    }
  }, [annotation]);

  const handleSave = () => {
    if (!annotation) return;
    
    if (!formData.componentLabel.trim() || !formData.cssSelector.trim()) {
      return;
    }
    
    onUpdate(annotation.id, formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (!annotation) return;
    
    setFormData({
      componentLabel: annotation.componentLabel,
      cssSelector: annotation.cssSelector,
      description: annotation.description || '',
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!annotation) return;
    onDelete(annotation.id);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const commonSelectorExamples = [
    { label: 'ID Selector', value: '#button-id' },
    { label: 'Class Selector', value: '.btn-primary' },
    { label: 'Attribute Selector', value: '[data-testid="login-btn"]' },
    { label: 'Type Selector', value: 'button' },
    { label: 'Descendant Selector', value: '.container .button' },
  ];

  if (!annotation) {
    return (
      <Card className="w-80">
        <CardContent className="p-6 text-center text-muted-foreground">
          Select an annotation to edit its properties
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Annotation Properties
          </CardTitle>
          <div className="flex items-center space-x-1">
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            Page {annotation.pageNumber}
          </Badge>
          <span>
            {Math.round(annotation.x * 100)}%,{' '}
            {Math.round(annotation.y * 100)}%
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="componentLabel">Component Label *</Label>
              <Input
                id="componentLabel"
                placeholder="e.g., Login Button"
                value={formData.componentLabel}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    componentLabel: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cssSelector">CSS/DOM Selector *</Label>
              <Input
                id="cssSelector"
                placeholder="e.g., #login-btn"
                value={formData.cssSelector}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    cssSelector: e.target.value,
                  }))
                }
              />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Examples:</p>
                <div className="grid grid-cols-1 gap-1">
                  {commonSelectorExamples.map((example) => (
                    <button
                      key={example.label}
                      className="text-left text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          cssSelector: example.value,
                        }))
                      }
                    >
                      {example.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional notes for developers/QA"
                value={formData.description}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!formData.componentLabel.trim() || !formData.cssSelector.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Component Label</Label>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {annotation.componentLabel || 'Not set'}
                  </p>
                  {annotation.componentLabel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(annotation.componentLabel, 'label')}
                    >
                      {copiedField === 'label' ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">CSS Selector</Label>
                <div className="flex items-center justify-between">
                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                    {annotation.cssSelector || 'Not set'}
                  </code>
                  {annotation.cssSelector && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(annotation.cssSelector, 'selector')}
                    >
                      {copiedField === 'selector' ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {annotation.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm">{annotation.description}</p>
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(annotation.createdAt).toLocaleString()}
                </p>
                {annotation.updatedAt !== annotation.createdAt && (
                  <p className="text-xs text-muted-foreground">
                    Updated: {new Date(annotation.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}