import type { Category } from './types';
import {
  ImageIcon,
  WritingIcon,
  CodeIcon,
  VideoIcon,
  ChatIcon,
  BusinessIcon,
  MusicIcon,
  EducationIcon,
  ProductivityIcon,
  SeoIcon,
  DesignIcon,
  SocialMediaIcon,
  FashionIcon,
  ArtStyleIcon,
} from './components/icons/CategoryIcons';

export const PREDEFINED_CATEGORIES = {
  IMAGE: 'image',
  WRITING: 'writing',
  CODE: 'code',
  CHAT: 'chat',
  BUSINESS: 'business',
  VIDEO: 'video',
  MUSIC: 'music',
  EDUCATION: 'education',
  PRODUCTIVITY: 'productivity',
  SEO: 'seo',
  DESIGN: 'design',
  SOCIAL_MEDIA: 'social_media',
  FASHION: 'fashion',
  ART_STYLE: 'art_style',
} as const;

export const CATEGORIES: Category[] = [
  {
    id: PREDEFINED_CATEGORIES.IMAGE,
    name: 'Image',
    description: 'Create detailed prompts for image generation AIs.',
    icon: ImageIcon,
    subtypes: ['Photorealistic', 'Digital Art', 'Illustration', '3D Render', 'Logo', 'Concept Art', 'Architectural Viz', 'Character Design'],
    filters: [
      { id: 'style', label: 'Art Style', type: 'select', options: [
        { value: 'cinematic', label: 'Cinematic' }, 
        { value: 'cyberpunk', label: 'Cyberpunk' }, 
        { value: 'fantasy', label: 'Fantasy' }, 
        { value: 'anime', label: 'Anime' },
        { value: 'steampunk', label: 'Steampunk' },
        { value: 'vaporwave', label: 'Vaporwave' },
        { value: 'minimalist', label: 'Minimalist' },
        { value: 'impressionistic', label: 'Impressionistic' },
      ]},
      { id: 'mood', label: 'Mood', type: 'select', options: [
        { value: 'dramatic', label: 'Dramatic' }, 
        { value: 'cheerful', label: 'Cheerful' }, 
        { value: 'mysterious', label: 'Mysterious' },
        { value: 'serene', label: 'Serene' },
        { value: 'energetic', label: 'Energetic' },
        { value: 'nostalgic', label: 'Nostalgic' },
        { value: 'ominous', label: 'Ominous' },
        { value: 'epic', label: 'Epic' },
      ]},
      { id: 'camera', label: 'Camera Details', type: 'textarea', placeholder: 'e.g., aerial view, 85mm lens, f/1.8' },
      { id: 'negativeKeywords', label: 'Negative Keywords', type: 'textarea', placeholder: 'e.g., ugly, blurry, watermark' },
    ],
    platform: {
      id: 'platform',
      label: 'Target Platform',
      options: [
        { value: 'Midjourney', label: 'Midjourney' },
        { value: 'DALL-E 3', label: 'DALL-E 3' },
        { value: 'Stable Diffusion', label: 'Stable Diffusion' },
        { value: 'Leonardo AI', label: 'Leonardo AI' },
        { value: 'Adobe Firefly', label: 'Adobe Firefly' },
        { value: 'Ideogram', label: 'Ideogram' },
        { value: 'Playground AI', label: 'Playground AI' },
      ],
    },
    template: `As an expert prompt engineer for {{platform}}, generate {{numVariations}} distinct, highly detailed prompts based on the following idea. Each prompt must be a ready-to-use, single block of text and structured with bold headings.

**Core Idea:** "{{inputText}}"
**Subtype:** {{subtype}}
**Style:** {{style}}
**Mood:** {{mood}}

For each variation, create a complete prompt with these sections:
- **Concept:** A single, powerful sentence capturing the artistic vision.
- **Visual Description:** A detailed paragraph describing the subject, environment, composition, and key visual elements.
- **Style & Mood:** A description of the artistic style, overall mood, color palette, and lighting.
- **Technical Specs:** Specific camera angles, lens types, and any relevant platform-specific parameters (e.g., --ar 16:9). Include: "{{camera}}".
- **Negative Prompt (optional):** Mention things to avoid, like "{{negativeKeywords}}".

Finally, provide 5 relevant, SEO-friendly tags for the generated image.`,
  },
  {
    id: PREDEFINED_CATEGORIES.WRITING,
    name: 'Writing',
    description: 'Craft prompts for articles, stories, and other written content.',
    icon: WritingIcon,
    subtypes: ['Blog Post', 'Short Story', 'Marketing Copy', 'Email', 'Poem', 'Technical Documentation', 'Script/Screenplay', 'Academic Paper'],
    filters: [
        { id: 'tone', label: 'Tone of Voice', type: 'select', options: [
            { value: 'professional', label: 'Professional' }, 
            { value: 'casual', label: 'Casual' }, 
            { value: 'humorous', label: 'Humorous' },
            { value: 'empathetic', label: 'Empathetic' },
            { value: 'authoritative', label: 'Authoritative' },
            { value: 'inspirational', label: 'Inspirational' },
            { value: 'witty', label: 'Witty' },
        ]},
        { id: 'audience', label: 'Target Audience', type: 'textarea', placeholder: 'e.g., developers, marketing managers' },
        { id: 'keywords', label: 'SEO Keywords', type: 'textarea', placeholder: 'e.g., AI, prompt engineering' },
    ],
    platform: {
      id: 'platform',
      label: 'Target Model',
      options: [
        { value: 'Gemini Pro', label: 'Gemini Pro' },
        { value: 'ChatGPT-4', label: 'ChatGPT-4' },
        { value: 'Claude 3', label: 'Claude 3' },
        { value: 'Llama 3', label: 'Llama 3' },
        { value: 'Perplexity', label: 'Perplexity' },
        { value: 'Cohere Command R+', label: 'Cohere Command R+' },
      ],
    },
    template: `As an expert content strategist for {{platform}}, generate {{numVariations}} detailed writing prompts based on the following request. Each prompt must be a complete, ready-to-use instruction for an LLM.

**Core Idea:** "{{inputText}}"
**Content Type:** {{subtype}}
**Tone:** {{tone}}
**Audience:** {{audience}}

For each variation, create a complete prompt with these sections:
- **Goal:** A clear, one-sentence objective for the written piece.
- **Content Outline:** A structured outline with key sections, headings, or plot points.
- **Key Instructions:** Specific directions on what to include, such as calls-to-action, data points, or character motivations.
- **Constraints:** Any limitations, such as word count, reading level, or topics to avoid.
- **SEO Keywords:** A list of keywords to naturally integrate: "{{keywords}}".

Finally, provide 5 relevant tags for the topic.`,
  },
    {
    id: PREDEFINED_CATEGORIES.CODE,
    name: 'Code',
    description: 'Generate programming-related prompts for snippets and logic.',
    icon: CodeIcon,
    subtypes: ['Function', 'Component', 'Algorithm', 'Test Case', 'Query', 'API Endpoint', 'Class/Object', 'Regex Pattern'],
    filters: [
        { id: 'language', label: 'Programming Language', type: 'select', options: [
            { value: 'javascript', label: 'JavaScript' }, 
            { value: 'python', label: 'Python' }, 
            { value: 'java', label: 'Java' }, 
            { value: 'csharp', label: 'C#' },
            { value: 'typescript', label: 'TypeScript' },
            { value: 'go', label: 'Go' },
            { value: 'rust', label: 'Rust' },
            { value: 'sql', label: 'SQL' },
            { value: 'php', label: 'PHP' },
        ]},
        { id: 'framework', label: 'Framework/Library', type: 'textarea', placeholder: 'e.g., React, Django, .NET' },
    ],
    platform: {
      id: 'platform',
      label: 'Target Model',
      options: [
        { value: 'Gemini Pro', label: 'Gemini Pro' },
        { value: 'GitHub Copilot', label: 'GitHub Copilot' },
        { value: 'ChatGPT-4 Code Interpreter', label: 'ChatGPT-4 Code Interpreter' },
        { value: 'Replit Ghostwriter', label: 'Replit Ghostwriter' },
        { value: 'Amazon CodeWhisperer', label: 'Amazon CodeWhisperer' },
      ],
    },
    template: `As a senior software architect, generate {{numVariations}} precise coding prompts for {{platform}}. Each prompt must be a clear, actionable instruction for a coding AI.

**Task:** "{{inputText}}"
**Code Type:** {{subtype}}
**Language:** {{language}}
**Framework/Library:** {{framework}}

For each variation, create a complete prompt with these sections:
- **Objective:** A concise summary of what the code should accomplish.
- **Input/Output:** Clear definitions of expected inputs (parameters, data types) and the desired output (return value, side effects).
- **Requirements:** A list of specific requirements, constraints, or logic to be implemented.
- **Edge Cases:** Examples of edge cases or error conditions that the code should handle.
- **Example:** A simple example of how the {{subtype}} should be called or used.

Finally, provide 5 relevant technical tags.`,
  },
  {
    id: PREDEFINED_CATEGORIES.VIDEO,
    name: 'Video',
    description: 'Design prompts for video script ideas and storyboards.',
    icon: VideoIcon,
    subtypes: ['YouTube Script', 'Short Film Idea', 'Ad Script', 'Explainer Video', 'Music Video Concept', 'Documentary Treatment', 'B-Roll Shot List'],
    filters: [
        { id: 'duration', label: 'Target Duration', type: 'select', options: [
            { value: 'short (<15 sec)', label: 'Very Short (<15 sec)' },
            { value: 'short (15-60 sec)', label: 'Short (15-60 sec)' }, 
            { value: 'medium (1-5 min)', label: 'Medium (1-5 min)' }, 
            { value: 'long (>5 min)', label: 'Long (>5 min)' }
        ]},
        { id: 'style', label: 'Video Style', type: 'textarea', placeholder: 'e.g., documentary, vlog, cinematic, fast-paced commercial' },
    ],
    platform: {
      id: 'platform',
      label: 'Target Platform',
      options: [
        { value: 'Pika Labs', label: 'Pika Labs' },
        { value: 'Sora', label: 'Sora' },
        { value: 'RunwayML', label: 'RunwayML' },
        { value: 'YouTube', label: 'YouTube' },
        { value: 'TikTok', label: 'TikTok' },
        { value: 'Instagram Reels', label: 'Instagram Reels' },
      ],
    },
    template: `As a creative director for video production, generate {{numVariations}} detailed video prompts for {{platform}}. Each prompt must be a complete, cinematic description ready for a video generation AI.

**Core Idea:** "{{inputText}}"
**Video Type:** {{subtype}}
**Style:** {{style}}
**Duration:** {{duration}}

For each variation, create a complete prompt with these sections:
- **Concept:** A one-sentence summary of the video's story or message.
- **Visual Description:** A detailed paragraph describing the scene, characters, action, and environment.
- **Cinematography:** Specific details on camera shots (e.g., wide shot, close-up), camera movement, and lighting.
- **Pacing & Mood:** Instructions on the video's pacing (e.g., fast-paced, slow motion) and the desired emotional mood.
- **Audio Cues:** Suggestions for sound effects or background music style.

Finally, provide 5 relevant tags for the video content.`,
  },
  {
    id: PREDEFINED_CATEGORIES.CHAT,
    name: 'Chatbot',
    description: 'Define personas and instructions for conversational AIs.',
    icon: ChatIcon,
    subtypes: ['Customer Support', 'Personal Assistant', 'Tutor', 'Roleplay Character', 'Onboarding Guide', 'Sales Agent', 'FAQ Bot'],
    filters: [
        { id: 'persona', label: 'Bot Persona', type: 'textarea', placeholder: 'e.g., a friendly and helpful guide, a witty Shakespearean poet' },
        { id: 'constraints', label: 'Rules & Constraints', type: 'textarea', placeholder: 'e.g., never give financial advice, must always talk in rhymes' },
    ],
    platform: {
      id: 'platform',
      label: 'Target System',
      options: [
        { value: 'Custom LLM', label: 'Custom LLM' },
        { value: 'Chatbot Platform', label: 'Chatbot Platform' },
        { value: 'Dialogflow', label: 'Dialogflow' },
        { value: 'Rasa', label: 'Rasa' },
        { value: 'Microsoft Bot Framework', label: 'Microsoft Bot Framework' },
        { value: 'Voiceflow', label: 'Voiceflow' },
      ],
    },
    template: `As a conversational AI designer, generate {{numVariations}} comprehensive system prompts for a {{platform}} chatbot.

**Core Function:** "{{inputText}}"
**Chatbot Type:** {{subtype}}

For each variation, create a complete system prompt with these sections:
- **Persona:** A detailed description of the chatbot's personality, tone, and communication style. Embody this persona: "{{persona}}".
- **Core Directives:** A clear list of the chatbot's primary goals and responsibilities.
- **Behavioral Rules:** Specific rules the chatbot must always follow (e.g., "Always be polite," "Never break character").
- **Constraints & Guardrails:** Strict limitations on what the chatbot is not allowed to do or discuss. Enforce these constraints: "{{constraints}}".
- **Example Opening:** A sample opening line that perfectly captures the chatbot's persona.

Finally, provide 5 tags describing the chatbot's function.`,
  },
  {
    id: PREDEFINED_CATEGORIES.BUSINESS,
    name: 'Business',
    description: 'Prompts for business plans, emails, and marketing strategies.',
    icon: BusinessIcon,
    subtypes: ['Business Plan', 'SWOT Analysis', 'Marketing Strategy', 'Press Release', 'Executive Summary', 'Pitch Deck Outline', 'User Persona'],
    filters: [
        { id: 'industry', label: 'Industry', type: 'textarea', placeholder: 'e.g., SaaS, retail, healthcare' },
        { id: 'company', label: 'Company Name (optional)', type: 'textarea', placeholder: 'e.g., NapNox Inc.' },
    ],
    platform: {
      id: 'platform',
      label: 'Context',
      options: [
        { value: 'Internal', label: 'Internal Use' },
        { value: 'External', label: 'External / Public' },
        { value: 'Investor Pitch', label: 'Investor Pitch' },
        { value: 'Board Meeting', label: 'Board Meeting' },
        { value: 'Team Brainstorm', label: 'Team Brainstorm' },
      ],
    },
    template: `As a senior business consultant, generate {{numVariations}} detailed prompts for creating a business document.

**Topic:** "{{inputText}}"
**Document Type:** {{subtype}}
**Industry:** {{industry}}
**Company:** {{company}}
**Context:** {{platform}}

For each variation, create a complete prompt with these sections:
- **Objective:** The primary goal of the document.
- **Target Audience:** Who the document is intended for.
- **Key Sections:** A structured outline of the required sections (e.g., for a Business Plan: Executive Summary, Market Analysis, Financial Projections).
- **Critical Information:** Specific questions to answer or data points to include in each section.
- **Formatting Instructions:** Guidelines on tone of voice, length, and presentation style.

Finally, provide 5 relevant business tags.`,
  },
  {
    id: PREDEFINED_CATEGORIES.MUSIC,
    name: 'Music',
    description: 'Generate prompts for song composition and audio creation.',
    icon: MusicIcon,
    subtypes: ['Song Composition', 'Ambient Track', 'Voiceover Script', 'Sound Effect', 'Film Score', 'Podcast Intro/Outro', 'Ad Jingle'],
    filters: [
      { id: 'genre', label: 'Genre', type: 'select', options: [
          { value: 'electronic', label: 'Electronic' }, 
          { value: 'orchestral', label: 'Orchestral' }, 
          { value: 'lo-fi', label: 'Lo-fi' }, 
          { value: 'rock', label: 'Rock' },
          { value: 'hip hop', label: 'Hip Hop' },
          { value: 'jazz', label: 'Jazz' },
          { value: 'cinematic', label: 'Cinematic' },
          { value: 'synthwave', label: 'Synthwave' },
      ]},
      { id: 'mood', label: 'Mood', type: 'select', options: [
          { value: 'uplifting', label: 'Uplifting' }, 
          { value: 'melancholic', label: 'Melancholic' }, 
          { value: 'tense', label: 'Tense' },
          { value: 'epic', label: 'Epic' },
          { value: 'relaxing', label: 'Relaxing' },
          { value: 'suspenseful', label: 'Suspenseful' },
          { value: 'driving', label: 'Driving' },
      ]},
      { id: 'tempo', label: 'Tempo', type: 'textarea', placeholder: 'e.g., 120 BPM, slow, fast' },
    ],
    platform: {
      id: 'platform',
      label: 'Target AI',
      options: [
          { value: 'Suno', label: 'Suno' }, 
          { value: 'Udio', label: 'Udio' }, 
          { value: 'ElevenLabs', label: 'ElevenLabs' },
          { value: 'AIVA', label: 'AIVA' },
          { value: 'Soundraw', label: 'Soundraw' },
      ],
    },
    template: `As a music producer, generate {{numVariations}} detailed prompts for an AI music generator like {{platform}}.

**Core Idea:** "{{inputText}}"
**Type:** {{subtype}}
**Genre:** {{genre}}
**Mood:** {{mood}}
**Tempo:** {{tempo}}

For each variation, create a complete prompt with these sections:
- **Concept:** A one-sentence artistic vision for the audio piece.
- **Musical Structure:** A description of the composition's structure (e.g., intro, verse, chorus, bridge, outro).
- **Instrumentation:** A list of key instruments to be featured (e.g., synth pads, acoustic guitar, heavy drums).
- **Melody & Harmony:** Guidance on the melodic style and harmonic complexity.
- **Production Notes:** Details on production style (e.g., clean, distorted, atmospheric).

Finally, provide 5 relevant tags for the music track.`,
  },
  {
    id: PREDEFINED_CATEGORIES.EDUCATION,
    name: 'Education',
    description: 'Prompts for lesson plans, quizzes, and learning materials.',
    icon: EducationIcon,
    subtypes: ['Lesson Plan', 'Quiz', 'Study Guide', 'Language Practice', 'Course Outline', 'Essay Prompt', 'Flashcard Set'],
    filters: [
      { id: 'level', label: 'Grade Level', type: 'select', options: [
          { value: 'elementary', label: 'Elementary' }, 
          { value: 'middle school', label: 'Middle School' },
          { value: 'high school', label: 'High School' }, 
          { value: 'university', label: 'University' },
          { value: 'postgraduate', label: 'Postgraduate' },
      ]},
      { id: 'difficulty', label: 'Difficulty', type: 'select', options: [
          { value: 'beginner', label: 'Beginner' }, 
          { value: 'intermediate', label: 'Intermediate' }, 
          { value: 'advanced', label: 'Advanced' },
          { value: 'expert', label: 'Expert' },
      ]},
    ],
    platform: {
      id: 'platform',
      label: 'Target Audience',
      options: [
          { value: 'Students', label: 'Students' }, 
          { value: 'Teachers', label: 'Teachers' },
          { value: 'Self-Learners', label: 'Self-Learners' },
          { value: 'Corporate Trainees', label: 'Corporate Trainees' },
      ],
    },
    template: `As an instructional designer, generate {{numVariations}} detailed prompts for educational content.

**Topic:** "{{inputText}}"
**Content Type:** {{subtype}}
**Level:** {{level}}
**Difficulty:** {{difficulty}}

For each variation, create a complete prompt with these sections:
- **Learning Objective:** What the user should know or be able to do after this activity.
- **Content Structure:** An outline of the material, including key topics, sections, or question types.
- **Activity Description:** Specific instructions for the learning activity or assessment.
- **Engagement Strategy:** Ideas to make the content more engaging and interactive.
- **Assessment Criteria:** How to evaluate the user's understanding or performance.

Finally, provide 5 relevant educational tags.`,
  },
  {
    id: PREDEFINED_CATEGORIES.PRODUCTIVITY,
    name: 'Productivity',
    description: 'Prompts for resumes, interview prep, and goal setting.',
    icon: ProductivityIcon,
    subtypes: ['Resume Bullets', 'Interview Prep', 'Daily Planner', 'Goal Setting', 'Cover Letter', 'Meeting Agenda', 'Project Plan'],
    filters: [
      { id: 'role', label: 'Job Role', type: 'textarea', placeholder: 'e.g., Software Engineer, Project Manager' },
      { id: 'industry', label: 'Industry', type: 'textarea', placeholder: 'e.g., Tech, Finance, Healthcare' },
      { id: 'tone', label: 'Tone', type: 'select', options: [
          { value: 'formal', label: 'Formal' }, 
          { value: 'action-oriented', label: 'Action-Oriented' }, 
          { value: 'inspirational', label: 'Inspirational' },
          { value: 'concise', label: 'Concise' },
          { value: 'persuasive', label: 'Persuasive' },
      ]},
    ],
    platform: {
      id: 'platform',
      label: 'Context',
      options: [
          { value: 'Personal Use', label: 'Personal Use' }, 
          { value: 'Professional Application', label: 'Professional Application' },
          { value: 'Team Collaboration', label: 'Team Collaboration' },
          { value: 'Job Application', label: 'Job Application' },
      ],
    },
    template: `As a career coach, generate {{numVariations}} powerful prompts for productivity and career development.

**Task:** "{{inputText}}"
**Type:** {{subtype}}
**Role:** {{role}}
**Industry:** {{industry}}
**Tone:** {{tone}}

For each variation, create a complete prompt with these sections:
- **Objective:** The specific goal of the task.
- **Key Information:** The essential details the user needs to provide or consider.
- **Structure/Format:** A clear format for the output (e.g., STAR method for resume bullets, a daily schedule template).
- **Guiding Questions:** Questions to help the user think critically and provide high-quality input.
- **Success Criteria:** What a successful outcome looks like.

Finally, provide 5 relevant tags for career development.`,
  },
  {
    id: PREDEFINED_CATEGORIES.SEO,
    name: 'SEO',
    description: 'Generate prompts for SEO-optimized content and strategies.',
    icon: SeoIcon,
    subtypes: ['Blog Outline', 'Meta Descriptions', 'FAQ Schema', 'Keyword Clustering', 'Topic Cluster Strategy', 'Content Brief'],
    filters: [
      { id: 'keyword', label: 'Target Keyword', type: 'textarea', placeholder: 'e.g., "AI prompt generator"' },
      { id: 'intent', label: 'Search Intent', type: 'select', options: [
          { value: 'informational', label: 'Informational' }, 
          { value: 'transactional', label: 'Transactional' }, 
          { value: 'navigational', label: 'Navigational' },
          { value: 'commercial investigation', label: 'Commercial Investigation' },
      ]},
      { id: 'wordCount', label: 'Target Word Count', type: 'textarea', placeholder: 'e.g., 1500 words' },
    ],
    platform: {
      id: 'platform',
      label: 'Target Tool/Model',
      options: [
          { value: 'Gemini Advanced', label: 'Gemini Advanced' }, 
          { value: 'ChatGPT-4', label: 'ChatGPT-4' },
          { value: 'SurferSEO', label: 'SurferSEO' },
          { value: 'Frase.io', label: 'Frase.io' },
          { value: 'MarketMuse', label: 'MarketMuse' },
      ],
    },
    template: `As an SEO specialist, generate {{numVariations}} detailed prompts for creating SEO-optimized content using {{platform}}.

**Core Task:** "{{inputText}}"
**Content Type:** {{subtype}}
**Primary Keyword:** {{keyword}}
**Search Intent:** {{intent}}
**Word Count:** {{wordCount}}

For each variation, create a complete prompt with these sections:
- **Objective:** The main goal of the content from an SEO perspective.
- **Content Structure:** A detailed outline including H1, H2, and H3 headings that target the primary keyword and related subtopics.
- **Semantic Keywords:** A list of LSI (Latent Semantic Indexing) keywords to include naturally within the content.
- **On-Page SEO Elements:** Instructions for creating the title tag, meta description, and image alt-text.
- **Internal/External Linking:** Suggestions for relevant internal and external links.

Finally, provide 5 relevant SEO and content marketing tags.`,
  },
  {
    id: PREDEFINED_CATEGORIES.DESIGN,
    name: 'Design',
    description: 'Prompts for logos, UI mockups, and branding concepts.',
    icon: DesignIcon,
    subtypes: ['Logo Concepts', 'UI Mockup', 'Moodboard', 'Typography Pairing', 'Icon Set', 'Brand Style Guide', 'Website Landing Page'],
    filters: [
      { id: 'personality', label: 'Brand Personality', type: 'textarea', placeholder: 'e.g., minimalist, rugged, playful' },
      { id: 'colors', label: 'Color Palette', type: 'textarea', placeholder: 'e.g., earthy tones, neon pastels' },
      { id: 'industry', label: 'Industry', type: 'textarea', placeholder: 'e.g., coffee shop, tech startup' },
    ],
    platform: {
      id: 'platform',
      label: 'Target AI/Tool',
      options: [
          { value: 'Midjourney', label: 'Midjourney' }, 
          { value: 'Ideogram', label: 'Ideogram' }, 
          { value: 'Figma (for ideas)', label: 'Figma (for ideas)' },
          { value: 'Adobe Firefly', label: 'Adobe Firefly' },
          { value: 'Canva Magic Design', label: 'Canva Magic Design' },
          { value: 'Spline (3D)', label: 'Spline (3D)' },
      ],
    },
    template: `As a brand designer, generate {{numVariations}} detailed prompts for {{platform}} to create design assets.

**Core Idea:** "{{inputText}}"
**Asset Type:** {{subtype}}
**Brand Personality:** {{personality}}
**Color Palette:** {{colors}}
**Industry:** {{industry}}

For each variation, create a complete prompt with these sections:
- **Concept:** A one-sentence summary of the design's core idea.
- **Visual Description:** A detailed paragraph describing the desired visuals, shapes, and composition.
- **Style & Aesthetic:** The overall design style (e.g., flat design, brutalism, art deco).
- **Key Elements:** A list of mandatory elements to include.
- **Inspiration:** Mention of any artists, brands, or movements to draw inspiration from.

Finally, provide 5 relevant design tags.`,
  },
  {
    id: PREDEFINED_CATEGORIES.SOCIAL_MEDIA,
    name: 'Social Media',
    description: 'Prompts for TikTok scripts, Instagram captions, and Twitter threads.',
    icon: SocialMediaIcon,
    subtypes: ['Instagram Caption', 'Twitter Thread', 'TikTok Script', 'LinkedIn Post', 'YouTube Video Idea', 'Pinterest Pin Description'],
    filters: [
      { id: 'tone', label: 'Tone', type: 'select', options: [
          { value: 'witty', label: 'Witty' }, 
          { value: 'inspirational', label: 'Inspirational' }, 
          { value: 'educational', label: 'Educational' },
          { value: 'provocative', label: 'Provocative' },
          { value: 'humorous', label: 'Humorous' },
          { value: 'authentic', label: 'Authentic' },
      ]},
      { id: 'cta', label: 'Call to Action', type: 'textarea', placeholder: 'e.g., "Link in bio!", "What do you think?"' },
    ],
    platform: {
      id: 'platform',
      label: 'Target Platform',
      options: [
          { value: 'Instagram', label: 'Instagram' }, 
          { value: 'X (Twitter)', label: 'X (Twitter)' }, 
          { value: 'TikTok', label: 'TikTok' }, 
          { value: 'LinkedIn', label: 'LinkedIn' },
          { value: 'YouTube', label: 'YouTube' },
          { value: 'Facebook', label: 'Facebook' },
          { value: 'Pinterest', label: 'Pinterest' },
          { value: 'Threads', label: 'Threads' },
      ],
    },
    template: `As a social media manager, generate {{numVariations}} engaging content prompts for {{platform}}.

**Topic:** "{{inputText}}"
**Post Type:** {{subtype}}
**Tone:** {{tone}}

For each variation, create a complete prompt with these sections:
- **Hook:** A powerful opening sentence to grab attention.
- **Core Message:** The main body of the content, structured for the specific platform (e.g., numbered list for a thread, key points for a caption).
- **Call to Action (CTA):** A clear instruction for the audience. Use this CTA: "{{cta}}".
- **Hashtags:** A list of 5-7 relevant and trending hashtags.
- **Visual Idea (optional):** A suggestion for a complementary image or video.

Finally, provide 5 relevant tags for the content.`,
  },
  {
    id: PREDEFINED_CATEGORIES.FASHION,
    name: 'Fashion',
    description: 'Prompts for editorial photography, outfit design, and concepts.',
    icon: FashionIcon,
    subtypes: ['Editorial Photoshoot', 'Outfit Design', 'Model Pose', 'Fabric Concept', 'Accessory Design', 'Lookbook Concept'],
    filters: [
      { id: 'season', label: 'Season', type: 'select', options: [
          { value: 'spring/summer', label: 'Spring/Summer' }, 
          { value: 'fall/winter', label: 'Fall/Winter' },
          { value: 'resort', label: 'Resort' },
          { value: 'pre-fall', label: 'Pre-Fall' },
      ]},
      { id: 'era', label: 'Era/Influence', type: 'textarea', placeholder: 'e.g., 1970s disco, futuristic, Gorpcore' },
      { id: 'look', label: 'Look', type: 'select', options: [
          { value: 'editorial', label: 'Editorial' }, 
          { value: 'streetwear', label: 'Streetwear' }, 
          { value: 'haute couture', label: 'Haute Couture' },
          { value: 'minimalist', label: 'Minimalist' },
          { value: 'bohemian', label: 'Bohemian' },
          { value: 'athleisure', label: 'Athleisure' },
      ]},
    ],
    platform: {
      id: 'platform',
      label: 'Target AI',
      options: [
          { value: 'Midjourney', label: 'Midjourney' }, 
          { value: 'DALL-E 3', label: 'DALL-E 3' },
          { value: 'Leonardo AI', label: 'Leonardo AI' },
          { value: 'Adobe Firefly', label: 'Adobe Firefly' },
      ],
    },
    template: `As a fashion director, generate {{numVariations}} high-fashion prompts for {{platform}}.

**Core Idea:** "{{inputText}}"
**Type:** {{subtype}}
**Look:** {{look}}
**Season:** {{season}}
**Influence:** {{era}}

For each variation, create a complete prompt with these sections:
- **Concept:** A one-sentence creative vision for the fashion image.
- **Wardrobe & Styling:** A detailed description of the clothing, accessories, hair, and makeup.
- **Setting & Environment:** A description of the background and location.
- **Lighting & Photography:** Specific instructions for lighting (e.g., dramatic studio lighting, golden hour) and camera details.
- **Model & Pose:** Guidance on the model's expression and pose to convey the desired mood.

Finally, provide 5 relevant fashion tags.`,
  },
  {
    id: PREDEFINED_CATEGORIES.ART_STYLE,
    name: 'Art Style',
    description: 'Explore and generate prompts for specific art styles.',
    icon: ArtStyleIcon,
    subtypes: ['Cyberpunk', 'Fantasy', 'Realism', 'Abstract', '3D Render', 'Surrealism', 'Impressionism', 'Minimalism', 'Pop Art', 'Vaporwave'],
    filters: [
      { id: 'detail', label: 'Detail Level', type: 'select', options: [
          { value: 'minimalist', label: 'Minimalist' }, 
          { value: 'highly detailed', label: 'Highly Detailed' }, 
          { value: 'intricate', label: 'Intricate' },
          { value: 'graphic', label: 'Graphic' },
      ]},
      { id: 'influences', label: 'Artist Influences', type: 'textarea', placeholder: 'e.g., by H.R. Giger, by Studio Ghibli' },
    ],
    platform: {
      id: 'platform',
      label: 'Target AI',
      options: [
          { value: 'Midjourney', label: 'Midjourney' }, 
          { value: 'Leonardo AI', label: 'Leonardo AI' }, 
          { value: 'Stable Diffusion', label: 'Stable Diffusion' },
          { value: 'DALL-E 3', label: 'DALL-E 3' },
          { value: 'NightCafe', label: 'NightCafe' },
      ],
    },
    template: `As an art historian and prompt engineer, generate {{numVariations}} detailed prompts for {{platform}} to create art in a specific style.

**Subject:** "{{inputText}}"
**Art Style:** {{subtype}}
**Detail Level:** {{detail}}
**Influences:** {{influences}}

For each variation, create a complete prompt with these sections:
- **Concept:** A one-sentence summary of the artwork's theme.
- **Composition & Subject:** A detailed description of the main subject and how it is composed within the frame.
- **Style Execution:** Specific instructions on how to apply the {{subtype}} style, including key visual motifs, techniques, and textures.
- **Color & Lighting:** Guidance on the color palette and lighting that are characteristic of the chosen style.
- **Technical Details:** Any relevant camera or rendering parameters to enhance the style.

Finally, provide 5 relevant tags for the art style and subject.`,
  },
];
