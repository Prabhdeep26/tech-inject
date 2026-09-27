import { Router, type Request, type Response, type NextFunction } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAdmin } from "../middleware/auth.js";
import { adminLoginSchema } from "../validations/auth.js";
import { validateComponentBundle } from "../validations/bundle.js";
import { createComponentSchema, updateComponentSchema } from "../validations/component.js";
import { ComponentModel, ComponentBundleModel, UserModel } from "../models/index.js";
import { storeBundleFiles, getBundleFileStream } from "../storage/gridfs.js";
import {
  signToken,
  setAuthCookie,
  clearAuthCookie,
  ADMIN_COOKIE_NAME,
} from "../utils/jwt.js";

export const adminRouter = Router();

/**
 * POST /admin/login
 * Verifies admin credentials from env and issues an httpOnly JWT cookie.
 */
adminRouter.post("/login", validateBody(adminLoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Verify email against configured admin email
    if (email.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) {
      return next(new AppError("Invalid administrative credentials.", 401));
    }

    // Verify password against ADMIN_PASSWORD_HASH or ADMIN_SECRET
    let isPasswordValid = false;

    if (env.ADMIN_PASSWORD_HASH) {
      try {
        isPasswordValid = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
      } catch {
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid && env.ADMIN_SECRET) {
      isPasswordValid = password === env.ADMIN_SECRET;
    }

    if (!isPasswordValid) {
      return next(new AppError("Invalid administrative credentials.", 401));
    }

    const token = signToken({
      id: "admin-root",
      email: env.ADMIN_EMAIL,
      role: "admin",
      isAdmin: true,
    });

    setAuthCookie(res, ADMIN_COOKIE_NAME, token);

    res.status(200).json({
      status: "success",
      message: "Admin authenticated successfully.",
      data: {
        token,
        admin: {
          id: "admin-root",
          email: env.ADMIN_EMAIL,
          role: "admin",
          isAdmin: true,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /admin/logout
 * Clears the admin httpOnly session cookie.
 */
adminRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res, ADMIN_COOKIE_NAME);
  res.status(200).json({
    status: "success",
    message: "Admin logged out successfully.",
  });
});

/**
 * GET /admin/me
 * Protected endpoint returning current admin identity.
 */
adminRouter.get("/me", requireAdmin, (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      admin: req.admin,
    },
  });
});

/**
 * Upload and store a component bundle.
 * Admin-only endpoint.
 *
 * Accepts a JSON bundle { files, meta } conforming to ComponentBundle.
 * Validates file types, sizes, path safety, and required metadata fields.
 * Stores raw file contents into MongoDB GridFS (NEVER executes or evals uploaded content).
 * Stores metadata in MongoDB (ComponentModel and ComponentBundleModel).
 */
async function handleBundleUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validation = validateComponentBundle(req.body);

    if (!validation.isValid) {
      res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Invalid component bundle payload.",
        errors: validation.errors,
      });
      return;
    }

    const { files, meta } = validation.data;

    // Calculate bundle metrics
    let totalSizeBytes = 0;
    for (const file of files) {
      totalSizeBytes += Buffer.byteLength(file.content, "utf8");
    }

    // 1. Store files in GridFS (raw streams only - zero eval or execution)
    const storedFiles = await storeBundleFiles(meta.slug, meta.version, files);

    // 2. Upsert Component metadata in MongoDB
    const component = await ComponentModel.findOneAndUpdate(
      { slug: meta.slug },
      {
        $set: {
          slug: meta.slug,
          name: meta.name,
          description: meta.description,
          category: meta.category,
          version: meta.version,
          accessLevel: meta.accessLevel || "free",
          status: meta.status || "draft",
          props: meta.props || {},
          dependencies: meta.dependencies || [],
          bundle: {
            version: meta.version,
            entryPoint: meta.entryPoint,
            totalSize: totalSizeBytes,
            fileCount: files.length,
            files: storedFiles,
            uploadedAt: new Date(),
            uploadedBy: req.admin?.email,
          },
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true }
    );

    // 3. Upsert versioned ComponentBundle document in MongoDB
    const bundleDoc = await ComponentBundleModel.findOneAndUpdate(
      { slug: meta.slug, version: meta.version },
      {
        $set: {
          componentId: component._id,
          slug: meta.slug,
          version: meta.version,
          files: storedFiles,
          totalSize: totalSizeBytes,
          fileCount: files.length,
          entryPoint: meta.entryPoint,
          meta,
          uploadedBy: req.admin?.email,
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true }
    );

    res.status(201).json({
      status: "success",
      message: `Component bundle '${meta.slug}@${meta.version}' uploaded and stored successfully.`,
      data: {
        component,
        bundle: bundleDoc,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Upload endpoints
adminRouter.post("/bundles", requireAdmin, handleBundleUpload);
adminRouter.post("/components/bundle", requireAdmin, handleBundleUpload);
adminRouter.post("/components/upload", requireAdmin, handleBundleUpload);

/**
 * POST /admin/components/validate & POST /admin/bundles/validate
 * Validates a component or bundle payload without persisting it to the database.
 * Returns validation status and normalized component preview spec.
 */
async function handleComponentValidate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body;

    // 1. If payload contains a bundle with files, validate using bundle schema
    if (payload && payload.files && Array.isArray(payload.files)) {
      const validation = validateComponentBundle(payload);
      if (!validation.isValid) {
        res.status(400).json({
          status: "error",
          statusCode: 400,
          message: "Invalid component bundle specification.",
          errors: validation.errors,
        });
        return;
      }

      const { files, meta } = validation.data;
      let totalSizeBytes = 0;
      for (const file of files) {
        totalSizeBytes += Buffer.byteLength(file.content, "utf8");
      }

      res.status(200).json({
        status: "success",
        message: "Component bundle validated successfully.",
        data: {
          valid: true,
          component: {
            slug: meta.slug,
            name: meta.name,
            description: meta.description,
            category: meta.category,
            version: meta.version,
            accessLevel: meta.accessLevel || "free",
            status: meta.status || "draft",
            props: meta.props || {},
            dependencies: meta.dependencies || [],
          },
          bundleMetrics: {
            fileCount: files.length,
            totalSize: totalSizeBytes,
            entryPoint: meta.entryPoint,
            files: files.map((f) => ({ path: f.path, size: Buffer.byteLength(f.content, "utf8") })),
          },
        },
      });
      return;
    }

    // 2. Otherwise, validate the component metadata schema
    const parsed = createComponentSchema.safeParse(payload);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => `[${i.path.join(".")}] ${i.message}`);
      res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Component validation failed.",
        errors,
      });
      return;
    }

    res.status(200).json({
      status: "success",
      message: "Component specification validated successfully.",
      data: {
        valid: true,
        component: parsed.data,
      },
    });
  } catch (error) {
    next(error);
  }
}

