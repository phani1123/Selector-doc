'use client';

import { useState, useCallback } from 'react';
import { Annotation, AnnotationFormData, AnnotationState } from '@/types/annotation';

export function useAnnotations() {
  const [state, setState] = useState<AnnotationState>({
    annotations: [],
    selectedAnnotation: null,
    isCreating: false,
    editingAnnotation: null,
  });

  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }, []);

  const createAnnotation = useCallback((
    annotationData: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = new Date();
    const newAnnotation: Annotation = {
      ...annotationData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    setState(prev => ({
      ...prev,
      annotations: [...prev.annotations, newAnnotation],
      selectedAnnotation: newAnnotation,
      editingAnnotation: newAnnotation,
    }));

    return newAnnotation;
  }, [generateId]);

  const updateAnnotation = useCallback((id: string, data: AnnotationFormData) => {
    setState(prev => ({
      ...prev,
      annotations: prev.annotations.map(annotation =>
        annotation.id === id
          ? {
              ...annotation,
              ...data,
              updatedAt: new Date(),
            }
          : annotation
      ),
      selectedAnnotation: prev.selectedAnnotation?.id === id
        ? { ...prev.selectedAnnotation, ...data, updatedAt: new Date() }
        : prev.selectedAnnotation,
      editingAnnotation: null,
    }));
  }, []);

  const deleteAnnotation = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      annotations: prev.annotations.filter(annotation => annotation.id !== id),
      selectedAnnotation: prev.selectedAnnotation?.id === id ? null : prev.selectedAnnotation,
      editingAnnotation: prev.editingAnnotation?.id === id ? null : prev.editingAnnotation,
    }));
  }, []);

  const selectAnnotation = useCallback((annotation: Annotation | null) => {
    setState(prev => ({
      ...prev,
      selectedAnnotation: annotation,
      editingAnnotation: null,
    }));
  }, []);

  const setEditingAnnotation = useCallback((annotation: Annotation | null) => {
    setState(prev => ({
      ...prev,
      editingAnnotation: annotation,
    }));
  }, []);

  const setIsCreating = useCallback((isCreating: boolean) => {
    setState(prev => ({
      ...prev,
      isCreating,
    }));
  }, []);

  const clearAnnotations = useCallback(() => {
    setState({
      annotations: [],
      selectedAnnotation: null,
      isCreating: false,
      editingAnnotation: null,
    });
  }, []);

  const getAnnotationsForPage = useCallback((pageNumber: number) => {
    return state.annotations.filter(annotation => annotation.pageNumber === pageNumber);
  }, [state.annotations]);

  const getAnnotationStats = useCallback(() => {
    const total = state.annotations.length;
    const completed = state.annotations.filter(
      annotation => annotation.componentLabel && annotation.cssSelector
    ).length;
    const pages = new Set(state.annotations.map(annotation => annotation.pageNumber)).size;

    return { total, completed, incomplete: total - completed, pages };
  }, [state.annotations]);

  return {
    ...state,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    selectAnnotation,
    setEditingAnnotation,
    setIsCreating,
    clearAnnotations,
    getAnnotationsForPage,
    getAnnotationStats,
  };
}