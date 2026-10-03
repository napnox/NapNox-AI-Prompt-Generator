import type React from 'react';
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
 * Icons live here rather than in the shared config so that the category
 * definitions stay plain JSON, readable by the PHP backend.
 */
export const CATEGORY_ICONS: Record<string, IconComponent> = {
  image: ImageIcon,
  portrait_transformer: PortraitIcon,
  writing: WritingIcon,
  code: CodeIcon,
  chat: ChatIcon,
  business: BusinessIcon,
  video: VideoIcon,
  education: EducationIcon,
  productivity: ProductivityIcon,
  seo: SeoIcon,
  design: DesignIcon,
  social_media: SocialMediaIcon,
  fashion: FashionIcon,
  art_style: ArtStyleIcon,
};