adminRouter.post("/components/validate", requireAdmin, handleComponentValidate);
adminRouter.post("/bundles/validate", requireAdmin, handleComponentValidate);

/**
 * GET /admin/bundles/:slug
 * Retrieves bundle metadata and file listings for a component
 */
adminRouter.get("/bundles/:slug", requireAdmin, async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { version } = req.query;

    const filter: Record<string, unknown> = { slug };
    if (version && typeof version === "string") {
      filter.version = version;
    }

    const bundle = await ComponentBundleModel.findOne(filter).sort({ createdAt: -1 });
    if (!bundle) {
      return next(new AppError(`No bundle found for component '${slug}'.`, 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        bundle,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /admin/bundles/file/:fileId
 * Streams a stored bundle file directly from GridFS
 */
adminRouter.get("/bundles/file/:fileId", requireAdmin, (req, res, next) => {
  try {
    const fileIdParam = req.params.fileId;
    const fileId = Array.isArray(fileIdParam) ? fileIdParam[0] : fileIdParam;
    if (!fileId) {
      return next(new AppError("File ID parameter is required", 400));
    }
    const stream = getBundleFileStream(fileId);

    stream.on("error", (err) => {
      next(new AppError(`Stored file not found or corrupted: ${err.message}`, 404));
    });

    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

/**
 * Helper to build filter matching either MongoDB ObjectId or component slug
 */
function buildComponentIdFilter(idOrSlug: string): Record<string, unknown> {
  if (mongoose.isValidObjectId(idOrSlug)) {
    return { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] };
  }
  return { slug: idOrSlug };
}

/**
 * GET /admin/components
 * Admin endpoint: list all components including drafts and published.
 */
adminRouter.get("/components", requireAdmin, async (req, res, next) => {
  try {
    const { status, accessLevel, category, search, page = "1", limit = "50" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {};

    if (status && (status === "draft" || status === "published")) {
      filter.status = status;
    }

    if (accessLevel && (accessLevel === "free" || accessLevel === "premium")) {
      filter.accessLevel = accessLevel;
    }

    if (category && typeof category === "string") {
      filter.category = category;
    }

    if (search && typeof search === "string") {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { slug: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    const [components, total] = await Promise.all([
      ComponentModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ComponentModel.countDocuments(filter),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        components,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /admin/components
 * Admin endpoint: create a new component.
 */
adminRouter.post("/components", requireAdmin, validateBody(createComponentSchema), async (req, res, next) => {
  try {
    const existing = await ComponentModel.findOne({ slug: req.body.slug });
    if (existing) {
      return next(new AppError(`Component with slug '${req.body.slug}' already exists.`, 409));
    }

    const component = await ComponentModel.create(req.body);

    res.status(201).json({
      status: "success",
      message: `Component '${component.name}' created successfully.`,
      data: {
        component,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /admin/components/:id
 * Admin endpoint: update component metadata by ID or slug.
 */
adminRouter.patch("/components/:id", requireAdmin, validateBody(updateComponentSchema), async (req, res, next) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!id) {
      return next(new AppError("Component ID parameter is required", 400));
    }
    const filter = buildComponentIdFilter(id);

    // If updating slug, verify uniqueness
    if (req.body.slug) {
      const existingWithSlug = await ComponentModel.findOne({ slug: req.body.slug });
      if (existingWithSlug && existingWithSlug._id.toString() !== id && existingWithSlug.slug !== id) {
        return next(new AppError(`Component with slug '${req.body.slug}' already exists.`, 409));
      }
    }

    const updatedComponent = await ComponentModel.findOneAndUpdate(
      filter,
      { $set: req.body },
      { returnDocument: "after", runValidators: true }
    );

    if (!updatedComponent) {
      return next(new AppError(`Component '${id}' not found.`, 404));
    }

    res.status(200).json({
      status: "success",
      message: `Component '${updatedComponent.slug}' updated successfully.`,
      data: {
        component: updatedComponent,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /admin/components/:id/publish
 * Admin endpoint: publish a component (sets status to 'published').
 */
adminRouter.post("/components/:id/publish", requireAdmin, async (req, res, next) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!id) {
      return next(new AppError("Component ID parameter is required", 400));
    }
    const filter = buildComponentIdFilter(id);

    const component = await ComponentModel.findOneAndUpdate(
      filter,
      { $set: { status: "published" } },
      { returnDocument: "after" }
    );

    if (!component) {
      return next(new AppError(`Component '${id}' not found.`, 404));
    }

    res.status(200).json({
      status: "success",
      message: `Component '${component.slug}' published successfully.`,
      data: {
        component,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /admin/components/:id/unpublish
 * Admin endpoint: unpublish a component (sets status to 'draft').
 */
adminRouter.post("/components/:id/unpublish", requireAdmin, async (req, res, next) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!id) {
      return next(new AppError("Component ID parameter is required", 400));
    }
    const filter = buildComponentIdFilter(id);

    const component = await ComponentModel.findOneAndUpdate(
      filter,
      { $set: { status: "draft" } },
      { returnDocument: "after" }
    );

    if (!component) {
      return next(new AppError(`Component '${id}' not found.`, 404));
    }

    res.status(200).json({
      status: "success",
      message: `Component '${component.slug}' unpublished (set to draft) successfully.`,
      data: {
        component,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /admin/customers
 * Admin endpoint: lists registered customer accounts with filtering and pagination.
 */
adminRouter.get("/customers", requireAdmin, async (req, res, next) => {
  try {
    const { search, isPremium, page = "1", limit = "50" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = { isAdmin: false };

    if (isPremium === "true") {
      filter.isPremium = true;
    } else if (isPremium === "false") {
      filter.isPremium = false;
    }

    if (search && typeof search === "string") {
      filter.email = new RegExp(search.trim(), "i");
    }

    const [customers, total] = await Promise.all([
      UserModel.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      UserModel.countDocuments(filter),
    ]);

    const formatSafeCustomer = (c: any) => ({
      id: c._id ? c._id.toString() : (c.id || ""),
      email: c.email,
      isAdmin: Boolean(c.isAdmin),
      isPremium: Boolean(c.isPremium),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    });

    res.status(200).json({
      status: "success",
      data: {
        customers: customers.map(formatSafeCustomer),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /admin/customers/:id/grant-premium
 * Admin endpoint: grants premium access to a customer.
 */
adminRouter.post("/customers/:id/grant-premium", requireAdmin, async (req, res, next) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!id) {
      return next(new AppError("Customer ID parameter is required.", 400));
    }

    const customer = mongoose.isValidObjectId(id)
      ? await UserModel.findById(id).select("-password")
      : await UserModel.findOne({ email: id.toLowerCase() }).select("-password");

    if (!customer) {
      return next(new AppError(`Customer '${id}' not found.`, 404));
    }

    customer.isPremium = true;
    await customer.save();

    res.status(200).json({
      status: "success",
      message: `Premium status granted to customer '${customer.email}'.`,
      data: {
        customer: {
          id: customer._id.toString(),
          email: customer.email,
          isAdmin: customer.isAdmin,
          isPremium: customer.isPremium,
          createdAt: (customer as any).createdAt,
          updatedAt: (customer as any).updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /admin/customers/:id/revoke-premium
 * Admin endpoint: revokes premium access from a customer.
 */
adminRouter.post("/customers/:id/revoke-premium", requireAdmin, async (req, res, next) => {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!id) {
      return next(new AppError("Customer ID parameter is required.", 400));
    }

    const customer = mongoose.isValidObjectId(id)
      ? await UserModel.findById(id).select("-password")
      : await UserModel.findOne({ email: id.toLowerCase() }).select("-password");

    if (!customer) {
      return next(new AppError(`Customer '${id}' not found.`, 404));
    }

    customer.isPremium = false;
    await customer.save();

    res.status(200).json({
      status: "success",
      message: `Premium status revoked for customer '${customer.email}'.`,
      data: {
        customer: {
          id: customer._id.toString(),
          email: customer.email,
          isAdmin: customer.isAdmin,
          isPremium: customer.isPremium,
          createdAt: (customer as any).createdAt,
          updatedAt: (customer as any).updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});



