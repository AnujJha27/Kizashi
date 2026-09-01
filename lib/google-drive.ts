export const GOOGLE_DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
export const GOOGLE_DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

export type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
};

export function isDriveFolder(file: GoogleDriveFile) {
  return file.mimeType === GOOGLE_DRIVE_FOLDER_MIME_TYPE;
}

export function isDrivePdf(file: GoogleDriveFile) {
  return file.mimeType === "application/pdf";
}
