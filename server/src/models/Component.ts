import { Schema, model, type Model } from "mongoose";
import type { Component as IComponent } from "@tech-inject/types";

export interface ComponentDocument extends Omit<IComponent, "id"> {
  _id: Schema.Types.ObjectId;
  bundle?: unknown;
}

const componentSchema = new Schema<ComponentDocument>(
  {
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    version: {
      type: String,
      required: [true, "Version is required"],
      default: "1.0.0",
      trim: true,
    },
    accessLevel: {
      type: String,
      enum: {
        values: ["free", "premium"],
        message: "{VALUE} is not a valid access level",
      },
      required: true,
      default: "free",
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "published"],
        message: "{VALUE} is not a valid component status",
      },
      required: true,
      default: "draft",
      index: true,
    },
    props: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    dependencies: {
      type: [String],
      default: [],
    },
    bundle: {
      type: Schema.Types.Mixed,
      default: null,
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

export const ComponentModel: Model<ComponentDocument> = model<ComponentDocument>(
  "Component",
  componentSchema
);

export default ComponentModel;
