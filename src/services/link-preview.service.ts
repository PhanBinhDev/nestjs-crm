import { Injectable, Logger } from '@nestjs/common';
import { getLinkPreview } from 'link-preview-js';

export interface LinkPreviewData {
  title?: string;
  description?: string;
  images?: string[];
  siteName?: string;
  favicon?: string;
  url: string;
}

@Injectable()
export class LinkPreviewService {
  private readonly logger = new Logger(LinkPreviewService.name);

  async getPreview(url: string): Promise<LinkPreviewData | null> {
    try {
      this.logger.log(`Fetching preview for URL: ${url}`);

      const preview = await getLinkPreview(url, {
        timeout: 10000, // 10 seconds timeout
        followRedirects: 'follow',
        handleRedirects: (baseURL: string, forwardedURL: string) => {
          const urlObj = new URL(baseURL);
          const forwardedURLObj = new URL(forwardedURL);

          // Chỉ cho phép redirect trong cùng domain hoặc subdomain
          if (
            forwardedURLObj.hostname === urlObj.hostname ||
            forwardedURLObj.hostname.endsWith(`.${urlObj.hostname}`)
          ) {
            return true;
          }
          return false;
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
        },
      });

      if (!preview) {
        this.logger.warn(`No preview data found for URL: ${url}`);
        return null;
      }

      const result: LinkPreviewData = {
        url,
        title: 'title' in preview ? preview.title || undefined : undefined,
        description:
          'description' in preview
            ? preview.description || undefined
            : undefined,
        siteName:
          'siteName' in preview ? preview.siteName || undefined : undefined,
        favicon: Array.isArray(preview.favicons)
          ? preview.favicons[0] || undefined
          : undefined,
        images:
          'images' in preview && Array.isArray(preview.images)
            ? preview.images
            : [],
      };

      this.logger.log(`Successfully fetched preview for: ${url}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch preview for URL: ${url}`, {
        error: error.message,
        stack: error.stack,
      });
      return null;
    }
  }

  /**
   * Lấy thumbnail tốt nhất từ danh sách images
   */
  getBestThumbnail(images: string[]): string | undefined {
    if (!images || images.length === 0) {
      return undefined;
    }

    // Ưu tiên images có kích thước lớn hoặc chứa từ khóa thumbnail
    const preferredImages = images.filter(
      (img) =>
        img.includes('og:image') ||
        img.includes('twitter:image') ||
        img.includes('thumbnail') ||
        img.includes('preview'),
    );

    if (preferredImages.length > 0) {
      return preferredImages[0];
    }

    // Nếu không có, lấy image đầu tiên
    return images[0];
  }

  /**
   * Validate URL trước khi fetch preview
   */
  isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
