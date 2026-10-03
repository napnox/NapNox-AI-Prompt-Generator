import type React from 'react';
import { PREDEFINED_CATEGORIES } from '../../constants';
import type { CategoryID } from '../../types';
import {
  ImageIcon,
  WritingIcon,
  CodeIcon,
  VideoIcon,
  ChatIcon,
  BusinessIcon,
  PortraitIcon,
  EducationIcon,
  ProductivityIcon,
  SeoIcon,
  DesignIcon,
  SocialMediaIcon,
  FashionIcon,
  ArtStyleIcon,
} from './CategoryIcons';

type IconComponent = React.ComponentType<{ className?: string }>;

/**
 * Icons live here rather than in `constants.ts` so that the category
 * definitions (and the prompt templates they carry) stay free of React
 * imports and can be reused by the server-side `/api/generate` handler.
 */
export const CATEGORY_ICONS: Record<CategoryID, IconComponent> = {
  [PREDEFINED_CATEGORIES.IMAGE]: ImageIcon,
  [PREDEFINED_CATEGORIES.PORTRAIT_TRANSFORMER]: PortraitIcon,
  [PREDEFINED_CATEGORIES.WRITING]: WritingIcon,
  [PREDEFINED_CATEGORIES.CODE]: CodeIcon,
  [PREDEFINED_CATEGORIES.CHAT]: ChatIcon,
  [PREDEFINED_CATEGORIES.BUSINESS]: BusinessIcon,
  [PREDEFINED_CATEGORIES.VIDEO]: VideoIcon,
  [PREDEFINED_CATEGORIES.EDUCATION]: EducationIcon,
  [PREDEFINED_CATEGORIES.PRODUCTIVITY]: ProductivityIcon,
  [PREDEFINED_CATEGORIES.SEO]: SeoIcon,
  [PREDEFINED_CATEGORIES.DESIGN]: DesignIcon,
  [PREDEFINED_CATEGORIES.SOCIAL_MEDIA]: SocialMediaIcon,
  [PREDEFINED_CATEGORIES.FASHION]: FashionIcon,
  [PREDEFINED_CATEGORIES.ART_STYLE]: ArtStyleIcon,
};
