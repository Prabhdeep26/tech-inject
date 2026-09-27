import { Router, type Request, type Response, type NextFunction } from "express";
import { ComponentModel } from "../models/Component.js";
import { AppError } from "../middleware/errorHandler.js";
import { resolveRequesterAuth } from "../middleware/auth.js";
import { getBundleFileStream, getBundleFileContent } from "../storage/gridfs.js";

export const componentsRouter = Router();

/**
 * Strips internal administrative metadata (such as uploadedBy admin email) from public bundle objects
 */
function sanitizePublicBundle(bundle: any) {
  if (!bundle) return undefined;
  return {
    version: bundle.version,
    entryPoint: bundle.entryPoint,
    totalSize: bundle.totalSize,
    fileCount: bundle.fileCount,
    files: bundle.files,
    uploadedAt: bundle.uploadedAt,
  };
}

/**
 * GET /components
 * Public endpoint: lists published components only.
 * Dynamically marks premium components as locked for guests / free users.
 */
componentsRouter.get("/", async (req, res, next) => {
  try {
    const { category, accessLevel, search, page = "1", limit = "20" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Public route only exposes published components
    const filter: Record<string, unknown> = { status: "published" };

    if (category && typeof category === "string") {
      filter.category = category;
    }

    if (accessLevel && (accessLevel === "free" || accessLevel === "premium")) {
      filter.accessLevel = accessLevel;
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
        .limit(limitNum)
        .lean(),
      ComponentModel.countDocuments(filter),
    ]);

    // Check requester auth status (e.g. is user logged in and premium?)
    const auth = await resolveRequesterAuth(req);

    // Filter/format components: lock premium details if requester lacks access
    const sanitizedComponents = components.map((comp) => {
      const isPremium = comp.accessLevel === "premium";
      const hasAccess = !isPremium || auth.isAdmin || auth.isPremium;

      if (!hasAccess) {
        // Return locked summary metadata (hide bundle file internals and props details)
        return {
          id: comp._id.toString(),
          slug: comp.slug,
          name: comp.name,
          description: comp.description,
          category: comp.category,
          version: comp.version,
          accessLevel: comp.accessLevel,
          status: comp.status,
          dependencies: comp.dependencies,
          isLocked: true,
          lockReason: "Premium subscription required.",
          createdAt: comp.createdAt,
          updatedAt: comp.updatedAt,
        };
      }

      return {
        id: comp._id.toString(),
        slug: comp.slug,
        name: comp.name,
        description: comp.description,
        category: comp.category,
        version: comp.version,
        accessLevel: comp.accessLevel,
        status: comp.status,
        props: comp.props,
        dependencies: comp.dependencies,
        bundle: sanitizePublicBundle(comp.bundle),
        isLocked: false,
        createdAt: comp.createdAt,
        updatedAt: comp.updatedAt,
      };
    });

    res.status(200).json({
      status: "success",
      data: {
        components: sanitizedComponents,
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
 * GET /components/:slug
 * Public endpoint: returns details for a published component.
 * Enforces accessLevel: returns locked metadata for premium components if requester lacks access.
 */
componentsRouter.get("/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;

    const component = await ComponentModel.findOne({ slug });
    if (!component) {
      return next(new AppError(`Component '${slug}' not found.`, 404));
    }

    const auth = await resolveRequesterAuth(req);

    // Only admins may view unpublished (draft) components
    if (component.status !== "published" && !auth.isAdmin) {
      return next(new AppError(`Component '${slug}' not found.`, 404));
    }

    const isPremium = component.accessLevel === "premium";
    const hasAccess = !isPremium || auth.isAdmin || auth.isPremium;

    if (!hasAccess) {
      // Return locked metadata: basic public info is visible, but bundle and source are locked
      return res.status(200).json({
        status: "success",
        data: {
          component: {
            id: component._id.toString(),
            slug: component.slug,
            name: component.name,
            description: component.description,
            category: component.category,
            version: component.version,
            accessLevel: component.accessLevel,
            status: component.status,
            dependencies: component.dependencies,
            isLocked: true,
            lockReason:
              "Premium subscription required. Upgrade your account to unlock source code, bundle files, and full prop definitions.",
            createdAt: component.createdAt,
            updatedAt: component.updatedAt,
          },
        },
      });
    }

    // Requester has full access (free component, or admin, or premium user)
    res.status(200).json({
      status: "success",
      data: {
        component: {
          id: component._id.toString(),
          slug: component.slug,
          name: component.name,
          description: component.description,
          category: component.category,
          version: component.version,
          accessLevel: component.accessLevel,
          status: component.status,
          props: component.props,
          dependencies: component.dependencies,
          bundle: sanitizePublicBundle(component.bundle),
          isLocked: false,
          createdAt: component.createdAt,
          updatedAt: component.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /components/:slug/source
 * Re-checks accessLevel and auth on EVERY call:
 * - If free: public access.
 * - If premium: strictly verifies requester auth and checks fresh isPremium in MongoDB.
 * Never executes or evals stored file content.
 */
componentsRouter.get("/:slug/source", async (req, res, next) => {
  try {
    const { slug } = req.params;

    const component = await ComponentModel.findOne({ slug });
    if (!component) {
      return next(new AppError(`Component '${slug}' not found.`, 404));
    }

    // Always perform a live auth resolution on every single request
    const auth = await resolveRequesterAuth(req);

    // Only admin can access source of unpublished/draft component
    if (component.status !== "published" && !auth.isAdmin) {
      return next(new AppError(`Component '${slug}' not found.`, 404));
    }

    // Enforce accessLevel
    // Enforce accessLevel: 403 Forbidden with clear message when signed out or non-premium
    if (component.accessLevel === "premium") {
      if (!auth.isAdmin && !auth.isPremium) {
        const message = !auth.isAuthenticated
          ? `Access denied: Active premium subscription required to access source code for '${slug}'. Please log in with a premium account.`
          : `Access denied: Active premium subscription required to access source code for '${slug}'.`;
        return next(new AppError(message, 403));
      }
    }

    // Check if component has stored bundle
    const bundle = component.bundle as
      | {
          version: string;
          entryPoint?: string;
          totalSize: number;
          fileCount: number;
          files: Array<{ path: string; fileId: string; size: number; contentType: string }>;
        }
      | undefined;

    if (!bundle || !bundle.files || bundle.files.length === 0) {
      return next(new AppError(`No bundle files found for component '${slug}'.`, 404));
    }

    // Retrieve file contents directly from GridFS (read-only streams, zero execution)
    const sourceFiles = await Promise.all(
      bundle.files.map(async (f) => {
        const content = await getBundleFileContent(f.fileId);
        return {
          path: f.path,
          content,
          size: f.size,
          contentType: f.contentType,
        };
      })
    );

    res.status(200).json({
      status: "success",
      data: {
        slug: component.slug,
        version: component.version,
        entryPoint: bundle.entryPoint,
        totalSize: bundle.totalSize,
        fileCount: bundle.fileCount,
        files: sourceFiles,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Handler for downloading full bundle or individual file.
 * Re-checks accessLevel and fresh auth on EVERY call.
 */
async function handleDownload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const slugParam = req.params.slug;
    const fileIdParam = req.params.fileId;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
    const fileId = Array.isArray(fileIdParam) ? fileIdParam[0] : fileIdParam;

    const component = await ComponentModel.findOne({ slug });
    if (!component) {
      return next(new AppError(`Component '${slug}' not found.`, 404));
    }

    // Re-check auth and accessLevel live on every call
    const auth = await resolveRequesterAuth(req);

    if (component.status !== "published" && !auth.isAdmin) {
      return next(new AppError(`Component '${slug}' not found.`, 404));
    }

    if (component.accessLevel === "premium") {
      if (!auth.isAdmin && !auth.isPremium) {
        const message = !auth.isAuthenticated
          ? `Access denied: Active premium subscription required to download '${slug}'. Please log in with a premium account.`
          : `Access denied: Active premium subscription required to download '${slug}'.`;
        return next(new AppError(message, 403));
      }
    }

    const bundle = component.bundle as
      | {
          version: string;
          entryPoint?: string;
          files: Array<{ path: string; fileId: string; size: number; contentType: string }>;
        }
      | undefined;

    if (!bundle || !bundle.files || bundle.files.length === 0) {
      return next(new AppError(`No bundle available for component '${slug}'.`, 404));
    }

    // If specific fileId requested, stream it
    if (fileId) {
      const fileRecord = bundle.files.find((f) => f.fileId === fileId);
      if (!fileRecord) {
        return next(new AppError(`File not found in bundle for component '${slug}'.`, 404));
      }

      res.setHeader("Content-Type", fileRecord.contentType);
      const filename = fileRecord.path.split("/").pop() || "file";
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      const stream = getBundleFileStream(fileId);
      stream.on("error", (err) => {
        next(new AppError(`Error reading file stream: ${err.message}`, 500));
      });
      stream.pipe(res);
      return;
    }

    // If no specific fileId, return the complete bundle JSON as an attachment
    const sourceFiles = await Promise.all(
      bundle.files.map(async (f) => {
        const content = await getBundleFileContent(f.fileId);
        return {
          path: f.path,
          content,
          size: f.size,
          contentType: f.contentType,
        };
      })
    );

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${slug}-bundle.json"`);
    res.status(200).json({
      slug: component.slug,
      version: component.version,
      entryPoint: bundle.entryPoint,
      files: sourceFiles,
    });
  } catch (error) {
    next(error);
  }
}

componentsRouter.get("/:slug/download", handleDownload);
componentsRouter.get("/:slug/download/:fileId", handleDownload);

/**
 * Handler for generating dynamic, credential-safe AI agent integration prompt.
 * Re-checks status (drafts return 404 for public) and accessLevel (premium requires active sub).
 * Returns version and prompt matching current component state.
 */
async function handleAgentPrompt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const slugParam = req.params.slug;
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

    const component = await ComponentModel.findOne({ slug });
    if (!component) {
      return next(new AppError(`Component '${slug}' not found.`, 404));
    }

    const auth = await resolveRequesterAuth(req);

    if (component.status !== "published" && !auth.isAdmin) {
      return next(new AppError(`Component '${slug}' not found.`, 404));
    }

    if (component.accessLevel === "premium") {
      if (!auth.isAdmin && !auth.isPremium) {
        const message = !auth.isAuthenticated
          ? `Access denied: Active premium subscription required to access agent prompt for '${slug}'. Please log in with a premium account.`
          : `Access denied: Active premium subscription required to access agent prompt for '${slug}'.`;
        return next(new AppError(message, 403));
      }
    }

    const name = component.name;
    const pascalName = name.replace(/[^a-zA-Z0-9]/g, "");
    const version = component.version;
    const description = component.description;
    const category = component.category;
    const depsList =
      Array.isArray(component.dependencies) && component.dependencies.length > 0
        ? component.dependencies.join(", ")
        : "react";

    const rawProps = (component.props as Record<string, any>) || {};
    const propEntries = Object.entries(rawProps);
    let propsSection = "";
    if (propEntries.length > 0) {
      propsSection = propEntries
        .map(([key, prop]) => {
          const propName = prop?.name || key;
          const propType = prop?.type || "unknown";
          const isReq = Boolean(prop?.required);
          const defVal = prop?.defaultValue !== undefined ? ` (default: ${String(prop.defaultValue)})` : "";
          const desc = prop?.description ? ` - ${prop.description}` : "";
          return `  - \`${propName}\` (${propType}${isReq ? ", required" : ", optional"}${defVal})${desc}`;
        })
        .join("\n");
    } else {
      propsSection = "  - Standard React component props: `className?: string`, `style?: React.CSSProperties`, `children?: React.ReactNode`";
    }

    const prompt = `# AI Coding Agent Prompt: Implement '${name}' (v${version})
You are an expert React + TypeScript developer. Integrate the following component into the project.

## Component Metadata
- Name: ${name}
- Slug: ${slug}
- Category: ${category}
- Version: ${version}
- Description: ${description}
- Required Dependencies: ${depsList}

## Props Specification
${propsSection}

## Integration Instructions
1. Install CLI bundle: \`npx @tech-inject/installer ${slug}\` (or create \`src/components/${pascalName}.tsx\`).
2. Import the component: \`import { ${pascalName} } from './components/${pascalName}';\`
3. Use the component in accordance with the Props Specification above.

*Security Notice: This integration payload contains zero hardcoded credentials or internal secrets.*`.trim();

    res.status(200).json({
      status: "success",
      data: {
        slug: component.slug,
        name: component.name,
        version: component.version,
        prompt,
      },
    });
  } catch (error) {
    next(error);
  }
}

componentsRouter.get("/:slug/agent-prompt", handleAgentPrompt);
componentsRouter.get("/:slug/prompt", handleAgentPrompt);

