import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AboutPageDocument = HydratedDocument<AboutPage>;

export interface AboutHero {
  eyebrow: string;
  title: string;
  subtitle: string;
  mediaId: Types.ObjectId | null;
}

export interface AboutStory {
  heading: string;
  contentHtml: string;
  mediaId: Types.ObjectId | null;
}

export interface AboutPhilosophyItem {
  title: string;
  description: string;
}

export interface AboutPhilosophy {
  heading: string;
  items: AboutPhilosophyItem[];
}

export interface AboutTeamMember {
  name: string;
  role: string;
  bio: string;
  mediaId: Types.ObjectId | null;
}

export interface AboutTeam {
  enabled: boolean;
  heading: string;
  members: AboutTeamMember[];
}

export interface AboutMetric {
  value: string;
  label: string;
}

export interface AboutBookingCta {
  heading: string;
  description: string;
  buttonLabel: string;
}

export interface AboutSeo {
  title: string;
  description: string;
  ogImageMediaId: Types.ObjectId | null;
}

const heroSchema = {
  _id: false,
  eyebrow: { type: String, default: 'Studio', trim: true, maxlength: 120 },
  title: { type: String, default: 'Gioi thieu', trim: true, maxlength: 160 },
  subtitle: { type: String, default: '', trim: true, maxlength: 500 },
  mediaId: { type: Types.ObjectId, ref: 'Media', default: null },
};

const storySchema = {
  _id: false,
  heading: { type: String, default: 'Cau chuyen Studio', trim: true, maxlength: 160 },
  contentHtml: { type: String, default: '', maxlength: 100000 },
  mediaId: { type: Types.ObjectId, ref: 'Media', default: null },
};

const philosophyItemSchema = {
  _id: false,
  title: { type: String, default: '', trim: true, maxlength: 120 },
  description: { type: String, default: '', trim: true, maxlength: 500 },
};

const philosophySchema = {
  _id: false,
  heading: { type: String, default: 'Triet ly hinh anh', trim: true, maxlength: 160 },
  items: { type: [philosophyItemSchema], default: [] },
};

const teamMemberSchema = {
  _id: false,
  name: { type: String, default: '', trim: true, maxlength: 120 },
  role: { type: String, default: '', trim: true, maxlength: 120 },
  bio: { type: String, default: '', trim: true, maxlength: 1000 },
  mediaId: { type: Types.ObjectId, ref: 'Media', default: null },
};

const teamSchema = {
  _id: false,
  enabled: { type: Boolean, default: false },
  heading: { type: String, default: 'Doi ngu', trim: true, maxlength: 160 },
  members: { type: [teamMemberSchema], default: [] },
};

const metricSchema = {
  _id: false,
  value: { type: String, default: '', trim: true, maxlength: 50 },
  label: { type: String, default: '', trim: true, maxlength: 120 },
};

const bookingCtaSchema = {
  _id: false,
  heading: { type: String, default: 'Dat lich cung Studio', trim: true, maxlength: 160 },
  description: { type: String, default: '', trim: true, maxlength: 1000 },
  buttonLabel: { type: String, default: 'Dat lich', trim: true, maxlength: 80 },
};

const seoSchema = {
  _id: false,
  title: { type: String, default: '', trim: true, maxlength: 70 },
  description: { type: String, default: '', trim: true, maxlength: 180 },
  ogImageMediaId: { type: Types.ObjectId, ref: 'Media', default: null },
};

@Schema({
  collection: 'abouts',
  timestamps: true,
  versionKey: false,
})
export class AboutPage {
  _id: Types.ObjectId;

  @Prop({
    type: String,
    default: 'default',
    unique: true,
    index: true,
  })
  key: 'default';

  @Prop({ type: heroSchema, default: () => createDefaultAboutHero() })
  hero: AboutHero;

  @Prop({ type: storySchema, default: () => createDefaultAboutStory() })
  story: AboutStory;

  @Prop({
    type: philosophySchema,
    default: () => createDefaultAboutPhilosophy(),
  })
  philosophy: AboutPhilosophy;

  @Prop({ type: teamSchema, default: () => createDefaultAboutTeam() })
  team: AboutTeam;

  @Prop({ type: [metricSchema], default: [] })
  metrics: AboutMetric[];

  @Prop({ type: [Types.ObjectId], ref: 'Media', default: [] })
  galleryMediaIds: Types.ObjectId[];

  @Prop({ type: bookingCtaSchema, default: () => createDefaultAboutBookingCta() })
  bookingCta: AboutBookingCta;

  @Prop({
    type: seoSchema,
    default: () => ({
      title: '',
      description: '',
      ogImageMediaId: null,
    }),
  })
  seo: AboutSeo;

  createdAt: Date;

  updatedAt: Date;
}

export const AboutPageSchema = SchemaFactory.createForClass(AboutPage);

export function createDefaultAboutHero(): AboutHero {
  return {
    eyebrow: 'Studio',
    title: 'Gioi thieu',
    subtitle: '',
    mediaId: null,
  };
}

export function createDefaultAboutStory(): AboutStory {
  return {
    heading: 'Cau chuyen Studio',
    contentHtml: '',
    mediaId: null,
  };
}

export function createDefaultAboutPhilosophy(): AboutPhilosophy {
  return {
    heading: 'Triet ly hinh anh',
    items: [],
  };
}

export function createDefaultAboutTeam(): AboutTeam {
  return {
    enabled: false,
    heading: 'Doi ngu',
    members: [],
  };
}

export function createDefaultAboutBookingCta(): AboutBookingCta {
  return {
    heading: 'Dat lich cung Studio',
    description: '',
    buttonLabel: 'Dat lich',
  };
}

