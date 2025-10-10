# Uploads Directory

This directory stores temporarily uploaded medical reports during OCR processing.

## Automatic Cleanup

All uploaded files are automatically deleted after OCR extraction is complete.

## Supported Formats

- **Images:** JPEG, JPG, PNG
- **Documents:** PDF

## Size Limit

Maximum file size: **10 MB**

## Security

- Files are validated before processing
- Automatic deletion prevents storage buildup
- No permanent storage of user data (Phase 2)

---

**Note:** This directory should remain empty in production deployments.
