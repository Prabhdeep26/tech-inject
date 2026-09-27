import { Schema, model, type Model } from "mongoose";

export interface StoredBundleFileInfo {
  path: string;
  fileId: string;
  size: number;
  contentType: string;
}

export interface ComponentBundleDocument {
  _id: Schema.Types.ObjectId;
  componentId: Schema.Types.ObjectId;
  slug: string;
  version: string;
  files: StoredBundleFileInfo[];
  totalSize: number;
  fileCount: number;
  entryPoint?: string;
  meta: Record<string, unknown>;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const componentBundleSchema = new Schema<ComponentBundleDocument>(
  {
    componentId: {
      type: Schema.Types.ObjectId,
      ref: "Component",
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      index: true,
    },
    version: {
      type: String,
      required: true,
    },
    files: [
      {
        path: { type: String, required: true },
        fileId: { type: String, required: true },
        size: { type: Number, required: true },
        contentType: { type: String, required: true },
      },
    ],
    totalSize: {
      type: Number,
      required: true,
    },
    fileCount: {
      type: Number,
      required: true,
    },
    entryPoint: {
      type: String,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    uploadedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id ? ret._id.toString() : "";
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id ? ret._id.toString() : "";
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index on slug and version for fast versioned lookups
componentBundleSchema.index({ slug: 1, version: 1 }, { unique: true });

export const ComponentBundleModel: Model<ComponentBundleDocument> = model<ComponentBundleDocument>(
  "ComponentBundle",
  componentBundleSchema
);

export default ComponentBundleModel;
